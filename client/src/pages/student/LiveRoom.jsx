import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import {
  Video, VideoOff, Mic, MicOff, Monitor, MonitorOff,
  MessageSquare, Users, Hand, PhoneOff, Send, X, Pin,
  UserX, Maximize, Minimize, Image, Calculator, FileText,
  Download, Copy, Trash2, Smile, Camera, Shield, Search,
  Coffee, UserPlus, UserMinus, RefreshCw, ChevronLeft,
  ChevronRight, BookOpen
} from 'lucide-react'
import useAuthStore from '../../store/authStore.js'
import { liveLecturesAPI } from '../../api/liveLectures.js'

// ─── Constants ──────────────────────────────────────────────────────────────
const SERVER_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}
const REACTIONS = ['👍', '👏', '😂', '❤️', '😮', '🎉', '🔥', '✨']
const CALC_BUTTONS = [
  'sin(', 'cos(', 'tan(', 'log(', 'ln(',
  'π', 'e', '^', '√(', '%',
  '7', '8', '9', '(', ')',
  '4', '5', '6', 'C', 'Del',
  '1', '2', '3', '×', '÷',
  '0', '.', '=', '+', '-',
]

// ─── Justified layout helper ─────────────────────────────────────────────────
function calcLayout(n, W, H, gap = 10) {
  if (!n || !W || !H) return { h: 0, cols: 1 }
  const ASPECT = 16 / 9
  let best = 0, bestCols = 1
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols)
    const hFromH = (H - gap * (rows - 1)) / rows
    const hFromW = (W - gap * (cols - 1)) / cols / ASPECT
    const h = Math.min(hFromH, hFromW)
    if (h > best) { best = h; bestCols = cols }
  }
  return { h: Math.max(120, Math.floor(best)), cols: bestCols }
}

// ─── Helper: set video element srcObject safely ──────────────────────────────
function setSrc(el, stream) {
  if (!el) return
  if (el.srcObject !== stream) {
    el.srcObject = stream
    el.play().catch(() => {})
  }
}

// ─── AutoVideo: remote video tile ───────────────────────────────────────────
function AutoVideo({ stream, muted = false, className }) {
  const ref = useRef(null)
  useEffect(() => { setSrc(ref.current, stream) }, [stream])
  return (
    <video
      ref={ref} autoPlay playsInline muted={muted}
      className={className}
      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
    />
  )
}

