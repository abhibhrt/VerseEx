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

  useEffect(() => {
    // Create video element
    const video = document.createElement('video');
    video.autoplay = true;
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
  }, [streamUrl, roomId]);

  const connectToStream = (url: string, roomCode: string) => {
    if (isConnecting) return;
    setIsConnecting(true);
    setConnectionError(null);

    try {
      // Clean up URL for Socket.IO (convert wss:// to https:// if needed)
      const cleanedUrl = url.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://');

      // Initialize Socket.IO connection matching your backend setup
      const socket = io(cleanedUrl, {
        transports: ['websocket', 'polling']
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ Connected to Socket.IO signaling server:', socket.id);
        // Emit watcher event just like your working client.js code
        socket.emit('watcher', roomCode);
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setIsConnecting(false);
        setConnectionError('Connection failed');
      });

      socket.on('no-broadcaster', () => {
        console.warn('No broadcaster found for room:', roomCode);
        setConnectionError('No broadcaster found');
        setIsConnecting(false);
      });

      socket.on('broadcaster-disconnected', () => {
        console.warn('Broadcaster disconnected');
        setIsStreamReady(false);
        setConnectionError('Broadcaster disconnected');
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
        }
      });

      // STUN configuration
      const pcConfig = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };

      // Handle incoming WebRTC Offer from Broadcaster (matching your working client.js logic)
      socket.on('offer', async (id: string, desc: RTCSessionDescriptionInit) => {
        try {
          if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
          }

          const pc = new RTCPeerConnection(pcConfig);
          peerConnectionRef.current = pc;

          pc.ontrack = (event) => {
            console.log('🎥 Received remote track:', event.track.kind);
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

          pc.onicecandidate = (e) => {
            if (e.candidate && socketRef.current) {
              socketRef.current.emit('ice-candidate', id, e.candidate);
            }
          };

          await pc.setRemoteDescription(new RTCSessionDescription(desc));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          socket.emit('answer', id, pc.localDescription);
          console.log('✅ Answer sent to broadcaster');
        } catch (err) {
          console.error('Error handling offer:', err);
        }
      });

      socket.on('ice-candidate', async (id: string, candidate: RTCIceCandidateInit) => {
        try {
          if (peerConnectionRef.current && candidate) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          }
        } catch (err) {
          console.error('Error adding received ice candidate', err);
        }
      });

    } catch (error) {
      console.error('Error connecting to stream:', error);
      setIsConnecting(false);
      setConnectionError('Connection failed');
    }
  };

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
    <group position={[0, 8, -28.5]}>
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
      <mesh position={[0, 0, 0.285]}>
        <planeGeometry args={[21, 10]} />
        <meshBasicMaterial 
          color="#000000" 
          transparent 
          opacity={0.1}
        />
      </mesh>
    </group>
  );
}