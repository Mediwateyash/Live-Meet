import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import axios from 'axios';
import {
    Video, VideoOff, Mic, MicOff, Monitor, MonitorOff,
    MessageSquare, Users, Hand, PhoneOff, Send, X, Pin,
    CheckCircle, XCircle, UserX, Maximize, Minimize, Image,
    Calculator, FileText, Download, Copy, Trash2, Smile, BookOpen, Camera, Shield, Search, Coffee,
    UserPlus, UserMinus, RefreshCw, Info, ChevronLeft, ChevronRight
} from 'lucide-react';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

const calculateJustifiedLayout = (aspects, containerWidth, containerHeight, gap = 8) => {
    const n = aspects.length;
    if (n <= 0) return { rowHeight: 0, cols: 1, rows: 1 };

    let bestHeight = 0;
    let bestRows = 1;
    let bestCols = 1;

    for (let r = 1; r <= n; r++) {
        const itemsPerRow = Math.ceil(n / r);
        const c = itemsPerRow;

        const hMax = (containerHeight - gap * (r - 1)) / r;

        let maxRowAspect = 0;
        for (let i = 0; i < r; i++) {
            const start = i * itemsPerRow;
            const end = Math.min(start + itemsPerRow, n);
            let rowAspectSum = 0;
            for (let j = start; j < end; j++) {
                rowAspectSum += aspects[j];
            }
            if (rowAspectSum > maxRowAspect) {
                maxRowAspect = rowAspectSum;
            }
        }

        const hLimitWidth = (containerWidth - gap * (itemsPerRow - 1)) / maxRowAspect;

        const h = Math.min(hMax, hLimitWidth);

        if (h > bestHeight) {
            bestHeight = h;
            bestRows = r;
            bestCols = c;
        }
    }

    return {
        rowHeight: Math.floor(bestHeight),
        rows: bestRows,
        cols: bestCols
    };
};