// ─── Avatar tile ─────────────────────────────────────────────────────────────
function AvatarTile({ name, role }) {
  const col = role === 'instructor' || role === 'admin' ? '#7C3AED'
    : role === 'co-host' ? '#D97706' : '#2563EB'
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1C1C21 0%, #111 100%)' }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg, ${col}, ${col}99)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 34, fontWeight: 800, color: '#fff',
        boxShadow: `0 0 0 4px ${col}30`,
      }}>
        {name?.[0]?.toUpperCase() || '?'}
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function LiveRoom() {
  const { id: lectureId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  // page state
  const [pageState, setPageState]   = useState('loading') // loading|live|denied|ended|error
  const [lecture, setLecture]       = useState(null)
  const [accessMsg, setAccessMsg]   = useState('')

  // participants & media state
  const [participants, setParticipants]         = useState([])
  const [mediaStatuses, setMediaStatuses]       = useState({}) // userId → {cameraOn,micOn,screenOn}
  const [remoteStreams, setRemoteStreams]        = useState({}) // userId → {camera,audio,screen}
  // streamInfos kept in ref only (streamInfosRef); no state needed for rendering
  const [activeScreen, setActiveScreen]         = useState(null) // {userId,name,role} | null
  const [speakingUsers, setSpeakingUsers]       = useState({})
  const [unavailableUsers, setUnavailableUsers] = useState({})
  const [roomMuteLocked, setRoomMuteLocked]     = useState(false)
  const [roomCameraLocked, setRoomCameraLocked] = useState(false)

  // own media
  const [isCameraOn, setIsCameraOn]       = useState(false)
  const [isMicOn, setIsMicOn]             = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [facingMode, setFacingMode]       = useState('user')
  const [streamApproved, setStreamApproved] = useState(false)

  // hand raise
  const [handRaised, setHandRaised]         = useState(false)
  const [handRaiseQueue, setHandRaiseQueue] = useState([])

  // chat
  const [chatMessages, setChatMessages]   = useState([])
  const [pinnedMessages, setPinnedMessages] = useState([])
  const [activePinnedIdx, setActivePinnedIdx] = useState(0)
  const [chatInput, setChatInput]         = useState('')
  const [chatImage, setChatImage]         = useState(null)
  const [chatTab, setChatTab]             = useState('global')
  const [chatRecipient, setChatRecipient] = useState('everyone')
  const [showChat, setShowChat]           = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [unreadChat, setUnreadChat]       = useState(false)
  const [unreadDM, setUnreadDM]           = useState(false)
  const [msgToDelete, setMsgToDelete]     = useState(null)
  const [recipientOpen, setRecipientOpen] = useState(false)
  const [showDownload, setShowDownload]   = useState(false)

  // grid/UI
  const [maximizedId, setMaximizedId]   = useState(null)
  const [gridDims, setGridDims]         = useState({ w: 0, h: 0 })
  const [hideCameraOff, setHideCameraOff] = useState(false)
  const [participantSearch, setParticipantSearch] = useState('')
  const [reactions, setReactions]       = useState([])
  const [showReactionPicker, setShowReactionPicker] = useState(false)

  // toasts
  const [joinLeaveToasts, setJoinLeaveToasts] = useState([])
  const [handRaiseToasts, setHandRaiseToasts] = useState([])

  // calculator
  const [showCalc, setShowCalc]       = useState(false)
  const [calcPos, setCalcPos]         = useState({ x: 60, y: 60 })
  const [calcExpr, setCalcExpr]       = useState('')
  const [calcResult, setCalcResult]   = useState('')
  const [isDegMode, setIsDegMode]     = useState(true)

  // notepad
  const [showNotepad, setShowNotepad]   = useState(false)
  const [notepadPos, setNotepadPos]     = useState({ x: 100, y: 100 })
  const [noteText, setNoteText]         = useState(() => localStorage.getItem(`note_${lectureId}`) || '')
  const [isCopied, setIsCopied]         = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // misc
  const [isAway, setIsAway]             = useState(false)
  const [lockAlert, setLockAlert]       = useState('')
  const [windowW, setWindowW]           = useState(window.innerWidth)

  // refs
  const socketRef        = useRef(null)
  const pcsRef           = useRef({})   // userId → RTCPeerConnection
  const localStreamRef   = useRef(null)
  const screenStreamRef  = useRef(null)
  const pendingScreenRef = useRef(null)
  const trackStreamMap   = useRef({})   // trackId → streamId
  const streamInfosRef   = useRef({})
  const localVideoRef    = useRef(null)
  const screenVideoRef   = useRef(null)
  const gridRef          = useRef(null)
  const calcRef          = useRef(null)
  const notepadRef       = useRef(null)
  const chatEndRef       = useRef(null)
  const chatTextareaRef  = useRef(null)
  const prevParticipantsRef = useRef(null)
  const mountTimeRef        = useRef(Date.now())
  const teacherStreamIds    = useRef({ cameraTrack: null, screenTrack: null, cameraStream: null, screenStream: null })
  const activeScreenOwnerRef = useRef(null)

  // computed
  const myId           = user?._id?.toString()
  const myRole         = user?.role
  const isInstructor   = myRole === 'instructor' || myRole === 'admin'
  const myParticipant  = participants.find(p => p.userId?.toString() === myId)
  const isCoHost       = myParticipant?.role === 'co-host'
  const isHostOrCoHost = isInstructor || isCoHost
  const activeScreenOwnerId = activeScreen?.userId?.toString()
  const showScreenTile = !!activeScreen || isScreenSharing

  // save note
  useEffect(() => { localStorage.setItem(`note_${lectureId}`, noteText) }, [noteText, lectureId])

  // window resize
  useEffect(() => {
    const fn = () => setWindowW(window.innerWidth)
    window.addEventListener('resize', fn)
    window.addEventListener('orientationchange', fn)
    return () => { window.removeEventListener('resize', fn); window.removeEventListener('orientationchange', fn) }
  }, [])

  // grid resize observer
  useEffect(() => {
    if (!gridRef.current) return
    const ro = new ResizeObserver(es => {
      const { width, height } = es[0].contentRect
      setGridDims({ w: width, h: height })
    })
    ro.observe(gridRef.current)
    return () => ro.disconnect()
  }, [])

  // auto-screen video routing
  useEffect(() => {
    if (!screenVideoRef.current) return
    let target = null
    if (isScreenSharing && screenStreamRef.current)         target = screenStreamRef.current
    else if (activeScreenOwnerRef.current && remoteStreams[activeScreenOwnerRef.current]?.screen) target = remoteStreams[activeScreenOwnerRef.current].screen
    else if (pendingScreenRef.current)                      target = pendingScreenRef.current
    if (target) setSrc(screenVideoRef.current, target)
  }, [showScreenTile, isScreenSharing, activeScreen, myId, remoteStreams])

  // auto-maximize screen tile
  useEffect(() => {
    if (showScreenTile) setMaximizedId('screen')
    else setMaximizedId(prev => prev === 'screen' ? null : prev)
  }, [showScreenTile])

  // chat scroll
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])
  useEffect(() => { if (showChat && chatTab === 'global') setUnreadChat(false) }, [showChat, chatTab])
  useEffect(() => { if (chatTab === 'private') setUnreadDM(false) }, [chatTab])

  // ─── Audio analyser (speaking detection) ────────────────────────────────────
  useEffect(() => {
    let ctx, frameId
    const analyzers = new Map()
    const speaking = {}
    try { ctx = new (window.AudioContext || window['webkitAudioContext'])() } catch { return }

    const setup = (uid, stream) => {
      if (!stream || stream.getAudioTracks().length === 0 || analyzers.has(uid)) return
      try {
        if (ctx.state === 'suspended') ctx.resume()
        const src = ctx.createMediaStreamSource(stream)
        const an = ctx.createAnalyser()
        an.fftSize = 256; an.smoothingTimeConstant = 0.8
        src.connect(an)
        analyzers.set(uid, an)
      } catch {}
    }

    if (localStreamRef.current && isMicOn) setup(myId, localStreamRef.current)
    Object.entries(remoteStreams).forEach(([uid, s]) => { if (s.audio) setup(uid, s.audio) })

    const tick = () => {
      let changed = false
      analyzers.forEach((an, uid) => {
        const data = new Uint8Array(an.frequencyBinCount)
        an.getByteFrequencyData(data)
        const avg = data.reduce((a, b) => a + b, 0) / data.length
        const now = avg > 12
        if (speaking[uid] !== now) { speaking[uid] = now; changed = true }
      })
      if (changed) setSpeakingUsers({ ...speaking })
      frameId = requestAnimationFrame(tick)
    }
    tick()
    return () => { cancelAnimationFrame(frameId); ctx?.state !== 'closed' && ctx?.close() }
  }, [isMicOn, remoteStreams, myId])

  // ─── Fetch lecture info ──────────────────────────────────────────────────────
  useEffect(() => {
    liveLecturesAPI.getById(lectureId)
      .then(({ data }) => setLecture(data.data))
      .catch(() => setPageState('error'))
  }, [lectureId])

  // ─── Track type resolver (same logic as reference) ──────────────────────────
  const getTrackType = useCallback((track, streamId, fromUserId) => {
    const info = streamInfosRef.current[fromUserId] || {}
    if (info.screenStream && streamId === info.screenStream) return 'screen'
    if (info.cameraStream && streamId === info.cameraStream) return 'camera'
    if (info.screenTrack && track.id === info.screenTrack)   return 'screen'
    if (info.cameraTrack && track.id === info.cameraTrack)   return 'camera'

    const t = teacherStreamIds.current
    if (t.screenStream && streamId === t.screenStream) return 'screen'
    if (t.cameraStream && streamId === t.cameraStream) return 'camera'
    if (t.screenTrack  && track.id === t.screenTrack)  return 'screen'
    if (t.cameraTrack  && track.id === t.cameraTrack)  return 'camera'

    const label = (track.label || '').toLowerCase()
    if (label.includes('screen') || label.includes('monitor') || label.includes('window')) return 'screen'

    const hasScreen  = !!(t.screenTrack || t.screenStream)
    const hasCamera  = !!(t.cameraTrack || t.cameraStream)
    if (hasScreen && !hasCamera) return 'screen'
    if (!hasScreen && hasCamera) return 'camera'

    return 'camera'
  }, [])

  // ─── Broadcast stream IDs (like reference broadcastStreamIds) ───────────────
  const broadcastStreamIds = useCallback(() => {
    if (!socketRef.current) return
    const camTrack    = localStreamRef.current?.getVideoTracks()[0]
    const screenTrack = screenStreamRef.current?.getVideoTracks()[0]
    const info = {
      cameraTrack:  camTrack?.id    || null,
      screenTrack:  screenTrack?.id || null,
      cameraStream: camTrack    ? localStreamRef.current?.id  : null,
      screenStream: screenTrack ? screenStreamRef.current?.id : null,
    }
    socketRef.current.emit('stream-info', info)
    streamInfosRef.current = { ...streamInfosRef.current, [myId]: info }
    if (isInstructor) socketRef.current.emit('teacher-streams', info)
  }, [myId, isInstructor])

  const emitMediaStatus = useCallback((status) => {
    socketRef.current?.emit('media-status', status)
    setMediaStatuses(prev => ({ ...prev, [myId]: status }))
  }, [myId])

  // ─── RTCPeerConnection factory ───────────────────────────────────────────────
  const createPC = useCallback((targetUserId) => {
    const existing = pcsRef.current[targetUserId]
    if (existing) {
      if (existing.connectionState === 'closed' || existing.connectionState === 'failed') {
        try { existing.close() } catch {}
        delete pcsRef.current[targetUserId]
      } else return existing
    }

    const pc = new RTCPeerConnection(ICE_SERVERS)

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', { targetUserId, candidate })
      }
    }

    pc.ontrack = ({ track, streams }) => {
      const streamId = streams?.[0]?.id
      if (streamId) trackStreamMap.current[track.id] = streamId

      if (track.kind === 'audio') {
        const audioStream = new MediaStream([track])
        setRemoteStreams(prev => ({
          ...prev,
          [targetUserId]: { ...(prev[targetUserId] || {}), audio: audioStream },
        }))
        return
      }

      if (track.kind === 'video') {
        const videoStream = new MediaStream([track])
        const type = getTrackType(track, streamId, targetUserId)
        setRemoteStreams(prev => ({
          ...prev,
          [targetUserId]: { ...(prev[targetUserId] || {}), [type]: videoStream },
        }))
        if (type === 'screen') {
          pendingScreenRef.current = videoStream
          if (screenVideoRef.current && activeScreenOwnerRef.current === targetUserId) {
            setSrc(screenVideoRef.current, videoStream)
          }
        }
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        delete pcsRef.current[targetUserId]
      }
    }

    pcsRef.current[targetUserId] = pc
    return pc
  }, [getTrackType])

  const addLocalTracks = useCallback((pc) => {
    const addTracks = (stream) => {
      if (!stream) return
      stream.getTracks().forEach(t => {
        if (!pc.getSenders().find(s => s.track === t)) pc.addTrack(t, stream)
      })
    }
    addTracks(localStreamRef.current)
    addTracks(screenStreamRef.current)
  }, [])

  const sendOfferToOne = useCallback(async (targetUserId) => {
    if (!socketRef.current) return
    const pc = createPC(targetUserId)
    addLocalTracks(pc)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    socketRef.current.emit('offer', { targetUserId, offer })
  }, [createPC, addLocalTracks])

  const sendOfferToAll = useCallback(async () => {
    const others = participants.filter(p => p.userId?.toString() !== myId)
    for (const p of others) await sendOfferToOne(p.userId?.toString())
  }, [participants, myId, sendOfferToOne])

  // ─── Socket setup ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const socket = io(SERVER_URL, { withCredentials: true, transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('connect_error', (err) => {
      console.error('[Socket] connect_error:', err.message)
      setPageState('error')
    })

    socket.on('connect', () => {
      socket.emit('join-class', lectureId)
      socket.emit('media-status', { cameraOn: isCameraOn, micOn: isMicOn, screenOn: isScreenSharing })
      if (isInstructor) setTimeout(broadcastStreamIds, 800)
    })

    socket.on('access-denied', ({ message }) => {
      setAccessMsg(message || 'Access denied.')
      setPageState('denied')
      socket.disconnect()
    })

    socket.on('error-message', (msg) => {
      setLockAlert(msg)
      setTimeout(() => setLockAlert(''), 4000)
    })

    socket.on('participant-update', (list) => {
      setPageState('live')

      // update media statuses & streamInfos from list
      setMediaStatuses(prev => {
        const next = { ...prev }
        list.forEach(p => { if (p.mediaStatus) next[p.userId?.toString()] = p.mediaStatus })
        return next
      })
      const nextSI = { ...streamInfosRef.current }
      list.forEach(p => { if (p.streamInfo) nextSI[p.userId?.toString()] = p.streamInfo })
      streamInfosRef.current = nextSI

      // clean up departed peers
      const activeIds = new Set(list.map(p => p.userId?.toString()))
      Object.keys(pcsRef.current).forEach(uid => {
        if (!activeIds.has(uid)) {
          try { pcsRef.current[uid].close() } catch {}
          delete pcsRef.current[uid]
          setRemoteStreams(prev => { const n = { ...prev }; delete n[uid]; return n })
        }
      })
      setUnavailableUsers(prev => {
        const n = { ...prev }
        Object.keys(n).forEach(uid => { if (!activeIds.has(uid)) delete n[uid] })
        return n
      })

      // join/leave toasts
      setParticipants(prev => {
        if (prevParticipantsRef.current !== null) {
          const prevIds = new Set(prev.map(p => p.userId?.toString()))
          const currIds = new Set(list.map(p => p.userId?.toString()))
          const joined = list.filter(p => !prevIds.has(p.userId?.toString()) && p.userId?.toString() !== myId)
          const left   = prev.filter(p => !currIds.has(p.userId?.toString()) && p.userId?.toString() !== myId)
          const toasts = []
          if (joined.length) toasts.push({ id: Date.now() + 1, msg: `${joined.map(p => p.name).join(', ')} joined`, type: 'join' })
          if (left.length)   toasts.push({ id: Date.now() + 2, msg: `${left.map(p => p.name).join(', ')} left`,   type: 'leave' })
          toasts.forEach(t => {
            setJoinLeaveToasts(jl => [...jl, t])
            setTimeout(() => setJoinLeaveToasts(jl => jl.filter(x => x.id !== t.id)), 4000)
          })

          // offer to newly joined
          const newOnes = list.filter(p => !prevIds.has(p.userId?.toString()) && p.userId?.toString() !== myId)
          if (newOnes.length && (localStreamRef.current || screenStreamRef.current)) {
            setTimeout(() => { newOnes.forEach(p => sendOfferToOne(p.userId?.toString())); broadcastStreamIds() }, 400)
          }
        }
        prevParticipantsRef.current = list
        return list
      })
    })

    socket.on('teacher-streams', (data) => {
      teacherStreamIds.current = data
      // Re-classify any existing remote video tracks from the instructor now that we have IDs
      setRemoteStreams(prev => {
        let changed = false
        const next = { ...prev }
        Object.entries(next).forEach(([uid, streams]) => {
          if (!streams) return
          const peerStreams = { ...streams }
          // If we have a screen stream under 'camera' wrongly, move it
          if (peerStreams.camera) {
            const track = peerStreams.camera.getVideoTracks()[0]
            if (track) {
              const sid = trackStreamMap.current[track.id]
              const type = getTrackType(track, sid, uid)
              if (type === 'screen' && !peerStreams.screen) {
                peerStreams.screen = peerStreams.camera
                delete peerStreams.camera
                changed = true
              }
            }
          }
          if (changed) next[uid] = peerStreams
        })
        return changed ? next : prev
      })
    })

    socket.on('stream-info', (data) => {
      streamInfosRef.current = { ...streamInfosRef.current, [data.userId?.toString()]: data.streamInfo }
    })

    socket.on('media-status', ({ userId, mediaStatus }) => {
      const uid = userId?.toString()
      setMediaStatuses(prev => ({ ...prev, [uid]: mediaStatus }))
      // clean remote streams if media turned off
      setRemoteStreams(prev => {
        const cur = prev[uid]
        if (!cur) return prev
        const next = { ...cur }
        if (!mediaStatus.cameraOn) delete next.camera
        if (!mediaStatus.micOn)    delete next.audio
        if (!mediaStatus.screenOn) delete next.screen
        return { ...prev, [uid]: next }
      })
    })

    socket.on('offer', async ({ fromUserId, offer }) => {
      const uid = fromUserId?.toString()
      if (pcsRef.current[uid]) { try { pcsRef.current[uid].close() } catch {} ; delete pcsRef.current[uid] }
      const pc = createPC(uid)
      addLocalTracks(pc)
      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket.emit('answer', { targetUserId: uid, answer })
    })

    socket.on('answer', async ({ fromUserId, answer }) => {
      const pc = pcsRef.current[fromUserId?.toString()]
      if (pc && pc.signalingState !== 'stable') {
        await pc.setRemoteDescription(new RTCSessionDescription(answer))
      }
    })

    socket.on('ice-candidate', async ({ fromUserId, candidate }) => {
      const pc = pcsRef.current[fromUserId?.toString()]
      if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {})
    })

    socket.on('chat-message', (msg) => {
      setChatMessages(prev => [...prev, msg])
      if (msg.senderId?.toString() !== myId) {
        if (Date.now() > mountTimeRef.current + 2000) {
          if (msg.recipientId) setUnreadDM(true)
          else setUnreadChat(true)
        }
      }
    })

    socket.on('chat-message-deleted', ({ messageId }) => {
      setChatMessages(prev => prev.filter(m => m._id?.toString() !== messageId?.toString()))
      setPinnedMessages(prev => prev.filter(m => m._id?.toString() !== messageId?.toString()))
    })

    socket.on('pinned-messages', (list) => setPinnedMessages(list || []))

    socket.on('hand-raise', (data) => {
      setHandRaiseQueue(prev => {
        const id = data.userId?.toString()
        if (prev.find(h => h.userId?.toString() === id)) return prev
        return [...prev, data]
      })
      const tid = Date.now()
      setHandRaiseToasts(prev => [...prev, { ...data, tid }])
      setTimeout(() => setHandRaiseToasts(prev => prev.filter(t => t.tid !== tid)), 3500)
    })

    socket.on('hand-raise-queue-update', (queue) => {
      setHandRaiseQueue(queue)
      const mine = queue.find(h => h.userId?.toString() === myId)
      setHandRaised(!!mine)
    })

    socket.on('hand-lower', ({ userId }) => {
      setHandRaiseQueue(prev => prev.filter(h => h.userId?.toString() !== userId?.toString()))
    })

    socket.on('stream-approved', ({ approved }) => {
      setStreamApproved(approved)
      if (!approved) {
        stopLocalStream()
      } else {
        setLockAlert('The host has approved you to speak. You can now turn on mic/camera.')
        setTimeout(() => setLockAlert(''), 5000)
        setHandRaised(false)
      }
    })

    socket.on('stream-revoked', () => {
      setStreamApproved(false)
      stopLocalStream()
    })

    socket.on('screen-share-state', (share) => {
      activeScreenOwnerRef.current = share?.userId?.toString() || null
      setActiveScreen(share)
      if (!share) {
        pendingScreenRef.current = null
        if (!isScreenSharing && screenVideoRef.current) screenVideoRef.current.srcObject = null
      }
    })

    socket.on('room-mute-state',   ({ muted })        => setRoomMuteLocked(!!muted))
    socket.on('room-camera-state', ({ cameraLocked }) => setRoomCameraLocked(!!cameraLocked))

    socket.on('force-media-off', (data) => {
      if (data.mic)    stopMic()
      if (data.camera) stopCamera()
      if (data.screen) stopScreenShare(false)
    })

    socket.on('user-unavailable', ({ userId, name }) => {
      setUnavailableUsers(prev => ({ ...prev, [userId?.toString()]: { name } }))
    })
    socket.on('user-available', ({ userId }) => {
      setUnavailableUsers(prev => { const n = { ...prev }; delete n[userId?.toString()]; return n })
    })
    socket.on('room-unavailable-users', (ids) => {
      setUnavailableUsers(prev => {
        const n = { ...prev }
        ids.forEach(id => { n[id.toString()] = { name: '' } })
        return n
      })
    })

    socket.on('reaction', (r) => {
      setReactions(prev => [...prev, r])
      setTimeout(() => setReactions(prev => prev.filter(x => x.id !== r.id)), 3000)
    })

    socket.on('removed-from-class', () => {
      cleanupAll()
      navigate(-1)
    })

    socket.on('session-ended', () => {
      setPageState('ended')
      cleanupAll()
    })

    return () => {
      socket.disconnect()
      cleanupAll()
    }
    // eslint-disable-next-line
  }, [user, lectureId])

  // ─── Media helpers ───────────────────────────────────────────────────────────
  const stopCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.stop(); localStreamRef.current?.removeTrack(t) })
    if (localStreamRef.current?.getTracks().length === 0) localStreamRef.current = null
    if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current
    setIsCameraOn(false)
    emitMediaStatus({ cameraOn: false, micOn: isMicOn, screenOn: isScreenSharing })
    broadcastStreamIds()
  }

  const stopMic = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.stop(); localStreamRef.current?.removeTrack(t) })
    if (localStreamRef.current?.getTracks().length === 0) localStreamRef.current = null
    setIsMicOn(false)
    emitMediaStatus({ cameraOn: isCameraOn, micOn: false, screenOn: isScreenSharing })
    broadcastStreamIds()
  }

  const stopScreenShare = (notify = true) => {
    screenStreamRef.current?.getTracks().forEach(t => t.stop())
    screenStreamRef.current = null
    pendingScreenRef.current = null
    if (screenVideoRef.current) screenVideoRef.current.srcObject = null
    setIsScreenSharing(false)
    emitMediaStatus({ cameraOn: isCameraOn, micOn: isMicOn, screenOn: false })
    broadcastStreamIds()
    if (notify) socketRef.current?.emit('stop-screen-share')
  }

  const stopLocalStream = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    localStreamRef.current = null
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    setIsCameraOn(false); setIsMicOn(false)
    emitMediaStatus({ cameraOn: false, micOn: false, screenOn: isScreenSharing })
    broadcastStreamIds()
  }

  const cleanupAll = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    screenStreamRef.current?.getTracks().forEach(t => t.stop())
    localStreamRef.current = screenStreamRef.current = null
    Object.values(pcsRef.current).forEach(pc => { try { pc.close() } catch {} })
    pcsRef.current = {}
  }

  // ─── Toggle camera ────────────────────────────────────────────────────────────
  const toggleCamera = async () => {
    if (isCameraOn) { stopCamera(); return }
    if (!isHostOrCoHost && roomCameraLocked && !streamApproved) {
      setLockAlert('Camera is locked by host.')
      setTimeout(() => setLockAlert(''), 3000)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: isMicOn,
      })
      if (localStreamRef.current) {
        stream.getVideoTracks().forEach(t => localStreamRef.current.addTrack(t))
      } else {
        localStreamRef.current = stream
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current
      setIsCameraOn(true)
      emitMediaStatus({ cameraOn: true, micOn: isMicOn, screenOn: isScreenSharing })
      broadcastStreamIds()
      await sendOfferToAll()
    } catch (err) {
      console.error('[Camera]', err.message)
      setLockAlert('Could not access camera. Check browser permissions.')
      setTimeout(() => setLockAlert(''), 4000)
    }
  }

  // ─── Toggle mic ───────────────────────────────────────────────────────────────
  const toggleMic = async () => {
    if (isMicOn) { stopMic(); return }
    if (!isHostOrCoHost && roomMuteLocked && !streamApproved) {
      setLockAlert('Microphone is locked by host.')
      setTimeout(() => setLockAlert(''), 3000)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (localStreamRef.current) {
        stream.getAudioTracks().forEach(t => localStreamRef.current.addTrack(t))
      } else {
        localStreamRef.current = stream
      }
      setIsMicOn(true)
      emitMediaStatus({ cameraOn: isCameraOn, micOn: true, screenOn: isScreenSharing })
      broadcastStreamIds()
      await sendOfferToAll()
    } catch (err) {
      console.error('[Mic]', err.message)
      setLockAlert('Could not access microphone. Check browser permissions.')
      setTimeout(() => setLockAlert(''), 4000)
    }
  }

  // ─── Toggle screen share ─────────────────────────────────────────────────────
  const toggleScreen = async () => {
    if (isScreenSharing) { stopScreenShare(true); return }
    if (activeScreen && activeScreenOwnerId !== myId) {
      setLockAlert(`${activeScreen.name} is already sharing.`)
      setTimeout(() => setLockAlert(''), 3000)
      return
    }
    try {
      const result = await new Promise(resolve => socketRef.current?.emit('request-screen-share', {}, resolve))
      if (!result?.ok) { setLockAlert(result?.message || 'Cannot share screen right now.'); setTimeout(() => setLockAlert(''), 3000); return }
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }).catch(() =>
        navigator.mediaDevices.getDisplayMedia({ video: true })
      )
      screenStreamRef.current = stream
      if (screenVideoRef.current) setSrc(screenVideoRef.current, stream)
      setIsScreenSharing(true)
      emitMediaStatus({ cameraOn: isCameraOn, micOn: isMicOn, screenOn: true })
      broadcastStreamIds()
      stream.getVideoTracks()[0].onended = () => stopScreenShare(true)
      await sendOfferToAll()
    } catch (err) {
      socketRef.current?.emit('stop-screen-share')
      console.error('[Screen]', err.message)
    }
  }

  // ─── Switch camera (mobile) ──────────────────────────────────────────────────
  const switchCamera = async () => {
    const next = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(next)
    if (!isCameraOn || !localStreamRef.current) return
    try {
      localStreamRef.current.getVideoTracks().forEach(t => { t.stop(); localStreamRef.current.removeTrack(t) })
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: next }, audio: isMicOn })
      const newTrack = stream.getVideoTracks()[0]
      localStreamRef.current.addTrack(newTrack)
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current
      Object.values(pcsRef.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video')
        if (sender) sender.replaceTrack(newTrack).catch(() => {})
      })
      broadcastStreamIds()
    } catch {}
  }

  // ─── Chat send ───────────────────────────────────────────────────────────────
  const sendChat = (e) => {
    e?.preventDefault()
    if (!chatInput.trim() && !chatImage) return
    const payload = {
      message: chatInput.trim(),
      image: chatImage || null,
    }
    if (chatTab === 'private' && chatRecipient !== 'everyone') {
      payload.recipientId = chatRecipient
      payload.recipientName = participants.find(p => p.userId?.toString() === chatRecipient)?.name || ''
    }
    socketRef.current?.emit('chat-message', payload)
    setChatInput(''); setChatImage(null)
  }

  // ─── Chat download ────────────────────────────────────────────────────────────
  const downloadChat = (type) => {
    setShowDownload(false)
    const msgs = chatMessages.filter(m => type === 'global' ? !m.recipientId : !!m.recipientId)
    if (!msgs.length) return
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Chat Export</title>
    <style>body{background:#111;color:#e5e7eb;font-family:sans-serif;padding:24px}.msg{margin:12px 0}
    .me{text-align:right}.bubble{display:inline-block;max-width:70%;padding:10px 14px;border-radius:14px;font-size:14px}
    .me .bubble{background:#6366f1;color:#fff}.other .bubble{background:#374151;color:#f3f4f6}
    .name{font-size:11px;color:#9ca3af;margin-bottom:4px}.time{font-size:10px;color:#6b7280;margin-top:3px}</style>
    </head><body><h2 style="color:#fff">${lecture?.title || 'Chat'} — ${type === 'global' ? 'Global' : 'Direct Messages'}</h2>
    ${msgs.map(m => {
      const isMe = m.senderId?.toString() === myId
      return `<div class="msg ${isMe ? 'me' : 'other'}">
        <div class="name">${m.senderName}${m.recipientId ? ' (DM)' : ''}</div>
        <div class="bubble">${m.image ? `<img src="${m.image}" style="max-width:180px;border-radius:8px;display:block;margin-bottom:6px">` : ''}${m.message || ''}</div>
        <div class="time">${new Date(m.timestamp).toLocaleString()}</div></div>`
    }).join('')}</body></html>`
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([html], { type: 'text/html' })), download: `chat_${lectureId}.html` })
    a.click(); URL.revokeObjectURL(a.href)
  }

  // ─── Screenshot ──────────────────────────────────────────────────────────────
  const takeScreenshot = () => {
    const v = screenVideoRef.current
    if (!v) return
    const c = document.createElement('canvas')
    c.width = v.videoWidth || 1920; c.height = v.videoHeight || 1080
    c.getContext('2d').drawImage(v, 0, 0)
    const a = Object.assign(document.createElement('a'), { href: c.toDataURL('image/png'), download: `screenshot_${Date.now()}.png` })
    a.click()
  }

  // ─── Calculator ───────────────────────────────────────────────────────────────
  const handleCalcBtn = (val) => {
    if (val === 'C') { setCalcExpr(''); setCalcResult(''); return }
    if (val === 'Del') { setCalcExpr(p => p.slice(0, -1)); return }
    if (val === '=') {
      const toRad = x => x * Math.PI / 180
      const sin = x => isDegMode ? Math.sin(toRad(x)) : Math.sin(x)
      const cos = x => isDegMode ? Math.cos(toRad(x)) : Math.cos(x)
      const tan = x => isDegMode ? Math.tan(toRad(x)) : Math.tan(x)
      const log = x => Math.log10(x), ln = x => Math.log(x), sqrt = x => Math.sqrt(x)
      try {
        let expr = calcExpr
        let open = 0
        for (const c of expr) { if (c === '(') open++; if (c === ')') open-- }
        if (open > 0) expr += ')'.repeat(open)
        expr = expr.replace(/([0-9)πe])(?=[sctl√πe(])/g, '$&*').replace(/([)])(?=[0-9])/g, '$&*')
        const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/π/g, 'Math.PI').replace(/e/g, 'Math.E').replace(/√\(/g, 'sqrt(').replace(/\^/g, '**')
        // eslint-disable-next-line no-new-func
        const result = new Function('sin','cos','tan','log','ln','sqrt', `return ${sanitized}`)(sin,cos,tan,log,ln,sqrt)
        setCalcResult(typeof result === 'number' && !isNaN(result) ? Number(result.toFixed(8)).toString() : 'Error')
      } catch { setCalcResult('Error') }
      return
    }
    setCalcExpr(p => p + val)
  }

  // ─── Notepad ──────────────────────────────────────────────────────────────────
  const copyNote = () => { navigator.clipboard.writeText(noteText); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000) }
  const downloadNote = () => {
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([noteText], { type: 'text/plain' })), download: `notes_${lectureId}.txt` })
    a.click(); URL.revokeObjectURL(a.href)
  }

  // ─── Draggable handler (ref-based, no jitter) ────────────────────────────────
  const makeDraggable = (elRef, setPos) => (e) => {
    if (e.button !== 0) return
    e.preventDefault()
    const el = elRef.current; if (!el) return
    const rect = el.getBoundingClientRect()
    const startX = e.clientX, startY = e.clientY
    const initL = rect.left, initT = rect.top
    el.style.transition = 'none'
    const move = (me) => {
      const dx = me.clientX - startX, dy = me.clientY - startY
      el.style.left = `${Math.max(0, Math.min(initL + dx, window.innerWidth - el.offsetWidth))}px`
      el.style.top  = `${Math.max(0, Math.min(initT + dy, window.innerHeight - el.offsetHeight))}px`
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      const r = el.getBoundingClientRect()
      setPos({ x: r.left, y: r.top })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  // ─── Leave / End ─────────────────────────────────────────────────────────────
  const leaveRoom = () => { socketRef.current?.disconnect(); cleanupAll(); navigate(-1) }
  const endSession = async () => {
    if (!window.confirm('End session for everyone?')) return
    socketRef.current?.emit('end-session')
    try { await liveLecturesAPI.update(lectureId, { status: 'ended' }) } catch {}
    cleanupAll(); navigate(-1)
  }

  // ─── Host actions ─────────────────────────────────────────────────────────────
  const forceMute   = (p) => socketRef.current?.emit('host-force-mute',       { targetUserId: p.userId })
  const forceCamOff = (p) => socketRef.current?.emit('host-force-camera-off', { targetUserId: p.userId })
  const removeUser  = (p) => { if (window.confirm(`Remove ${p.name}?`)) socketRef.current?.emit('host-remove-participant', { targetUserId: p.userId }) }
  const toggleCoHost = (p) => socketRef.current?.emit('toggle-co-host', { targetUserId: p.userId })
  const approveHand  = (p) => socketRef.current?.emit('approve-hand', { targetUserId: p.userId, targetSocketId: p.socketId, targetName: p.name })
  const denyHand     = (p) => socketRef.current?.emit('deny-hand',    { targetUserId: p.userId, targetSocketId: p.socketId })
  const toggleAway   = () => {
    if (!isAway) { socketRef.current?.emit('user-unavailable'); setIsAway(true) }
    else          { socketRef.current?.emit('user-available');   setIsAway(false) }
  }

  // ─── Gate screens ─────────────────────────────────────────────────────────────
  if (!user || pageState === 'loading') return <GateScreen spinner text="Connecting…" />
  if (pageState === 'error')  return <GateScreen text="Could not load session." onBack={() => navigate(-1)} />
  if (pageState === 'denied') return <GateScreen text={accessMsg || 'Access denied.'} onBack={() => navigate(-1)} />
  if (pageState === 'ended')  return <GateScreen text="This session has ended." onBack={() => navigate(-1)} />

  // ─── Build tile list ──────────────────────────────────────────────────────────
  const hostParticipant  = participants.find(p => p.role === 'instructor' || p.role === 'admin')
  const hostId           = hostParticipant?.userId?.toString() || (isInstructor ? myId : null)
  const isHostPresent    = !!hostParticipant || isInstructor
  const ownStatus        = { cameraOn: isCameraOn, micOn: isMicOn, screenOn: isScreenSharing }

  // non-host participants, filter
  const studentParticipants = participants
    .filter(p => p.role !== 'instructor' && p.role !== 'admin')
    .filter(p => {
      if (!hideCameraOff) return true
      const s = p.userId?.toString() === myId ? ownStatus : (mediaStatuses[p.userId?.toString()] || {})
      return !!s.cameraOn
    })
    .filter(p => !participantSearch || p.name?.toLowerCase().includes(participantSearch.toLowerCase()))

  const filteredAll = participants.filter(p =>
    !participantSearch || p.name?.toLowerCase().includes(participantSearch.toLowerCase())
  )

  // Tiles for the grid
  const tiles = []
  if (showScreenTile)  tiles.push({ id: 'screen', type: 'screen' })
  if (isHostPresent)   tiles.push({ id: 'host',   type: 'host',   userId: hostId, name: hostParticipant?.name || user?.fullName, role: hostParticipant?.role || myRole })
  studentParticipants.forEach(p => tiles.push({ id: p.userId?.toString(), type: 'student', userId: p.userId?.toString(), name: p.name, role: p.role }))

  const isMobile = windowW < 768
  const sideW = (showParticipants || showChat) ? (isMobile ? 0 : 320) : 0
  const gridW = (gridDims.w || windowW - sideW - 16)
  const gridH = (gridDims.h || window.innerHeight - 164)

  const { h: tileH, cols } = calcLayout(
    maximizedId ? 0 : tiles.length,
    gridW, gridH, 10
  )
  const tileW = cols && tileH ? Math.floor((gridW - 10 * (cols - 1)) / cols) : gridW

  const visibleMessages = chatMessages.filter(m => {
    if (chatTab === 'global') return !m.recipientId
    if (!m.recipientId) return false
    if (chatRecipient === 'everyone') return true
    return m.recipientId?.toString() === chatRecipient || m.senderId?.toString() === chatRecipient
  })
  const pinnedMsg = pinnedMessages[activePinnedIdx % (pinnedMessages.length || 1)]
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0F0F13', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>

      {/* Remote audio elements */}
      {Object.entries(remoteStreams).map(([uid, s]) =>
        s.audio ? <audio key={uid} autoPlay ref={n => { if (n && n.srcObject !== s.audio) { n.srcObject = s.audio; n.play().catch(() => {}) } }} style={{ display: 'none' }} /> : null
      )}

      {/* ── HEADER ─── */}
      <div style={{ background: '#18181B', borderBottom: '1px solid #27272A', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <BookOpen size={22} color="#7C3AED" />
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: '-0.3px' }}>Zenius</span>
          </div>
          {!isMobile && (
            <span style={{ color: '#71717A', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
              {lecture?.title || 'Live Session'}
            </span>
          )}
          <span style={{ background: 'rgba(74,222,128,0.12)', color: '#4ADE80', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, letterSpacing: '0.5px' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80', display: 'inline-block', animation: 'speakPulse 1.5s ease infinite' }} />
            LIVE
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <HeaderBtn
            active={showParticipants}
            onClick={() => { setShowParticipants(p => !p); setShowChat(false) }}
            icon={<Users size={16} />}
            label={participants.length}
          />
          <HeaderBtn
            active={showChat}
            onClick={() => { setShowChat(p => !p); setShowParticipants(false) }}
            icon={<MessageSquare size={16} />}
            label="Chat"
            badge={unreadChat || unreadDM}
          />
        </div>
      </div>

      {/* ── MAIN ROW ─── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Left: Video area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Video grid */}
          <div ref={gridRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', padding: 8 }}>

            {/* Pinned message - floating at top of video area */}
            {pinnedMessages.length > 0 && (
              <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', background: 'rgba(20,17,56,0.96)', border: '1px solid #4C1D95', borderRadius: 14, padding: '9px 20px', display: 'flex', alignItems: 'center', gap: 10, zIndex: 25, width: 'max-content', maxWidth: '70%', backdropFilter: 'blur(12px)', boxShadow: '0 4px 24px rgba(0,0,0,0.55)' }}>
                {pinnedMessages.length > 1 && (
                  <button onClick={() => setActivePinnedIdx(i => (i - 1 + pinnedMessages.length) % pinnedMessages.length)} style={{ background: 'none', border: 'none', color: '#A78BFA', cursor: 'pointer', padding: '0 2px', display: 'flex' }}>
                    <ChevronLeft size={16} />
                  </button>
                )}
                <Pin size={14} color="#A78BFA" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#DDD6FE', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>
                  <b>{pinnedMsg?.senderName}:</b> {pinnedMsg?.message}
                </span>
                {pinnedMessages.length > 1 && (
                  <>
                    <span style={{ fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>{activePinnedIdx + 1}/{pinnedMessages.length}</span>
                    <button onClick={() => setActivePinnedIdx(i => (i + 1) % pinnedMessages.length)} style={{ background: 'none', border: 'none', color: '#A78BFA', cursor: 'pointer', padding: '0 2px', display: 'flex' }}>
                      <ChevronRight size={16} />
                    </button>
                  </>
                )}
                {isHostOrCoHost && (
                  <button onClick={() => socketRef.current?.emit('unpin-message', { messageId: pinnedMsg?._id })} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', marginLeft: 4, display: 'flex' }}>
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {/* Maximized tile */}
            {maximizedId && (() => {
              const t = tiles.find(t => t.id === maximizedId) || tiles[0]
              if (!t) return null
              return (
                <div style={{ position: 'absolute', inset: 8, display: 'flex', gap: 8 }}>
                  {/* Main big tile */}
                  <div style={{ flex: 1, position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
                    <VideoTile
                      tile={t} myId={myId} isCameraOn={isCameraOn} isMicOn={isMicOn}
                      localVideoRef={localVideoRef} screenVideoRef={screenVideoRef}
                      remoteStreams={remoteStreams} mediaStatuses={mediaStatuses} ownStatus={ownStatus}
                      speakingUsers={speakingUsers} unavailableUsers={unavailableUsers}
                      activeScreen={activeScreen} isScreenSharing={isScreenSharing}
                      switchCamera={switchCamera} takeScreenshot={takeScreenshot}
                    />
                    <button
                      onClick={() => setMaximizedId(null)}
                      style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', padding: '4px 6px', display: 'flex' }}>
                      <Minimize size={14} />
                    </button>
                  </div>
                  {/* Strip */}
                  {tiles.length > 1 && (
                    <div style={{ width: isMobile ? 100 : 180, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', paddingRight: 2 }}>
                      {tiles.filter(tt => tt.id !== t.id).map(tt => (
                        <div key={tt.id} onClick={() => setMaximizedId(tt.id)} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', flexShrink: 0, height: isMobile ? 72 : 112, cursor: 'pointer', border: '1.5px solid #3F3F46', transition: 'border-color 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = '#7C3AED'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = '#3F3F46'}>
                          <VideoTile
                            tile={tt} myId={myId} isCameraOn={isCameraOn} isMicOn={isMicOn}
                            localVideoRef={null} screenVideoRef={null}
                            remoteStreams={remoteStreams} mediaStatuses={mediaStatuses} ownStatus={ownStatus}
                            speakingUsers={speakingUsers} unavailableUsers={unavailableUsers}
                            activeScreen={activeScreen} isScreenSharing={isScreenSharing}
                            switchCamera={null} takeScreenshot={null}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Normal grid */}
            {!maximizedId && (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'center', gap: 10, overflow: 'hidden', padding: 4 }}>
                {tiles.map(t => (
                  <div
                    key={t.id}
                    onDoubleClick={() => setMaximizedId(t.id)}
                    style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', flexShrink: 0, width: tileW, height: tileH || 200, border: `2px solid ${speakingUsers[t.userId] ? '#4ADE80' : '#27272A'}`, transition: 'border-color 0.25s, box-shadow 0.25s', cursor: 'pointer', boxShadow: speakingUsers[t.userId] ? '0 0 0 3px rgba(74,222,128,0.25)' : 'none' }}
                    className={speakingUsers[t.userId] ? 'speaking-tile' : ''}
                  >
                    <VideoTile
                      tile={t} myId={myId} isCameraOn={isCameraOn} isMicOn={isMicOn}
                      localVideoRef={localVideoRef} screenVideoRef={screenVideoRef}
                      remoteStreams={remoteStreams} mediaStatuses={mediaStatuses} ownStatus={ownStatus}
                      speakingUsers={speakingUsers} unavailableUsers={unavailableUsers}
                      activeScreen={activeScreen} isScreenSharing={isScreenSharing}
                      switchCamera={switchCamera} takeScreenshot={takeScreenshot}
                    />
                    <button
                      onClick={e => { e.stopPropagation(); setMaximizedId(t.id) }}
                      style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', padding: '3px 5px', display: 'flex', opacity: 0 }}
                      className="tile-maximize-btn"
                    >
                      <Maximize size={12} />
                    </button>
                  </div>
                ))}
                {tiles.length === 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: '#52525B' }}>
                    <Video size={40} />
                    <p style={{ fontSize: 14, textAlign: 'center' }}>
                      {isInstructor ? 'Turn on your camera or share screen to start broadcasting.' : 'Waiting for the instructor to start…'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Floating reactions */}
            {reactions.length > 0 && (
              <div style={{ position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 16, pointerEvents: 'none', zIndex: 20 }}>
                {reactions.map(r => (
                  <div key={r.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, animation: 'floatUp 2.5s cubic-bezier(0.22,1,0.36,1) forwards' }}>
                    <span style={{ fontSize: 44, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}>{r.emoji}</span>
                    <span style={{ fontSize: 10, color: '#fff', background: 'rgba(0,0,0,0.6)', borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap' }}>{r.userId?.toString() === myId ? 'You' : r.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Join/leave toasts */}
            <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 30, pointerEvents: 'none' }}>
              {joinLeaveToasts.map(t => (
                <div key={t.id} className="join-toast" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(24,24,27,0.95)', border: `1px solid ${t.type === 'join' ? '#166534' : '#7F1D1D'}`, borderRadius: 12, padding: '8px 14px', fontSize: 12, color: '#E4E4E7', backdropFilter: 'blur(8px)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
                  {t.type === 'join' ? <UserPlus size={13} color="#4ADE80" /> : <UserMinus size={13} color="#F87171" />}
                  {t.msg}
                </div>
              ))}
              {handRaiseToasts.map(t => (
                <div key={t.tid} className="join-toast" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(24,24,27,0.95)', border: '1px solid #F59E0B', borderRadius: 12, padding: '8px 14px', fontSize: 12, color: '#FDE68A', backdropFilter: 'blur(8px)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
                  ✋ {t.name} raised hand
                </div>
              ))}
            </div>

            {/* Lock alert */}
            {lockAlert && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#18181B', border: '1px solid #7C3AED', borderRadius: 14, padding: '14px 24px', fontSize: 13, color: '#DDD6FE', textAlign: 'center', zIndex: 50, maxWidth: 300, boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
                {lockAlert}
              </div>
            )}
          </div>

          {/* ── CONTROLS BAR ─── */}
          <div style={{ background: '#18181B', borderTop: '1px solid #27272A', padding: isMobile ? '14px 10px' : '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 8 : 14, flexShrink: 0, flexWrap: 'wrap', minHeight: 96 }}>
            <CtrlBtn onClick={toggleMic}    active={isMicOn}        icon={isMicOn ? <Mic size={24} /> : <MicOff size={24} />}           label="Mic"    />
            <CtrlBtn onClick={toggleCamera} active={isCameraOn}     icon={isCameraOn ? <Video size={24} /> : <VideoOff size={24} />}    label="Camera" />
            <CtrlBtn onClick={toggleScreen} active={isScreenSharing} icon={isScreenSharing ? <Monitor size={24} /> : <MonitorOff size={24} />} label="Screen" />

            {/* Reactions */}
            <div style={{ position: 'relative' }}>
              <CtrlBtn onClick={() => setShowReactionPicker(p => !p)} active={showReactionPicker} icon={<Smile size={24} />} label="React" />
              {showReactionPicker && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowReactionPicker(false)} />
                  <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', background: '#18181B', border: '1px solid #27272A', borderRadius: 16, padding: 8, display: 'flex', gap: 4, zIndex: 50, boxShadow: '0 8px 30px rgba(0,0,0,0.5)', marginBottom: 8 }}>
                    {REACTIONS.map(e => (
                      <button key={e} onClick={() => { socketRef.current?.emit('reaction', { emoji: e }); setShowReactionPicker(false) }}
                        style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', borderRadius: 8, padding: '4px 6px', transition: 'background 0.15s' }}
                        onMouseEnter={el => el.currentTarget.style.background = '#3F3F46'}
                        onMouseLeave={el => el.currentTarget.style.background = 'none'}
                      >{e}</button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <CtrlBtn onClick={() => setShowCalc(p => !p)}    active={showCalc}    icon={<Calculator size={24} />}  label="Calc"  />
            <CtrlBtn onClick={() => setShowNotepad(p => !p)} active={showNotepad} icon={<FileText size={24} />}    label="Notes" />

            {!isInstructor && (
              <CtrlBtn
                onClick={() => { if (!handRaised) { socketRef.current?.emit('hand-raise'); setHandRaised(true) } else { socketRef.current?.emit('hand-lower'); setHandRaised(false) } }}
                active={handRaised}
                icon={<Hand size={24} />}
                label={handRaised ? 'Lower' : 'Raise'}
                color="#F59E0B"
              />
            )}

            <CtrlBtn onClick={toggleAway} active={isAway} icon={<Coffee size={24} />} label="Away" color="#F97316" />

            <button
              onClick={isInstructor ? endSession : leaveRoom}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, padding: '12px 22px', borderRadius: 22, border: '2px solid #991B1B', cursor: 'pointer', background: '#450a0a', color: '#FCA5A5', fontSize: 13, fontWeight: 700, transition: 'all 0.2s', minWidth: 80, lineHeight: 1 }}
              onMouseEnter={e => { e.currentTarget.style.background = '#7F1D1D'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#450a0a'; e.currentTarget.style.color = '#FCA5A5' }}
            >
              <PhoneOff size={24} />
              <span style={{ fontSize: 13 }}>{isInstructor ? 'End' : 'Leave'}</span>
            </button>
          </div>
        </div>

        {/* ── SIDE PANEL ─── */}
        {(showParticipants || showChat) && (
          <div style={{ width: isMobile ? '100%' : 320, background: '#18181B', borderLeft: '1px solid #27272A', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: isMobile ? 'absolute' : 'relative', right: 0, top: 0, bottom: 0, zIndex: isMobile ? 40 : 'auto' }}>

            {/* ── Participants ── */}
            {showParticipants && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <PanelHeader title={`Participants (${participants.length})`} onClose={() => setShowParticipants(false)} />

                <div style={{ padding: '8px 12px', borderBottom: '1px solid #27272A', flexShrink: 0 }}>
                  <div style={{ position: 'relative', marginBottom: 8 }}>
                    <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#71717A' }} />
                    <input value={participantSearch} onChange={e => setParticipantSearch(e.target.value)}
                      placeholder="Search…"
                      style={{ width: '100%', boxSizing: 'border-box', background: '#27272A', border: '1px solid #3F3F46', color: '#E4E4E7', borderRadius: 8, padding: '7px 10px 7px 32px', fontSize: 12, outline: 'none' }} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#A1A1AA', cursor: 'pointer' }}>
                    <input type="checkbox" checked={hideCameraOff} onChange={e => setHideCameraOff(e.target.checked)} style={{ accentColor: '#7C3AED' }} />
                    Hide camera-off participants
                  </label>
                </div>

                {isHostOrCoHost && (
                  <div style={{ display: 'flex', gap: 6, padding: '8px 12px', borderBottom: '1px solid #27272A', flexShrink: 0 }}>
                    <SmBtn onClick={() => socketRef.current?.emit(roomMuteLocked ? 'host-unmute-all' : 'host-mute-all')} danger={roomMuteLocked}>
                      {roomMuteLocked ? 'Unmute All' : 'Mute All'}
                    </SmBtn>
                    <SmBtn onClick={() => socketRef.current?.emit(roomCameraLocked ? 'host-camera-on-all' : 'host-camera-off-all')} danger={roomCameraLocked}>
                      {roomCameraLocked ? 'Cam On All' : 'Cam Off All'}
                    </SmBtn>
                  </div>
                )}

                {isHostOrCoHost && handRaiseQueue.length > 0 && (
                  <div style={{ margin: '8px 12px', background: '#1E1B4B', border: '1px solid #312E81', borderRadius: 10, padding: 10, flexShrink: 0 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA', marginBottom: 8 }}>✋ Raised Hands</p>
                    {handRaiseQueue.map(p => (
                      <div key={p.userId} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <span style={{ flex: 1, fontSize: 12, color: '#E4E4E7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                        <button onClick={() => approveHand(p)} style={{ padding: '2px 8px', borderRadius: 6, border: 'none', background: '#059669', color: '#fff', fontSize: 11, cursor: 'pointer' }}>Allow</button>
                        <button onClick={() => denyHand(p)}    style={{ padding: '2px 8px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#fff', fontSize: 11, cursor: 'pointer' }}>Deny</button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
                  {filteredAll.map(p => {
                    const uid     = p.userId?.toString()
                    const isSelf  = uid === myId
                    const isHost  = p.role === 'instructor' || p.role === 'admin'
                    const isCH    = p.role === 'co-host'
                    const status  = isSelf ? ownStatus : (mediaStatuses[uid] || p.mediaStatus || {})
                    const away    = unavailableUsers[uid]
                    const canMod  = isHostOrCoHost && !isHost && !isSelf
                    return (
                      <div key={uid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderBottom: '1px solid #1F1F22' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: isHost ? '#7C3AED' : isCH ? '#D97706' : '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {p.name?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#E4E4E7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{isSelf ? `${p.name} (You)` : p.name}</span>
                            {isHost && <RoleBadge color="#4C1D95" text="Host" />}
                            {isCH   && <RoleBadge color="#78350F" text="Co-host" />}
                            {away   && <RoleBadge color="#431407" text="Away" />}
                          </div>
                          <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
                            {status.micOn    ? <Mic size={12} color="#4ADE80" />   : <MicOff size={12} color="#52525B" />}
                            {status.cameraOn ? <Video size={12} color="#60A5FA" /> : <VideoOff size={12} color="#52525B" />}
                            {status.screenOn && <Monitor size={12} color="#A78BFA" />}
                          </div>
                        </div>
                        {canMod && (
                          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                            {isInstructor && (
                              <IconBtn onClick={() => toggleCoHost(p)} title={isCH ? 'Remove co-host' : 'Make co-host'} color={isCH ? '#F59E0B' : '#71717A'}><Shield size={11} /></IconBtn>
                            )}
                            <IconBtn onClick={() => forceMute(p)}   title="Mute"       color="#71717A"><MicOff size={11} /></IconBtn>
                            <IconBtn onClick={() => forceCamOff(p)} title="Camera off" color="#71717A"><VideoOff size={11} /></IconBtn>
                            <IconBtn onClick={() => removeUser(p)}  title="Remove"     color="#EF4444"><UserX size={11} /></IconBtn>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Chat panel ── */}
            {showChat && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <PanelHeader
                  title="Chat"
                  onClose={() => setShowChat(false)}
                  extra={
                    <div style={{ position: 'relative' }}>
                      <button onClick={() => setShowDownload(p => !p)} style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', padding: '2px 4px', display: 'flex' }}>
                        <Download size={15} />
                      </button>
                      {showDownload && (
                        <>
                          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowDownload(false)} />
                          <div style={{ position: 'absolute', right: 0, top: '100%', background: '#27272A', border: '1px solid #3F3F46', borderRadius: 10, overflow: 'hidden', zIndex: 50, minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                            <DlBtn onClick={() => downloadChat('global')}>Download Global Chat</DlBtn>
                            <DlBtn onClick={() => downloadChat('private')} style={{ borderTop: '1px solid #3F3F46' }}>Download Direct Messages</DlBtn>
                          </div>
                        </>
                      )}
                    </div>
                  }
                />

                {/* Tabs */}
                <div style={{ display: 'flex', background: '#111', borderBottom: '1px solid #27272A', flexShrink: 0 }}>
                  <TabBtn active={chatTab === 'global'}  onClick={() => setChatTab('global')}  badge={unreadChat}>Global</TabBtn>
                  <TabBtn active={chatTab === 'private'} onClick={() => setChatTab('private')} badge={unreadDM}>DMs</TabBtn>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {visibleMessages.map((msg, i) => {
                    const isMe = msg.senderId?.toString() === myId
                    const isH  = msg.senderRole === 'instructor' || msg.senderRole === 'admin'
                    return (
                      <div key={msg._id || i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }} className="chat-msg-group">
                        <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 2, paddingLeft: 4 }}>
                          {msg.senderName}
                          {isH && <span style={{ marginLeft: 4, background: '#4C1D95', color: '#DDD6FE', borderRadius: 4, padding: '0 4px', fontSize: 9 }}>Host</span>}
                          {msg.recipientId && <span style={{ marginLeft: 4, color: '#818CF8' }}>(DM)</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                          <div style={{ maxWidth: 200, background: isMe ? '#6366F1' : '#27272A', color: isMe ? '#fff' : '#E4E4E7', borderRadius: 12, padding: '8px 12px', fontSize: 13, wordBreak: 'break-word', borderTopRightRadius: isMe ? 2 : 12, borderTopLeftRadius: isMe ? 12 : 2 }}>
                            {msg.image && <img src={msg.image} alt="" style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 6, display: 'block' }} />}
                            {msg.message}
                          </div>
                          {/* Actions */}
                          <div style={{ display: 'flex', gap: 2, opacity: 0, transition: 'opacity 0.2s' }} className="msg-actions">
                            {isHostOrCoHost && (
                              <MsgAction onClick={() => socketRef.current?.emit('pin-message', { _id: msg._id, senderName: msg.senderName, message: msg.message, image: msg.image })} color="#6366F1">
                                <Pin size={9} />
                              </MsgAction>
                            )}
                            {(isHostOrCoHost || isMe) && (
                              msgToDelete === msg._id ? (
                                <div style={{ display: 'flex', gap: 3, alignItems: 'center', background: '#27272A', border: '1px solid #7F1D1D', borderRadius: 8, padding: '2px 6px' }}>
                                  <span style={{ fontSize: 9, color: '#FCA5A5' }}>Delete?</span>
                                  <button onClick={() => { socketRef.current?.emit('delete-chat-message', { messageId: msg._id }); setMsgToDelete(null) }} style={{ background: '#DC2626', border: 'none', color: '#fff', borderRadius: 4, padding: '1px 5px', fontSize: 9, cursor: 'pointer' }}>Yes</button>
                                  <button onClick={() => setMsgToDelete(null)} style={{ background: '#3F3F46', border: 'none', color: '#E4E4E7', borderRadius: 4, padding: '1px 5px', fontSize: 9, cursor: 'pointer' }}>No</button>
                                </div>
                              ) : (
                                <MsgAction onClick={() => setMsgToDelete(msg._id)} color="#EF4444"><Trash2 size={9} /></MsgAction>
                              )
                            )}
                          </div>
                        </div>
                        <span style={{ fontSize: 9, color: '#52525B', marginTop: 2, paddingLeft: 4 }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat input */}
                <div style={{ padding: 10, borderTop: '1px solid #27272A', flexShrink: 0 }}>
                  {chatTab === 'private' && (
                    <div style={{ position: 'relative', marginBottom: 8 }}>
                      <button onClick={() => setRecipientOpen(p => !p)}
                        style={{ width: '100%', background: '#27272A', border: '1px solid #3F3F46', color: '#E4E4E7', borderRadius: 8, padding: '6px 10px', fontSize: 11, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>To: {chatRecipient === 'everyone' ? 'All DMs' : participants.find(p => p.userId?.toString() === chatRecipient)?.name || chatRecipient}</span>
                        <ChevronRight size={11} style={{ transform: recipientOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                      </button>
                      {recipientOpen && (
                        <>
                          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setRecipientOpen(false)} />
                          <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, background: '#27272A', border: '1px solid #3F3F46', borderRadius: 10, overflow: 'hidden', zIndex: 50, marginBottom: 4 }}>
                            {isHostOrCoHost && (
                              <DlBtn onClick={() => { setChatRecipient('everyone'); setRecipientOpen(false) }}>All Direct Messages</DlBtn>
                            )}
                            {participants
                              .filter(p => isHostOrCoHost ? p.userId?.toString() !== myId : (p.role === 'instructor' || p.role === 'admin' || p.role === 'co-host'))
                              .map(p => (
                                <DlBtn key={p.userId} onClick={() => { setChatRecipient(p.userId?.toString()); setRecipientOpen(false) }}>
                                  {p.name} {p.role === 'instructor' ? '(Host)' : p.role === 'co-host' ? '(Co-host)' : ''}
                                </DlBtn>
                              ))
                            }
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {chatImage && (
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}>
                      <img src={chatImage} alt="" style={{ height: 60, width: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #3F3F46' }} />
                      <button onClick={() => setChatImage(null)} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#DC2626', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                        <X size={10} />
                      </button>
                    </div>
                  )}

                  <form onSubmit={sendChat} style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                    <label style={{ cursor: 'pointer', padding: '7px', color: '#71717A', display: 'flex', flexShrink: 0 }}>
                      <Image size={16} />
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                        const f = e.target.files?.[0]; if (!f) return
                        const r = new FileReader()
                        r.onload = ev => {
                          const img = new window.Image()
                          img.src = ev.target.result
                          img.onload = () => {
                            const c = document.createElement('canvas')
                            let w = img.width, h = img.height, M = 800
                            if (w > M) { h = h * M / w; w = M }
                            if (h > M) { w = w * M / h; h = M }
                            c.width = w; c.height = h
                            c.getContext('2d').drawImage(img, 0, 0, w, h)
                            setChatImage(c.toDataURL('image/jpeg', 0.72))
                          }
                        }
                        r.readAsDataURL(f)
                        e.target.value = ''
                      }} />
                    </label>
                    <textarea
                      ref={chatTextareaRef}
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(e) } }}
                      placeholder="Message…"
                      rows={1}
                      style={{ flex: 1, background: '#27272A', border: '1px solid #3F3F46', color: '#E4E4E7', borderRadius: 10, padding: '8px 12px', fontSize: 13, outline: 'none', resize: 'none', maxHeight: 100, overflow: 'auto', fontFamily: 'inherit' }}
                    />
                    <button type="submit" style={{ background: '#7C3AED', border: 'none', borderRadius: 10, padding: '8px 10px', display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0 }}>
                      <Send size={15} />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CALCULATOR OVERLAY ── */}
      {showCalc && (
        <div ref={calcRef} style={{ position: 'fixed', left: calcPos.x, top: calcPos.y, zIndex: 100, width: 340, background: '#18181B', border: '1px solid #3F3F46', borderRadius: 18, boxShadow: '0 16px 48px rgba(0,0,0,0.7)', overflow: 'hidden' }}>
          <div onPointerDown={makeDraggable(calcRef, setCalcPos)} style={{ background: '#111', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'grab', userSelect: 'none', borderBottom: '1px solid #27272A' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#E4E4E7', display: 'flex', alignItems: 'center', gap: 7 }}><Calculator size={15} color="#A78BFA" /> Calculator</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} onPointerDown={e => e.stopPropagation()}>
              <button onClick={() => setIsDegMode(p => !p)} style={{ background: isDegMode ? '#7C3AED' : '#3F3F46', color: '#fff', border: 'none', borderRadius: 7, padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                {isDegMode ? 'DEG' : 'RAD'}
              </button>
              <button onClick={() => setShowCalc(false)} style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', display: 'flex' }}><X size={16} /></button>
            </div>
          </div>
          <div style={{ padding: '12px 18px', textAlign: 'right', borderBottom: '1px solid #27272A' }}>
            <div style={{ fontSize: 12, color: '#52525B', minHeight: 18, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{calcExpr || '0'}</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: '#fff', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>{calcResult || '0'}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5, padding: 12 }}>
            {CALC_BUTTONS.map(btn => {
              const isFn  = ['sin(','cos(','tan(','log(','ln(','√('].includes(btn)
              const isOp  = ['÷','×','-','+'].includes(btn)
              const isCl  = btn === 'C' || btn === 'Del'
              const isEq  = btn === '='
              const bg = isCl ? '#450a0a' : isEq ? '#7C3AED' : isOp ? '#1E1B4B' : isFn ? '#1C1917' : '#27272A'
              const col = isCl ? '#FCA5A5' : isEq ? '#fff' : isOp ? '#A78BFA' : isFn ? '#FDBA74' : '#E4E4E7'
              const display = btn === 'sin(' ? 'sin' : btn === 'cos(' ? 'cos' : btn === 'tan(' ? 'tan' : btn === 'log(' ? 'log' : btn === 'ln(' ? 'ln' : btn === '√(' ? '√' : btn
              return (
                <button key={btn} onClick={() => handleCalcBtn(btn)} style={{ background: bg, color: col, border: 'none', borderRadius: 9, padding: '11px 4px', fontSize: isFn ? 11 : 14, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.8'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  {display}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── NOTEPAD OVERLAY ── */}
      {showNotepad && (
        <div ref={notepadRef} style={{ position: 'fixed', left: notepadPos.x, top: notepadPos.y, zIndex: 100, width: 360, height: 380, background: '#18181B', border: '1px solid #3F3F46', borderRadius: 18, boxShadow: '0 16px 48px rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', overflow: 'hidden', resize: 'both' }}>
          <div onPointerDown={makeDraggable(notepadRef, setNotepadPos)} style={{ background: '#111', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'grab', userSelect: 'none', borderBottom: '1px solid #27272A', flexShrink: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#E4E4E7', display: 'flex', alignItems: 'center', gap: 7 }}><FileText size={15} color="#A78BFA" /> Notepad</span>
            <button onClick={() => setShowNotepad(false)} onPointerDown={e => e.stopPropagation()} style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', display: 'flex' }}><X size={16} /></button>
          </div>
          <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Type your notes here…"
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#E4E4E7', padding: 14, fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6 }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '10px 14px', background: '#111', borderTop: '1px solid #27272A', flexShrink: 0 }}>
            {showClearConfirm ? (
              <>
                <span style={{ fontSize: 12, color: '#FCA5A5', alignSelf: 'center' }}>Clear notes?</span>
                <button onClick={() => { setNoteText(''); setShowClearConfirm(false) }} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: '#DC2626', color: '#fff', fontSize: 12, cursor: 'pointer' }}>Yes</button>
                <button onClick={() => setShowClearConfirm(false)} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: '#3F3F46', color: '#E4E4E7', fontSize: 12, cursor: 'pointer' }}>No</button>
              </>
            ) : (
              <>
                <button onClick={() => setShowClearConfirm(true)} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: '#450a0a', color: '#FCA5A5', cursor: 'pointer', display: 'flex' }}><Trash2 size={14} /></button>
                <button onClick={copyNote} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#27272A', color: '#E4E4E7', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Copy size={13} /> {isCopied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={downloadNote} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#7C3AED', color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Download size={13} /> .txt
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Global CSS */}
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0) scale(1);   opacity: 1; }
          60%  { transform: translateY(-60px) scale(1.15); opacity: 1; }
          100% { transform: translateY(-120px) scale(0.8); opacity: 0; }
        }
        @keyframes speakPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.5); }
          50%       { box-shadow: 0 0 0 6px rgba(74,222,128,0); }
        }
        @keyframes toastIn {
          from { transform: translateX(40px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes handWave {
          0%,100% { transform: rotate(0deg); }
          20%     { transform: rotate(20deg); }
          40%     { transform: rotate(-10deg); }
          60%     { transform: rotate(15deg); }
          80%     { transform: rotate(-5deg); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .tile-maximize-btn { opacity:0; transition:opacity 0.2s; }
        div:hover > .tile-maximize-btn { opacity:1!important; }
        .chat-msg-group:hover .msg-actions { opacity:1!important; }
        .speaking-tile { animation: speakPulse 1.2s ease infinite; }
        .join-toast { animation: toastIn 0.3s ease; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#3F3F46; border-radius:4px; }
        ::-webkit-scrollbar-thumb:hover { background:#52525B; }
        @media (max-width:768px) { .tile-maximize-btn { display:none!important; } }
      `}</style>
    </div>
  )
}

// ─── VideoTile component ──────────────────────────────────────────────────────
function VideoTile({ tile, myId, isCameraOn, isMicOn, localVideoRef, screenVideoRef, remoteStreams, mediaStatuses, ownStatus, speakingUsers, unavailableUsers, activeScreen, isScreenSharing, switchCamera, takeScreenshot }) {
  const isSelf   = tile.userId === myId
  const uid      = tile.userId
  const status   = isSelf ? ownStatus : (mediaStatuses[uid] || {})
  const camOn    = isSelf ? isCameraOn : status.cameraOn
  const micOn    = isSelf ? isMicOn   : status.micOn
  const away     = unavailableUsers?.[uid]
  const speaking = speakingUsers?.[uid]
  const remoteStream = remoteStreams?.[uid]

  if (tile.type === 'screen') {
    return (
      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0a0a0f 0%, #0F0F13 100%)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <video ref={screenVideoRef} autoPlay playsInline muted
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        {/* overlay when no stream yet */}
        {!screenVideoRef?.current?.srcObject && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#52525B' }}>
            <Monitor size={48} />
            <span style={{ fontSize: 13 }}>Waiting for screen share…</span>
          </div>
        )}
        {takeScreenshot && (
          <button onClick={takeScreenshot} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', color: '#fff', borderRadius: 10, padding: '6px 12px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.7)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
          >
            <Camera size={13} /> Screenshot
          </button>
        )}
        <TileLabel text={activeScreen?.name ? `${activeScreen.name}'s screen` : 'Screen share'} />
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#1C1C21', overflow: 'hidden' }}>
      {/* Video/avatar */}
      {isSelf && camOn ? (
        <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : !isSelf && camOn && remoteStream?.camera ? (
        <AutoVideo stream={remoteStream.camera} className="" />
      ) : (
        <AvatarTile name={tile.name} role={tile.role} />
      )}

      {/* Away overlay */}
      {away && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(249,115,22,0.9)', borderRadius: 12, padding: '8px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 20 }}>☕</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>Away</span>
          </div>
        </div>
      )}

      {/* Speaking glow */}
      {speaking && <div style={{ position: 'absolute', inset: 0, border: '2.5px solid #4ADE80', borderRadius: 'inherit', pointerEvents: 'none', boxShadow: 'inset 0 0 12px rgba(74,222,128,0.15)' }} />}

      {/* Switch camera button (self tile) */}
      {isSelf && camOn && switchCamera && (
        <button onClick={e => { e.stopPropagation(); switchCamera() }} style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', borderRadius: 8, padding: '4px 6px', cursor: 'pointer', display: 'flex', opacity: 0, transition: 'opacity 0.2s' }} className="tile-maximize-btn">
          <RefreshCw size={11} />
        </button>
      )}

      {/* Role badge */}
      {(tile.role === 'instructor' || tile.role === 'admin') && (
        <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(124,58,237,0.9)', color: '#fff', borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>Host</div>
      )}
      {tile.role === 'co-host' && (
        <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(217,119,6,0.9)', color: '#fff', borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>Co-host</div>
      )}

      {/* Media status icons */}
      <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 5 }}>
        <div style={{ background: 'rgba(0,0,0,0.7)', borderRadius: 7, padding: '4px 6px', display: 'flex' }}>
          {camOn ? <Video size={13} color="#4ADE80" /> : <VideoOff size={13} color="#EF4444" />}
        </div>
        <div style={{ background: 'rgba(0,0,0,0.7)', borderRadius: 7, padding: '4px 6px', display: 'flex' }}>
          {micOn ? <Mic size={13} color="#4ADE80" /> : <MicOff size={13} color="#EF4444" />}
        </div>
      </div>

      <TileLabel text={isSelf ? `${tile.name} (You)` : tile.name} />
    </div>
  )
}

