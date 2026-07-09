import jwt      from 'jsonwebtoken'
import User      from '../models/User.js'
import LiveLecture from '../models/LiveLecture.js'

function parseCookies(str = '') {
  return str.split(';').reduce((acc, part) => {
    const [k, ...v] = part.trim().split('=')
    if (k) acc[decodeURIComponent(k.trim())] = decodeURIComponent(v.join('=').trim())
    return acc
  }, {})
}

// ─── In-memory room state (per lecture) ────────────────────────────────────
const activeScreenShares   = new Map()  // lectureId → { userId, name, role }
const roomMuteLocks        = new Map()  // lectureId → boolean
const roomCameraLocks      = new Map()  // lectureId → boolean
const roomHandRaises       = new Map()  // lectureId → Map(userId → handData)
const roomPinnedMessages   = new Map()  // lectureId → array
const roomCoHosts          = new Map()  // lectureId → Set(userId string)
const roomUnavailableUsers = new Map()  // lectureId → Set(userId string)

function getSocketsByUserId(io, roomId, targetUserId) {
  const room = io.sockets.adapter.rooms.get(roomId)
  if (!room) return []
  const out = []
  for (const sid of room) {
    const s = io.sockets.sockets.get(sid)
    if (s?.user?._id?.toString() === targetUserId?.toString()) out.push(s)
  }
  return out
}

function isHostSocket(s) {
  return s.user?.role === 'instructor' || s.user?.role === 'admin'
}

const allowedOrigins = [
  'https://live-meet.onrender.com',
  process.env.CLIENT_URL
].filter(Boolean)

if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173')
}

