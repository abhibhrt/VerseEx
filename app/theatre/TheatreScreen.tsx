// components/theatre/TheatreScreen.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { io, Socket } from 'socket.io-client';

interface TheatreScreenProps {
  isStarted: boolean;
  streamUrl?: string;
  roomId?: string;
}

export default function TheatreScreen({ 
  isStarted, 
  streamUrl = 'https://sturdy-goggles-1bnx.onrender.com',
  roomId = ''
}: TheatreScreenProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);
  const roomIdRef = useRef<string>(roomId);

  useEffect(() => {
    // Create video element
    const video = document.createElement('video');
    video.autoplay = false;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.volume = 0.7;
    video.muted = false;
    video.loop = true;
    videoRef.current = video;

    // Create video texture
    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;
    setVideoTexture(texture);

    // Connect to stream if roomId is provided
    if (streamUrl && roomId) {
      connectToStream(streamUrl, roomId);
    } else {
      setConnectionError('No room ID provided');
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current.src = '';
        videoRef.current.load();
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      texture.dispose();
    };
  }, []);

  const connectToStream = async (url: string, roomId: string) => {
    if (isConnecting) return;
    setIsConnecting(true);
    setConnectionError(null);
    roomIdRef.current = roomId;

    try {
      // Create WebRTC peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      });
      peerConnectionRef.current = pc;

      // Handle incoming stream
      pc.ontrack = (event) => {
        console.log('Received track:', event.track.kind);
        if (videoRef.current && event.streams.length > 0) {
          videoRef.current.srcObject = event.streams[0];
          setIsStreamReady(true);
          setIsConnecting(false);
          setConnectionError(null);
          
          if (isStarted) {
            videoRef.current.play().catch(err => {
              console.warn('Play error:', err);
              setTimeout(() => {
                if (videoRef.current) {
                  videoRef.current.play().catch(() => {});
                }
              }, 500);
            });
          }
        }
      };

      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        console.log('ICE connection state:', state);
        if (state === 'connected') {
          console.log('✅ Stream connected successfully!');
          setIsStreamReady(true);
          setIsConnecting(false);
          setConnectionError(null);
        } else if (state === 'failed') {
          console.warn('ICE connection failed');
          setIsConnecting(false);
          setConnectionError('Connection failed');
        } else if (state === 'disconnected') {
          console.warn('ICE disconnected');
          setIsConnecting(false);
          setConnectionError('Disconnected');
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('ice-candidate', roomId, event.candidate);
        }
      };

      // Create Socket.IO connection
      const socket = io(url, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ Connected to signaling server');
        // Join room as watcher
        socket.emit('watcher', roomId);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnecting(false);
        setConnectionError('Connection error');
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnecting(false);
        if (!isStreamReady) {
          setConnectionError('Disconnected');
        }
      });

      // Handle broadcaster found
      socket.on('broadcaster-found', (broadcasterId) => {
        console.log('📡 Broadcaster found:', broadcasterId);
        createOffer();
      });

      // Handle no broadcaster
      socket.on('no-broadcaster', () => {
        console.warn('❌ No broadcaster found for room:', roomId);
        setIsConnecting(false);
        setConnectionError('No broadcaster available');
        // Retry after 3 seconds
        setTimeout(() => {
          if (socketRef.current && roomIdRef.current) {
            socketRef.current.emit('watcher', roomIdRef.current);
          }
        }, 3000);
      });

      // Handle WebRTC signaling
      socket.on('offer', async (id, sdp) => {
        console.log('📨 Received offer from:', id);
        try {
          if (!peerConnectionRef.current) return;
          
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(sdp)
          );
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          
          if (socketRef.current) {
            socketRef.current.emit('answer', id, answer);
            console.log('✅ Answer sent');
          }
        } catch (error) {
          console.error('Error handling offer:', error);
        }
      });

      socket.on('answer', async (id, sdp) => {
        console.log('📨 Received answer from:', id);
        try {
          if (!peerConnectionRef.current) return;
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(sdp)
          );
          console.log('✅ Connection established');
        } catch (error) {
          console.error('Error handling answer:', error);
        }
      });

      socket.on('ice-candidate', async (id, candidate) => {
        try {
          if (!peerConnectionRef.current) return;
          if (candidate) {
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          }
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      });

      socket.on('broadcaster-disconnected', () => {
        console.warn('📡 Broadcaster disconnected');
        setIsStreamReady(false);
        setConnectionError('Broadcaster disconnected');
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        // Try to reconnect
        setTimeout(() => {
          if (socketRef.current && roomIdRef.current) {
            socketRef.current.emit('watcher', roomIdRef.current);
          }
        }, 3000);
      });

      socket.on('room-participants', (count) => {
        console.log(`👥 Participants: ${count}`);
      });

      // Store createOffer function
      const createOffer = async () => {
        try {
          if (!peerConnectionRef.current) return;
          
          console.log('Creating offer...');
          const offer = await peerConnectionRef.current.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
          });
          await peerConnectionRef.current.setLocalDescription(offer);

          if (socketRef.current && roomIdRef.current) {
            socketRef.current.emit('offer', roomIdRef.current, offer);
            console.log('✅ Offer sent');
          }
        } catch (err) {
          console.error('Error creating offer:', err);
          setConnectionError('Failed to create connection');
        }
      };

      // Expose createOffer globally for reconnection
      (window as any).createOffer = createOffer;

      // Initial connection
      socket.emit('watcher', roomId);

    } catch (error) {
      console.error('Error connecting to stream:', error);
      setIsConnecting(false);
      setConnectionError('Connection failed');
    }
  };

  // Handle roomId changes
  useEffect(() => {
    if (roomId && roomId !== roomIdRef.current) {
      // Reconnect with new room ID
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      setIsStreamReady(false);
      setIsConnecting(false);
      setConnectionError(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      connectToStream(streamUrl, roomId);
    }
  }, [roomId]);

  // Handle play/pause based on isStarted
  useEffect(() => {
    if (!videoRef.current) return;

    const playVideo = async () => {
      try {
        if (isStarted && videoRef.current) {
          if (videoRef.current.srcObject || videoRef.current.src) {
            await videoRef.current.play();
          }
        }
      } catch (err) {
        console.warn('Error playing video:', err);
        if (isStarted) {
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.play().catch(() => {});
            }
          }, 1000);
        }
      }
    };

    if (isStarted) {
      playVideo();
    } else {
      videoRef.current.pause();
    }
  }, [isStarted]);

  return (
    <group position={[0, 7.5, -23.5]}>
      {/* Screen Frame - Outer border */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[21, 10, 0.5]} />
        <meshStandardMaterial 
          color="#795d02" 
          roughness={0.7} 
          metalness={0.4}
          emissive="#0a0a0a"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Screen Surface - The actual screen */}
      <mesh position={[0, 0, 0.28]}>
        <planeGeometry args={[20.5, 9.5]} />
        {videoTexture && (isStreamReady || isStarted) ? (
          <meshBasicMaterial map={videoTexture} />
        ) : (
          <meshStandardMaterial 
            color="#050505"
            emissive="#0a0a0a"
            emissiveIntensity={0.05}
            roughness={0.3}
            metalness={0.1}
          />
        )}
      </mesh>

      {/* Loading/Error overlay on screen */}
      {(isConnecting || connectionError) && !isStreamReady && (
        <mesh position={[0, 0, 0.29]}>
          <planeGeometry args={[19, 8]} />
          <meshBasicMaterial 
            color="#000000" 
            transparent 
            opacity={0.8}
          />
        </mesh>
      )}

      {/* Screen Glow - Subtle light bleed effect */}
      <mesh position={[0, 0, 0.26]}>
        <planeGeometry args={[19.8, 7.8]} />
        <meshBasicMaterial 
          color="#1a0a0a" 
          transparent 
          opacity={isStarted ? 0.08 : 0.03}
        />
      </mesh>

      {/* Screen dark overlay for cinema feel */}
      <mesh position={[0, 0, 0.28]}>
        <planeGeometry args={[21, 10]} />
        <meshBasicMaterial 
          color="#000000" 
          transparent 
          opacity={0.1}
        />
      </mesh>

      {/* Screen border glow - top */}
      <mesh position={[0, 5.05, 0.15]} rotation={[0.1, 0, 0]}>
        <planeGeometry args={[20, 0.5]} />
        <meshBasicMaterial 
          color="#ffd700" 
          transparent 
          opacity={isStreamReady ? 0.05 : 0.02}
        />
      </mesh>

      {/* Screen border glow - bottom */}
      <mesh position={[0, -5.05, 0.15]} rotation={[-0.1, 0, 0]}>
        <planeGeometry args={[20, 0.5]} />
        <meshBasicMaterial 
          color="#ffd700" 
          transparent 
          opacity={isStreamReady ? 0.05 : 0.02}
        />
      </mesh>
    </group>
  );
}