const LiveClassRoom = () => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    // Class info
    const [classInfo, setClassInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    // Access control
    const [accessDenied, setAccessDenied] = useState(false);
    const [accessDeniedMessage, setAccessDeniedMessage] = useState('');

    // Socket
    const socketRef = useRef(null);

    // WebRTC
    const peerConnectionsRef = useRef({});
    const localStreamRef = useRef(null);
    const screenStreamRef = useRef(null);

    // Media state
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [facingMode, setFacingMode] = useState('user');
    const [isMicOn, setIsMicOn] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [maximizedGridId, setMaximizedGridId] = useState(null);

    // UI state
    const [participants, setParticipants] = useState([]);
    const [chatMessages, setChatMessages] = useState([]);
    const [pinnedMessages, setPinnedMessages] = useState([]);
    const [activePinnedIndex, setActivePinnedIndex] = useState(0);
    const [chatInput, setChatInput] = useState('');
    const [chatImage, setChatImage] = useState(null);
    const [chatRecipient, setChatRecipient] = useState('everyone');
    const [chatTab, setChatTab] = useState('global');
    const [selectedImage, setSelectedImage] = useState(null);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState(null);
    const [copiedMessageId, setCopiedMessageId] = useState(null);
    const [isRecipientDropdownOpen, setIsRecipientDropdownOpen] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [unreadChat, setUnreadChat] = useState(false);
    const [unreadPrivateChat, setUnreadPrivateChat] = useState(false);
    const [latestMessage, setLatestMessage] = useState(null);
    const [isScreenMaximized, setIsScreenMaximized] = useState(true);
    const [showParticipants, setShowParticipants] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showFullscreenControls, setShowFullscreenControls] = useState(false);
    const [mediaStatuses, setMediaStatuses] = useState({});
    const [reactions, setReactions] = useState([]);
    const [remoteMediaStreams, setRemoteMediaStreams] = useState({});
    const [streamInfos, setStreamInfos] = useState({});
    const [activeScreenShare, setActiveScreenShare] = useState(null);
    const [roomMuteLocked, setRoomMuteLocked] = useState(false);
    const [roomCameraLocked, setRoomCameraLocked] = useState(false);
    const [participantSearch, setParticipantSearch] = useState('');

    // Unavailable feature state
    const [unavailableUsers, setUnavailableUsers] = useState({}); // { userId: { name } }
    const [unavailableToasts, setUnavailableToasts] = useState([]); // [{ id, name, userId, exiting }]
    const [isUnavailable, setIsUnavailable] = useState(false);

    // Audio levels glow state
    const [speakingUsers, setSpeakingUsers] = useState({});

    // Mobile check
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    useEffect(() => {
        const handleResize = () => setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight
        });
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    const windowWidth = windowSize.width;
    const windowHeight = windowSize.height;
    const isCompactLandscape = windowWidth > windowHeight && windowHeight <= 520;

    // Hand raise state
    const [handRaised, setHandRaised] = useState(false);
    const [handRaiseQueue, setHandRaiseQueue] = useState([]);
    const [streamApproved, setStreamApproved] = useState(false);
    const [showSpeakMessage, setShowSpeakMessage] = useState(false);
    const [handRaiseToasts, setHandRaiseToasts] = useState([]);
    const [joinLeaveToasts, setJoinLeaveToasts] = useState([]);
    const prevParticipantsRef = useRef(null);
    const windowStartParticipantsRef = useRef(null);
    const joinLeaveTimerRef = useRef(null);
    const currentParticipantsRef = useRef([]);
    const [activeStudent, setActiveStudent] = useState(null);

    // Calculator & Notepad State
    const [showCalculator, setShowCalculator] = useState(false);
    const [showNotepad, setShowNotepad] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [isDegreeMode, setIsDegreeMode] = useState(true);
    const [calcExpr, setCalcExpr] = useState('');
    const [calcResult, setCalcResult] = useState('');
    const [noteText, setNoteText] = useState(() => {
        return localStorage.getItem(`note_${classId}`) || '';
    });
    const [isCopied, setIsCopied] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [participantToRemove, setParticipantToRemove] = useState(null);
    const [lockAlertMessage, setLockAlertMessage] = useState(null);
    const [infoAlertMessage, setInfoAlertMessage] = useState(null);

    // Draggable Position States
    const [calcPos, setCalcPos] = useState({
        x: Math.max(10, window.innerWidth / 2 - 190),
        y: Math.max(50, window.innerHeight / 2 - 250)
    });
    const [notepadPos, setNotepadPos] = useState({
        x: Math.max(20, window.innerWidth / 2 - 170),
        y: Math.max(80, window.innerHeight / 2 - 200)
    });

    // Refs for Calculator & Notepad Elements and Size State
    const calcRef = useRef(null);
    const notepadRef = useRef(null);
    const calcSizeRef = useRef({ width: '360px', height: '480px' });
    const notepadSizeRef = useRef({ width: '400px', height: '400px' });
    const mountTimeRef = useRef(Date.now());
    const speakMessageTimerRef = useRef(null);
    const fullscreenControlsTimeoutRef = useRef(null);

    const videoGridContainerRef = useRef(null);
    const [gridDimensions, setGridDimensions] = useState({ width: 800, height: 600 });
    const [videoAspects, setVideoAspects] = useState({});
    const [hideCameraOff, setHideCameraOff] = useState(false);

    useEffect(() => {
        if (!videoGridContainerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                setGridDimensions({ width: width || 800, height: height || 600 });
            }
        });
        observer.observe(videoGridContainerRef.current);
        return () => observer.disconnect();
    }, []);

    const handleVideoMetadata = (gridId, videoElement) => {
        if (!videoElement) return;
        const width = videoElement.videoWidth;
        const height = videoElement.videoHeight;
        if (width && height) {
            const ratio = width / height;
            setVideoAspects(prev => {
                if (prev[gridId] === ratio) return prev;
                return { ...prev, [gridId]: ratio };
            });
        }
    };



    useEffect(() => {
        localStorage.setItem(`note_${classId}`, noteText);
    }, [noteText, classId]);

    const showScreenTile = !!activeScreenShare || isScreenSharing;

    useEffect(() => {
        if (showScreenTile) {
            setMaximizedGridId('screen');
        } else {
            setMaximizedGridId(prev => prev === 'screen' ? null : prev);
        }
    }, [showScreenTile]);


    useEffect(() => {
        if (!showNotepad || !notepadRef.current) return;
        const observer = new ResizeObserver(() => {
            const width = notepadRef.current.style.width;
            const height = notepadRef.current.style.height;
            if (width) notepadSizeRef.current.width = width;
            if (height) notepadSizeRef.current.height = height;
        });
        observer.observe(notepadRef.current);
        return () => observer.disconnect();
    }, [showNotepad]);

    useEffect(() => {
        const constrainPositions = () => {
            const isMobile = window.innerWidth < 640;
            setCalcPos(prev => {
                const width = isMobile ? 280 : 360;
                const height = 480;
                const maxX = window.innerWidth - width;
                const maxY = window.innerHeight - height;
                const newX = Math.max(10, Math.min(prev.x, Math.max(10, maxX)));
                const newY = Math.max(60, Math.min(prev.y, Math.max(60, maxY)));
                if (newX !== prev.x || newY !== prev.y) {
                    return { x: newX, y: newY };
                }
                return prev;
            });
            setNotepadPos(prev => {
                const width = isMobile ? 290 : 400;
                const height = isMobile ? 320 : 400;
                const maxX = window.innerWidth - width;
                const maxY = window.innerHeight - height;
                const newX = Math.max(10, Math.min(prev.x, Math.max(10, maxX)));
                const newY = Math.max(60, Math.min(prev.y, Math.max(60, maxY)));
                if (newX !== prev.x || newY !== prev.y) {
                    return { x: newX, y: newY };
                }
                return prev;
            });
        };
        constrainPositions();
    }, [windowSize, showCalculator, showNotepad]);

    // Draggable Pointer Handler (High Performance, Ref-based to avoid React state re-render lags)
    const handlePointerDown = (e, elementRef, setPos) => {
        if (e.button !== undefined && e.button !== 0) return;

        // Prevent default browser text selection & dragging behavior
        e.preventDefault();

        const element = elementRef.current;
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const startX = e.clientX;
        const startY = e.clientY;
        const initialLeft = rect.left;
        const initialTop = rect.top;

        const oldTransition = element.style.transition;
        element.style.transition = 'none';

        const handlePointerMove = (moveEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;

            let newLeft = initialLeft + dx;
            let newTop = initialTop + dy;

            // Constrain modal boundaries to screen area
            const width = element.offsetWidth;
            const height = element.offsetHeight;
            const maxX = window.innerWidth - width;
            const maxY = window.innerHeight - height;

            newLeft = Math.max(10, Math.min(newLeft, Math.max(10, maxX)));
            newTop = Math.max(60, Math.min(newTop, Math.max(60, maxY)));

            element.style.left = `${newLeft}px`;
            element.style.top = `${newTop}px`;
        };

        const handlePointerUp = () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);

            element.style.transition = oldTransition;

            // Sync final position to state once dragging finishes
            const finalRect = element.getBoundingClientRect();
            setPos({ x: finalRect.left, y: finalRect.top });
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    };

    const handleCalcBtn = (val) => {
        if (val === 'C') {
            setCalcExpr('');
            setCalcResult('');
        } else if (val === 'Del') {
            setCalcExpr(prev => prev.slice(0, -1));
        } else if (val === '=') {
            const degToRad = (x) => x * Math.PI / 180;
            const sin = (x) => isDegreeMode ? Math.sin(degToRad(x)) : Math.sin(x);
            const cos = (x) => isDegreeMode ? Math.cos(degToRad(x)) : Math.cos(x);
            const tan = (x) => isDegreeMode ? Math.tan(degToRad(x)) : Math.tan(x);
            const log = (x) => Math.log10(x);
            const ln = (x) => Math.log(x);
            const sqrt = (x) => Math.sqrt(x);

            try {
                let expr = calcExpr;
                // Auto-close open parentheses
                let openCount = 0;
                for (let char of expr) {
                    if (char === '(') openCount++;
                    if (char === ')') openCount--;
                }
                if (openCount > 0) {
                    expr += ')'.repeat(openCount);
                }

                // Insert implicit multiplication (e.g. 5log(2) -> 5*log(2))
                expr = expr.replace(/([0-9)πe])(?=[sctl√πe(])/g, '$&*');
                expr = expr.replace(/([)])(?=[0-9])/g, '$&*');

                let sanitized = expr
                    .replace(/×/g, '*')
                    .replace(/÷/g, '/')
                    .replace(/π/g, 'Math.PI')
                    .replace(/e/g, 'Math.E')
                    .replace(/√\(/g, 'sqrt(')
                    .replace(/\^/g, '**');

                if (!/^[0-9+\-*/().\s|sin|cos|tan|log|ln|sqrt|Math.PI|Math.E|**|%]+$/.test(sanitized)) {
                    setCalcResult('Error');
                    return;
                }

                const evaluator = new Function('sin', 'cos', 'tan', 'log', 'ln', 'sqrt', `return ${sanitized}`);
                const result = evaluator(sin, cos, tan, log, ln, sqrt);

                if (typeof result === 'number' && !isNaN(result)) {
                    setCalcResult(Number(result.toFixed(8)).toString());
                } else {
                    setCalcResult('Error');
                }
            } catch (err) {
                setCalcResult('Error');
            }
        } else {
            setCalcExpr(prev => prev + val);
        }
    };

    const downloadNote = () => {
        const element = document.createElement("a");
        const file = new Blob([noteText], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        const title = classInfo?.title || 'class';
        const formattedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        element.download = `notes-${formattedTitle}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const copyNoteToClipboard = () => {
        navigator.clipboard.writeText(noteText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const clearNote = () => {
        setShowClearConfirm(true);
    };

    const calcButtons = [
        'sin(', 'cos(', 'tan(', 'log(', 'ln(',
        'π', 'e', '^', '√(', '%',
        '7', '8', '9', '(', ')',
        '4', '5', '6', 'C', 'Del',
        '1', '2', '3', '×', '÷',
        '0', '.', '=', '+', '-'
    ];

    // Diagnostics state
    const [, setDiagnostics] = useState({
        cameraTrackId: null,
        screenTrackId: null,
        cameraStreamId: null,
        screenStreamId: null,
        remoteCameraTrack: null,
        remoteScreenTrack: null,
        remoteCameraStream: null,
        remoteScreenStream: null,
        lastEvent: 'none'
    });

    const updateDiagnostics = useCallback((event) => {
        setDiagnostics({
            cameraTrackId: teacherStreamIds.current.cameraTrack,
            screenTrackId: teacherStreamIds.current.screenTrack,
            cameraStreamId: teacherStreamIds.current.cameraStream,
            screenStreamId: teacherStreamIds.current.screenStream,
            remoteCameraTrack: remoteVideoRef.current?.srcObject?.getVideoTracks()[0]?.id || null,
            remoteScreenTrack: screenVideoRef.current?.srcObject?.getVideoTracks()[0]?.id || null,
            remoteCameraStream: remoteVideoRef.current?.srcObject?.id || null,
            remoteScreenStream: screenVideoRef.current?.srcObject?.id || null,
            lastEvent: event
        });
    }, []);

    // Tracking stream and track IDs
    const teacherStreamIds = useRef({
        cameraTrack: null,
        screenTrack: null,
        cameraStream: null,
        screenStream: null
    });
    const trackStreamMap = useRef({}); // trackId -> streamId
    const streamInfosRef = useRef({});
    const remoteVideoRefs = useRef({});

    // Refs for media elements
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const screenVideoRef = useRef(null);
    const pendingScreenStreamRef = useRef(null);
    const studentVideoRef = useRef(null);
    const remoteAudioRef = useRef(null); // Separate audio element for reliable voice
    const chatEndRef = useRef(null);
    const chatTextareaRef = useRef(null);
    const lastProcessedMsgLengthRef = useRef(0);
    const screenContainerRef = useRef(null);
    const fullscreenControlsTimerRef = useRef(null);
    const touchDoubleTapRef = useRef({ gridId: null, time: 0 });
    const lastTouchDoubleTapHandledAtRef = useRef(0);

    const isTeacher = user && (user.role === 'teacher' || user.role === 'admin');
    const isCoHost = participants.find(p => p.userId?.toString() === user?._id?.toString())?.role === 'co-host';
    const isHost = isTeacher || isCoHost;
    const hostParticipant = participants.find(p => p.role === 'teacher' || p.role === 'admin');
    const hostId = hostParticipant?.userId || (isTeacher ? user?._id : null);
    const hostName = hostParticipant?.name || user?.name || 'Teacher';
    const ownMediaStatus = {
        cameraOn: isCameraOn,
        micOn: isMicOn,
        screenOn: isScreenSharing
    };
    const hostMediaStatus = hostId === user?._id
        ? ownMediaStatus
        : (mediaStatuses[hostId] || hostParticipant?.mediaStatus || {
            cameraOn: false,
            micOn: false,
            screenOn: false
        });
    const activeScreenOwnerId = activeScreenShare?.userId?.toString();
    const activeScreenOwnerName = activeScreenShare?.name || 'Presenter';

    const getParticipantActionState = (participant) => {
        const id = participant?.userId?.toString();
        const status = id === user?._id?.toString()
            ? ownMediaStatus
            : (mediaStatuses[id] || participant?.mediaStatus || {});
        const micOn = !!status.micOn;
        const cameraOn = !!status.cameraOn;
        const away = !!unavailableUsers[id];
        const handRaisedForUser = handRaiseQueue.some(h => (
            h.userId?.toString() === id || h.socketId?.toString() === id
        ));
        return {
            micOn,
            cameraOn,
            away,
            handRaised: handRaisedForUser,
            speaking: !!speakingUsers[id],
            score: (speakingUsers[id] ? 16 : 0) + (micOn ? 8 : 0) + (cameraOn ? 8 : 0) + (handRaisedForUser ? 4 : 0) + (away ? 2 : 0)
        };
    };

    const compareParticipantsByGridPriority = (a, b) => {
        const isCoHostA = a.role === 'co-host';
        const isCoHostB = b.role === 'co-host';
        if (isCoHostA && !isCoHostB) return -1;
        if (!isCoHostA && isCoHostB) return 1;

        const actionA = getParticipantActionState(a);
        const actionB = getParticipantActionState(b);
        if (actionA.score !== actionB.score) return actionB.score - actionA.score;

        return (a.name || '').localeCompare(b.name || '');
    };

    const visibleParticipants = participants
        .filter(p => !(p.role === 'teacher' || p.role === 'admin'))
        .sort(compareParticipantsByGridPriority);

    const isHostPresent = !!hostParticipant || isTeacher;
    const isMaximized = !!maximizedGridId;

    const getMaxTiles = () => {
        if (isCompactLandscape) return 8;
        if (windowWidth < 1024) return 6;
        if (windowWidth < 1536) return 9;
        return 12;
    };

    let displayedParticipants = visibleParticipants;
    let extraParticipantsCount = 0;

    if (isMaximized) {
        const getMaxBottomTiles = () => {
            if (windowWidth < 640) return 4;
            if (windowWidth < 1024) return 5;
            if (windowWidth < 1280) return 6;
            return 7;
        };
        const maxBottomTiles = getMaxBottomTiles();
        const isScreenInBottom = maximizedGridId !== 'screen' && showScreenTile;
        const isHostInBottom = maximizedGridId !== 'host' && isHostPresent;
        const availableSlots = Math.max(1, maxBottomTiles - (isScreenInBottom ? 1 : 0) - (isHostInBottom ? 1 : 0));

        const otherParticipantsList = visibleParticipants.filter(p => maximizedGridId !== p.userId);
        if (otherParticipantsList.length > availableSlots) {
            const slotsForRealParticipants = Math.max(0, availableSlots - 1);
            displayedParticipants = otherParticipantsList.slice(0, slotsForRealParticipants);
            extraParticipantsCount = otherParticipantsList.length - slotsForRealParticipants;
        } else {
            displayedParticipants = otherParticipantsList;
            extraParticipantsCount = 0;
        }
    } else {
        const maxTiles = getMaxTiles();
        const availableSlots = Math.max(1, maxTiles - (isHostPresent ? 1 : 0) - (showScreenTile ? 1 : 0));
        if (visibleParticipants.length > availableSlots) {
            const slotsForRealParticipants = Math.max(0, availableSlots - 1);
            displayedParticipants = visibleParticipants.slice(0, slotsForRealParticipants);
            extraParticipantsCount = visibleParticipants.length - slotsForRealParticipants;
        }
    }

    let finalDisplayedParticipants = displayedParticipants;
    if (hideCameraOff) {
        const withVideo = displayedParticipants.filter(p => {
            const status = mediaStatuses[p.userId] || p.mediaStatus || { cameraOn: false };
            const isPartCamOn = p.userId === user?._id ? isCameraOn : status.cameraOn;
            return isPartCamOn;
        });
        if (withVideo.length > 0) {
            finalDisplayedParticipants = withVideo;
        }
    }

    const actualTileCount = (isHostPresent ? 1 : 0) + (showScreenTile ? 1 : 0) + finalDisplayedParticipants.length + (extraParticipantsCount > 0 ? 1 : 0);

    const videoGridClass = isMaximized
        ? 'grid grid-rows-[minmax(0,1fr)_auto] md:grid-rows-1 md:grid-cols-[minmax(0,1fr)_160px] lg:grid-cols-[minmax(0,1fr)_200px] gap-2 w-full h-full min-h-0 overflow-hidden'
        : 'flex flex-wrap justify-center items-center gap-2 w-full h-full min-h-0 overflow-hidden p-1 sm:p-2';

    const activeTileAspects = [];
    if (!isMaximized) {
        if (showScreenTile && maximizedGridId !== 'screen') {
            activeTileAspects.push(videoAspects['screen'] || (16 / 9));
        }
        if (isHostPresent && maximizedGridId !== 'host') {
            let isHostCamOn = hostId === user?._id ? isCameraOn : hostMediaStatus.cameraOn;
            activeTileAspects.push(isHostCamOn ? (videoAspects['host'] || (16 / 9)) : (16 / 9));
        }
        finalDisplayedParticipants.forEach(p => {
            if (maximizedGridId !== p.userId) {
                const status = mediaStatuses[p.userId] || p.mediaStatus || { cameraOn: false };
                const isPartCamOn = p.userId === user?._id ? isCameraOn : status.cameraOn;
                activeTileAspects.push(isPartCamOn ? (videoAspects[p.userId] || (16 / 9)) : (16 / 9));
            }
        });
        if (extraParticipantsCount > 0) {
            activeTileAspects.push(16 / 9);
        }
    }

    const { rowHeight, cols, rows } = calculateJustifiedLayout(
        activeTileAspects,
        gridDimensions.width,
        gridDimensions.height,
        8
    );

    const getTileStyle = (gridId) => {
        if (isMaximized) return {};
        let aspect = 16 / 9;
        if (gridId === 'screen') {
            aspect = videoAspects['screen'] || (16 / 9);
        } else if (gridId === 'host') {
            let isHostCamOn = hostId === user?._id ? isCameraOn : hostMediaStatus.cameraOn;
            aspect = isHostCamOn ? (videoAspects['host'] || (16 / 9)) : (16 / 9);
        } else if (gridId === 'others') {
            aspect = 16 / 9;
        } else {
            const p = visibleParticipants.find(part => part.userId === gridId);
            if (p) {
                const status = mediaStatuses[gridId] || p.mediaStatus || { cameraOn: false };
                const isPartCamOn = p.userId === user?._id ? isCameraOn : status.cameraOn;
                aspect = isPartCamOn ? (videoAspects[gridId] || (16 / 9)) : (16 / 9);
            }
        }

        return {
            height: `${rowHeight}px`,
            width: `${rowHeight * aspect}px`,
            maxWidth: '100%',
            maxHeight: '100%',
            flexGrow: aspect,
            flexShrink: 1
        };
    };

    const getParticipantStatus = (participant) => {
        if (participant.userId === user?._id) return ownMediaStatus;
        return mediaStatuses[participant.userId] || participant.mediaStatus || {
            cameraOn: false,
            micOn: false,
            screenOn: false
        };
    };

    const getRemoteCameraStream = (userId) => remoteMediaStreams[userId]?.camera || null;

    const setRemoteVideoNode = (userId, type, node) => {
        if (!userId) return;
        const key = `${userId}-${type}`;
        if (node) {
            remoteVideoRefs.current[key] = node;
            const stream = remoteMediaStreams[userId]?.[type];
            if (stream && node.srcObject !== stream) node.srcObject = stream;
        } else {
            delete remoteVideoRefs.current[key];
        }
    };

    const setScreenVideoNode = (node) => {
        if (node) {
            screenVideoRef.current = node;
            const activeOwnerIsMe = activeScreenOwnerId === user?._id?.toString();
            const remoteScreenStream = activeScreenOwnerId ? remoteMediaStreams[activeScreenOwnerId]?.screen : null;

            let targetStream = null;
            if (activeOwnerIsMe && screenStreamRef.current) {
                targetStream = screenStreamRef.current;
            } else if (remoteScreenStream) {
                targetStream = remoteScreenStream;
            } else if (pendingScreenStreamRef.current && !activeOwnerIsMe) {
                targetStream = pendingScreenStreamRef.current;
            }

            if (targetStream && node.srcObject !== targetStream) {
                node.srcObject = targetStream;
                const playPromise = node.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => console.error("Screen play failed:", e));
                }
            }
        } else {
            screenVideoRef.current = null;
        }
    };

    // Fetch class info and chat history
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                // Pre-join validation: check if user is allowed to join this class
                try {
                    const validateRes = await axios.post(`/api/live-class/${classId}/validate-join`, {}, { headers });
                    if (!validateRes.data.allowed) {
                        setAccessDenied(true);
                        setAccessDeniedMessage(validateRes.data.message || 'You are not authorized to join this class.');
                        setLoading(false);
                        return;
                    }
                } catch (validateError) {
                    setAccessDenied(true);
                    setAccessDeniedMessage(validateError.response?.data?.message || 'Access denied. You are not authorized to join this class.');
                    setLoading(false);
                    return;
                }

                const [classRes, chatRes] = await Promise.all([
                    axios.get(`/api/live-class/${classId}`, { headers }),
                    axios.get(`/api/live-class/${classId}/chat`, { headers })
                ]);
                setClassInfo(classRes.data);
                setChatMessages(chatRes.data);
                lastProcessedMsgLengthRef.current = chatRes.data.length;
            } catch (error) {
                console.error('Failed to fetch class data', error);
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [classId, navigate]);

    // Fullscreen listener
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
            setIsFullscreen(isFull);
            if (!isFull) {
                setShowFullscreenControls(false);
                if (fullscreenControlsTimerRef.current) clearTimeout(fullscreenControlsTimerRef.current);
            } else {
                setShowFullscreenControls(true);
                if (fullscreenControlsTimerRef.current) clearTimeout(fullscreenControlsTimerRef.current);
                fullscreenControlsTimerRef.current = setTimeout(() => {
                    setShowFullscreenControls(false);
                }, 5000);
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            if (fullscreenControlsTimerRef.current) clearTimeout(fullscreenControlsTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (!showScreenTile || !screenVideoRef.current) return;
        const activeOwnerIsMe = activeScreenOwnerId === user?._id?.toString();
        const remoteScreenStream = activeScreenOwnerId ? remoteMediaStreams[activeScreenOwnerId]?.screen : null;

        let targetStream = null;
        if (activeOwnerIsMe && screenStreamRef.current) {
            targetStream = screenStreamRef.current;
        } else if (remoteScreenStream) {
            targetStream = remoteScreenStream;
        } else if (pendingScreenStreamRef.current && !activeOwnerIsMe) {
            targetStream = pendingScreenStreamRef.current;
        }

        if (targetStream && screenVideoRef.current.srcObject !== targetStream) {
            screenVideoRef.current.srcObject = targetStream;
            const playPromise = screenVideoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => console.error("Screen play failed:", e));
            }
        }
    }, [showScreenTile, activeScreenOwnerId, user?._id, remoteMediaStreams]);

    useEffect(() => {
        streamInfosRef.current = streamInfos;
    }, [streamInfos]);

    useEffect(() => {
        Object.entries(remoteVideoRefs.current).forEach(([key, node]) => {
            const [userId, type] = key.split('-');
            const stream = remoteMediaStreams[userId]?.[type];
            if (stream && node.srcObject !== stream) {
                node.srcObject = stream;
                const playPromise = node.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => console.error("Camera play failed:", e));
                }
            }
        });
    }, [remoteMediaStreams]);

    const toggleFullScreen = () => {
        if (isFullscreen) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else {
                setIsFullscreen(false); // CSS fallback
            }
        } else {
            const container = screenContainerRef.current;
            if (container?.requestFullscreen) {
                container.requestFullscreen().catch(err => {
                    console.error(`Fullscreen error: ${err.message}`);
                    if (screenVideoRef.current?.webkitEnterFullscreen) {
                        screenVideoRef.current.webkitEnterFullscreen();
                    } else {
                        setIsFullscreen(true); // CSS fallback
                    }
                });
            } else if (container?.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            } else if (screenVideoRef.current?.webkitEnterFullscreen) {
                screenVideoRef.current.webkitEnterFullscreen(); // iOS Safari fallback specifically for video elements
            } else {
                setIsFullscreen(true); // CSS fallback
            }
        }
    };

    const isInteractiveGridEvent = (e) => (
        e?.target?.closest && (
            e.target.closest('button') ||
            e.target.closest('input') ||
            e.target.closest('textarea') ||
            e.target.closest('select') ||
            e.target.closest('a') ||
            e.target.closest('[role="button"]')
        )
    );

    // 3-state double-tap: normal -> layout-maximized -> browser fullscreen -> normal
    const handleGridDoubleTap = (e, gridId) => {
        if (e?.type === 'dblclick' && Date.now() - lastTouchDoubleTapHandledAtRef.current < 450) {
            return;
        }

        // Don't trigger on interactive child elements
        if (isInteractiveGridEvent(e)) {
            return;
        }

        const container = e.currentTarget;
        if (!container) return;

        const isInBrowserFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);

        if (isInBrowserFullscreen) {
            // State 3 → State 1: Exit browser fullscreen → go back to normal
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
            setMaximizedGridId(null);
        } else if (maximizedGridId === gridId) {
            // State 2 → State 3: Already layout-maximized → go to browser fullscreen
            if (container.requestFullscreen) {
                container.requestFullscreen().catch(err => {
                    console.error("Fullscreen error:", err);
                    const video = container.querySelector('video');
                    if (video && video.webkitEnterFullscreen) {
                        video.webkitEnterFullscreen();
                    }
                });
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            } else {
                const video = container.querySelector('video');
                if (video && video.webkitEnterFullscreen) {
                    video.webkitEnterFullscreen();
                }
            }
        } else {
            // State 1 → State 2: Normal → layout-maximize this grid
            setMaximizedGridId(gridId);
        }
    };

    const handleGridPointerUp = (e, gridId) => {
        if (e.pointerType === 'mouse' || isInteractiveGridEvent(e)) return;

        const now = Date.now();
        const previousTap = touchDoubleTapRef.current;
        if (previousTap.gridId === gridId && now - previousTap.time < 320) {
            e.preventDefault();
            lastTouchDoubleTapHandledAtRef.current = now;
            touchDoubleTapRef.current = { gridId: null, time: 0 };
            handleGridDoubleTap(e, gridId);
            return;
        }

        touchDoubleTapRef.current = { gridId, time: now };
    };

    // Legacy: keep for screen-share double-click that also needs toggleFullScreen
    const toggleTileFullscreen = (e) => {
        handleGridDoubleTap(e, 'screen');
    };

    const switchCamera = async () => {
        if (!isCameraOn || !localStreamRef.current) return;

        const nextFacingMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(nextFacingMode);

        try {
            // Stop current video tracks
            localStreamRef.current.getVideoTracks().forEach(track => {
                track.stop();
                localStreamRef.current.removeTrack(track);
            });

            // Get new stream with the new facingMode
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: nextFacingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: isMicOn
            });

            const newVideoTrack = newStream.getVideoTracks()[0];
            localStreamRef.current.addTrack(newVideoTrack);

            // Update local video element
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStreamRef.current;
            }

            // Update peer connections
            Object.values(peerConnectionsRef.current).forEach(pc => {
                const senders = pc.getSenders();
                const videoSender = senders.find(s => s.track && s.track.kind === 'video');
                if (videoSender) {
                    videoSender.replaceTrack(newVideoTrack).catch(err => {
                        console.error('Failed to replace track in RTCPeerConnection:', err);
                    });
                }
            });

            broadcastStreamIds();
        } catch (err) {
            console.error('Failed to switch camera:', err);
            alert('Could not switch camera. Make sure you have another camera device.');
        }
    };

    const takeScreenShareScreenshot = () => {
        const video = screenVideoRef.current;
        if (!video) return;

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || video.clientWidth || 1920;
        canvas.height = video.videoHeight || video.clientHeight || 1080;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            try {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = `screenshot_${classInfo?.title || 'screenshare'}_${Date.now()}.png`;
                link.href = dataUrl;
                link.click();
            } catch (err) {
                console.error('Failed to take video screenshot:', err);
                alert('Cannot take screenshot due to browser security restrictions (CORS).');
            }
        }
    };

    const toggleFullscreenControls = () => {
        if (!isFullscreen) return;
        setShowFullscreenControls(prev => {
            const next = !prev;
            if (next) {
                if (fullscreenControlsTimerRef.current) clearTimeout(fullscreenControlsTimerRef.current);
                fullscreenControlsTimerRef.current = setTimeout(() => {
                    setShowFullscreenControls(false);
                }, 5000);
            }
            return next;
        });
    };

    const handleScreenContainerClick = (e) => {
        if (isFullscreen) {
            if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea') || e.target.closest('.no-click-trigger') || e.target.closest('.custom-scrollbar')) {
                return;
            }
            toggleFullscreenControls();
        }
    };

    const broadcastStreamIds = useCallback(() => {
        if (!socketRef.current) return;

        const cameraVideoTrack = localStreamRef.current?.getVideoTracks()[0];
        const screenVideoTrack = screenStreamRef.current?.getVideoTracks()[0];

        const info = {
            cameraTrack: cameraVideoTrack?.id || null,
            screenTrack: screenVideoTrack?.id || null,
            cameraStream: cameraVideoTrack ? localStreamRef.current?.id : null,
            screenStream: screenVideoTrack ? screenStreamRef.current?.id : null
        };

        socketRef.current.emit('stream-info', info);
        const nextInfos = {
            ...streamInfosRef.current,
            [user?._id]: info
        };
        streamInfosRef.current = nextInfos;
        setStreamInfos(nextInfos);

        if (isTeacher) {
            socketRef.current.emit('teacher-streams', info);
        }
        updateDiagnostics('broadcastStreamIds');
    }, [isTeacher, updateDiagnostics, user?._id]);

    const emitMediaStatus = useCallback((status) => {
        if (!socketRef.current) return;
        socketRef.current.emit('media-status', status);
        setMediaStatuses(prev => ({
            ...prev,
            [user?._id]: status
        }));
    }, [user?._id]);

    // Initialize socket connection
    useEffect(() => {
        if (!user || loading) return;
        const token = localStorage.getItem('token');

        const socketUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:5000'
            : import.meta.env.VITE_API_URL || window.location.origin;
        const socket = io(socketUrl, {
            auth: { token }
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[Socket] Connected');
            socket.emit('join-class', classId);
            socket.emit('media-status', {
                cameraOn: isCameraOn,
                micOn: isMicOn,
                screenOn: isScreenSharing
            });
            if (isTeacher) {
                setTimeout(broadcastStreamIds, 1000); // Broadcast initial state
            }
            updateDiagnostics('connect');
        });

        socket.on('participant-update', (list) => {
            setMediaStatuses(prev => {
                const next = { ...prev };
                list.forEach(p => {
                    if (p.mediaStatus) next[p.userId] = p.mediaStatus;
                });
                return next;
            });

            // Synchronously update streamInfosRef.current to avoid WebRTC race conditions during reconnects
            const nextStreamInfos = { ...streamInfosRef.current };
            list.forEach(p => {
                if (p.streamInfo) nextStreamInfos[p.userId] = p.streamInfo;
            });
            streamInfosRef.current = nextStreamInfos;
            setStreamInfos(nextStreamInfos);

            // Clean up stale peer connections and remote streams for users who left
            const activeUserIds = list.map(p => p.userId);
            Object.keys(peerConnectionsRef.current).forEach(userId => {
                if (!activeUserIds.includes(userId)) {
                    console.log(`[participant-update] Cleaning up departed participant: ${userId}`);
                    const pc = peerConnectionsRef.current[userId];
                    if (pc) {
                        try { pc.close(); } catch (e) { }
                        delete peerConnectionsRef.current[userId];
                    }
                    setRemoteMediaStreams(prev => {
                        const next = { ...prev };
                        delete next[userId];
                        return next;
                    });
                }
            });

            // Clean up unavailable status for users who left
            const activeIdSet = new Set(list.map(p => p.userId?.toString()));
            setUnavailableUsers(prev => {
                const next = { ...prev };
                Object.keys(next).forEach(id => { if (!activeIdSet.has(id)) delete next[id]; });
                return next;
            });

            setParticipants(prev => {
                const newParticipants = list.filter(p => !prev.find(old => old.userId === p.userId));

                // If ANY user has active media (camera/audio/screen), send offers to newly joined participants
                setTimeout(() => {
                    let hasMedia = false;
                    newParticipants.forEach(np => {
                        if (np.userId !== user._id && (localStreamRef.current || screenStreamRef.current)) {
                            console.log(`[participant-update] Sending connection offer to new participant: ${np.userId}`);
                            sendOfferToOne(np.userId);
                            hasMedia = true;
                        }
                    });
                    if (hasMedia) broadcastStreamIds();
                }, 500);

                return list;
            });
        });

        socket.on('chat-message', (msg) => {
            setChatMessages(prev => [...prev, msg]);
        });

        socket.on('chat-message-deleted', ({ messageId }) => {
            console.log('[Socket] chat-message-deleted received for:', messageId);
            setChatMessages(prev => prev.filter(msg => {
                const mId = msg._id || msg.id;
                return mId?.toString() !== messageId?.toString();
            }));
            setPinnedMessages(prev => prev.filter(msg => {
                const mId = msg._id || msg.id;
                return mId?.toString() !== messageId?.toString();
            }));
        });

        socket.on('pinned-messages', (msgs) => {
            console.log('[Socket] Received pinned-messages list:', msgs);
            setPinnedMessages(msgs || []);
        });

        socket.on('error-message', (msg) => {
            alert(msg);
        });

        socket.on('access-denied', (data) => {
            setAccessDenied(true);
            setAccessDeniedMessage(data.message || 'You are not authorized to join this class.');
            socket.disconnect();
        });

        // Track teacher stream IDs for proper WebRTC mapping
        socket.on('teacher-streams', (data) => {
            console.log('[Socket] Received teacher-streams:', data);
            teacherStreamIds.current = data;
            console.log("teacherStreamIds.current", teacherStreamIds.current);
            setMediaStatuses(prev => {
                const teacher = participants.find(p => p.role === 'teacher' || p.role === 'admin');
                const teacherUserId = teacher?.userId;
                if (!teacherUserId) return prev;
                return {
                    ...prev,
                    [teacherUserId]: {
                        ...(prev[teacherUserId] || teacher.mediaStatus || {}),
                        cameraOn: !!data.cameraTrack,
                        screenOn: !!data.screenTrack
                    }
                };
            });

            if (!isTeacher) {
                // Safely reassign tracks without bundling issues
                const currentTracks = [];
                if (remoteVideoRef.current?.srcObject) {
                    currentTracks.push(...remoteVideoRef.current.srcObject.getVideoTracks());
                }
                if (screenVideoRef.current?.srcObject) {
                    currentTracks.push(...screenVideoRef.current.srcObject.getVideoTracks());
                }

                // Clear both temporarily
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
                if (screenVideoRef.current) screenVideoRef.current.srcObject = null;

                // Deduplicate tracks
                const uniqueTracks = [...new Map(currentTracks.map(t => [t.id, t])).values()];
                const activeTracks = uniqueTracks; // Removed raw readyState filter to avoid browser quirks

                activeTracks.forEach(track => {
                    const videoStream = new MediaStream([track]);
                    const streamId = trackStreamMap.current[track.id];
                    const type = getTrackType(track, streamId);
                    console.log(`[reassign] Track ${track.id} (stream ${streamId}) resolved to type: ${type}`);

                    if (type === 'screen') {
                        pendingScreenStreamRef.current = videoStream;
                        if (screenVideoRef.current) screenVideoRef.current.srcObject = videoStream;
                    } else {
                        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = videoStream;
                    }
                });
            }
            updateDiagnostics('teacher-streams');
        });

        // WebRTC signaling
        socket.on('offer', async (data) => {
            const oldPc = peerConnectionsRef.current[data.fromUserId];
            if (oldPc) {
                console.log(`[offer] Closing old peer connection for ${data.fromUserId} because we received a new offer`);
                try { oldPc.close(); } catch (e) { }
                delete peerConnectionsRef.current[data.fromUserId];
            }
            await handleOffer(data);
        });
        socket.on('answer', async (data) => {
            await handleAnswer(data);
        });
        socket.on('ice-candidate', async (data) => {
            await handleIceCandidate(data);
        });

        // Hand raise events
        socket.on('hand-raise', (data) => {
            setHandRaiseQueue(prev => {
                const identifier = data.socketId || data.userId;
                if (prev.find(h => (h.socketId || h.userId) === identifier)) return prev;
                return [...prev, data];
            });

            const toastId = Date.now() + Math.random();
            setHandRaiseToasts(prev => [...prev, { ...data, toastId }]);
            setTimeout(() => {
                setHandRaiseToasts(prev => prev.filter(t => t.toastId !== toastId));
            }, 3000);
        });

        socket.on('hand-raise-queue-update', (queue) => {
            setHandRaiseQueue(queue);
            // Also check if we should update our own handRaised state
            const ownRaise = queue.find(h => (h.userId === user?._id?.toString() || h.socketId === socketRef.current?.id));
            if (ownRaise && !handRaised) setHandRaised(true);
            else if (!ownRaise && handRaised) setHandRaised(false);
        });

        socket.on('hand-lower', (data) => {
            const identifier = data.socketId || data.userId;
            setHandRaiseQueue(prev => prev.filter(h => (h.socketId || h.userId) !== identifier));
            setHandRaiseToasts(prev => prev.filter(t => (t.socketId || t.userId) !== identifier));
        });

        // Stream approval (student receives)
        socket.on('stream-approved', (data) => {
            setStreamApproved(data.approved);
            if (!data.approved) {
                stopLocalStream();
                setShowSpeakMessage(false);
            } else {
                alert('The teacher has given you permission to speak. You can now turn on your mic/camera.');
                setHandRaised(false);
                setShowSpeakMessage(true);
                if (speakMessageTimerRef.current) clearTimeout(speakMessageTimerRef.current);
                speakMessageTimerRef.current = setTimeout(() => {
                    setShowSpeakMessage(false);
                }, 5000);
            }
        });

        socket.on('stream-revoked', () => {
            setStreamApproved(false);
            stopLocalStream();
        });

        socket.on('active-student', (data) => {
            setActiveStudent(data.userId ? data : null);
        });

        socket.on('media-status', (data) => {
            setMediaStatuses(prev => ({
                ...prev,
                [data.userId]: data.mediaStatus
            }));
            setRemoteMediaStreams(prev => {
                const current = prev[data.userId];
                if (!current) return prev;
                const nextForUser = { ...current };
                if (!data.mediaStatus.cameraOn) delete nextForUser.camera;
                if (!data.mediaStatus.micOn) delete nextForUser.audio;
                if (!data.mediaStatus.screenOn) delete nextForUser.screen;
                return {
                    ...prev,
                    [data.userId]: nextForUser
                };
            });
        });

        socket.on('stream-info', (data) => {
            const nextInfos = {
                ...streamInfosRef.current,
                [data.userId]: data.streamInfo
            };
            streamInfosRef.current = nextInfos;
            setStreamInfos(nextInfos);
        });

        socket.on('screen-share-state', (share) => {
            setActiveScreenShare(share);
            if (!share) {
                pendingScreenStreamRef.current = null;
                if (!isScreenSharing && screenVideoRef.current) screenVideoRef.current.srcObject = null;
            }
        });

        socket.on('room-mute-state', (data) => {
            setRoomMuteLocked(!!data.muted);
        });

        socket.on('room-camera-state', (data) => {
            setRoomCameraLocked(!!data.cameraLocked);
        });

        socket.on('force-media-off', (data) => {
            if (data.mic) stopMic();
            if (data.camera) stopCamera();
            if (data.screen) stopScreenSharing(false);
        });

        socket.on('removed-from-class', () => {
            cleanupMedia();
            alert('The host removed you from the class.');
            navigate('/student');
        });

        socket.on('reaction', (reaction) => {
            setReactions(prev => [...prev, reaction]);
            window.setTimeout(() => {
                setReactions(prev => prev.filter(r => r.id !== reaction.id));
            }, 2000);
        });

        socket.on('session-ended', () => {
            alert('The session has ended.');
            navigate('/student'); // Redirect correctly depending on role
        });

        // ─── Unavailable / Away ───
        socket.on('user-unavailable', (data) => {
            setUnavailableUsers(prev => ({ ...prev, [data.userId]: { name: data.name } }));
            const toastId = Date.now() + Math.random();
            setUnavailableToasts(prev => [...prev, { id: toastId, name: data.name, userId: data.userId, exiting: false }]);
            // Start exit animation after 3s, remove after 3.6s
            setTimeout(() => {
                setUnavailableToasts(prev => prev.map(t => t.id === toastId ? { ...t, exiting: true } : t));
                setTimeout(() => {
                    setUnavailableToasts(prev => prev.filter(t => t.id !== toastId));
                }, 600);
            }, 3000);
        });

        socket.on('user-available', (data) => {
            setUnavailableUsers(prev => {
                const next = { ...prev };
                delete next[data.userId];
                return next;
            });
        });

        socket.on('room-unavailable-users', (userIds) => {
            setUnavailableUsers(prev => {
                const next = { ...prev };
                userIds.forEach(id => {
                    next[id.toString()] = { name: '' };
                });
                return next;
            });
        });

        return () => {
            socket.disconnect();
            cleanupMedia();
        };
    }, [user, loading, classId, isTeacher, navigate, broadcastStreamIds, updateDiagnostics]);

    // Auto-scroll chat and Toast notifications
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

        if (chatMessages.length === 0) return;

        if (chatMessages.length > lastProcessedMsgLengthRef.current) {
            lastProcessedMsgLengthRef.current = chatMessages.length;
            const lastMsg = chatMessages[chatMessages.length - 1];
            const msgTime = new Date(lastMsg.timestamp).getTime();

            // Only show toast for messages received after the classroom mounted
            if (lastMsg.senderId !== user?._id && msgTime > mountTimeRef.current) {
                if (!showChat) {
                    setUnreadChat(true);
                } else if (lastMsg.recipientId && chatTab !== 'private') {
                    setUnreadPrivateChat(true);
                }

                // Show notification for new messages
                if (!showChat || (lastMsg.recipientId && chatTab !== 'private')) {
                    setLatestMessage(lastMsg);
                    const timer = setTimeout(() => {
                        setLatestMessage(null);
                    }, 4000);
                    return () => clearTimeout(timer);
                }
            }
        }
    }, [chatMessages, showChat, user?._id]);

    useEffect(() => {
        if (showChat) {
            setUnreadChat(false);
            if (chatTab === 'global') setLatestMessage(null);
        }
        if (chatTab === 'private') {
            setUnreadPrivateChat(false);
            setLatestMessage(null);
        }
    }, [showChat, chatTab]);
 
    // Auto-resize chat textarea height
    useEffect(() => {
        const textarea = chatTextareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
        }
    }, [chatInput]);

    // ─── WebRTC helpers ───

    const getTrackType = useCallback((track, streamId, remoteUserId) => {
        const info = streamInfosRef.current[remoteUserId] || {};
        if (info.screenStream && streamId === info.screenStream) return 'screen';
        if (info.cameraStream && streamId === info.cameraStream) return 'camera';
        if (info.screenTrack && track.id === info.screenTrack) return 'screen';
        if (info.cameraTrack && track.id === info.cameraTrack) return 'camera';

        console.log("teacherStreamIds.current", teacherStreamIds.current);
        // 1. Explicit matches on stream IDs (most reliable)
        if (teacherStreamIds.current.screenStream && streamId === teacherStreamIds.current.screenStream) return 'screen';
        if (teacherStreamIds.current.cameraStream && streamId === teacherStreamIds.current.cameraStream) return 'camera';

        // 2. Explicit matches on track IDs
        if (teacherStreamIds.current.screenTrack && track.id === teacherStreamIds.current.screenTrack) return 'screen';
        if (teacherStreamIds.current.cameraTrack && track.id === teacherStreamIds.current.cameraTrack) return 'camera';

        // 3. Label fallback
        if (track.label) {
            const labelLower = track.label.toLowerCase();
            if (labelLower.includes('screen') || labelLower.includes('monitor') || labelLower.includes('window')) {
                return 'screen';
            }
        }

        // 4. Smart fallback based on active teacher media states (highly reliable for single active feed)
        const isTeacherSharingScreen = !!teacherStreamIds.current.screenTrack || !!teacherStreamIds.current.screenStream;
        const isTeacherCameraOn = !!teacherStreamIds.current.cameraTrack || !!teacherStreamIds.current.cameraStream;

        if (isTeacherSharingScreen && !isTeacherCameraOn) {
            return 'screen';
        }
        if (!isTeacherSharingScreen && isTeacherCameraOn) {
            return 'camera';
        }

        // 5. Smart fallback: if camera box already has a video playing, route new video track to screen
        if (remoteVideoRef.current?.srcObject && remoteVideoRef.current.srcObject.getVideoTracks().length > 0) {
            return 'screen';
        }

        return 'camera';
    }, []);

    const createPeerConnection = useCallback((targetUserId) => {
        const existingPc = peerConnectionsRef.current[targetUserId];
        if (existingPc) {
            // If the connection is closed or failed, clean it up and create a new one
            if (existingPc.connectionState === 'closed' || existingPc.connectionState === 'failed') {
                console.log(`[createPeerConnection] Cleaning up closed/failed peer connection for ${targetUserId}`);
                try { existingPc.close(); } catch (e) { }
                delete peerConnectionsRef.current[targetUserId];
            } else {
                return existingPc;
            }
        }

        const pc = new RTCPeerConnection(ICE_SERVERS);

        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit('ice-candidate', {
                    targetUserId,
                    candidate: event.candidate
                });
            }
        };

        pc.ontrack = (event) => {
            const track = event.track;
            if (!track) return;
            const remoteUserId = targetUserId?.toString();
            const streamId = event.streams && event.streams[0]?.id;

            if (streamId) {
                trackStreamMap.current[track.id] = streamId;
            }

            if (track.kind === 'audio') {
                const audioStream = new MediaStream([track]);
                setRemoteMediaStreams(prev => ({
                    ...prev,
                    [remoteUserId]: {
                        ...(prev[remoteUserId] || {}),
                        audio: audioStream
                    }
                }));
                return;
            }

            if (track.kind === 'video') {
                const videoStream = new MediaStream([track]);
                const type = getTrackType(track, streamId, remoteUserId);
                console.log(`[ontrack] Video track ${track.id} (stream ${streamId}) from ${remoteUserId} resolved to type: ${type}`);

                setRemoteMediaStreams(prev => ({
                    ...prev,
                    [remoteUserId]: {
                        ...(prev[remoteUserId] || {}),
                        [type]: videoStream
                    }
                }));

                if (type === 'screen') {
                    pendingScreenStreamRef.current = videoStream;
                    if (screenVideoRef.current && activeScreenOwnerId === remoteUserId) {
                        screenVideoRef.current.srcObject = videoStream;
                    }
                }
                updateDiagnostics('ontrack');
            }
        };

        peerConnectionsRef.current[targetUserId] = pc;
        return pc;
    }, [getTrackType, updateDiagnostics, activeScreenOwnerId]);

    const handleOffer = async (data) => {
        const pc = createPeerConnection(data.fromUserId);

        // Add local tracks if we have them
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                const senders = pc.getSenders();
                if (!senders.find(s => s.track === track)) {
                    pc.addTrack(track, localStreamRef.current);
                }
            });
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => {
                const senders = pc.getSenders();
                if (!senders.find(s => s.track === track)) {
                    pc.addTrack(track, screenStreamRef.current);
                }
            });
        }

        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketRef.current.emit('answer', {
            targetUserId: data.fromUserId,
            answer
        });
    };

    const sendOfferToOne = async (targetUserId) => {
        if (!socketRef.current) return;
        const pc = createPeerConnection(targetUserId);

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                const senders = pc.getSenders();
                if (!senders.find(s => s.track === track)) {
                    pc.addTrack(track, localStreamRef.current);
                }
            });
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => {
                const senders = pc.getSenders();
                if (!senders.find(s => s.track === track)) {
                    pc.addTrack(track, screenStreamRef.current);
                }
            });
        }

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current.emit('offer', {
            targetUserId,
            offer
        });
    };

    const handleAnswer = async (data) => {
        const pc = peerConnectionsRef.current[data.fromUserId];
        if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
    };

    const handleIceCandidate = async (data) => {
        const pc = peerConnectionsRef.current[data.fromUserId];
        if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    };

    const sendOfferToAll = async (stream) => {
        const otherParticipants = participants.filter(
            p => p.userId.toString() !== user._id.toString()
        );

        for (const participant of otherParticipants) {
            const pc = createPeerConnection(participant.userId);
            stream.getTracks().forEach(track => {
                // Avoid adding duplicate tracks
                const senders = pc.getSenders();
                const alreadyAdded = senders.find(s => s.track === track);
                if (!alreadyAdded) {
                    pc.addTrack(track, stream);
                }
            });

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socketRef.current.emit('offer', {
                targetUserId: participant.userId,
                offer
            });
        }
    };

    // ─── Media Controls ───

    const stopCamera = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(t => {
                t.stop();
                localStreamRef.current?.removeTrack(t);
            });
            if (localStreamRef.current.getTracks().length === 0) {
                localStreamRef.current = null;
            }
        }
        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
        setIsCameraOn(false);
        emitMediaStatus({ cameraOn: false, micOn: isMicOn, screenOn: isScreenSharing });
        broadcastStreamIds();
    };

    const stopMic = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(t => {
                t.stop();
                localStreamRef.current?.removeTrack(t);
            });
            if (localStreamRef.current.getTracks().length === 0) {
                localStreamRef.current = null;
            }
        }
        setIsMicOn(false);
        emitMediaStatus({ cameraOn: isCameraOn, micOn: false, screenOn: isScreenSharing });
        broadcastStreamIds();
    };

    const stopScreenSharing = (notifyServer = true) => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
        }
        pendingScreenStreamRef.current = null;
        if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
        setIsScreenSharing(false);
        emitMediaStatus({ cameraOn: isCameraOn, micOn: isMicOn, screenOn: false });
        broadcastStreamIds();
        if (notifyServer && socketRef.current) {
            socketRef.current.emit('stop-screen-share');
        }
    };

    const toggleCamera = async () => {
        if (!isHost && roomCameraLocked && !isCameraOn && !streamApproved) {
            setLockAlertMessage('The host has disabled cameras. You can turn on your camera after the host allows it.');
            return;
        }

        if (isCameraOn) {
            stopCamera();
            updateDiagnostics('toggleCameraOff');
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: facingMode,
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        frameRate: { ideal: 30 }
                    },
                    audio: isMicOn
                });

                if (localStreamRef.current) {
                    stream.getVideoTracks().forEach(t => localStreamRef.current.addTrack(t));
                } else {
                    localStreamRef.current = stream;
                }

                if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
                setIsCameraOn(true);
                emitMediaStatus({ cameraOn: true, micOn: isMicOn, screenOn: isScreenSharing });
                broadcastStreamIds();
                await sendOfferToAll(localStreamRef.current);
                updateDiagnostics('toggleCameraOn');
            } catch (err) {
                console.error('Failed to access camera:', err);
                setLockAlertMessage('Could not access camera. Please check permissions.');
            }
        }
    };

    const toggleMic = async () => {
        if (!isHost && roomMuteLocked && !isMicOn && !streamApproved) {
            setLockAlertMessage('The host has muted everyone. You can unmute after the host allows it.');
            return;
        }

        if (isMicOn) {
            stopMic();
            updateDiagnostics('toggleMicOff');
        } else {
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                if (localStreamRef.current) {
                    audioStream.getAudioTracks().forEach(t => localStreamRef.current.addTrack(t));
                } else {
                    localStreamRef.current = audioStream;
                }
                setIsMicOn(true);
                emitMediaStatus({ cameraOn: isCameraOn, micOn: true, screenOn: isScreenSharing });
                broadcastStreamIds();
                await sendOfferToAll(localStreamRef.current);
                updateDiagnostics('toggleMicOn');
            } catch (err) {
                console.error('Failed to access microphone:', err);
                setLockAlertMessage('Could not access microphone. Please check permissions.');
            }
        }
    };

    const toggleScreenShare = async () => {
        if (!isScreenSharing) {
            if (!navigator.mediaDevices || typeof navigator.mediaDevices.getDisplayMedia !== 'function') {
                let deviceMsg = "Screen sharing is not supported by your current browser or device.";
                const userAgent = navigator.userAgent || '';
                const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
                const isAndroid = /Android/i.test(userAgent);
                
                if (isIOS) {
                    deviceMsg += "\n\nOn iOS devices (iPhone/iPad), screen sharing is ONLY supported in the native Apple Safari browser. Third-party browsers (like Chrome, Firefox) and in-app browsers are blocked by Apple from sharing the screen.";
                } else if (isAndroid) {
                    deviceMsg += "\n\nScreen sharing from Android mobile browsers is not supported due to mobile OS limitations. Please join from a desktop computer (PC, Mac, or Laptop) if you need to share your screen.";
                } else {
                    deviceMsg += "\n\nPlease ensure you are using a modern desktop browser (like Chrome, Safari, Edge, or Firefox) and accessing the app over a secure HTTPS connection.";
                }
                alert(deviceMsg);
                return;
            }
        }

        if (isScreenSharing) {
            stopScreenSharing(true);
            updateDiagnostics('toggleScreenShareOff');
        } else {
            if (activeScreenShare && activeScreenOwnerId !== user?._id?.toString()) {
                alert(`${activeScreenShare.name} is already presenting.`);
                return;
            }
            try {
                const result = await new Promise(resolve => {
                    socketRef.current?.emit('request-screen-share', {}, resolve);
                });
                if (!result?.ok) {
                    alert(result?.message || 'Screen sharing is not available right now.');
                    return;
                }

                let stream;
                try {
                    stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                } catch (audioErr) {
                    console.warn('Screen share with audio not supported on this device/browser, falling back to video-only screen share.', audioErr);
                    stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                }
                screenStreamRef.current = stream;
                if (screenVideoRef.current) screenVideoRef.current.srcObject = stream;
                setIsScreenSharing(true);
                setActiveScreenShare({
                    userId: user._id,
                    name: user.name,
                    role: user.role
                });
                emitMediaStatus({ cameraOn: isCameraOn, micOn: isMicOn, screenOn: true });
                broadcastStreamIds();

                stream.getVideoTracks()[0].onended = () => {
                    stopScreenSharing(true);
                    updateDiagnostics('toggleScreenShareOnEnded');
                };

                await sendOfferToAll(stream);
                updateDiagnostics('toggleScreenShareOn');
            } catch (err) {
                socketRef.current?.emit('stop-screen-share');
                console.error('Failed to share screen:', err);
                alert(`Screen sharing failed or is not supported on this device: ${err.message}`);
            }
        }
    };

    const stopLocalStream = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        setIsCameraOn(false);
        setIsMicOn(false);
        emitMediaStatus({ cameraOn: false, micOn: false, screenOn: isScreenSharing });
        broadcastStreamIds();
        updateDiagnostics('stopLocalStream');
    };

    const cleanupMedia = () => {
        stopLocalStream();
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
        }
        pendingScreenStreamRef.current = null;
        if (isScreenSharing && socketRef.current) socketRef.current.emit('stop-screen-share');
        Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
        peerConnectionsRef.current = {};
    };

    // ─── Audio Levels Glow Effect ───
    useEffect(() => {
        let audioCtx;
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            return;
        }
        let animationFrame;
        const analyzers = new Map();
        const speakingState = {};

        const checkAudioLevels = () => {
            let changed = false;
            const newState = { ...speakingState };

            analyzers.forEach((analyzer, userId) => {
                const dataArray = new Uint8Array(analyzer.frequencyBinCount);
                analyzer.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                }
                const average = sum / dataArray.length;
                const isSpeaking = average > 10;

                if (speakingState[userId] !== isSpeaking) {
                    speakingState[userId] = isSpeaking;
                    newState[userId] = isSpeaking;
                    changed = true;
                }
            });

            if (changed) {
                setSpeakingUsers(newState);
            }
            animationFrame = requestAnimationFrame(checkAudioLevels);
        };

        const setupAnalyzer = (userId, stream) => {
            if (!stream || stream.getAudioTracks().length === 0) return;
            if (analyzers.has(userId)) return;
            try {
                if (audioCtx.state === 'suspended') audioCtx.resume();
                // Clone stream so we don't affect WebRTC
                const source = audioCtx.createMediaStreamSource(new MediaStream(stream.getAudioTracks()));
                const analyzer = audioCtx.createAnalyser();
                analyzer.fftSize = 256;
                analyzer.smoothingTimeConstant = 0.8;
                source.connect(analyzer);
                analyzers.set(userId, analyzer);
            } catch (e) {
                console.error("Audio analyzer setup failed for", userId, e);
            }
        };

        if (localStreamRef.current && isMicOn) {
            setupAnalyzer(user?._id, localStreamRef.current);
        } else if (analyzers.has(user?._id)) {
            analyzers.delete(user?._id);
            speakingState[user?._id] = false;
            setSpeakingUsers(prev => ({ ...prev, [user?._id]: false }));
        }

        Object.entries(remoteMediaStreams).forEach(([userId, streams]) => {
            if (streams.audio) {
                setupAnalyzer(userId, streams.audio);
            }
        });

        checkAudioLevels();

        return () => {
            cancelAnimationFrame(animationFrame);
            if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
        };
    }, [isMicOn, remoteMediaStreams, user?._id]);

    currentParticipantsRef.current = participants;

    useEffect(() => {
        if (prevParticipantsRef.current === null) {
            if (participants.length > 0) prevParticipantsRef.current = participants;
            return;
        }

        const prev = prevParticipantsRef.current;
        const current = participants;
        const prevMap = new Map(prev.map(p => [p.userId, p]));
        const currMap = new Map(current.map(p => [p.userId, p]));

        const joined = current.filter(p => !prevMap.has(p.userId) && p.userId !== user?._id);
        const left = prev.filter(p => !currMap.has(p.userId) && p.userId !== user?._id);

        if (joined.length > 0 || left.length > 0) {
            if (!joinLeaveTimerRef.current) {
                windowStartParticipantsRef.current = prevParticipantsRef.current;

                joinLeaveTimerRef.current = setTimeout(() => {
                    const startMap = new Map(windowStartParticipantsRef.current.map(p => [p.userId, p]));
                    const endMap = new Map(currentParticipantsRef.current.map(p => [p.userId, p]));

                    const finalJoined = currentParticipantsRef.current.filter(p => !startMap.has(p.userId) && p.userId !== user?._id);
                    const finalLeft = windowStartParticipantsRef.current.filter(p => !endMap.has(p.userId) && p.userId !== user?._id);

                    const newToasts = [];
                    const getLabel = p => p.role === 'teacher' || p.role === 'admin' ? ' (Host)' : p.role === 'co-host' ? ' (Co-host)' : '';

                    if (finalJoined.length > 0) {
                        let message = '';
                        if (finalJoined.length <= 2) {
                            message = `${finalJoined.map(p => `${p.name}${getLabel(p)}`).join(' and ')} joined`;
                        } else {
                            message = `${finalJoined.slice(0, 2).map(p => `${p.name}${getLabel(p)}`).join(', ')} and ${finalJoined.length - 2} others joined`;
                        }
                        newToasts.push({ id: Date.now() + Math.random(), message, type: 'join' });
                    }

                    if (finalLeft.length > 0) {
                        let message = '';
                        if (finalLeft.length <= 2) {
                            message = `${finalLeft.map(p => `${p.name}${getLabel(p)}`).join(' and ')} left`;
                        } else {
                            message = `${finalLeft.slice(0, 2).map(p => `${p.name}${getLabel(p)}`).join(', ')} and ${finalLeft.length - 2} others left`;
                        }
                        newToasts.push({ id: Date.now() + Math.random(), message, type: 'leave' });
                    }

                    if (newToasts.length > 0) {
                        setJoinLeaveToasts(prevToasts => [...prevToasts, ...newToasts]);
                        newToasts.forEach(t => {
                            setTimeout(() => {
                                setJoinLeaveToasts(prevToasts => prevToasts.filter(toast => toast.id !== t.id));
                            }, 3000);
                        });
                    }

                    joinLeaveTimerRef.current = null;
                }, 15000);
            }
        }

        prevParticipantsRef.current = current;
    }, [participants, user?._id]);

    useEffect(() => {
        return () => {
            if (joinLeaveTimerRef.current) clearTimeout(joinLeaveTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (!isHost && chatTab === 'private' && chatRecipient === 'everyone') {
            const mods = participants.filter(p => p.role === 'teacher' || p.role === 'admin' || p.role === 'co-host');
            if (mods.length > 0) {
                setChatRecipient(mods[0].userId.toString());
            }
        }
    }, [isHost, chatTab, chatRecipient, participants]);

    // ─── Chat ───
    const sendChatMessage = (e) => {
        e.preventDefault();
        if ((!chatInput.trim() && !chatImage) || !socketRef.current) return;

        // Enforce word limit (100 words for links/https, 20 words otherwise) and 15-char per word limit (only if not starting with https)
        const startsWithHttps = chatInput.trim().toLowerCase().startsWith('https');
        const maxWords = startsWithHttps ? 100 : 20;
        const words = chatInput.trim().split(/\s+/).filter(w => w.length > 0);
        if (words.length > maxWords) {
            alert(`Message too long! Please limit to ${maxWords} words (you have ${words.length} words).`);
            return;
        }
        if (words.some(w => w.length > 100)) {
            alert("A single word cannot exceed 100 characters.");
            return;
        }

        const payload = { message: chatInput.trim(), image: chatImage };

        const actualRecipient = chatTab === 'global' ? 'everyone' : chatRecipient;

        if (chatTab === 'private' && actualRecipient === 'everyone') {
            alert('Please select a specific person to send a direct message.');
            return;
        }

        if (actualRecipient !== 'everyone') {
            payload.recipientId = actualRecipient;
            // Find recipient name
            let recName = '';
            if (actualRecipient === hostId?.toString()) {
                recName = hostName;
            } else {
                const recUser = participants.find(p => p.userId.toString() === actualRecipient);
                if (recUser) recName = recUser.name;
            }
            payload.recipientName = recName;
        }

        socketRef.current.emit('chat-message', payload);
        setChatInput('');
        setChatImage(null);
    };

    const downloadChat = (type) => {
        setShowDownloadMenu(false);
        if (chatMessages.length === 0) {
            setInfoAlertMessage('No messages to download.');
            return;
        }

        const filteredMessages = chatMessages.filter(msg => {
            if (type === 'global') return !msg.recipientId;
            if (type === 'private') {
                if (!msg.recipientId) return false;
                if (chatRecipient === 'everyone') return true;
                return msg.recipientId === chatRecipient || msg.senderId === chatRecipient || msg.senderId?._id === chatRecipient;
            }
            return false;
        });

        if (filteredMessages.length === 0) {
            setInfoAlertMessage(`No ${type} messages to download.`);
            return;
        }

        let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${type === 'private' ? 'Direct Messages' : 'Global Chat'} History - ${classInfo?.title || 'Class'}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
            background-color: #111827; 
            color: #e5e7eb; 
            padding: 24px; 
            margin: 0; 
        }
        .chat-container { 
            max-width: 600px; 
            margin: 0 auto; 
            display: flex; 
            flex-direction: column; 
            gap: 16px; 
        }
        .message-row { 
            display: flex; 
            flex-direction: column; 
        }
        .message-row.own { 
            align-items: flex-end; 
        }
        .message-row.other { 
            align-items: flex-start; 
        }
        .sender { 
            font-size: 12px; 
            color: #9ca3af; 
            margin-bottom: 4px; 
            font-weight: 500;
        }
        .bubble { 
            max-width: 85%; 
            padding: 12px 16px; 
            border-radius: 16px; 
            font-size: 14px; 
            line-height: 1.5; 
            word-break: break-word; 
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .message-row.own .bubble { 
            background-color: #6366f1; 
            color: #ffffff; 
            border-top-right-radius: 4px; 
        }
        .message-row.other .bubble { 
            background-color: #374151; 
            color: #f3f4f6; 
            border-top-left-radius: 4px; 
        }
        .time { 
            font-size: 11px; 
            color: #6b7280; 
            margin-top: 4px; 
        }
        .attachment { 
            max-width: 100%; 
            max-height: 300px; 
            border-radius: 8px; 
            margin-bottom: 8px; 
            display: block; 
            object-fit: contain; 
        }
        h1 { 
            text-align: center; 
            font-size: 24px; 
            margin-top: 0;
            margin-bottom: 32px; 
            color: #ffffff; 
            border-bottom: 1px solid #374151; 
            padding-bottom: 16px; 
        }
    </style>
</head>
<body>
    <h1>Chat History - ${classInfo?.title || 'Live Class'}</h1>
    <div class="chat-container">
`;

        filteredMessages.forEach(msg => {
            const isOwn = msg.senderId === user._id || msg.senderId?._id === user._id;
            const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const alignmentClass = isOwn ? 'own' : 'other';
            const directLabel = msg.recipientId ? ' <span style="color:#818cf8; font-weight:bold;">(Direct Message)</span>' : '';

            htmlContent += `        <div class="message-row ${alignmentClass}">
            <span class="sender">${msg.senderName}${directLabel}</span>
            <div class="bubble">
                ${msg.image ? `<img src="${msg.image}" class="attachment" alt="Image Attachment" />` : ''}
                ${msg.message ? `<span>${msg.message}</span>` : ''}
            </div>
            <span class="time">${time}</span>
        </div>\n`;
        });

        htmlContent += `    </div>
</body>
</html>`;

        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `chat_history_${classInfo?.title || 'class'}_${classId}.html`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // ─── Hand raise ───
    const toggleHandRaise = () => {
        if (!socketRef.current) return;
        if (handRaised) {
            socketRef.current.emit('hand-lower');
            setHandRaised(false);
        } else {
            socketRef.current.emit('hand-raise');
            setHandRaised(true);
        }
    };

    const reactionOptions = ['\uD83D\uDC4D', '\uD83D\uDC4F', '\uD83D\uDE02', '\u2764\uFE0F', '\uD83D\uDE2E', '\uD83C\uDF89'];

    const sendReaction = (emoji) => {
        if (!socketRef.current) return;
        socketRef.current.emit('reaction', { emoji });
    };

    const approveHand = (studentUserId, studentName, studentSocketId) => {
        if (!socketRef.current) return;
        socketRef.current.emit('approve-hand', { targetUserId: studentUserId, targetName: studentName, targetSocketId: studentSocketId });
        setHandRaiseQueue(prev => prev.filter(h => (h.socketId || h.userId) !== (studentSocketId || studentUserId)));
    };

    const denyHand = (studentUserId, studentSocketId) => {
        if (!socketRef.current) return;
        socketRef.current.emit('deny-hand', { targetUserId: studentUserId, targetSocketId: studentSocketId });
        setHandRaiseQueue(prev => prev.filter(h => (h.socketId || h.userId) !== (studentSocketId || studentUserId)));
    };

    const revokeStudentStream = (studentUserId) => {
        if (!socketRef.current) return;
        socketRef.current.emit('revoke-stream', { targetUserId: studentUserId });
    };

    const muteParticipant = (studentUserId) => {
        if (!socketRef.current) return;
        socketRef.current.emit('host-force-mute', { targetUserId: studentUserId });
    };

    const turnOffParticipantCamera = (studentUserId) => {
        if (!socketRef.current) return;
        socketRef.current.emit('host-force-camera-off', { targetUserId: studentUserId });
    };

    const removeParticipant = (studentUserId) => {
        if (!socketRef.current) return;
        const p = participants.find(part => part.userId === studentUserId);
        if (p) {
            setParticipantToRemove(p);
        }
    };

    const requestDeleteMessage = (messageId) => {
        setMessageToDelete(messageId);
    };

    const confirmDeleteMessage = () => {
        if (!messageToDelete || !socketRef.current) return;
        socketRef.current.emit('delete-chat-message', { messageId: messageToDelete.toString() });
        setMessageToDelete(null);
    };

    const toggleUnavailable = () => {
        if (!socketRef.current) return;
        if (isUnavailable) {
            socketRef.current.emit('user-available');
            setIsUnavailable(false);
        } else {
            socketRef.current.emit('user-unavailable');
            setIsUnavailable(true);
        }
    };

    const toggleCoHost = (studentUserId) => {
        if (!studentUserId || !socketRef.current) return;
        socketRef.current.emit('toggle-co-host', { targetUserId: studentUserId });
    };

    const muteAllParticipants = () => {
        if (!socketRef.current) return;
        socketRef.current.emit('host-mute-all');
    };

    const unmuteAllParticipants = () => {
        if (!socketRef.current) return;
        socketRef.current.emit('host-unmute-all');
    };

    const cameraOffAllParticipants = () => {
        if (!socketRef.current) return;
        socketRef.current.emit('host-camera-off-all');
    };

    const cameraOnAllParticipants = () => {
        if (!socketRef.current) return;
        socketRef.current.emit('host-camera-on-all');
    };

    const stopParticipantScreen = (studentUserId) => {
        if (!socketRef.current) return;
        socketRef.current.emit('stop-screen-share', { targetUserId: studentUserId });
    };

    // ─── End / Leave session ───
    const endSession = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/live-class/${classId}/end`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (socketRef.current) socketRef.current.emit('end-session');
            cleanupMedia();
            navigate('/teacher/live-classes');
        } catch (err) {
            alert('Failed to end session');
        }
    };

    const leaveSession = () => {
        cleanupMedia();
        navigate('/student');
    };

    const renderControlsBar = (isForFullscreen = false) => (
        <div className={`flex flex-wrap items-center justify-center gap-1 sm:gap-2 md:gap-3 ${isCompactLandscape ? 'p-1' : 'p-2 sm:p-3'} flex-shrink-0 bg-gray-900 border-t border-gray-800 z-[40] ${isForFullscreen ? 'absolute bottom-8 left-1/2 -translate-x-1/2 rounded-2xl border border-gray-700 shadow-2xl transition-all duration-500 ease-in-out transform ' + (showFullscreenControls ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-24 opacity-0 scale-95 pointer-events-none') : ''}`}>
            {/* Always show mic/cam buttons for students so they know they have the option, but handle click logically */}
            <button
                onClick={toggleCamera}
                className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-colors ${isCameraOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                    }`}
                title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
            >
                {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button
                onClick={toggleMic}
                className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-colors relative ${isMicOn ? 'bg-gray-700 text-white hover:bg-gray-600 ring-2 ring-green-500' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                    } ${!isHost && roomMuteLocked && !isMicOn ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isMicOn ? 'Mute' : 'Unmute'}
            >
                {isMicOn && <span className="absolute -inset-1 rounded-xl border-2 border-green-500 animate-pulse opacity-50"></span>}
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
                onClick={toggleScreenShare}
                className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-colors ${isScreenSharing
                    ? 'bg-primary text-white'
                    : activeScreenShare && activeScreenOwnerId !== user?._id?.toString()
                        ? 'bg-gray-700/40 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                    }`}
                title={isScreenSharing ? 'Stop sharing' : activeScreenShare ? `${activeScreenShare.name} is presenting` : 'Share screen'}
            >
                {isScreenSharing ? <Monitor className="w-5 h-5" /> : <MonitorOff className="w-5 h-5" />}
            </button>

            {/* Emoji Reaction Picker */}
            <div className="relative">
                <button
                    onClick={() => setShowReactionPicker(!showReactionPicker)}
                    className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-1 sm:gap-1.5 shadow-sm font-semibold text-xs whitespace-nowrap ${showReactionPicker
                        ? 'bg-primary text-white ring-2 ring-primary/40'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700 hover:text-white'
                        }`}
                    title="Send a reaction"
                >
                    <Smile className="w-5 h-5 text-indigo-400" />
                    <span className="hidden md:inline">React</span>
                </button>

                {showReactionPicker && (
                    <>
                        {/* Transparent backdrop to click-away to close picker */}
                        <div
                            className="fixed inset-0 z-[45]"
                            onClick={() => setShowReactionPicker(false)}
                        />
                        {/* Floating reaction picker */}
                        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-800 rounded-2xl p-2 flex items-center gap-1 shadow-2xl z-[50] animate-in fade-in slide-in-from-bottom-2 duration-150">
                            {reactionOptions.map(emoji => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => {
                                        sendReaction(emoji);
                                        setShowReactionPicker(false);
                                    }}
                                    className="h-10 w-10 rounded-xl text-xl hover:bg-gray-800 transition-all duration-100 active:scale-90 flex items-center justify-center"
                                    title={`React with ${emoji}`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Scientific Calculator Trigger */}
            <button
                onClick={() => {
                    setShowCalculator(!showCalculator);
                }}
                className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-1 sm:gap-1.5 shadow-sm font-semibold text-xs whitespace-nowrap ${showCalculator
                    ? 'bg-primary text-white ring-2 ring-primary/40'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700 hover:text-white'
                    }`}
                title="Scientific Calculator"
            >
                <Calculator className="w-4 h-4" />
                <span className="hidden md:inline">Calculator</span>
            </button>

            {/* Notepad Trigger */}
            <button
                onClick={() => {
                    setShowNotepad(!showNotepad);
                }}
                className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-1 sm:gap-1.5 shadow-sm font-semibold text-xs whitespace-nowrap ${showNotepad
                    ? 'bg-primary text-white ring-2 ring-primary/40'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700 hover:text-white'
                    }`}
                title="Notepad / Save Notes"
            >
                <FileText className="w-4 h-4" />
                <span className="hidden md:inline">Notes</span>
            </button>

            {!isHost && !showSpeakMessage && (
                <button
                    onClick={toggleHandRaise}
                    className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap ${handRaised ? 'bg-amber-500 text-white' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'}`}
                    title={handRaised ? 'Lower hand' : 'Raise hand to speak'}
                >
                    <Hand className="w-5 h-5" />
                    <span className="text-xs sm:text-sm hidden md:inline">{handRaised ? 'Hand Raised' : 'Raise Hand'}</span>
                </button>
            )}

            <button
                onClick={toggleUnavailable}
                className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${isUnavailable
                    ? 'bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.5)]'
                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-orange-300'
                    }`}
                title={isUnavailable ? 'Click to mark yourself as available' : 'Mark yourself as unavailable / away'}
            >
                <Coffee className="w-5 h-5" />
                <span className="text-xs sm:text-sm hidden md:inline">{isUnavailable ? 'Away' : 'Away'}</span>
            </button>

            {!isHost && showSpeakMessage && (
                <span className="text-green-400 text-xs font-medium bg-green-500/10 px-3 py-2 rounded-lg">✓ You can speak</span>
            )}


            {isTeacher ? (
                <button
                    onClick={() => setShowLeaveConfirm(true)}
                    className="p-2 sm:p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg sm:rounded-xl transition-colors ml-0 sm:ml-3"
                    title="End session for everyone"
                >
                    <PhoneOff className="w-5 h-5" />
                </button>
            ) : (
                <button
                    onClick={() => setShowLeaveConfirm(true)}
                    className="p-2 sm:p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg sm:rounded-xl transition-colors ml-0 sm:ml-3"
                    title="Leave session"
                >
                    <PhoneOff className="w-5 h-5" />
                </button>
            )}
        </div>
    );

    const renderCalculator = () => (
        showCalculator && (
            <div
                ref={calcRef}
                style={{
                    position: 'fixed',
                    left: `${calcPos.x}px`,
                    top: `${calcPos.y}px`,
                    zIndex: 100,
                    width: windowWidth < 640 ? '280px' : '360px',
                    maxWidth: 'calc(100vw - 20px)',
                    height: 'auto'
                }}
                className="transform animate-in fade-in zoom-in-95 duration-200"
            >
                <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full w-full">
                    {/* Header */}
                    <div
                        onPointerDown={(e) => handlePointerDown(e, calcRef, setCalcPos)}
                        className="px-3 py-2 sm:px-4 sm:py-3 bg-gray-955 border-b border-gray-800 flex items-center justify-between flex-shrink-0 select-none cursor-grab active:cursor-grabbing"
                    >
                        <span className="text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 pointer-events-none">
                            <Calculator className="w-4 h-4 text-primary" /> Scientific Calculator
                        </span>
                        <div className="flex items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
                            <button
                                onClick={() => setIsDegreeMode(!isDegreeMode)}
                                className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold transition-all ${isDegreeMode ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                            >
                                {isDegreeMode ? 'DEG' : 'RAD'}
                            </button>
                            <button onClick={() => setShowCalculator(false)} className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-800">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Screen */}
                    <div className="p-3 sm:p-4 bg-gray-955 border-b border-gray-800 text-right min-h-[72px] sm:min-h-[96px] flex flex-col justify-end flex-shrink-0">
                        <div className="text-gray-400 text-xs sm:text-lg overflow-x-auto whitespace-nowrap scrollbar-none font-mono">
                            {calcExpr || '0'}
                        </div>
                        <div className="text-white text-xl sm:text-4xl font-bold mt-0.5 sm:mt-1 overflow-x-auto whitespace-nowrap scrollbar-none font-mono">
                            {calcResult || '0'}
                        </div>
                    </div>

                    {/* Grid Pad */}
                    <div className="p-2 sm:p-3 grid grid-cols-5 gap-1.5 sm:gap-2 bg-gray-900 flex-grow min-h-0 overflow-hidden">
                        {calcButtons.map((btn) => {
                            const isOperator = ['÷', '×', '-', '+'].includes(btn);
                            const isFn = ['sin(', 'cos(', 'tan(', 'log(', 'ln(', '√(', '^', 'π', 'e', '%'].includes(btn);
                            const isParen = ['(', ')'].includes(btn);

                            let displayLabel = btn;
                            if (btn === 'sin(') displayLabel = 'sin';
                            if (btn === 'cos(') displayLabel = 'cos';
                            if (btn === 'tan(') displayLabel = 'tan';
                            if (btn === 'log(') displayLabel = 'log';
                            if (btn === 'ln(') displayLabel = 'ln';
                            if (btn === '√(') displayLabel = '√';

                            return (
                                <button
                                    key={btn}
                                    onClick={() => handleCalcBtn(btn)}
                                    className={`py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-105 active:scale-90 flex items-center justify-center ${btn === '='
                                        ? 'bg-primary text-white hover:bg-indigo-600 shadow-md shadow-primary/20 text-sm sm:text-lg font-bold'
                                        : btn === 'C' || btn === 'Del'
                                            ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20 text-xs sm:text-sm font-bold'
                                            : isOperator
                                                ? 'bg-gray-800 text-indigo-400 hover:bg-gray-750 font-bold text-sm sm:text-lg'
                                                : isParen
                                                    ? 'bg-gray-850 text-indigo-300 hover:bg-gray-800 border border-gray-800 font-bold text-xs sm:text-base'
                                                    : isFn
                                                        ? 'bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/10 text-[9px] sm:text-xs font-semibold'
                                                        : 'bg-gray-800 text-gray-100 hover:bg-gray-700 border border-gray-700 font-bold text-sm sm:text-lg'
                                        }`}
                                >
                                    {displayLabel}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        )
    );


    const renderNotepad = () => (
        showNotepad && (
            <div
                ref={notepadRef}
                style={{
                    position: 'fixed',
                    left: `${notepadPos.x}px`,
                    top: `${notepadPos.y}px`,
                    zIndex: 100,
                    width: windowWidth < 640 ? '290px' : notepadSizeRef.current.width,
                    height: windowWidth < 640 ? '320px' : notepadSizeRef.current.height,
                    resize: windowWidth < 640 ? 'none' : 'both',
                    overflow: 'hidden',
                    minWidth: '280px',
                    minHeight: '280px',
                    maxWidth: 'calc(100vw - 20px)',
                    maxHeight: 'calc(100vh - 20px)'
                }}
                className="transform animate-in fade-in zoom-in-95 duration-200 flex flex-col"
            >
                <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl flex flex-col h-full w-full overflow-hidden relative">
                    {/* Header */}
                    <div
                        onPointerDown={(e) => handlePointerDown(e, notepadRef, setNotepadPos)}
                        className="px-3.5 py-2 bg-gray-955 border-b border-gray-800 flex items-center justify-between flex-shrink-0 select-none cursor-grab active:cursor-grabbing"
                    >
                        <span className="text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 pointer-events-none">
                            <FileText className="w-4 h-4 text-primary" /> Notepad & Notes
                        </span>
                        <button
                            onClick={() => setShowNotepad(false)}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-800"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Text Editor Area */}
                    <div className="flex-grow p-3 bg-gray-955/40">
                        <textarea
                            value={noteText}
                            onChange={(e) => {
                                if (e.target.value.split('\n').length <= 100) {
                                    setNoteText(e.target.value);
                                }
                            }}
                            placeholder="Write down your class notes here..."
                            className="w-full h-full bg-transparent text-gray-100 placeholder-gray-500 resize-none border-none outline-none focus:ring-0 text-xs sm:text-base leading-relaxed"
                        />
                    </div>

                    <div className="px-3 py-2 bg-gray-955 border-t border-gray-800 flex items-center justify-end gap-2 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={clearNote}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 rounded-lg sm:rounded-xl transition-colors"
                                title="Clear notes"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={copyNoteToClipboard}
                                className="px-2 py-1.5 bg-gray-800 hover:bg-gray-750 text-gray-300 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold flex items-center gap-1 transition-colors border border-gray-700"
                            >
                                <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                {isCopied ? 'Copied!' : 'Copy'}
                            </button>
                            <button
                                onClick={downloadNote}
                                className="px-2 py-1.5 bg-primary hover:bg-indigo-650 text-white rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
                            >
                                <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                {windowWidth < 640 ? 'Save' : 'Save as .txt'}
                            </button>
                        </div>
                    </div>

                    {showClearConfirm && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-[3px] flex items-center justify-center z-50 p-4 transition-all duration-200 animate-in fade-in">
                            <div className="bg-gray-950 border border-gray-800 rounded-2xl p-5 max-w-[90%] w-72 text-center shadow-2xl flex flex-col items-center gap-3 animate-in zoom-in-95 duration-200">
                                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                                    <Trash2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-sm">Clear all notes?</h4>
                                    <p className="text-gray-400 text-[11px] mt-1 leading-normal">Are you sure you want to clear your notes? This action cannot be undone.</p>
                                </div>
                                <div className="flex items-center gap-2.5 w-full mt-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setShowClearConfirm(false)}
                                        className="flex-1 py-2 bg-gray-800 hover:bg-gray-750 text-gray-300 font-semibold text-xs rounded-lg transition-all border border-gray-700 active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNoteText('');
                                            setShowClearConfirm(false);
                                        }}
                                        className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold text-xs rounded-lg transition-all shadow-md shadow-red-500/10 active:scale-95"
                                    >
                                        Yes, Clear
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    );

    const sortedParticipants = [...participants].sort((a, b) => {
        const isHostA = a.role === 'teacher' || a.role === 'admin';
        const isHostB = b.role === 'teacher' || b.role === 'admin';
        if (isHostA && !isHostB) return -1;
        if (!isHostA && isHostB) return 1;

        return compareParticipantsByGridPriority(a, b);
    });

    const filteredParticipants = sortedParticipants.filter(p =>
        (p.name || '').toLowerCase().includes(participantSearch.toLowerCase())
    );

    if (loading) return <div className="fixed inset-0 z-50 flex justify-center items-center bg-gray-900 text-gray-500">Loading classroom...</div>;

    if (accessDenied) {
        return (
            <div className="fixed inset-0 z-50 flex justify-center items-center bg-gray-900">
                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                        <Shield className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
                    <p className="text-gray-400 text-sm mb-6">{accessDeniedMessage}</p>
                    <button
                        onClick={() => navigate('/student/dashboard')}
                        className="w-full py-3 bg-primary hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        // z-50 and fixed inset-0 completely hides the navbar and footer and locks user in
        <div className="fixed inset-0 z-50 flex h-[100dvh] max-h-[100dvh] w-screen flex-col bg-gray-900 overflow-hidden live-classroom-page">
            <audio ref={remoteAudioRef} autoPlay style={{ display: 'none' }} />
            {Object.entries(remoteMediaStreams).map(([remoteUserId, streams]) => (
                streams.audio ? (
                    <audio
                        key={`audio-${remoteUserId}`}
                        autoPlay
                        ref={node => {
                            if (node && node.srcObject !== streams.audio) {
                                node.srcObject = streams.audio;
                                node.play().catch(e => console.error('Audio play failed:', e));
                            }
                        }}
                        style={{ display: 'none' }}
                    />
                ) : null
            ))}
            <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[65] flex justify-center">
                <div className="flex flex-wrap-reverse justify-center gap-3 px-4">
                    {reactions.map((reaction, index) => (
                        <div
                            key={reaction.id}
                            className="reaction-float-up flex flex-col items-center gap-1 px-4 py-2"
                            style={{ animationDelay: `${index * 80}ms` }}
                            title={reaction.name}
                        >
                            <span className="text-5xl leading-none drop-shadow-lg">{reaction.emoji}</span>
                            <span className="max-w-[120px] truncate rounded-full bg-blue-300 px-2 py-0.5 text-xs font-semibold text-gray-900 shadow-sm">
                                {reaction.userId === user?._id ? 'You' : reaction.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
            {/* Chat Toast Notification */}
            <div className={`fixed bottom-24 right-4 z-[70] max-w-[280px] md:max-w-xs transition-all duration-500 ease-out transform ${latestMessage && !showChat ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
                <div
                    className="bg-gray-800/95 border border-indigo-500/50 rounded-xl p-3 shadow-[0_0_15px_rgba(99,102,241,0.3)] backdrop-blur-md cursor-pointer hover:bg-gray-700 transition-colors"
                    onClick={() => setShowChat(true)}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-indigo-300">{(latestMessage?.senderName || '?').charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="text-xs font-semibold text-indigo-300 truncate">{latestMessage?.senderName}</span>
                    </div>
                    <p className="text-sm text-gray-200 line-clamp-2">
                        {latestMessage?.recipientId
                            ? "sent you a direct message"
                            : latestMessage?.message}
                    </p>
                </div>
            </div>

            <div className={`bg-gray-800 border-b border-gray-700 px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-3 flex-shrink-0 ${isCompactLandscape ? 'py-1' : 'py-2 sm:py-3'}`}>
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 pr-2 sm:pr-3 border-r border-gray-700 flex-shrink-0">
                        <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        <span className="text-white font-bold text-sm sm:text-lg tracking-wide whitespace-nowrap">Zenius AI</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                        <Video className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 flex-shrink-0" />
                        <h2 className="text-white font-semibold text-sm sm:text-base truncate max-w-[120px] sm:max-w-[200px] md:max-w-xs">{classInfo?.title || 'Live Class'}</h2>
                        {classInfo?.subject && <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-medium flex-shrink-0 hidden sm:inline-block">{classInfo.subject}</span>}
                        <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-medium flex items-center gap-1 flex-shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span> LIVE
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                    <button
                        onClick={() => setShowParticipants(!showParticipants)}
                        className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors"
                    >
                        <Users className="w-4 h-4 sm:w-5 sm:h-5" /> {participants.length}
                    </button>
                    <button
                        onClick={() => setShowChat(!showChat)}
                        className={`relative flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${showChat ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                    >
                        <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="hidden min-[480px]:inline">Chat</span>
                        {unreadChat && <span className="absolute top-1 right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-gray-800"></span>}
                    </button>
                </div>
            </div>

            {/* Main content area */}
            <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative">
                {/* Video area */}
                <div className="flex-grow flex flex-col min-w-0 overflow-hidden relative">
                    <div className={`flex-grow flex flex-col gap-2 overflow-hidden ${isCompactLandscape ? 'p-1' : 'p-1 sm:p-2 md:p-3'}`}>
                        {/* Main video grid */}
                        <div className={videoGridClass}>

                            {/* ─── TILE JSX DEFINITIONS ─── */}
                            {(() => {
                                const getTileClass = (gridId, extraClasses = '') => {
                                    const isThisMaximized = maximizedGridId === gridId;
                                    return `relative bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-300 min-w-0 min-h-0 ${extraClasses} ${isThisMaximized
                                            ? 'w-full h-full bg-black shadow-2xl'
                                            : 'w-full aspect-video max-h-full justify-self-center self-center'
                                        }`;
                                };

                                const screenTileJSX = showScreenTile ? (
                                    <div
                                        key="screen"
                                        onDoubleClick={(e) => handleGridDoubleTap(e, 'screen')}
                                        onPointerUp={(e) => handleGridPointerUp(e, 'screen')}
                                        onClick={handleScreenContainerClick}
                                        ref={screenContainerRef}
                                        className={`${getTileClass('screen')} ${isFullscreen ? 'fixed inset-0 z-[60] bg-black rounded-none' : ''}`}
                                    >
                                        <video
                                            ref={setScreenVideoNode}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-full object-contain"
                                            onLoadedMetadata={(e) => handleVideoMetadata('screen', e.target)}
                                            onPlay={(e) => handleVideoMetadata('screen', e.target)}
                                        />
                                        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                            {activeScreenOwnerId === user?._id?.toString() ? 'Your presentation' : `${activeScreenOwnerName}'s presentation`}
                                        </div>
                                        {isHost && activeScreenOwnerId && activeScreenOwnerId !== user?._id?.toString() && (
                                            <button
                                                onClick={() => socketRef.current?.emit('stop-screen-share', { targetUserId: activeScreenOwnerId })}
                                                className={`absolute top-2 ${maximizedGridId === 'screen' && !isFullscreen ? 'right-12' : 'right-2'} bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors`}
                                                title="Stop presentation"
                                            >
                                                <MonitorOff className="w-4 h-4" />
                                            </button>
                                        )}
                                        {maximizedGridId === 'screen' && !isFullscreen && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setMaximizedGridId(null); }}
                                                className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-lg hover:bg-black/80 transition-colors shadow-lg z-20"
                                                title="Minimize"
                                            >
                                                <Minimize className="w-4 h-4" />
                                            </button>
                                        )}
                                        <div className={`absolute bottom-2 right-2 flex items-center gap-2 transition-all duration-500 ${isFullscreen ? (showFullscreenControls ? 'opacity-100' : 'opacity-0 pointer-events-none') : ''}`}>
                                            {(isFullscreen || maximizedGridId === 'screen') && (
                                                <button
                                                    onClick={takeScreenShareScreenshot}
                                                    className="bg-indigo-600/90 text-white px-3 py-1.5 rounded hover:bg-indigo-700 transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-lg"
                                                    title="Take Screenshot"
                                                >
                                                    <Camera className="w-4 h-4" />
                                                    <span className="hidden sm:inline">Screenshot</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={toggleFullScreen}
                                                className="bg-black/60 text-white p-1.5 rounded hover:bg-black/80 transition-colors shadow-lg"
                                                title="Toggle Fullscreen"
                                            >
                                                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {isFullscreen && renderControlsBar(true)}
                                        {isFullscreen && showCalculator && renderCalculator()}
                                        {isFullscreen && showNotepad && renderNotepad()}
                                    </div>
                                ) : null;

                                const hostTileJSX = isHostPresent ? (() => {
                                    const isLocalUser = hostId === user?._id;
                                    const camOn = isLocalUser ? isCameraOn : hostMediaStatus.cameraOn;
                                    const micOn = isLocalUser ? isMicOn : hostMediaStatus.micOn;
                                    return (
                                        <div
                                            key="host"
                                            onDoubleClick={(e) => handleGridDoubleTap(e, 'host')}
                                            onPointerUp={(e) => handleGridPointerUp(e, 'host')}
                                            className={`${getTileClass('host')} ${speakingUsers[hostId] ? 'ring-4 ring-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]' : ''}`}
                                            style={getTileStyle('host')}
                                        >
                                            {camOn && isLocalUser ? (
                                                <div className="relative w-full h-full flex items-center justify-center bg-black">
                                                    <video
                                                        ref={(node) => {
                                                            localVideoRef.current = node;
                                                            if (node && localStreamRef.current) {
                                                                node.srcObject = localStreamRef.current;
                                                            }
                                                        }}
                                                        autoPlay
                                                        muted
                                                        playsInline
                                                        className="w-full h-full object-cover"
                                                        onLoadedMetadata={(e) => handleVideoMetadata('host', e.target)}
                                                        onPlay={(e) => handleVideoMetadata('host', e.target)}
                                                    />
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); switchCamera(); }}
                                                        className="absolute top-2 left-14 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full z-20 active:scale-95 transition-all shadow-md flex items-center justify-center border border-gray-800"
                                                        title="Switch camera"
                                                    >
                                                        <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                                                    </button>
                                                </div>
                                            ) : camOn && getRemoteCameraStream(hostId) ? (
                                                <video
                                                    ref={node => setRemoteVideoNode(hostId, 'camera', node)}
                                                    autoPlay
                                                    playsInline
                                                    muted
                                                    className="w-full h-full object-cover"
                                                    onLoadedMetadata={(e) => handleVideoMetadata('host', e.target)}
                                                    onPlay={(e) => handleVideoMetadata('host', e.target)}
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2 text-gray-400">
                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-primary text-white flex items-center justify-center text-base sm:text-lg md:text-2xl font-bold">
                                                        {(hostName || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                </div>
                                            )}

                                            {unavailableUsers[hostId?.toString()] && (
                                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center rounded-xl pointer-events-none z-0">
                                                    <div className="flex flex-col items-center gap-1 bg-orange-500/90 text-white px-3 py-2 rounded-xl shadow-lg">
                                                        <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />
                                                        <span className="text-[10px] sm:text-xs font-semibold tracking-wide">Away</span>
                                                    </div>
                                                </div>
                                            )}

                                            {maximizedGridId === 'host' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setMaximizedGridId(null); }}
                                                    className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-lg hover:bg-black/80 transition-colors shadow-lg z-20"
                                                    title="Minimize"
                                                >
                                                    <Minimize className="w-4 h-4" />
                                                </button>
                                            )}

                                            <div className={`absolute top-2 ${maximizedGridId === 'host' ? 'right-12' : 'right-2'} flex gap-1 z-10`}>
                                                <div className={`bg-black/60 p-1 sm:p-1.5 rounded-full ${camOn ? 'text-green-400' : 'text-red-400'}`}>
                                                    {camOn ? <Video className="w-3 h-3 sm:w-4 sm:h-4" /> : <VideoOff className="w-3 h-3 sm:w-4 sm:h-4" />}
                                                </div>
                                                <div className={`bg-black/60 p-1 sm:p-1.5 rounded-full ${micOn ? 'text-green-400' : 'text-red-400'}`}>
                                                    {micOn ? <Mic className="w-3 h-3 sm:w-4 sm:h-4" /> : <MicOff className="w-3 h-3 sm:w-4 sm:h-4" />}
                                                </div>
                                            </div>

                                            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] sm:text-xs px-2 py-1 rounded max-w-[85%] flex items-center gap-1 z-10">
                                                <span className="truncate">{isTeacher ? `${user?.name || 'You'} (You)` : hostName}</span>
                                                {unavailableUsers[hostId?.toString()] && <Coffee className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />}
                                                {handRaiseQueue.some(h => (h.userId === hostId?.toString() || h.socketId === hostId?.toString())) && <Hand className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 flex-shrink-0" />}
                                            </div>
                                            <div className="absolute top-2 left-2 bg-primary/90 text-white text-[11px] font-medium px-2 py-1 rounded z-10">
                                                Host
                                            </div>
                                        </div>
                                    );
                                })() : null;

                                const participantTilesJSX = visibleParticipants.reduce((acc, p) => {
                                    const isActiveSpeaker = activeStudent?.userId === p.userId;
                                    const isCurrentUser = p.userId === user?._id;
                                    const isRealHost = p.role === 'teacher' || p.role === 'admin';
                                    const isParticipantCoHost = p.role === 'co-host';
                                    const isParticipantHostOrCoHost = isRealHost || isParticipantCoHost;
                                    const initial = (p.name || '?').charAt(0).toUpperCase();
                                    const status = getParticipantStatus(p);
                                    const camOn = isCurrentUser ? isCameraOn : status.cameraOn;
                                    const micOn = isCurrentUser ? isMicOn : status.micOn;
                                    const remoteCameraStream = getRemoteCameraStream(p.userId);
                                    const thisGridId = p.userId;

                                    acc[p.userId] = (
                                        <div
                                            key={p.userId}
                                            onDoubleClick={(e) => handleGridDoubleTap(e, thisGridId)}
                                            onPointerUp={(e) => handleGridPointerUp(e, thisGridId)}
                                            className={`${getTileClass(thisGridId)} ${speakingUsers[p.userId] ? 'ring-4 ring-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]' : ''}`}
                                            style={getTileStyle(p.userId)}
                                        >
                                            {isCurrentUser && camOn ? (
                                                <div className="relative w-full h-full flex items-center justify-center bg-black">
                                                    <video
                                                        ref={(node) => {
                                                            localVideoRef.current = node;
                                                            if (node && localStreamRef.current) {
                                                                node.srcObject = localStreamRef.current;
                                                            }
                                                        }}
                                                        autoPlay
                                                        muted
                                                        playsInline
                                                        className="w-full h-full object-cover"
                                                        onLoadedMetadata={(e) => handleVideoMetadata(p.userId, e.target)}
                                                        onPlay={(e) => handleVideoMetadata(p.userId, e.target)}
                                                    />
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); switchCamera(); }}
                                                        className={`absolute top-2 ${isParticipantHostOrCoHost ? 'left-16' : 'left-2'} bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full z-20 active:scale-95 transition-all shadow-md flex items-center justify-center border border-gray-800`}
                                                        title="Switch camera"
                                                    >
                                                        <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                                                    </button>
                                                </div>
                                            ) : camOn && remoteCameraStream ? (
                                                <video
                                                    ref={node => setRemoteVideoNode(p.userId, 'camera', node)}
                                                    autoPlay
                                                    playsInline
                                                    muted
                                                    className="w-full h-full object-cover"
                                                    onLoadedMetadata={(e) => handleVideoMetadata(p.userId, e.target)}
                                                    onPlay={(e) => handleVideoMetadata(p.userId, e.target)}
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center gap-2 p-2 text-gray-400 w-full h-full">
                                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-base sm:text-lg md:text-2xl font-bold ${isParticipantHostOrCoHost ? 'bg-primary text-white' : 'bg-gray-700 text-gray-200'}`}>
                                                        {initial}
                                                    </div>
                                                </div>
                                            )}

                                            {unavailableUsers[p.userId?.toString()] && (
                                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center rounded-xl pointer-events-none z-0">
                                                    <div className="flex flex-col items-center gap-1 bg-orange-500/90 text-white px-3 py-2 rounded-xl shadow-lg">
                                                        <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />
                                                        <span className="text-[10px] sm:text-xs font-semibold tracking-wide">Away</span>
                                                    </div>
                                                </div>
                                            )}

                                            {maximizedGridId === thisGridId && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setMaximizedGridId(null); }}
                                                    className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-lg hover:bg-black/80 transition-colors shadow-lg z-20"
                                                    title="Minimize"
                                                >
                                                    <Minimize className="w-4 h-4" />
                                                </button>
                                            )}

                                            <div className={`absolute top-2 ${maximizedGridId === thisGridId ? 'right-12' : 'right-2'} flex gap-1 z-10`}>
                                                <div className={`bg-black/60 p-1 sm:p-1.5 rounded-full ${camOn ? 'text-green-400' : 'text-red-400'}`}>
                                                    {camOn ? <Video className="w-3 h-3 sm:w-4 sm:h-4" /> : <VideoOff className="w-3 h-3 sm:w-4 sm:h-4" />}
                                                </div>
                                                <div className={`bg-black/60 p-1 sm:p-1.5 rounded-full ${micOn ? 'text-green-400' : 'text-red-400'}`}>
                                                    {micOn ? <Mic className="w-3 h-3 sm:w-4 sm:h-4" /> : <MicOff className="w-3 h-3 sm:w-4 sm:h-4" />}
                                                </div>
                                            </div>

                                            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] sm:text-xs px-2 py-1 rounded max-w-[85%] flex items-center gap-1 z-10">
                                                <span className="truncate">{isCurrentUser ? `${p.name} (You)` : p.name}</span>
                                                {unavailableUsers[p.userId?.toString()] && <Coffee className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />}
                                                {handRaiseQueue.some(h => (h.userId === p.userId?.toString() || h.socketId === p.userId?.toString())) && <Hand className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 flex-shrink-0" />}
                                            </div>

                                            {isRealHost && (
                                                <div className="absolute top-2 left-2 bg-primary/90 text-white text-[11px] font-medium px-2 py-1 rounded z-10">
                                                    Host
                                                </div>
                                            )}
                                            {isParticipantCoHost && (
                                                <div className="absolute top-2 left-2 bg-amber-500/90 text-white text-[11px] font-medium px-2 py-1 rounded z-10">
                                                    Co-host
                                                </div>
                                            )}
                                            {isHost && isActiveSpeaker && (
                                                <button
                                                    onClick={() => revokeStudentStream(activeStudent.userId)}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors"
                                                    title="Revoke stream"
                                                >
                                                    <UserX className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                    return acc;
                                }, {});

                                const othersTileJSX = extraParticipantsCount > 0 ? (
                                    <div
                                        key="others"
                                        onClick={() => { setShowParticipants(true); setShowChat(false); }}
                                        className={`relative bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors ${isMaximized ? 'w-full h-full aspect-video' : ''}`}
                                        style={getTileStyle('others')}
                                    >
                                        <div className="flex flex-col items-center justify-center gap-1 text-gray-400">
                                            <Users className="w-6 h-6 sm:w-8 sm:h-8 opacity-70" />
                                            <span className="font-semibold text-xs sm:text-sm">+{extraParticipantsCount} others</span>
                                        </div>
                                    </div>
                                ) : null;

                                return (
                                    <>
                                        {/* ─── MAXIMIZED TILE TOP ROW ─── */}
                                        {isMaximized && (
                                            <div className="w-full h-full min-h-0 relative flex items-center justify-center bg-gray-950 rounded-lg overflow-hidden shadow-2xl">
                                                {maximizedGridId === 'screen' ? screenTileJSX :
                                                    maximizedGridId === 'host' ? hostTileJSX :
                                                        participantTilesJSX[maximizedGridId]}
                                            </div>
                                        )}

                                        {/* ─── REMAINING TILES ─── */}
                                        <div className={isMaximized ? "grid grid-flow-col auto-cols-fr md:grid-flow-row md:auto-rows-fr md:grid-cols-1 gap-1.5 sm:gap-2 w-full md:w-auto h-24 sm:h-28 md:h-full md:overflow-y-auto overflow-x-auto overflow-y-hidden md:overflow-x-hidden flex-shrink-0" : "contents"}>
                                            {maximizedGridId !== 'screen' && screenTileJSX}
                                            {maximizedGridId !== 'host' && hostTileJSX}
                                            {finalDisplayedParticipants.map(p => maximizedGridId !== p.userId && participantTilesJSX[p.userId])}
                                            {othersTileJSX}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Hand raise queue removed per user request */}

                    </div>

                    {!isFullscreen && renderControlsBar()}
                </div>

                {/* Responsive Sidebars Container */}
                {(showParticipants || showChat) && (
                    <div className="absolute inset-0 md:relative md:inset-auto md:w-[420px] xl:w-auto flex flex-col xl:flex-row flex-shrink-0 bg-gray-800 md:border-l border-gray-700 z-[45] md:z-auto">
                        {/* Participants sidebar */}
                        {showParticipants && (
                            <div className="flex-1 xl:flex-initial xl:w-[360px] flex flex-col min-h-0 bg-gray-800 border-b xl:border-b-0 xl:border-r border-gray-700">
                                <div className="px-4 py-3 border-b border-gray-700 flex flex-col gap-2 flex-shrink-0">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-white font-semibold text-lg">Participants ({participants.length})</h3>
                                        <button onClick={() => setShowParticipants(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                                    </div>
                                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none group">
                                        <input
                                            type="checkbox"
                                            checked={hideCameraOff}
                                            onChange={(e) => setHideCameraOff(e.target.checked)}
                                            className="sr-only"
                                        />
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${hideCameraOff ? 'bg-indigo-500 border-indigo-500 text-white shadow-sm shadow-indigo-500/25' : 'border-gray-600 bg-gray-700 group-hover:border-gray-500'}`}>
                                            {hideCameraOff && (
                                                <svg className="w-3 h-3 stroke-current" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                            )}
                                        </div>
                                        <span>Hide participants with camera off</span>
                                    </label>
                                </div>
                                {isHost && (
                                    <div className="p-3 border-b border-gray-700 flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={roomMuteLocked ? unmuteAllParticipants : muteAllParticipants}
                                            className={`flex-grow px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${roomMuteLocked
                                                ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                                                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                                }`}
                                            title={roomMuteLocked ? "Allow students to unmute themselves" : "Mute all students"}
                                        >
                                            {roomMuteLocked ? "Unmute all" : "Mute all"}
                                        </button>
                                        <button
                                            onClick={roomCameraLocked ? cameraOnAllParticipants : cameraOffAllParticipants}
                                            className={`flex-grow px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${roomCameraLocked
                                                ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                                                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                                }`}
                                            title={roomCameraLocked ? "Allow students to turn on camera" : "Turn off everyone's camera"}
                                        >
                                            {roomCameraLocked ? "Cam on all" : "Cam off all"}
                                        </button>
                                    </div>
                                )}
                                <div className="px-3 pb-2 border-b border-gray-700">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search participants..."
                                            value={participantSearch}
                                            onChange={(e) => setParticipantSearch(e.target.value)}
                                            className="w-full bg-gray-700 text-white pl-9 pr-4 py-2 rounded-lg text-sm border border-gray-600 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                                <div className="flex-grow overflow-y-auto p-3 space-y-1">
                                    {filteredParticipants.map(p => {
                                        const isRealHost = p.role === 'teacher' || p.role === 'admin';
                                        const isCoHost = p.role === 'co-host';
                                        const isHostOrCoHost = isRealHost || isCoHost;
                                        const isSelf = p.userId === user?._id;
                                        const status = getParticipantStatus(p);
                                        const canModerate = isHost && !isRealHost && !isSelf;
                                        const canAssignCoHost = isTeacher && !isRealHost;

                                        return (
                                            <div key={p.userId} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm sm:text-base text-gray-300 hover:bg-gray-700/50">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isHostOrCoHost ? 'bg-primary text-white' : 'bg-gray-600 text-gray-300'}`}>
                                                    {p.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="truncate font-medium flex items-center gap-1">
                                                            {isSelf ? `${p.name} (You)` : p.name}
                                                            {unavailableUsers[p.userId?.toString()] && <Coffee className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />}
                                                            {handRaiseQueue.some(h => (h.userId === p.userId?.toString() || h.socketId === p.userId?.toString())) && <Hand className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                                                        </span>
                                                        {isRealHost && <span className="text-xs text-primary font-semibold">Host</span>}
                                                        {isCoHost && <span className="text-xs text-amber-500 font-semibold">Co-host</span>}
                                                        {unavailableUsers[p.userId?.toString()] && (
                                                            <span className="flex items-center gap-0.5 text-xs text-orange-400 font-medium bg-orange-500/10 px-1.5 py-0.5 rounded-full">
                                                                <Coffee className="w-3 h-3" /> Away
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                                                        {status.cameraOn ? <Video className="w-3.5 h-3.5 text-green-400" /> : <VideoOff className="w-3.5 h-3.5" />}
                                                        {status.micOn ? <Mic className="w-3.5 h-3.5 text-green-400" /> : <MicOff className="w-3.5 h-3.5" />}
                                                        {status.screenOn && <Monitor className="w-3.5 h-3.5 text-indigo-300" />}
                                                    </div>
                                                </div>
                                                {canModerate && (
                                                    <div className="flex items-center gap-1">
                                                        {canAssignCoHost && (
                                                            <button
                                                                onClick={() => toggleCoHost(p.userId)}
                                                                className={`p-1.5 rounded-md transition-colors ${isCoHost
                                                                    ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                                                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                                    }`}
                                                                title={isCoHost ? "Remove Co-host" : "Make Co-host"}
                                                            >
                                                                <Shield className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => muteParticipant(p.userId)}
                                                            className="p-1.5 rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600"
                                                            title="Mute participant"
                                                        >
                                                            <MicOff className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => turnOffParticipantCamera(p.userId)}
                                                            className="p-1.5 rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600"
                                                            title="Turn off camera"
                                                        >
                                                            <VideoOff className="w-3.5 h-3.5" />
                                                        </button>
                                                        {status.screenOn && (
                                                            <button
                                                                onClick={() => stopParticipantScreen(p.userId)}
                                                                className="p-1.5 rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600"
                                                                title="Stop presentation"
                                                            >
                                                                <MonitorOff className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => removeParticipant(p.userId)}
                                                            className="p-1.5 rounded-md bg-red-500/20 text-red-300 hover:bg-red-500/30"
                                                            title="Remove participant"
                                                        >
                                                            <UserX className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Chat sidebar */}
                        {showChat && (
                            <div className="flex-1 xl:flex-initial xl:w-[420px] flex flex-col min-h-0 bg-gray-800">
                                <div className="px-4 py-3 border-b border-gray-700 flex flex-col gap-3 flex-shrink-0">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-white font-semibold text-lg">Chat</h3>
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                                                    className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700/50 transition-colors"
                                                    title="Download chat history"
                                                >
                                                    <Download className="w-5 h-5" />
                                                </button>
                                                {showDownloadMenu && (
                                                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-[60] overflow-hidden">
                                                        <button
                                                            onClick={() => downloadChat('global')}
                                                            className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 hover:text-white transition-colors"
                                                        >
                                                            Download Global Chat
                                                        </button>
                                                        <button
                                                            onClick={() => downloadChat('private')}
                                                            className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 hover:text-white transition-colors border-t border-gray-700"
                                                        >
                                                            Download Direct Messages
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => setShowChat(false)}
                                                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700/50 transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex bg-gray-900 rounded-lg p-1">
                                        <button
                                            onClick={() => setChatTab('global')}
                                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${chatTab === 'global' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                                        >
                                            Everyone
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (!isHost) {
                                                    const mods = participants.filter(p => p.role === 'teacher' || p.role === 'admin' || p.role === 'co-host');
                                                    if (mods.length > 0) setChatRecipient(mods[0].userId.toString());
                                                }
                                                setChatTab('private');
                                            }}
                                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors relative ${chatTab === 'private' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                                        >
                                            Direct Messages
                                            {unreadPrivateChat && (
                                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full shadow-sm"></span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                {chatTab === 'global' && pinnedMessages.length > 0 && (() => {
                                    const activeIndex = Math.min(activePinnedIndex, Math.max(0, pinnedMessages.length - 1));
                                    const pinnedMsg = pinnedMessages[activeIndex];
                                    if (!pinnedMsg) return null;
                                    return (
                                        <div className="mx-3 mt-2 p-2.5 bg-indigo-950/80 border border-indigo-500/30 rounded-lg flex items-stretch gap-2 text-xs relative group animate-in fade-in slide-in-from-top-2 duration-200">
                                            {/* WhatsApp Style Segmented Vertical Bar */}
                                            {pinnedMessages.length > 1 && (
                                                <div className="flex flex-col gap-0.5 w-[3px] flex-shrink-0 self-stretch rounded-full overflow-hidden my-0.5">
                                                    {pinnedMessages.map((_, i) => (
                                                        <div 
                                                            key={i} 
                                                            className={`flex-1 w-full transition-all duration-300 ${i === activeIndex ? 'bg-white' : 'bg-gray-600/60'}`} 
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                            <Pin className="w-3.5 h-3.5 text-indigo-400 mt-1 flex-shrink-0" />
                                            <div 
                                                onClick={() => {
                                                    // Switch to appropriate chat tab if needed
                                                    if (pinnedMsg.recipientId) {
                                                        setChatTab('private');
                                                        const otherPersonId = (pinnedMsg.senderId === user?._id || pinnedMsg.senderId?._id === user?._id)
                                                            ? pinnedMsg.recipientId
                                                            : (pinnedMsg.senderId?._id || pinnedMsg.senderId);
                                                        if (otherPersonId) {
                                                            setChatRecipient(otherPersonId.toString());
                                                        }
                                                    } else {
                                                        setChatTab('global');
                                                    }
                                                    // Wait for layout update, then scroll & highlight
                                                    setTimeout(() => {
                                                        const targetId = pinnedMsg._id ? `chat-msg-${pinnedMsg._id}` : null;
                                                        if (targetId) {
                                                            const element = document.getElementById(targetId);
                                                            if (element) {
                                                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                element.classList.add('bg-indigo-500/20');
                                                                setTimeout(() => {
                                                                    element.classList.remove('bg-indigo-500/20');
                                                                 }, 2000);
                                                            }
                                                        }
                                                    }, 150);
                                                    
                                                    // WhatsApp Style: Auto-cycle to the next pinned message on click
                                                    if (pinnedMessages.length > 1) {
                                                        setActivePinnedIndex((activeIndex + 1) % pinnedMessages.length);
                                                    }
                                                }}
                                                className="flex-grow min-w-0 cursor-pointer hover:opacity-80 transition-opacity pr-6"
                                                title="Jump to message & cycle"
                                            >
                                                <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                                                    <span>{pinnedMsg.senderName}</span>
                                                    <span className="text-[10px] text-gray-500 font-normal">
                                                        pinned message
                                                    </span>
                                                </div>
                                                <div className="text-gray-200 mt-0.5 break-words line-clamp-2 flex items-center gap-2" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                                    {pinnedMsg.image && (
                                                        <img
                                                            src={pinnedMsg.image}
                                                            alt="pinned"
                                                            className="h-8 w-8 rounded object-cover border border-indigo-500/40 flex-shrink-0"
                                                        />
                                                    )}
                                                    {pinnedMsg.message
                                                        ? <span>{pinnedMsg.message}</span>
                                                        : pinnedMsg.image && <span className="text-xs italic text-gray-400">📷 Image</span>
                                                    }
                                                </div>
                                            </div>
                                            {isHost && (
                                                <button
                                                    onClick={() => socketRef.current.emit('unpin-message', { messageId: pinnedMsg._id })}
                                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-400 p-0.5 rounded transition-colors flex-shrink-0"
                                                    title="Unpin message"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })()}
                                <div className="flex-grow overflow-y-auto p-3 space-y-3">
                                    {chatMessages.filter(msg => {
                                        if (chatTab === 'global') return !msg.recipientId;
                                        if (chatTab === 'private') {
                                            if (!msg.recipientId) return false; // Must be a direct message
                                            if (chatRecipient === 'everyone') return true; // Show all direct messages if no specific recipient selected
                                            return msg.recipientId === chatRecipient || msg.senderId === chatRecipient || msg.senderId?._id === chatRecipient;
                                        }
                                        return true;
                                    }).map((msg, idx) => {
                                        const isOwn = msg.senderId === user._id || msg.senderId?._id === user._id;
                                        return (
                                            <div 
                                                key={msg._id || idx} 
                                                id={`chat-msg-${msg._id || idx}`}
                                                className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} group relative w-full rounded-lg px-2 py-1 transition-colors duration-500`}
                                            >
                                                <span className="text-xs text-gray-500 mb-0.5">
                                                    {msg.senderName}
                                                    {(msg.senderId === hostId?.toString() || msg.senderId?._id === hostId?.toString()) && ' (Host)'}
                                                    {(() => {
                                                        const sId = typeof msg.senderId === 'object' ? msg.senderId?._id?.toString() : msg.senderId?.toString();
                                                        const isCo = participants.find(p => p.userId === sId)?.role === 'co-host';
                                                        return isCo && sId !== hostId?.toString() ? ' (Co-host)' : '';
                                                    })()}
                                                    {msg.recipientId && (
                                                        <span className="text-indigo-400 font-medium ml-1">
                                                            (Direct Message)
                                                        </span>
                                                    )}
                                                </span>
                                                <div className={`flex items-stretch gap-2 max-w-full ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    <div 
                                                        className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${isOwn ? 'bg-primary text-white rounded-tr-sm' : 'bg-gray-700 text-gray-200 rounded-tl-sm'} flex items-center`}
                                                        style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                                                    >
                                                        <div className="w-full break-words whitespace-pre-wrap" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                                            {msg.image && (
                                                                <img
                                                                    src={msg.image}
                                                                    alt="chat attachment"
                                                                    className="max-w-full rounded-lg mb-2 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                                                    style={{ maxHeight: '150px' }}
                                                                    onClick={() => setSelectedImage(msg.image)}
                                                                />
                                                            )}
                                                            {msg.message && (
                                                                <span className="break-words whitespace-pre-wrap" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                                                    {msg.message}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex-shrink-0 flex items-stretch gap-1">
                                                        {msg.message && messageToDelete !== msg._id && (
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(msg.message);
                                                                    setCopiedMessageId(msg._id || idx);
                                                                    setTimeout(() => setCopiedMessageId(null), 1500);
                                                                }}
                                                                className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md border border-gray-750 flex items-center justify-center self-center"
                                                                title="Copy message"
                                                            >
                                                                {copiedMessageId === (msg._id || idx) ? (
                                                                    <span className="text-[10px] text-green-400 font-semibold px-1">Copied!</span>
                                                                ) : (
                                                                    <Copy className="w-3.5 h-3.5" />
                                                                )}
                                                            </button>
                                                        )}
                                                        {(isHost || isOwn) && (
                                                            messageToDelete === msg._id ? (
                                                                <div className="flex items-center gap-1.5 bg-gray-900 border border-red-500/30 rounded-xl px-2.5 py-1.5 shadow-lg whitespace-nowrap z-10 animate-in fade-in zoom-in-95 duration-100 h-full">
                                                                    <span className="text-[10px] font-semibold text-red-400">Delete?</span>
                                                                    <button type="button" onClick={confirmDeleteMessage} className="bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 text-[9px] font-bold rounded shadow-sm">Yes</button>
                                                                    <button type="button" onClick={() => setMessageToDelete(null)} className="bg-gray-750 hover:bg-gray-700 text-gray-200 px-2 py-0.5 text-[9px] font-bold rounded border border-gray-600">No</button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center h-full gap-1">
                                                                    {isHost && (
                                                                        <button
                                                                            onClick={() => {
                                                                                console.log('[UI] Pin button clicked. Emitting pin-message:', msg);
                                                                                socketRef.current.emit('pin-message', {
                                                                                    _id: msg._id,
                                                                                    senderName: msg.senderName,
                                                                                    message: msg.message,
                                                                                    image: msg.image
                                                                                });
                                                                            }}
                                                                            className="bg-indigo-600/90 hover:bg-indigo-700 text-white rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md"
                                                                            title="Pin message"
                                                                        >
                                                                            <Pin className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => requestDeleteMessage(msg._id)}
                                                                        className="bg-red-600/90 hover:bg-red-700 text-white rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md"
                                                                        title="Delete message"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-xs text-gray-600 mt-0.5">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        );
                                    })}
                                    <div ref={chatEndRef} />
                                </div>
                                <form onSubmit={sendChatMessage} className="p-3 border-t border-gray-700 relative flex-shrink-0">
                                    {chatTab === 'private' && (() => {
                                        const availableRecipients = isHost
                                            ? [
                                                { id: 'everyone', name: 'All Direct Messages', label: '' },
                                                ...participants
                                                    .filter(p => p.userId?.toString() !== user?._id?.toString())
                                                    .map(p => ({
                                                        id: p.userId,
                                                        name: p.name,
                                                        label: p.role === 'teacher' || p.role === 'admin' ? ' (Host)' : p.role === 'co-host' ? ' (Co-host)' : ''
                                                    }))
                                              ]
                                            : [
                                                ...participants
                                                    .filter(p => p.role === 'teacher' || p.role === 'admin' || p.role === 'co-host')
                                                    .map(p => ({
                                                        id: p.userId,
                                                        name: p.name,
                                                        label: p.role === 'co-host' ? ' (Co-host)' : ' (Host)'
                                                    }))
                                              ];

                                        if (!isHost && availableRecipients.length === 0) {
                                            availableRecipients.push({ id: 'everyone', name: 'Waiting for Host/Co-host...', label: '' });
                                        }

                                        const selectedRecipientObj = availableRecipients.find(r => r.id?.toString() === chatRecipient?.toString()) || availableRecipients[0];
                                        const triggerLabel = selectedRecipientObj ? `${selectedRecipientObj.name}${selectedRecipientObj.label}` : 'Select recipient';

                                        return (
                                            <div className="mb-2 flex items-center gap-2 text-sm w-full">
                                                <span className="text-gray-400 font-medium w-6 text-right">To:</span>
                                                <div className="flex-1 relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsRecipientDropdownOpen(!isRecipientDropdownOpen)}
                                                        className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-lg px-2.5 py-1.5 text-sm flex items-center justify-between focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                                                    >
                                                        <span className="truncate">{triggerLabel}</span>
                                                        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isRecipientDropdownOpen ? 'rotate-90' : ''}`} />
                                                    </button>
                                                    
                                                    {isRecipientDropdownOpen && (
                                                        <>
                                                            <div 
                                                                className="fixed inset-0 z-[48]"
                                                                onClick={() => setIsRecipientDropdownOpen(false)}
                                                            />
                                                            <div className="absolute bottom-full mb-1 left-0 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto z-[49] py-1">
                                                                {availableRecipients.map((recipient) => (
                                                                    <div
                                                                        key={recipient.id}
                                                                        onClick={() => {
                                                                            setChatRecipient(recipient.id);
                                                                            setIsRecipientDropdownOpen(false);
                                                                        }}
                                                                        className={`px-3 py-2 text-sm cursor-pointer transition-colors truncate ${chatRecipient === recipient.id ? 'bg-primary text-white font-medium' : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'}`}
                                                                    >
                                                                        {recipient.name}{recipient.label}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    {chatImage && (
                                        <div className="mb-2 relative inline-block">
                                            <img src={chatImage} alt="preview" className="h-20 w-20 object-cover rounded-lg border border-gray-600" />
                                            <button
                                                type="button"
                                                onClick={() => setChatImage(null)}
                                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors shadow-lg"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex gap-2 items-end">
                                        <label className="cursor-pointer text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700 mb-1">
                                            <Image className="w-5 h-5" />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onload = (ev) => {
                                                            const img = new window.Image();
                                                            img.src = ev.target.result;
                                                            img.onload = () => {
                                                                const canvas = document.createElement('canvas');
                                                                const MAX_WIDTH = 800;
                                                                const MAX_HEIGHT = 800;
                                                                let width = img.width;
                                                                let height = img.height;

                                                                if (width > height) {
                                                                    if (width > MAX_WIDTH) {
                                                                        height *= MAX_WIDTH / width;
                                                                        width = MAX_WIDTH;
                                                                    }
                                                                } else {
                                                                    if (height > MAX_HEIGHT) {
                                                                        width *= MAX_HEIGHT / height;
                                                                        height = MAX_HEIGHT;
                                                                    }
                                                                }
                                                                canvas.width = width;
                                                                canvas.height = height;
                                                                const ctx = canvas.getContext('2d');
                                                                ctx.drawImage(img, 0, 0, width, height);
                                                                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
setChatImage(dataUrl);
                                                            };
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                        </label>
                                        {(() => {
                                            const startsWithHttps = chatInput.trim().toLowerCase().startsWith('https');
                                            const maxWords = startsWithHttps ? 100 : 20;
                                            const maxChars = startsWithHttps ? 1500 : 600;
                                            const currentWords = chatInput.trim().split(/\s+/).filter(w => w.length > 0);
                                            const currentWordCount = currentWords.length;
                                            const hasTooLongWord = currentWords.some(w => w.length > 100);
                                            const isChatInputInvalid = currentWordCount > maxWords || hasTooLongWord;
                                            return (
                                                <>
                                                    <div className="flex-grow flex flex-col gap-1">
                                                        <textarea
                                                             ref={chatTextareaRef}
                                                             value={chatInput}
                                                             onChange={(e) => setChatInput(e.target.value)}
                                                             maxLength={maxChars}
                                                             rows={1}
                                                             onKeyDown={(e) => {
                                                                 if (e.key === 'Enter' && !e.shiftKey) {
                                                                     e.preventDefault();
                                                                     sendChatMessage(e);
                                                                 }
                                                             }}
                                                             className={`w-full bg-gray-700 text-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 placeholder-gray-400 resize-none max-h-24 overflow-y-auto ${isChatInputInvalid
                                                                 ? 'border-red-500 focus:ring-red-500'
                                                                 : 'border-gray-600 focus:ring-primary'
                                                                 }`}
                                                             placeholder={`Type a message (max ${maxWords} words)...`}
                                                        />
                                                        {chatInput.trim().length > 0 && (currentWordCount >= maxWords - 5 || hasTooLongWord) && (
                                                            <span className={`text-[10px] text-right pr-1 ${isChatInputInvalid
                                                                ? 'text-red-400 font-medium'
                                                                : 'text-gray-500'
                                                                }`}>
                                                                {hasTooLongWord
                                                                    ? 'Word length limit exceeded (max 100 chars/word)'
                                                                    : `${currentWordCount}/${maxWords} words`
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="submit"
                                                        disabled={isChatInputInvalid}
                                                        className="bg-primary hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-1"
                                                    >
                                                        <Send className="w-4 h-4" />
                                                    </button>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {!isFullscreen && showCalculator && renderCalculator()}

            {!isFullscreen && showNotepad && renderNotepad()}

            {/* Image Viewer Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 bg-gray-800/50 rounded-full"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={selectedImage}
                        alt="Full screen preview"
                        className="max-w-full max-h-[95vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}


            {/* Unavailable / Away Toast Notifications — centered, slides from top */}
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[90] flex flex-col items-center gap-3 pointer-events-none">
                {unavailableToasts.map((toast) => (
                    <div
                        key={toast.id}
                        style={{
                            transition: 'opacity 0.6s ease, transform 0.6s ease',
                            opacity: toast.exiting ? 0 : 1,
                            transform: toast.exiting ? 'translateY(-16px) scale(0.95)' : 'translateY(0) scale(1)',
                        }}
                        className="bg-gray-900/95 border border-orange-500/60 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-[0_8px_32px_rgba(249,115,22,0.35)] backdrop-blur-xl flex items-center gap-3 sm:gap-4 min-w-[240px] max-w-[90vw] sm:max-w-sm toast-slide-in relative overflow-hidden pointer-events-auto"
                    >
                        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 flex-shrink-0 ring-2 ring-orange-500/30">
                            <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-white text-xs sm:text-sm">{toast.name}</span>
                            <span className="text-orange-300 text-xs sm:text-sm">is unavailable right now</span>
                        </div>
                        {/* Progress bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl overflow-hidden">
                            <div
                                className="h-full bg-orange-500/70 origin-left"
                                style={{ animation: 'shrink-width 3s linear forwards' }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Join/Leave Toast Notifications */}
            <div className="fixed top-24 right-4 z-[70] flex flex-col items-end gap-2 pointer-events-none">
                {joinLeaveToasts.map((toast) => (
                    <div key={toast.id} className="animate-in slide-in-from-right-8 fade-in duration-300 bg-gray-800/95 border border-gray-600/50 rounded-xl px-4 py-3 shadow-[0_0_15px_rgba(0,0,0,0.3)] backdrop-blur-md flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'join' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {toast.type === 'join' ? <UserPlus className="w-4 h-4" /> : <UserMinus className="w-4 h-4" />}
                        </div>
                        <div className="text-sm font-medium text-white">
                            {toast.message}
                        </div>
                    </div>
                ))}
            </div>



            {/* Hand Raise Toast Notifications */}
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] flex flex-col gap-1.5 pointer-events-none">
                {handRaiseToasts.map((toast) => (
                    <div key={toast.toastId} className="animate-in slide-in-from-bottom-5 fade-in duration-300 bg-gray-800/95 border border-amber-500/50 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 shadow-[0_0_15px_rgba(245,158,11,0.3)] backdrop-blur-md flex items-center gap-2 sm:gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                            <Hand className="w-4 h-4 sm:w-5 h-5 animate-bounce" />
                        </div>
                        <div className="text-xs sm:text-sm whitespace-nowrap">
                            <span className="font-semibold text-white">{toast.name}</span>
                            <span className="text-gray-300 ml-1">raised their hand!</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Shrink-width animation for the toast progress bar and slide-in for toast */}
            <style>{`
                @keyframes shrink-width {
                    from { transform: scaleX(1); }
                    to { transform: scaleX(0); }
                }
                @keyframes slide-in-top {
                    from {
                        transform: translateY(-24px) scale(0.95);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0) scale(1);
                        opacity: 1;
                    }
                }
                @keyframes float-up-dissolve {
                    0% {
                        transform: translateY(80px);
                        opacity: 0;
                    }
                    15% {
                        transform: translateY(0);
                        opacity: 1;
                    }
                    80% {
                        transform: translateY(-60px);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-120px);
                        opacity: 0;
                    }
                }
                .toast-slide-in {
                    animation: slide-in-top 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .reaction-float-up {
                    animation: float-up-dissolve 2s cubic-bezier(0.25, 1, 0.5, 1) both;
                }
            `}</style>

            {showLeaveConfirm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-[3px] flex items-center justify-center z-[100] p-4 transition-all duration-200 animate-in fade-in">
                    <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 max-w-[90%] w-80 text-center shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                            <PhoneOff className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-base">
                                {isTeacher ? "End session for everyone?" : "Leave the session?"}
                            </h4>
                            <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                                {isTeacher
                                    ? "Are you sure you want to end this live session for all participants?"
                                    : "Are you sure you want to leave the live classroom?"}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 w-full mt-2">
                            <button
                                type="button"
                                onClick={() => setShowLeaveConfirm(false)}
                                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-750 text-gray-300 font-semibold text-xs rounded-xl transition-all border border-gray-700 active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    setShowLeaveConfirm(false);
                                    if (isTeacher) {
                                        await endSession();
                                    } else {
                                        leaveSession();
                                    }
                                }}
                                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-red-500/10 active:scale-95"
                            >
                                {isTeacher ? "End Session" : "Leave"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Modal: Remove Participant Confirm */}
            {participantToRemove && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-[3px] flex items-center justify-center z-[100] p-4 transition-all duration-200 animate-in fade-in">
                    <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 max-w-[90%] w-80 text-center shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                            <UserMinus className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-base">Remove participant?</h4>
                            <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                                Are you sure you want to remove <span className="font-semibold text-white">{participantToRemove.name}</span> from the class?
                            </p>
                        </div>
                        <div className="flex items-center gap-3 w-full mt-2">
                            <button
                                type="button"
                                onClick={() => setParticipantToRemove(null)}
                                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-750 text-gray-300 font-semibold text-xs rounded-xl transition-all border border-gray-700 active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (socketRef.current) {
                                        socketRef.current.emit('host-remove-participant', { targetUserId: participantToRemove.userId });
                                    }
                                    setParticipantToRemove(null);
                                }}
                                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-red-500/10 active:scale-95"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {lockAlertMessage && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-[3px] flex items-center justify-center z-[100] p-4 transition-all duration-200 animate-in fade-in">
                    <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 max-w-[90%] w-80 text-center shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            {lockAlertMessage.toLowerCase().includes('mute') || lockAlertMessage.toLowerCase().includes('micro') || lockAlertMessage.toLowerCase().includes('mic') ? <MicOff className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-base">Action Restricted</h4>
                            <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                                {lockAlertMessage}
                            </p>
                        </div>
                        <div className="w-full mt-2">
                            <button
                                type="button"
                                onClick={() => setLockAlertMessage(null)}
                                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-all active:scale-95 shadow-md shadow-indigo-600/10"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {infoAlertMessage && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-[3px] flex items-center justify-center z-[100] p-4 transition-all duration-200 animate-in fade-in">
                    <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 max-w-[90%] w-80 text-center shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <Info className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-base">Notice</h4>
                            <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                                {infoAlertMessage}
                            </p>
                        </div>
                        <div className="w-full mt-2">
                            <button
                                type="button"
                                onClick={() => setInfoAlertMessage(null)}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all active:scale-95 shadow-md shadow-blue-600/10"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveClassRoom;