// ─── Mini components ──────────────────────────────────────────────────────────
function TileLabel({ text }) {
  return (
    <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', borderRadius: 9, padding: '5px 12px', fontSize: 13, fontWeight: 600, color: '#fff', maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {text}
    </div>
  )
}

function CtrlBtn({ onClick, active, icon, label, color }) {
  const bg = active
    ? (color ? color + '30' : 'rgba(124,58,237,0.25)')
    : '#27272A'
  const cl = active ? (color || '#C4B5FD') : '#D1D5DB'
  const br = active ? (color || '#7C3AED') : '#3F3F46'
  return (
    <button onClick={onClick}
      style={{ background: bg, color: cl, border: `2px solid ${br}`, borderRadius: 22, padding: '12px 22px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, transition: 'all 0.2s', flexShrink: 0, minWidth: 80, lineHeight: 1 }}
      onMouseEnter={e => { e.currentTarget.style.background = active ? bg : '#3F3F46'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = active ? br : '#52525B' }}
      onMouseLeave={e => { e.currentTarget.style.background = bg; e.currentTarget.style.color = cl; e.currentTarget.style.borderColor = br }}
    >
      {icon}
      <span style={{ fontSize: 13 }}>{label}</span>
    </button>
  )
}

function HeaderBtn({ onClick, active, icon, label, badge }) {
  return (
    <button onClick={onClick} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 7, padding: '7px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', background: active ? '#3F3F46' : '#27272A', color: active ? '#fff' : '#D1D5DB', fontSize: 13, fontWeight: 600, transition: 'background 0.2s' }}>
      {icon} {label}
      {badge && <span style={{ position: 'absolute', top: -3, right: -3, width: 9, height: 9, borderRadius: '50%', background: '#EF4444' }} />}
    </button>
  )
}

