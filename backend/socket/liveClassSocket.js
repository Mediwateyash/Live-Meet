import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import ChatMessage from '../models/ChatMessage.js';
import LiveClass from '../models/LiveClass.js';

const initLiveClassSocket = (io) => {
    const activeScreenShares = new Map(); // classId -> { userId, name, role }
    const roomMuteLocks = new Map(); // classId -> boolean
    const roomCameraLocks = new Map(); // classId -> boolean
    const roomCoHosts = new Map(); // classId -> Set of userIds
    const roomUnavailableUsers = new Map(); // classId -> Set of userIds
    const roomHandRaises = new Map(); // classId -> Map(userId -> handData)
    const roomPinnedMessages = new Map(); // classId -> pinnedMessageData

    // Authenticate socket connections using JWT
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error: No token'));
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }
            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`[Socket] User connected: ${socket.user.name} (${socket.user.role})`);

        // Track which class this socket is in
        let currentClassId = null;
        let attendanceId = null;
        socket.data.mediaStatus = {
            cameraOn: false,
            micOn: false,
            screenOn: false
        };
        socket.data.teacherStreams = null;
        socket.data.streamInfo = {
            cameraTrack: null,
            cameraStream: null,
            screenTrack: null,
            screenStream: null
        };

        const buildParticipants = async (classId) => {
            const socketsInRoom = await io.in(classId).fetchSockets();
            const coHostsSet = roomCoHosts.get(classId) || new Set();
            return socketsInRoom.map(s => ({
                userId: s.user._id,
                name: s.user.name,
                role: coHostsSet.has(s.user._id.toString()) ? 'co-host' : s.user.role,
                mediaStatus: s.data.mediaStatus || {
                    cameraOn: false,
                    micOn: false,
                    screenOn: false
                },
                streamInfo: s.data.streamInfo || {}
            }));
        };

        const emitParticipants = async () => {
            if (!currentClassId) return;
            const participants = await buildParticipants(currentClassId);
            io.to(currentClassId).emit('participant-update', participants);
        };

        const userIsHost = () => {
            const isCoHost = currentClassId && roomCoHosts.get(currentClassId)?.has(socket.user._id.toString());
            return socket.user.role === 'teacher' || socket.user.role === 'admin' || isCoHost;
        };

        // ─── Join a live class room ───
        socket.on('join-class', async (classId) => {
            try {
                const liveClass = await LiveClass.findById(classId);
                if (!liveClass) {
                    socket.emit('error-message', 'Class not found');
                    return;
                }

                currentClassId = classId;
                socket.join(classId);

                // Record attendance for students
                if (socket.user.role === 'student') {
                    const attendance = await Attendance.create({
                        classId,
                        studentId: socket.user._id,
                        joinedAt: new Date()
                    });
                    attendanceId = attendance._id;
                }

                // Notify the room about new participant
                const participants = await buildParticipants(classId);
                io.to(classId).emit('participant-update', participants);
                socket.emit('room-mute-state', { muted: !!roomMuteLocks.get(classId) });
                socket.emit('room-camera-state', { cameraLocked: !!roomCameraLocks.get(classId) });
                socket.emit('screen-share-state', activeScreenShares.get(classId) || null);

                const unavailSet = roomUnavailableUsers.get(classId) || new Set();
                socket.emit('room-unavailable-users', Array.from(unavailSet));
                socket.emit('pinned-messages', roomPinnedMessages.get(classId) || []);

                const handRaisesMap = roomHandRaises.get(classId);
                if (handRaisesMap && handRaisesMap.size > 0) {
                    socket.emit('hand-raise-queue-update', Array.from(handRaisesMap.values()));
                }

                const teacherSocket = (await io.in(classId).fetchSockets()).find(s =>
                    s.user.role === 'teacher' || s.user.role === 'admin'
                );
                if (teacherSocket?.data.teacherStreams) {
                    socket.emit('teacher-streams', teacherSocket.data.teacherStreams);
                }

                console.log(`[Socket] ${socket.user.name} joined class ${classId}`);
            } catch (error) {
                console.error('[Socket] join-class error:', error.message);
                socket.emit('error-message', 'Failed to join class');
            }
        });

        // ─── Chat message ───
        socket.on('chat-message', async (data) => {
            try {
                if (!currentClassId) return;

                // Enforce word limit (100 words for links starting with https, 20 words otherwise) and 100-character word length limit
                const startsWithHttps = (data.message || '').trim().toLowerCase().startsWith('https');
                const maxWords = startsWithHttps ? 100 : 20;
                const words = (data.message || '').trim().split(/\s+/).filter(w => w.length > 0);
                if (words.length > maxWords) {
                    socket.emit('error-message', `Message exceeds the ${maxWords}-word limit.`);
                    return;
                }
                if (words.some(w => w.length > 100)) {
                    socket.emit('error-message', 'A single word cannot exceed 100 characters.');
                    return;
                }

                const chatMsg = await ChatMessage.create({
                    classId: currentClassId,
                    senderId: socket.user._id,
                    senderName: socket.user.name,
                    message: data.message,
                    image: data.image,
                    recipientId: data.recipientId || null,
                    recipientName: data.recipientName || null,
                    timestamp: new Date()
                });

                const emitData = {
                    _id: chatMsg._id,
                    senderId: socket.user._id,
                    senderName: socket.user.name,
                    message: data.message,
                    image: data.image,
                    recipientId: data.recipientId || null,
                    recipientName: data.recipientName || null,
                    timestamp: chatMsg.timestamp
                };

                if (data.recipientId) {
                    const targetSockets = getSocketsByUserId(io, currentClassId, data.recipientId);
                    const senderSockets = getSocketsByUserId(io, currentClassId, socket.user._id);
                    
                    const uniqueSockets = new Set([...targetSockets, ...senderSockets]);
                    uniqueSockets.forEach(s => s.emit('chat-message', emitData));
                } else {
                    io.to(currentClassId).emit('chat-message', emitData);
                }
            } catch (error) {
                console.error('[Socket] chat-message error:', error.message);
            }
        });

        socket.on('delete-chat-message', async (data) => {
            try {
                if (!currentClassId || !data?.messageId) return;

                const message = await ChatMessage.findById(data.messageId);
                if (!message) {
                    socket.emit('error-message', 'Message not found');
                    return;
                }

                // Validate if user has host/co-host rights OR is the sender of the message
                const isSender = message.senderId.toString() === socket.user._id.toString();
                if (!userIsHost() && !isSender) {
                    console.log('[Socket] delete-chat-message denied: not host/co-host and not sender');
                    return;
                }

                console.log('[Socket] delete-chat-message attempt:', data.messageId, 'classId:', currentClassId);
                const deleted = await ChatMessage.findByIdAndDelete(data.messageId);
                if (deleted) {
                    console.log('[Socket] delete-chat-message success:', data.messageId);
                    io.to(currentClassId).emit('chat-message-deleted', { messageId: data.messageId.toString() });
                    
                    // Remove message from server-side pinned messages memory
                    let list = roomPinnedMessages.get(currentClassId) || [];
                    if (list.some(m => m._id?.toString() === data.messageId.toString())) {
                        list = list.filter(m => m._id?.toString() !== data.messageId.toString());
                        roomPinnedMessages.set(currentClassId, list);
                        io.to(currentClassId).emit('pinned-messages', list);
                        console.log('[Socket] Automatically unpinned deleted message. Remaining:', list.length);
                    }
                } else {
                    console.log('[Socket] delete-chat-message: message not found:', data.messageId);
                    socket.emit('error-message', 'Message not found or already deleted.');
                }
            } catch (error) {
                console.error('[Socket] delete-chat-message error:', error.message);
                socket.emit('error-message', 'Failed to delete message.');
            }
        });

        socket.on('pin-message', (data) => {
            try {
                console.log('[Socket] pin-message received:', data, 'by user:', socket.user?.name, 'role:', socket.user?.role, 'isHost:', userIsHost());
                if (!currentClassId) return;
                if (!userIsHost()) {
                    console.log('[Socket] pin-message denied: not host/co-host');
                    return;
                }
                let list = roomPinnedMessages.get(currentClassId) || [];
                if (!list.some(m => m._id?.toString() === data._id?.toString())) {
                    list.push(data);
                }
                roomPinnedMessages.set(currentClassId, list);
                io.to(currentClassId).emit('pinned-messages', list);
                console.log('[Socket] pin-message success, list size:', list.length);
            } catch (error) {
                console.error('[Socket] pin-message error:', error.message);
            }
        });

        socket.on('unpin-message', (data) => {
            try {
                console.log('[Socket] unpin-message received, messageId:', data?.messageId, 'by user:', socket.user?.name, 'role:', socket.user?.role, 'isHost:', userIsHost());
                if (!currentClassId) return;
                if (!userIsHost()) {
                    console.log('[Socket] unpin-message denied: not host/co-host');
                    return;
                }
                let list = roomPinnedMessages.get(currentClassId) || [];
                list = list.filter(m => m._id?.toString() !== data?.messageId?.toString());
                roomPinnedMessages.set(currentClassId, list);
                io.to(currentClassId).emit('pinned-messages', list);
                console.log('[Socket] unpin-message success, remaining:', list.length);
            } catch (error) {
                console.error('[Socket] unpin-message error:', error.message);
            }
        });

        // ─── WebRTC Signaling ───
        socket.on('offer', (data) => {
            // data: { targetUserId, offer }
            const targetSockets = getSocketsByUserId(io, currentClassId, data.targetUserId);
            targetSockets.forEach(s => {
                s.emit('offer', {
                    fromUserId: socket.user._id,
                    fromName: socket.user.name,
                    fromRole: socket.user.role,
                    offer: data.offer
                });
            });
        });

        socket.on('answer', (data) => {
            // data: { targetUserId, answer }
            const targetSockets = getSocketsByUserId(io, currentClassId, data.targetUserId);
            targetSockets.forEach(s => {
                s.emit('answer', {
                    fromUserId: socket.user._id,
                    answer: data.answer
                });
            });
        });

        socket.on('ice-candidate', (data) => {
            // data: { targetUserId, candidate }
            const targetSockets = getSocketsByUserId(io, currentClassId, data.targetUserId);
            targetSockets.forEach(s => {
                s.emit('ice-candidate', {
                    fromUserId: socket.user._id,
                    candidate: data.candidate
                });
            });
        });

        // ─── Hand raise (student → teacher) ───
        socket.on('hand-raise', () => {
            if (!currentClassId) return;
            
            if (!roomHandRaises.has(currentClassId)) {
                roomHandRaises.set(currentClassId, new Map());
            }
            const queue = roomHandRaises.get(currentClassId);
            const handData = {
                userId: socket.user._id,
                name: socket.user.name,
                socketId: socket.id
            };
            queue.set(socket.user._id.toString(), handData);

            // Broadcast to everyone in the room
            io.to(currentClassId).emit('hand-raise', handData);
            io.to(currentClassId).emit('hand-raise-queue-update', Array.from(queue.values()));
        });

        socket.on('hand-lower', () => {
            if (!currentClassId) return;
            
            const queue = roomHandRaises.get(currentClassId);
            if (queue) {
                queue.delete(socket.user._id.toString());
                io.to(currentClassId).emit('hand-raise-queue-update', Array.from(queue.values()));
            }

            // Broadcast to everyone in the room
            io.to(currentClassId).emit('hand-lower', {
                userId: socket.user._id,
                socketId: socket.id
            });
        });

        // ─── Relay teacher stream IDs ───
        socket.on('teacher-streams', (data) => {
            if (!currentClassId) return;
            socket.data.teacherStreams = data;
            socket.data.mediaStatus = {
                ...(socket.data.mediaStatus || {}),
                cameraOn: !!data.cameraTrack,
                screenOn: !!data.screenTrack
            };
            io.to(currentClassId).emit('teacher-streams', data);
            emitParticipants();
        });

        socket.on('stream-info', (data) => {
            if (!currentClassId) return;
            const activeShare = activeScreenShares.get(currentClassId);
            const canPublishScreen = activeShare?.userId?.toString() === socket.user._id.toString();
            socket.data.streamInfo = {
                cameraTrack: data.cameraTrack || null,
                cameraStream: data.cameraStream || null,
                screenTrack: canPublishScreen ? data.screenTrack || null : null,
                screenStream: canPublishScreen ? data.screenStream || null : null
            };
            socket.data.mediaStatus = {
                ...(socket.data.mediaStatus || {}),
                cameraOn: !!socket.data.streamInfo.cameraTrack,
                screenOn: !!socket.data.streamInfo.screenTrack
            };
            io.to(currentClassId).emit('stream-info', {
                userId: socket.user._id,
                streamInfo: socket.data.streamInfo
            });
            emitParticipants();
        });

        socket.on('media-status', (status) => {
            if (!currentClassId) return;
            const muteLocked = !!roomMuteLocks.get(currentClassId);
            const cameraLocked = !!roomCameraLocks.get(currentClassId);
            const activeShare = activeScreenShares.get(currentClassId);
            const canHaveMic = userIsHost() || !muteLocked;
            const canHaveCamera = userIsHost() || !cameraLocked;
            const canHaveScreen = activeShare?.userId?.toString() === socket.user._id.toString();
            socket.data.mediaStatus = {
                ...(socket.data.mediaStatus || {}),
                cameraOn: canHaveCamera && !!status.cameraOn,
                micOn: canHaveMic && !!status.micOn,
                screenOn: canHaveScreen && !!status.screenOn
            };
            io.to(currentClassId).emit('media-status', {
                userId: socket.user._id,
                mediaStatus: socket.data.mediaStatus
            });
            if (muteLocked && status.micOn && !userIsHost()) {
                socket.emit('force-media-off', { mic: true });
            }
            if (cameraLocked && status.cameraOn && !userIsHost()) {
                socket.emit('force-media-off', { camera: true });
            }
            emitParticipants();
        });

        socket.on('request-screen-share', (data, ack) => {
            if (!currentClassId) {
                ack?.({ ok: false, message: 'You are not in a class.' });
                return;
            }

            const activeShare = activeScreenShares.get(currentClassId);
            if (activeShare && activeShare.userId.toString() !== socket.user._id.toString()) {
                ack?.({ ok: false, message: `${activeShare.name} is already presenting.` });
                return;
            }

            const share = {
                userId: socket.user._id,
                name: socket.user.name,
                role: socket.user.role
            };
            activeScreenShares.set(currentClassId, share);
            socket.data.mediaStatus = {
                ...(socket.data.mediaStatus || {}),
                screenOn: true
            };
            io.to(currentClassId).emit('screen-share-state', share);
            io.to(currentClassId).emit('media-status', {
                userId: socket.user._id,
                mediaStatus: socket.data.mediaStatus
            });
            emitParticipants();
            ack?.({ ok: true });
        });

        socket.on('stop-screen-share', (data = {}) => {
            if (!currentClassId) return;
            const activeShare = activeScreenShares.get(currentClassId);
            if (!activeShare) return;

            const targetUserId = data.targetUserId || socket.user._id;
            const isOwner = activeShare.userId.toString() === socket.user._id.toString();
            const isStoppingActiveOwner = activeShare.userId.toString() === targetUserId.toString();
            if (!isStoppingActiveOwner || (!isOwner && !userIsHost())) return;

            const targetSockets = getSocketsByUserId(io, currentClassId, targetUserId);
            targetSockets.forEach(s => {
                s.data.mediaStatus = {
                    ...(s.data.mediaStatus || {}),
                    screenOn: false
                };
                s.data.streamInfo = {
                    ...(s.data.streamInfo || {}),
                    screenTrack: null,
                    screenStream: null
                };
                s.emit('force-media-off', { screen: true });
                io.to(currentClassId).emit('media-status', {
                    userId: s.user._id,
                    mediaStatus: s.data.mediaStatus
                });
                io.to(currentClassId).emit('stream-info', {
                    userId: s.user._id,
                    streamInfo: s.data.streamInfo
                });
            });

            activeScreenShares.delete(currentClassId);
            io.to(currentClassId).emit('screen-share-state', null);
            emitParticipants();
        });

        socket.on('host-force-mute', (data) => {
            if (!currentClassId || !userIsHost() || !data?.targetUserId) return;
            const targetSockets = getSocketsByUserId(io, currentClassId, data.targetUserId);
            targetSockets.forEach(s => {
                if (s.user.role === 'teacher' || s.user.role === 'admin') return;
                s.data.mediaStatus = {
                    ...(s.data.mediaStatus || {}),
                    micOn: false
                };
                s.emit('force-media-off', { mic: true });
                io.to(currentClassId).emit('media-status', {
                    userId: s.user._id,
                    mediaStatus: s.data.mediaStatus
                });
            });
            emitParticipants();
        });

        socket.on('host-force-camera-off', (data) => {
            if (!currentClassId || !userIsHost() || !data?.targetUserId) return;
            const targetSockets = getSocketsByUserId(io, currentClassId, data.targetUserId);
            targetSockets.forEach(s => {
                if (s.user.role === 'teacher' || s.user.role === 'admin') return;
                s.data.mediaStatus = {
                    ...(s.data.mediaStatus || {}),
                    cameraOn: false
                };
                s.emit('force-media-off', { camera: true });
                io.to(currentClassId).emit('media-status', {
                    userId: s.user._id,
                    mediaStatus: s.data.mediaStatus
                });
            });
            emitParticipants();
        });

        socket.on('host-mute-all', () => {
            if (!currentClassId || !userIsHost()) return;
            roomMuteLocks.set(currentClassId, true);
            io.to(currentClassId).emit('room-mute-state', { muted: true });
            const room = io.sockets.adapter.rooms.get(currentClassId);
            if (room) {
                for (const socketId of room) {
                    const s = io.sockets.sockets.get(socketId);
                    if (!s || s.user.role === 'teacher' || s.user.role === 'admin') continue;
                    s.data.mediaStatus = {
                        ...(s.data.mediaStatus || {}),
                        micOn: false
                    };
                    s.emit('force-media-off', { mic: true });
                    io.to(currentClassId).emit('media-status', {
                        userId: s.user._id,
                        mediaStatus: s.data.mediaStatus
                    });
                }
            }
            emitParticipants();
        });

        socket.on('host-camera-off-all', () => {
            if (!currentClassId || !userIsHost()) return;
            roomCameraLocks.set(currentClassId, true);
            io.to(currentClassId).emit('room-camera-state', { cameraLocked: true });
            const room = io.sockets.adapter.rooms.get(currentClassId);
            if (room) {
                for (const socketId of room) {
                    const s = io.sockets.sockets.get(socketId);
                    if (!s || s.user.role === 'teacher' || s.user.role === 'admin') continue;
                    s.data.mediaStatus = {
                        ...(s.data.mediaStatus || {}),
                        cameraOn: false
                    };
                    s.emit('force-media-off', { camera: true });
                    io.to(currentClassId).emit('media-status', {
                        userId: s.user._id,
                        mediaStatus: s.data.mediaStatus
                    });
                }
            }
            emitParticipants();
        });

        socket.on('host-camera-on-all', () => {
            if (!currentClassId || !userIsHost()) return;
            roomCameraLocks.set(currentClassId, false);
            io.to(currentClassId).emit('room-camera-state', { cameraLocked: false });
        });

        socket.on('host-unmute-all', () => {
            if (!currentClassId || !userIsHost()) return;
            roomMuteLocks.set(currentClassId, false);
            io.to(currentClassId).emit('room-mute-state', { muted: false });
        });

        socket.on('host-remove-participant', (data) => {
            if (!currentClassId || !userIsHost() || !data?.targetUserId) return;
            const targetSockets = getSocketsByUserId(io, currentClassId, data.targetUserId);
            targetSockets.forEach(s => {
                if (s.user.role === 'teacher' || s.user.role === 'admin') return;
                s.emit('removed-from-class');
                s.leave(currentClassId);
                s.disconnect(true);
            });
            emitParticipants();
        });

        socket.on('reaction', (data) => {
            if (!currentClassId || !data?.emoji) return;
            io.to(currentClassId).emit('reaction', {
                id: `${socket.id}-${Date.now()}`,
                userId: socket.user._id,
                name: socket.user.name,
                emoji: String(data.emoji).slice(0, 8),
                timestamp: Date.now()
            });
        });

        // ─── Teacher approves/denies student stream ───
        socket.on('approve-hand', (data) => {
            // data: { targetUserId, targetSocketId }
            if (!currentClassId) return;
            if (data.targetSocketId) {
                const s = io.sockets.sockets.get(data.targetSocketId);
                if (s) {
                    s.emit('stream-approved', { approved: true });
                }
            } else {
                const targetSockets = getSocketsByUserId(io, currentClassId, data.targetUserId);
                targetSockets.forEach(s => {
                    s.emit('stream-approved', { approved: true });
                });
            }
            // Notify room that this student is now active
            io.to(currentClassId).emit('active-student', {
                userId: data.targetUserId,
                name: data.targetName || ''
            });
        });

        socket.on('deny-hand', (data) => {
            if (!currentClassId) return;
            if (data.targetSocketId) {
                const s = io.sockets.sockets.get(data.targetSocketId);
                if (s) {
                    s.emit('stream-approved', { approved: false });
                }
            } else {
                const targetSockets = getSocketsByUserId(io, currentClassId, data.targetUserId);
                targetSockets.forEach(s => {
                    s.emit('stream-approved', { approved: false });
                });
            }
        });

        socket.on('revoke-stream', (data) => {
            if (!currentClassId) return;
            const targetSockets = getSocketsByUserId(io, currentClassId, data.targetUserId);
            targetSockets.forEach(s => {
                s.emit('stream-revoked');
            });
            io.to(currentClassId).emit('active-student', {
                userId: null,
                name: ''
            });
        });

        socket.on('toggle-co-host', (data) => {
            const isRealHost = socket.user.role === 'teacher' || socket.user.role === 'admin';
            if (!currentClassId || !isRealHost || !data?.targetUserId) return;

            let coHostsSet = roomCoHosts.get(currentClassId);
            if (!coHostsSet) {
                coHostsSet = new Set();
                roomCoHosts.set(currentClassId, coHostsSet);
            }

            const targetIdStr = data.targetUserId.toString();
            if (coHostsSet.has(targetIdStr)) {
                coHostsSet.delete(targetIdStr);
            } else {
                coHostsSet.add(targetIdStr);
            }

            emitParticipants();
        });

        socket.on('user-unavailable', () => {
            if (!currentClassId) return;
            let unavailSet = roomUnavailableUsers.get(currentClassId);
            if (!unavailSet) { unavailSet = new Set(); roomUnavailableUsers.set(currentClassId, unavailSet); }
            unavailSet.add(socket.user._id.toString());
            io.to(currentClassId).emit('user-unavailable', {
                userId: socket.user._id.toString(),
                name: socket.user.name
            });
        });

        socket.on('user-available', () => {
            if (!currentClassId) return;
            const unavailSet = roomUnavailableUsers.get(currentClassId);
            if (unavailSet) unavailSet.delete(socket.user._id.toString());
            io.to(currentClassId).emit('user-available', {
                userId: socket.user._id.toString(),
                name: socket.user.name
            });
        });

        socket.on('end-session', async () => {
            if (!currentClassId) return;
            roomCoHosts.delete(currentClassId);
            roomUnavailableUsers.delete(currentClassId);
            roomHandRaises.delete(currentClassId);
            roomPinnedMessages.delete(currentClassId);
            io.to(currentClassId).emit('session-ended');
        });

        // ─── Disconnect ───
        socket.on('disconnect', async () => {
            console.log(`[Socket] User disconnected: ${socket.user.name}`);
            if (attendanceId) {
                try {
                    await Attendance.findByIdAndUpdate(attendanceId, { leftAt: new Date() });
                } catch (error) {
                    console.error('[Socket] Failed to update attendance:', error.message);
                }
            }

            if (currentClassId) {
                // Clear unavailable status on disconnect
                const unavailSet = roomUnavailableUsers.get(currentClassId);
                if (unavailSet?.has(socket.user._id.toString())) {
                    unavailSet.delete(socket.user._id.toString());
                    io.to(currentClassId).emit('user-available', {
                        userId: socket.user._id.toString(),
                        name: socket.user.name
                    });
                }

                // Clear hand raise on disconnect
                const handRaisesMap = roomHandRaises.get(currentClassId);
                if (handRaisesMap && handRaisesMap.has(socket.user._id.toString())) {
                    handRaisesMap.delete(socket.user._id.toString());
                    io.to(currentClassId).emit('hand-raise-queue-update', Array.from(handRaisesMap.values()));
                    io.to(currentClassId).emit('hand-lower', {
                        userId: socket.user._id,
                        socketId: socket.id
                    });
                }

                const activeShare = activeScreenShares.get(currentClassId);
                if (activeShare?.userId?.toString() === socket.user._id.toString()) {
                    activeScreenShares.delete(currentClassId);
                    io.to(currentClassId).emit('screen-share-state', null);
                }
                // Update participant list
                const participants = await buildParticipants(currentClassId);
                io.to(currentClassId).emit('participant-update', participants);
            }
        });
    });
};

// Helper: find sockets for a specific user in a room
function getSocketsByUserId(io, roomId, targetUserId) {
    const room = io.sockets.adapter.rooms.get(roomId);
    if (!room) return [];

    const results = [];
    for (const socketId of room) {
        const s = io.sockets.sockets.get(socketId);
        if (s && s.user && s.user._id.toString() === targetUserId.toString()) {
            results.push(s);
        }
    }
    return results;
}

export default initLiveClassSocket;
