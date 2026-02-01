import { useRef, useEffect, useState, useCallback } from 'react';
import type { ICamera } from '@shared/interfaces/camera.interface';
import { useCameraStream } from '@/hooks/use-camera-stream';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Play, Square, AlertCircle, Loader2, RotateCw } from 'lucide-react';
import Hls from 'hls.js';

interface ICameraPlayerProps {
    camera: ICamera;
    className?: string;
}

type StreamState = 'idle' | 'loading' | 'playing' | 'error' | 'stopped';

export function CameraPlayer({ camera, className }: ICameraPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const hlsRef = useRef<Hls | null>(null);

    const [state, setState] = useState<StreamState>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const { data, isLoading, refetch, isStarting, start } = useCameraStream(camera.id, true);

    // Cleanup function
    const cleanup = useCallback(() => {
        console.log('[Stream] Cleaning up resources...');

        // Cleanup WebRTC
        if (pcRef.current) {
            console.log('[Stream] Cleaning up WebRTC connection...');
            pcRef.current.ontrack = null;
            pcRef.current.onconnectionstatechange = null;
            pcRef.current.oniceconnectionstatechange = null;
            pcRef.current.close();
            pcRef.current = null;
            console.log('[Stream] WebRTC connection closed');
        }

        // Cleanup HLS
        if (hlsRef.current) {
            console.log('[Stream] Cleaning up HLS instance...');
            try {
                hlsRef.current.destroy();
                console.log('[Stream] HLS instance destroyed');
            } catch (e) {
                console.error('[Stream] Error destroying HLS:', e);
            }
            hlsRef.current = null;
        }

        // Cleanup video element
        if (videoRef.current) {
            console.log('[Stream] Cleaning up video element...');
            videoRef.current.srcObject = null;
            videoRef.current.removeAttribute('src');
            videoRef.current.load();
        }

        console.log('[Stream] Cleanup completed');
    }, []);

    // Stop stream
    const stopStream = useCallback(() => {
        console.log('[Stream] Stopping stream playback');
        cleanup();
        setState('stopped');
        console.log('[Stream] Stream stopped');
    }, [cleanup]);




    // Start WebRTC (WHEP) stream
    const startWebRTC = useCallback(async (whepUrl: string): Promise<boolean> => {
        if (!videoRef.current) {
            console.warn('[WebRTC] Video element not available');
            return false;
        }

        console.log('[WebRTC] Starting WHEP connection to:', whepUrl);

        try {
            const pc = new RTCPeerConnection({
                bundlePolicy: 'max-bundle',
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                ],
            });

            pcRef.current = pc;
            console.log('[WebRTC] RTCPeerConnection created');

            pc.addTransceiver('video', { direction: 'recvonly' });
            console.log('[WebRTC] Video transceiver added (recvonly)');


            pc.ontrack = (event) => {
                console.log('[WebRTC] Track received:', {
                    kind: event.track.kind,
                    id: event.track.id,
                    enabled: event.track.enabled,
                    readyState: event.track.readyState,
                });

                if (videoRef.current && event.streams[0]) {
                    videoRef.current.srcObject = event.streams[0];
                    console.log('[WebRTC] Video srcObject set, attempting playback');

                    event.track.onended = () => {
                        console.warn('[WebRTC] Track ended');
                        setErrorMessage('Stream ended');
                        setState('error');
                    };

                    event.track.onmute = () => {
                        console.warn('[WebRTC] Track muted');
                    };

                    event.track.onunmute = () => {
                        console.log('[WebRTC] Track unmuted');
                    };

                    videoRef.current.play()
                        .then(() => {
                            console.log('[WebRTC] Playback started successfully');
                            setState('playing');
                        })
                        .catch((err) => {
                            console.error('[WebRTC] Playback failed:', err);
                            setErrorMessage('Autoplay blocked. Click to play.');
                            setState('error');
                        });
                }
            };

            pc.onconnectionstatechange = () => {
                const state = pc.connectionState;
                console.log('[WebRTC] Connection state changed:', state);

                if (state === 'connected') {
                    console.log('[WebRTC] Connection established');
                    setState('playing');
                } else if (state === 'connecting' || state === 'disconnected') {
                    console.log('[WebRTC] Connection state:', state, '(transient)');
                } else if (state === 'failed') {
                    console.error('[WebRTC] Connection failed');
                    setErrorMessage('WebRTC connection failed');
                    setState('error');
                    cleanup();
                } else if (state === 'closed') {
                    console.log('[WebRTC] Connection closed');
                }
            };

            pc.oniceconnectionstatechange = () => {
                const iceState = pc.iceConnectionState;
                console.log('[WebRTC] ICE connection state changed:', iceState);

                if (iceState === 'connected' || iceState === 'completed') {
                    console.log('[WebRTC] ICE connection established');
                } else if (iceState === 'checking' || iceState === 'disconnected') {
                    console.log('[WebRTC] ICE state:', iceState, '(transient)');
                } else if (iceState === 'failed') {
                    console.error('[WebRTC] ICE connection failed');
                    setErrorMessage('ICE connection failed');
                    setState('error');
                    cleanup();
                } else if (iceState === 'closed') {
                    console.log('[WebRTC] ICE connection closed');
                }
            };

            // Create and send offer
            console.log('[WebRTC] Creating SDP offer...');
            const offer = await pc.createOffer({
                offerToReceiveVideo: true,
                offerToReceiveAudio: false,
            });

            console.log('[WebRTC] SDP offer created:', {
                type: offer.type,
                sdpLength: offer.sdp.length,
                preview: offer.sdp.substring(0, 100) + '...',
            });

            await pc.setLocalDescription(offer);
            console.log('[WebRTC] Local description set');

            console.log('[WebRTC] Waiting 5 seconds before sending WHEP request...');
            await new Promise(resolve => setTimeout(resolve, 5000));

            console.log('[WebRTC] Sending WHEP POST request to:', whepUrl);
            let response: Response;
            try {
                response = await fetch(whepUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/sdp',
                        'Accept': 'application/sdp',
                    },
                    body: offer.sdp,
                    signal: AbortSignal.timeout(20000), // 20 second timeout
                });
                console.log('[WebRTC] WHEP response received:', {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok,
                });
            } catch (fetchError: any) {
                console.error('[WebRTC] WHEP fetch error:', {
                    name: fetchError.name,
                    message: fetchError.message,
                    stack: fetchError.stack,
                });
                throw new Error(`WHEP fetch failed: ${fetchError.message}`);
            }

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                console.error('[WebRTC] WHEP request failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText,
                });
                throw new Error(`WHEP request failed: ${response.status} ${errorText}`);
            }

            const answerSDP = await response.text();
            if (!answerSDP || answerSDP.trim().length === 0) {
                console.error('[WebRTC] Empty SDP answer received');
                throw new Error('Empty SDP answer from server - stream may not be published yet');
            }

            console.log('[WebRTC] Received SDP answer:', {
                length: answerSDP.length,
                preview: answerSDP.substring(0, 100) + '...',
            });

            await pc.setRemoteDescription({ type: 'answer', sdp: answerSDP });
            console.log('[WebRTC] Remote description set, WHEP connection established');

            return true;
        } catch (error: any) {
            console.error('[WebRTC] Connection failed:', {
                error: error.message,
                stack: error.stack,
            });
            cleanup();
            return false;
        }
    }, [cleanup]);


    // Start HLS stream
    const startHLS = useCallback(async (hlsUrl: string): Promise<boolean> => {
        if (!videoRef.current) {
            console.warn('[HLS] Video element not available');
            return false;
        }

        console.log('[HLS] Starting HLS playback from:', hlsUrl);

        try {
            // Use HLS.js if supported
            if (Hls.isSupported()) {
                console.log('[HLS] HLS.js is supported, initializing...');
                const hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90,
                    maxBufferLength: 30,
                    maxMaxBufferLength: 60,
                    startLevel: -1,
                    manifestLoadingTimeOut: 20000,
                    manifestLoadingMaxRetry: 5,
                    levelLoadingTimeOut: 10000,
                    fragLoadingTimeOut: 20000,
                });

                hlsRef.current = hls;
                console.log('[HLS] HLS.js instance created');

                // Setup event handlers
                hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                    console.log('[HLS] Manifest parsed:', {
                        levels: data.levels?.length || 0,
                        videoTracks: data.videoTracks?.length || 0,
                        audioTracks: data.audioTracks?.length || 0,
                    });
                    if (videoRef.current) {
                        console.log('[HLS] Starting video playback...');
                        videoRef.current.play()
                            .then(() => {
                                console.log('[HLS] Playback started successfully');
                                setState('playing');
                            })
                            .catch((err) => {
                                console.error('[HLS] Playback failed:', err);
                                setErrorMessage('Failed to start playback');
                                setState('error');
                            });
                    }
                });

                hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
                    if (videoRef.current && !videoRef.current.paused && state !== 'playing') {
                        console.log('[HLS] Fragment loaded, setting state to playing');
                        setState('playing');
                    }
                });

                hls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.details === 'bufferStalledError') {
                        console.warn('[HLS] Buffer stalled (non-fatal, will recover)');
                        return;
                    }

                    if (data.fatal) {
                        console.error('[HLS] Fatal error:', {
                            type: data.type,
                            details: data.details,
                            fatal: data.fatal,
                            url: data.url,
                        });
                        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                            console.log('[HLS] Attempting to recover from network error...');
                            try {
                                hls.startLoad();
                                console.log('[HLS] Recovery started');
                            } catch (e) {
                                console.error('[HLS] Recovery failed:', e);
                                setErrorMessage('HLS network error - stream may not be ready yet');
                                setState('error');
                                hls.destroy();
                                hlsRef.current = null;
                            }
                        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                            console.log('[HLS] Attempting to recover from media error...');
                            try {
                                hls.recoverMediaError();
                                console.log('[HLS] Media error recovery started');
                            } catch (e) {
                                console.error('[HLS] Recovery failed:', e);
                                setErrorMessage('HLS media error');
                                setState('error');
                                hls.destroy();
                                hlsRef.current = null;
                            }
                        } else {
                            console.error('[HLS] Unrecoverable error:', data.details);
                            setErrorMessage(`HLS error: ${data.details || 'Playback failed'}`);
                            setState('error');
                            hls.destroy();
                            hlsRef.current = null;
                        }
                    } else {
                        console.warn('[HLS] Non-fatal error:', data.details);
                    }
                });

                // Load source
                console.log('[HLS] Loading HLS source and attaching to video element...');
                hls.loadSource(hlsUrl);
                hls.attachMedia(videoRef.current);
                console.log('[HLS] HLS source loaded and attached');

                return true;
            }
            // Fallback to native HLS (Safari)
            else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
                console.log('[HLS] Using native HLS support (Safari)');
                videoRef.current.src = hlsUrl;
                videoRef.current.load();
                await videoRef.current.play();
                console.log('[HLS] Native HLS playback started');
                setState('playing');
                return true;
            } else {
                console.error('[HLS] HLS not supported in this browser');
                throw new Error('HLS not supported in this browser');
            }
        } catch (error: any) {
            console.error('[HLS] Playback failed:', {
                error: error.message,
                stack: error.stack,
            });
            cleanup();
            return false;
        }
    }, [cleanup, state]);

    // Start stream
    const startStream = useCallback(async () => {
        console.log('[Stream] Starting stream for camera:', camera.id);


        await start();

        if (!data || !videoRef.current) {
            console.error('[Stream] Stream data or video element not available:', {
                hasData: !!data,
                hasVideoElement: !!videoRef.current,
            });
            setErrorMessage('Stream data not available');
            setState('error');
            return;
        }

        console.log('[Stream] Stream data available:', {
            hasWhepUrl: !!data.whepUrl,
            hasHlsUrl: !!data.hlsUrl,
            whepUrl: data.whepUrl,
            hlsUrl: data.hlsUrl,
        });

        cleanup();
        setErrorMessage(null);
        setState('loading');

        // Wait a moment for stream to start publishing (FFmpeg needs time to connect)
        console.log('[Stream] Waiting 2 seconds for FFmpeg to publish...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Try WebRTC (WHEP) first - best quality, low latency
        if (data.whepUrl) {
            console.log('[Stream] Attempting WebRTC (WHEP) connection...');
            const success = await startWebRTC(data.whepUrl);
            if (success) {
                console.log('[Stream] WebRTC connection successful, waiting for track...');
                return; // WebRTC connected, wait for track
            } else {
                console.warn('[Stream] WebRTC connection failed, falling back to HLS');
            }
        } else {
            console.log('[Stream] No WHEP URL available, skipping WebRTC');
        }

        // Fallback to HLS
        if (data.hlsUrl) {
            console.log('[Stream] Attempting HLS playback...');
            const success = await startHLS(data.hlsUrl);
            if (success) {
                console.log('[Stream] HLS playback started successfully');
                return;
            } else {
                console.error('[Stream] HLS playback failed');
            }
        } else {
            console.error('[Stream] No HLS URL available');
        }

        // All methods failed
        console.error('[Stream] All playback methods failed');
        setErrorMessage('Failed to start stream. Stream may not be ready yet. Please try again.');
        setState('error');
    }, [data, cleanup, startWebRTC, startHLS, camera.id, start]);
  

    // Auto-start playback when data is ready
    useEffect(() => {
        if (data && (data.whepUrl || data.hlsUrl) && state === 'idle') {
            console.log('[Stream] Auto-starting playback - data ready and state is idle');
            startStream();
        } else {
            console.log('[Stream] Not auto-starting playback:', {
                hasData: !!data,
                hasWhepUrl: !!data?.whepUrl,
                hasHlsUrl: !!data?.hlsUrl,
                state,
            });
        }
    }, [data, state, startStream]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    // Video event handlers
    const handleVideoPlay = useCallback(() => {
        if (state !== 'playing') {
            console.log('[Video] Play event triggered, setting state to playing');
            setState('playing');
        }
    }, [state]);

    const handleVideoError = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
        const video = e.currentTarget;
        const error = video.error;

        console.error('[Video] Video error event:', {
            errorCode: error?.code,
            errorMessage: error?.message,
            networkState: video.networkState,
            readyState: video.readyState,
            currentSrc: video.currentSrc,
        });

        if (error) {
            const errorMessages: Record<number, string> = {
                [error.MEDIA_ERR_ABORTED]: 'Video loading aborted',
                [error.MEDIA_ERR_NETWORK]: 'Network error',
                [error.MEDIA_ERR_DECODE]: 'Decoding error',
                [error.MEDIA_ERR_SRC_NOT_SUPPORTED]: 'Format not supported',
            };

            const message = errorMessages[error.code] || `Video error (${error.code})`;
            console.error('[Video] Error message:', message);

            setErrorMessage(message);
        } else {
            console.error('[Video] Unknown video error');
            setErrorMessage('Video playback error');
        }

        setState('error');
    }, [state]);

    return (
        <div className={cn('relative bg-black rounded-lg overflow-hidden shadow-lg', className)}>
            <video
                ref={videoRef}
                muted
                playsInline
                autoPlay
                preload="auto"
                className="w-full h-full object-contain min-h-[300px]"
                onPlay={handleVideoPlay}
                onPlaying={handleVideoPlay}
                onError={handleVideoError}
            />

            {/* State Overlay - Top Left */}
            <div className="absolute top-2 left-2 z-20">
                {state === 'playing' && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-green-500/90 backdrop-blur-sm rounded-md">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        <span className="text-xs font-medium text-white">LIVE</span>
                    </div>
                )}
                {state === 'loading' && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/90 backdrop-blur-sm rounded-md">
                        <Loader2 className="w-3 h-3 text-white animate-spin" />
                        <span className="text-xs font-medium text-white">CONNECTING</span>
                    </div>
                )}
                {state === 'error' && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-red-500/90 backdrop-blur-sm rounded-md">
                        <AlertCircle className="w-3 h-3 text-white" />
                        <span className="text-xs font-medium text-white">FAILED</span>
                    </div>
                )}
                {state === 'stopped' && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-gray-500/90 backdrop-blur-sm rounded-md">
                        <Square className="w-3 h-3 text-white" />
                        <span className="text-xs font-medium text-white">STOPPED</span>
                    </div>
                )}
            </div>

            {/* Loading Overlay - Full Screen */}
            {state === 'loading' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-foreground gap-3 z-10">
                    <Loader2 className="w-8 h-8 animate-spin text-background" />
                    <span className="text-sm text-foreground">Connecting to stream...</span>
                </div>
            )}

            {/* Error/Stopped Overlay - Full Screen */}
            {(state === 'error' || state === 'stopped') && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-foreground gap-4 p-4 z-10">
                    {errorMessage && (
                        <p className="text-sm text-center text-background">{errorMessage}</p>
                    )}
                </div>
            )}

            
            {/* Loading state from hook */}
            {isLoading && state === 'idle' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
            )}
        </div>
    );
}