function PanelHeader({ title, onClose, extra }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #27272A', flexShrink: 0 }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{title}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {extra}
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', display: 'flex' }}><X size={15} /></button>
      </div>
    </div>
  )
}

function TabBtn({ active, onClick, badge, children }) {
  return (
    <button onClick={onClick} style={{ flex: 1, padding: '8px', border: 'none', cursor: 'pointer', background: active ? '#27272A' : 'transparent', color: active ? '#fff' : '#71717A', fontSize: 12, fontWeight: 600, position: 'relative' }}>
      {children}
      {badge && <span style={{ position: 'absolute', top: 6, right: 14, width: 6, height: 6, borderRadius: '50%', background: '#EF4444' }} />}
    </button>
  )
}

function SmBtn({ onClick, children, danger }) {
  return (
    <button onClick={onClick} style={{ flex: 1, padding: '6px', borderRadius: 8, border: 'none', cursor: 'pointer', background: danger ? '#450a0a' : '#27272A', color: danger ? '#FCA5A5' : '#A1A1AA', fontSize: 11, fontWeight: 600 }}>
      {children}
    </button>
  )
}

function RoleBadge({ color, text }) {
  return <span style={{ background: color, color: '#FDE68A', borderRadius: 4, padding: '1px 5px', fontSize: 9, fontWeight: 700 }}>{text}</span>
}

