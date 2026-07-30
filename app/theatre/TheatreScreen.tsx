// components/theatre/TheatreScreen.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface TheatreScreenProps {
  isStarted: boolean;
  streamUrl?: string;
  roomId?: string;
}

export default function TheatreScreen({ 
  isStarted, 
  streamUrl = 'wss://screen-share-stream.onrender.com/ws',
  roomId = ''
}: TheatreScreenProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);

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
      if (wsRef.current) {
        wsRef.current.close();
      }
      texture.dispose();
    };
  }, [streamUrl, roomId]);

  const connectToStream = async (url: string, roomId: string) => {
    if (isConnecting) return;
    setIsConnecting(true);
    setConnectionError(null);

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
        if (event.candidate && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'signal',
            signal: { type: 'ice-candidate', candidate: event.candidate }
          }));
        }
      };

      // Create WebSocket connection
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ Connected to signaling server');
        // Join room with provided ID
        ws.send(JSON.stringify({
          type: 'join-room',
          roomId: roomId,
          username: 'Cinema Viewer'
        }));
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnecting(false);
        setConnectionError('WebSocket error');
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        setIsConnecting(false);
        if (!isStreamReady) {
          setConnectionError('Connection closed');
        }
        // Try to reconnect after 3 seconds
        setTimeout(() => {
          if (!isStreamReady && !connectionError) {
            connectToStream(url, roomId);
          }
        }, 3000);
      };

      ws.onmessage = async (message) => {
        try {
          const data = JSON.parse(message.data);
          
          switch (data.type) {
            case 'room-joined':
              console.log(`✅ Joined room: ${data.roomId}`);
              console.log(`👁️ Viewers: ${data.viewerCount}`);
              await createOffer();
              break;

            case 'broadcaster-ready':
              console.log('📡 Broadcaster is ready');
              await createOffer();
              break;

            case 'signal':
              await handleSignal(data.signal);
              break;

            case 'viewer-count':
              console.log(`👁️ Viewers: ${data.count}`);
              break;

            case 'broadcaster-disconnected':
              console.warn('Broadcaster disconnected');
              setIsStreamReady(false);
              setConnectionError('Broadcaster disconnected');
              if (videoRef.current) {
                videoRef.current.srcObject = null;
              }
              // Try to reconnect
              setTimeout(() => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  createOffer();
                }
              }, 3000);
              break;

            case 'error':
              console.error('Server error:', data.message);
              setConnectionError(data.message);
              setIsConnecting(false);
              if (data.message.includes('Room not found')) {
                console.error(`❌ Room ${roomId} not found`);
              }
              break;

            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      };

      const createOffer = async () => {
        try {
          if (!peerConnectionRef.current) return;
          
          console.log('Creating offer...');
          const offer = await peerConnectionRef.current.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
          });
          await peerConnectionRef.current.setLocalDescription(offer);

          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'signal',
              signal: offer
            }));
            console.log('✅ Offer sent');
          }
        } catch (err) {
          console.error('Error creating offer:', err);
          setConnectionError('Failed to create connection');
        }
      };

      // Store createOffer function for later use
      (window as any).createOffer = createOffer;

    } catch (error) {
      console.error('Error connecting to stream:', error);
      setIsConnecting(false);
      setConnectionError('Connection failed');
    }
  };

  const handleSignal = async (signal: any) => {
    try {
      if (!peerConnectionRef.current) return;

      if (signal.type === 'offer') {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(signal)
        );
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'signal',
            signal: answer
          }));
        }
      } else if (signal.type === 'answer') {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(signal)
        );
        console.log('✅ Connection established with broadcaster');
      } else if (signal.type === 'ice-candidate' && signal.candidate) {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(signal.candidate)
        );
      }
    } catch (error) {
      console.error('Error handling signal:', error);
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