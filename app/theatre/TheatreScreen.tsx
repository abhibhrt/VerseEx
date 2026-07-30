// components/theatre/TheatreScreen.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface TheatreScreenProps {
  isStarted: boolean;
}

export default function TheatreScreen({ isStarted }: TheatreScreenProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Create video element on mount
    const video = document.createElement('video');
    video.src = 'https://lorem.video/720p';
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    videoRef.current = video;

    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
    };
  }, []);

  useEffect(() => {
    if (isStarted && videoRef.current) {
      videoRef.current.play().catch(console.error);
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
        {isStarted && videoRef.current ? (
          <meshBasicMaterial>
            <videoTexture 
              attach="map" 
              args={[videoRef.current]} 
            />
          </meshBasicMaterial>
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

      {/* Screen Glow - Subtle light bleed effect */}
      <mesh position={[0, 0, 0.26]}>
        <planeGeometry args={[19.8, 7.8]} />
        <meshBasicMaterial 
          color="#1a0a0a" 
          transparent 
          opacity={isStarted ? 0.08 : 0.03}
        />
      </mesh>

      <mesh position={[0, 0, 0.28]}>
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