function IconBtn({ onClick, children, title, color }) {
  return (
    <button onClick={onClick} title={title} style={{ background: 'none', border: 'none', color: color || '#71717A', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex' }}
      onMouseEnter={e => e.currentTarget.style.background = '#27272A'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
      {children}
    </button>
  )
}

function MsgAction({ onClick, children, color }) {
  return (
    <button onClick={onClick} style={{ background: color || '#3F3F46', border: 'none', color: '#fff', borderRadius: 6, padding: '3px 5px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
      {children}
    </button>
  )
}

function DlBtn({ onClick, children, style: s }) {
  return (
    <button onClick={onClick} style={{ width: '100%', textAlign: 'left', padding: '9px 14px', border: 'none', background: 'none', color: '#E4E4E7', fontSize: 12, cursor: 'pointer', ...s }}
      onMouseEnter={e => e.currentTarget.style.background = '#3F3F46'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
      {children}
    </button>
  )
}

function GateScreen({ text, spinner, onBack }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0F0F13', gap: 16 }}>
      {spinner && <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #7C3AED', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />}
      <p style={{ color: '#A1A1AA', fontSize: 14, textAlign: 'center', maxWidth: 280 }}>{text}</p>
      {onBack && (
        <button onClick={onBack} style={{ background: '#27272A', color: '#E4E4E7', border: 'none', borderRadius: 10, padding: '8px 20px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ChevronLeft size={14} /> Go back
        </button>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