export function registerLiveRoomSocket(io) {
  // ── Cookie, Auth Handshake, or Header auth ────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const origin = socket.handshake.headers.origin
      if (origin) {
        if (!allowedOrigins.includes(origin)) {
          console.warn(`[SECURITY] Blocked WebSocket connection from unauthorized origin: ${origin}`);
          return next(new Error('Origin not allowed'));
        }
      }

      const cookies = parseCookies(socket.handshake.headers.cookie || '')
      // Auth token from: (1) socket.io handshake auth object [sent over TLS], (2) httpOnly cookie
      // NOTE: query-param tokens are intentionally NOT supported to prevent token leakage in server logs
      const token =
        socket.handshake.auth?.token ||
        cookies.accessToken

      if (!token) return next(new Error('Socket authentication required'))
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
      const user    = await User.findById(decoded.userId).select('-password -refreshToken -resetPasswordToken')
      if (!user) return next(new Error('User not found'))

      if (user.suspended) {
        return next(new Error('Account has been suspended'))
      }

      if (decoded.role && user.role !== decoded.role) {
        return next(new Error('Session expired — please log in again'))
      }

      socket.user = user
      next()
    } catch (_) {
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', (socket) => {
    let currentLectureId = null
    socket.data.mediaStatus = { cameraOn: false, micOn: false, screenOn: false }

    const isHost = () => socket.user.role === 'instructor' || socket.user.role === 'admin'
    const isCoHost = () => {
      if (!currentLectureId) return false
      return roomCoHosts.get(currentLectureId)?.has(socket.user._id.toString()) || false
    }
    const isHostOrCoHost = () => isHost() || isCoHost()

    const buildParticipants = async (lid) => {
      const sockets = await io.in(lid).fetchSockets()
      const coHosts = roomCoHosts.get(lid) || new Set()
      return sockets.map(s => ({
        userId:      s.user._id,
        name:        s.user.fullName,
        role:        coHosts.has(s.user._id.toString()) && !isHostSocket(s)
                       ? 'co-host'
                       : s.user.role,
        avatar:      s.user.avatar || '',
        socketId:    s.id,
        mediaStatus: s.data.mediaStatus || { cameraOn: false, micOn: false, screenOn: false },
        streamInfo:  s.data.streamInfo  || null,
      }))
    }

    const emitParticipants = async () => {
      if (!currentLectureId) return
      const list = await buildParticipants(currentLectureId)
      io.to(currentLectureId).emit('participant-update', list)
    }

    // ── Join ──────────────────────────────────────────────────────────────────
    socket.on('join-class', async (lectureId) => {
      try {
        if (!lectureId || !/^[0-9a-fA-F]{24}$/.test(lectureId)) {
          return socket.emit('access-denied', { message: 'Invalid lecture ID format.' })
        }
        const lecture = await LiveLecture.findById(lectureId).populate({
          path: 'courseId',
          select: 'enrolledStudents'
        })
        if (!lecture) return socket.emit('error-message', 'Lecture not found')

        if (lecture.status === 'ended') {
          return socket.emit('access-denied', { message: 'This session has already ended.' })
        }

        if (socket.user.role === 'student') {
          if (lecture.status === 'scheduled') {
            return socket.emit('access-denied', { message: 'This session has not started yet.' })
          }
          if (lecture.courseId) {
            const enrolled = lecture.courseId.enrolledStudents?.some(
              id => id.toString() === socket.user._id.toString()
            )
            if (!enrolled) {
              return socket.emit('access-denied', { message: 'You must be enrolled in this course to join.' })
            }
          }
        } else {
          const isOwner = lecture.instructor?.toString() === socket.user._id.toString()
          if (!isOwner && socket.user.role !== 'admin') {
            return socket.emit('access-denied', { message: 'You are not the instructor of this lecture.' })
          }
        }

        currentLectureId = lectureId
        socket.join(lectureId)

        if (socket.user.role === 'student') {
          const studentId = socket.user._id.toString()
          let attRecord = lecture.attendance?.find(att => att.user?.toString() === studentId)
          if (!attRecord) {
            lecture.attendance = lecture.attendance || []
            lecture.attendance.push({
              user: socket.user._id,
              joinedAt: new Date(),
              sessions: [{ joinedAt: new Date() }]
            })
          } else {
            const activeSession = attRecord.sessions?.find(s => !s.leftAt)
            if (!activeSession) {
              attRecord.sessions = attRecord.sessions || []
              attRecord.sessions.push({ joinedAt: new Date() })
            }
          }
          await lecture.save()
        }

        const participants = await buildParticipants(lectureId)
        io.to(lectureId).emit('participant-update', participants)

        socket.emit('room-mute-state',    { muted: !!roomMuteLocks.get(lectureId) })
        socket.emit('room-camera-state',  { cameraLocked: !!roomCameraLocks.get(lectureId) })
        socket.emit('screen-share-state', activeScreenShares.get(lectureId) || null)
        socket.emit('pinned-messages',    roomPinnedMessages.get(lectureId) || [])

        const queue = roomHandRaises.get(lectureId)
        if (queue?.size) socket.emit('hand-raise-queue-update', Array.from(queue.values()))

        // Send away status list
        const unavailable = Array.from(roomUnavailableUsers.get(lectureId) || [])
        if (unavailable.length) socket.emit('room-unavailable-users', unavailable)

      } catch (err) {
        console.error('[Socket] join-class error:', err.message)
        socket.emit('error-message', 'Failed to join session')
      }
    })

    // ── Chat ──────────────────────────────────────────────────────────────────
    socket.on('chat-message', (data) => {
      if (!currentLectureId) return
      const msg = {
        _id:           `${socket.id}-${Date.now()}`,
        senderId:      socket.user._id,
        senderName:    socket.user.fullName,
        senderRole:    socket.user.role,
        message:       data.message || '',
        image:         data.image   || null,
        recipientId:   data.recipientId   || null,
        recipientName: data.recipientName || null,
        timestamp:     new Date().toISOString(),
      }
      if (data.recipientId) {
        const targets = getSocketsByUserId(io, currentLectureId, data.recipientId)
        const senders = getSocketsByUserId(io, currentLectureId, socket.user._id)
        new Set([...targets, ...senders]).forEach(s => s.emit('chat-message', msg))
      } else {
        io.to(currentLectureId).emit('chat-message', msg)
      }
    })

    socket.on('delete-chat-message', ({ messageId }) => {
      if (!currentLectureId) return
      io.to(currentLectureId).emit('chat-message-deleted', { messageId })
    })

    socket.on('pin-message', (data) => {
      if (!currentLectureId || !isHostOrCoHost()) return
      const list = roomPinnedMessages.get(currentLectureId) || []
      if (!list.some(m => m._id === data._id)) list.push(data)
      roomPinnedMessages.set(currentLectureId, list)
      io.to(currentLectureId).emit('pinned-messages', list)
    })

    socket.on('unpin-message', (data) => {
      if (!currentLectureId || !isHostOrCoHost()) return
      const list = (roomPinnedMessages.get(currentLectureId) || []).filter(m => m._id !== data.messageId)
      roomPinnedMessages.set(currentLectureId, list)
      io.to(currentLectureId).emit('pinned-messages', list)
    })

    // ── WebRTC Signaling (userId-based) ───────────────────────────────────────
    socket.on('offer', ({ targetUserId, offer }) => {
      getSocketsByUserId(io, currentLectureId, targetUserId).forEach(s =>
        s.emit('offer', { fromUserId: socket.user._id.toString(), fromName: socket.user.fullName, fromRole: socket.user.role, offer })
      )
    })

    socket.on('answer', ({ targetUserId, answer }) => {
      getSocketsByUserId(io, currentLectureId, targetUserId).forEach(s =>
        s.emit('answer', { fromUserId: socket.user._id.toString(), answer })
      )
    })

    socket.on('ice-candidate', ({ targetUserId, candidate }) => {
      getSocketsByUserId(io, currentLectureId, targetUserId).forEach(s =>
        s.emit('ice-candidate', { fromUserId: socket.user._id.toString(), candidate })
      )
    })

    // ── Stream info (track ID broadcast for WebRTC track-type resolution) ────
    socket.on('stream-info', (info) => {
      if (!currentLectureId) return
      socket.data.streamInfo = info
      socket.to(currentLectureId).emit('stream-info', {
        userId: socket.user._id.toString(),
        streamInfo: info,
      })
    })

    socket.on('teacher-streams', (info) => {
      if (!currentLectureId) return
      if (!isHostSocket(socket)) return
      socket.data.streamInfo = info
      socket.to(currentLectureId).emit('teacher-streams', info)
    })

    // ── Media status ──────────────────────────────────────────────────────────
    socket.on('media-status', (status) => {
      if (!currentLectureId) return
      const muteLocked   = !!roomMuteLocks.get(currentLectureId)
      const cameraLocked = !!roomCameraLocks.get(currentLectureId)
      const elevated     = isHostOrCoHost()
      socket.data.mediaStatus = {
        cameraOn: (elevated || !cameraLocked) ? !!status.cameraOn : false,
        micOn:    (elevated || !muteLocked)   ? !!status.micOn    : false,
        screenOn: !!status.screenOn,
      }
      io.to(currentLectureId).emit('media-status', {
        userId:      socket.user._id,
        mediaStatus: socket.data.mediaStatus,
      })
      if (muteLocked   && status.micOn    && !elevated) socket.emit('force-media-off', { mic: true })
      if (cameraLocked && status.cameraOn && !elevated) socket.emit('force-media-off', { camera: true })
      emitParticipants()
    })

    // ── Screen share ──────────────────────────────────────────────────────────
    socket.on('request-screen-share', (data, ack) => {
      if (!currentLectureId) return ack?.({ ok: false, message: 'Not in a session' })
      const active = activeScreenShares.get(currentLectureId)
      if (active && active.userId.toString() !== socket.user._id.toString()) {
        return ack?.({ ok: false, message: `${active.name} is already sharing screen.` })
      }
      const share = { userId: socket.user._id, name: socket.user.fullName, role: socket.user.role }
      activeScreenShares.set(currentLectureId, share)
      socket.data.mediaStatus = { ...(socket.data.mediaStatus || {}), screenOn: true }
      io.to(currentLectureId).emit('screen-share-state', share)
      io.to(currentLectureId).emit('media-status', { userId: socket.user._id, mediaStatus: socket.data.mediaStatus })
      emitParticipants()
      ack?.({ ok: true })
    })

    socket.on('stop-screen-share', (data) => {
      if (!currentLectureId) return
      const active = activeScreenShares.get(currentLectureId)
      if (!active) return
      const targetId = data?.targetUserId || active.userId.toString()
      if (targetId !== socket.user._id.toString() && !isHostOrCoHost()) return
      const targets = getSocketsByUserId(io, currentLectureId, targetId)
      targets.forEach(s => {
        s.data.mediaStatus = { ...(s.data.mediaStatus || {}), screenOn: false }
        s.emit('force-media-off', { screen: true })
        io.to(currentLectureId).emit('media-status', { userId: s.user._id, mediaStatus: s.data.mediaStatus })
      })
      activeScreenShares.delete(currentLectureId)
      io.to(currentLectureId).emit('screen-share-state', null)
      emitParticipants()
    })

    // ── Hand raise ────────────────────────────────────────────────────────────
    socket.on('hand-raise', () => {
      if (!currentLectureId) return
      if (!roomHandRaises.has(currentLectureId)) roomHandRaises.set(currentLectureId, new Map())
      const queue = roomHandRaises.get(currentLectureId)
      const data  = { userId: socket.user._id.toString(), name: socket.user.fullName, socketId: socket.id }
      queue.set(socket.user._id.toString(), data)
      io.to(currentLectureId).emit('hand-raise', data)
      io.to(currentLectureId).emit('hand-raise-queue-update', Array.from(queue.values()))
    })

    socket.on('hand-lower', () => {
      if (!currentLectureId) return
      const queue = roomHandRaises.get(currentLectureId)
      if (queue) {
        queue.delete(socket.user._id.toString())
        io.to(currentLectureId).emit('hand-raise-queue-update', Array.from(queue.values()))
      }
      io.to(currentLectureId).emit('hand-lower', { userId: socket.user._id.toString(), socketId: socket.id })
    })

    socket.on('approve-hand', ({ targetUserId, targetSocketId, targetName }) => {
      if (!currentLectureId || !isHostOrCoHost()) return
      const queue = roomHandRaises.get(currentLectureId)
      if (queue) {
        queue.delete(targetUserId?.toString())
        io.to(currentLectureId).emit('hand-raise-queue-update', Array.from(queue.values()))
      }
      if (targetSocketId) {
        io.sockets.sockets.get(targetSocketId)?.emit('stream-approved', { approved: true })
      } else {
        getSocketsByUserId(io, currentLectureId, targetUserId).forEach(s => s.emit('stream-approved', { approved: true }))
      }
    })

    socket.on('deny-hand', ({ targetUserId, targetSocketId }) => {
      if (!currentLectureId || !isHostOrCoHost()) return
      const queue = roomHandRaises.get(currentLectureId)
      if (queue) {
        queue.delete(targetUserId?.toString())
        io.to(currentLectureId).emit('hand-raise-queue-update', Array.from(queue.values()))
      }
      const target = targetSocketId
        ? [io.sockets.sockets.get(targetSocketId)].filter(Boolean)
        : getSocketsByUserId(io, currentLectureId, targetUserId)
      target.forEach(s => s.emit('stream-approved', { approved: false }))
    })

    socket.on('revoke-stream', ({ targetUserId }) => {
      if (!currentLectureId || !isHostOrCoHost()) return
      getSocketsByUserId(io, currentLectureId, targetUserId).forEach(s => {
        s.emit('stream-revoked')
        s.emit('force-media-off', { mic: true, camera: true })
        s.data.mediaStatus = { ...(s.data.mediaStatus || {}), cameraOn: false, micOn: false }
        io.to(currentLectureId).emit('media-status', { userId: s.user._id, mediaStatus: s.data.mediaStatus })
      })
      emitParticipants()
    })

    // ── Co-host delegation ────────────────────────────────────────────────────
    socket.on('toggle-co-host', ({ targetUserId }) => {
      if (!currentLectureId || !isHost()) return
      if (!roomCoHosts.has(currentLectureId)) roomCoHosts.set(currentLectureId, new Set())
      const coHosts = roomCoHosts.get(currentLectureId)
      const tid = targetUserId.toString()
      if (coHosts.has(tid)) coHosts.delete(tid)
      else coHosts.add(tid)
      emitParticipants()
    })

    // ── Away status ───────────────────────────────────────────────────────────
    socket.on('user-unavailable', () => {
      if (!currentLectureId) return
      if (!roomUnavailableUsers.has(currentLectureId)) roomUnavailableUsers.set(currentLectureId, new Set())
      roomUnavailableUsers.get(currentLectureId).add(socket.user._id.toString())
      io.to(currentLectureId).emit('user-unavailable', {
        userId: socket.user._id.toString(),
        name:   socket.user.fullName,
      })
    })

    socket.on('user-available', () => {
      if (!currentLectureId) return
      roomUnavailableUsers.get(currentLectureId)?.delete(socket.user._id.toString())
      io.to(currentLectureId).emit('user-available', { userId: socket.user._id.toString() })
    })

    // ── Host controls ─────────────────────────────────────────────────────────
    socket.on('host-mute-all', () => {
      if (!currentLectureId || !isHostOrCoHost()) return
      roomMuteLocks.set(currentLectureId, true)
      io.to(currentLectureId).emit('room-mute-state', { muted: true })
      for (const sid of (io.sockets.adapter.rooms.get(currentLectureId) || [])) {
        const s = io.sockets.sockets.get(sid)
        if (!s || isHostSocket(s)) continue
        s.data.mediaStatus = { ...(s.data.mediaStatus || {}), micOn: false }
        s.emit('force-media-off', { mic: true })
        io.to(currentLectureId).emit('media-status', { userId: s.user._id, mediaStatus: s.data.mediaStatus })
      }
      emitParticipants()
    })

    socket.on('host-unmute-all', () => {
      if (!currentLectureId || !isHostOrCoHost()) return
      roomMuteLocks.set(currentLectureId, false)
      io.to(currentLectureId).emit('room-mute-state', { muted: false })
    })

    socket.on('host-camera-off-all', () => {
      if (!currentLectureId || !isHostOrCoHost()) return
      roomCameraLocks.set(currentLectureId, true)
      io.to(currentLectureId).emit('room-camera-state', { cameraLocked: true })
      for (const sid of (io.sockets.adapter.rooms.get(currentLectureId) || [])) {
        const s = io.sockets.sockets.get(sid)
        if (!s || isHostSocket(s)) continue
        s.data.mediaStatus = { ...(s.data.mediaStatus || {}), cameraOn: false }
        s.emit('force-media-off', { camera: true })
        io.to(currentLectureId).emit('media-status', { userId: s.user._id, mediaStatus: s.data.mediaStatus })
      }
      emitParticipants()
    })

    socket.on('host-camera-on-all', () => {
      if (!currentLectureId || !isHostOrCoHost()) return
      roomCameraLocks.set(currentLectureId, false)
      io.to(currentLectureId).emit('room-camera-state', { cameraLocked: false })
    })

    socket.on('host-force-mute', ({ targetUserId }) => {
      if (!currentLectureId || !isHostOrCoHost()) return
      getSocketsByUserId(io, currentLectureId, targetUserId).forEach(s => {
        if (isHostSocket(s)) return
        s.data.mediaStatus = { ...(s.data.mediaStatus || {}), micOn: false }
        s.emit('force-media-off', { mic: true })
        io.to(currentLectureId).emit('media-status', { userId: s.user._id, mediaStatus: s.data.mediaStatus })
      })
      emitParticipants()
    })

    socket.on('host-force-camera-off', ({ targetUserId }) => {
      if (!currentLectureId || !isHostOrCoHost()) return
      getSocketsByUserId(io, currentLectureId, targetUserId).forEach(s => {
        if (isHostSocket(s)) return
        s.data.mediaStatus = { ...(s.data.mediaStatus || {}), cameraOn: false }
        s.emit('force-media-off', { camera: true })
        io.to(currentLectureId).emit('media-status', { userId: s.user._id, mediaStatus: s.data.mediaStatus })
      })
      emitParticipants()
    })

    socket.on('host-remove-participant', ({ targetUserId }) => {
      if (!currentLectureId || !isHostOrCoHost()) return
      getSocketsByUserId(io, currentLectureId, targetUserId).forEach(s => {
        if (isHostSocket(s)) return
        s.emit('removed-from-class')
        s.leave(currentLectureId)
        s.disconnect(true)
      })
      emitParticipants()
    })

    // ── Reactions ─────────────────────────────────────────────────────────────
    socket.on('reaction', ({ emoji }) => {
      if (!currentLectureId || !emoji) return
      io.to(currentLectureId).emit('reaction', {
        id:        `${socket.id}-${Date.now()}`,
        userId:    socket.user._id.toString(),
        name:      socket.user.fullName,
        emoji:     String(emoji).slice(0, 8),
        timestamp: Date.now(),
      })
    })

    socket.on('end-session', () => {
      if (!currentLectureId || !isHost()) return
      roomHandRaises.delete(currentLectureId)
      roomPinnedMessages.delete(currentLectureId)
      activeScreenShares.delete(currentLectureId)
      roomCoHosts.delete(currentLectureId)
      roomUnavailableUsers.delete(currentLectureId)
      io.to(currentLectureId).emit('session-ended')

      const rid = currentLectureId
      setTimeout(() => {
        io.in(rid).disconnectSockets(true)
      }, 1000)
    })

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      if (!currentLectureId) return

      if (socket.user && socket.user.role === 'student') {
        try {
          const lecture = await LiveLecture.findById(currentLectureId)
          if (lecture) {
            const studentId = socket.user._id.toString()
            const attRecord = lecture.attendance?.find(att => att.user?.toString() === studentId)
            if (attRecord && attRecord.sessions) {
              const activeSession = attRecord.sessions.find(s => !s.leftAt)
              if (activeSession) {
                activeSession.leftAt = new Date()
                await lecture.save()
              }
            }
          }
        } catch (err) {
          console.error('[Socket] disconnect attendance log error:', err.message)
        }
      }

      const queue = roomHandRaises.get(currentLectureId)
      if (queue?.has(socket.user._id.toString())) {
        queue.delete(socket.user._id.toString())
        io.to(currentLectureId).emit('hand-raise-queue-update', Array.from(queue.values()))
        io.to(currentLectureId).emit('hand-lower', { userId: socket.user._id.toString(), socketId: socket.id })
      }

      const active = activeScreenShares.get(currentLectureId)
      if (active?.userId?.toString() === socket.user._id.toString()) {
        activeScreenShares.delete(currentLectureId)
        io.to(currentLectureId).emit('screen-share-state', null)
      }

      roomUnavailableUsers.get(currentLectureId)?.delete(socket.user._id.toString())

      emitParticipants()
    })
  })
}
