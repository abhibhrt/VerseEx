// components/theatre/TheatreScreen.tsx
'use client';

import React, { useEffect, useState } from 'react';
import * as THREE from 'three';

interface TheatreScreenProps {
  texture: THREE.VideoTexture | null;
}

export default function TheatreScreen({ texture }: TheatreScreenProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!texture || !texture.image) return;

    const video = texture.image as HTMLVideoElement;

    // Configure texture properties for sharp video playback
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;

    const checkVideoState = () => {
      if (video.readyState >= 2) {
        setIsReady(true);
        texture.needsUpdate = true;
        // Force play just in case it's waiting for data
        video.play().catch(() => {
          // Handles browser autoplay policies silently until user interaction
        });
      } else {
        requestAnimationFrame(checkVideoState);
      }
    };

    checkVideoState();

    const handleCanPlay = () => {
      setIsReady(true);
      texture.needsUpdate = true;
      video.play().catch(() => {});
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleCanPlay);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleCanPlay);
    };
  }, [texture]);

  // Continuously update texture frames if video is playing
  useEffect(() => {
    if (!texture || !texture.image) return;
    const video = texture.image as HTMLVideoElement;

    let animationFrameId: number;
    const updateTexture = () => {
      if (video.readyState >= 2 && !video.paused && !video.ended) {
        texture.needsUpdate = true;
      }
      animationFrameId = requestAnimationFrame(updateTexture);
    };

    animationFrameId = requestAnimationFrame(updateTexture);
    return () => cancelAnimationFrame(animationFrameId);
  }, [texture]);

  return (
    <group position={[0, 6.5, -22]}>
      {/* Main screen frame */}
      <mesh position={[0, 0, -0.4]}>
        <boxGeometry args={[25, 11.5, 0.6]} />
        <meshStandardMaterial 
          color="#0a0a0a" 
          roughness={0.3} 
          metalness={0.8}
          emissive="#111111"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Inner frame detail */}
      <mesh position={[0, 0, -0.35]}>
        <boxGeometry args={[21.2, 10.7, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Screen surface - Displays video texture immediately when available */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[23.5, 9.5]} />
        <meshBasicMaterial
          map={texture}
          color={texture ? '#ffffff' : '#2a2a4a'}
          toneMapped={false}
        />
      </mesh>

      {/* Subtle dark vignette overlay for cinema feel */}
      <mesh position={[0, 0, 0.05]}>
        <planeGeometry args={[23.5, 9.5]} />
        <meshBasicMaterial 
          color="#000000" 
          transparent 
          opacity={0.3}
        />
      </mesh>

      {/* Decorative curtains */}
      <mesh position={[-12.2, 0, 0.2]}>
        <planeGeometry args={[0.2, 10.5]} />
        <meshStandardMaterial color="#ac0000" roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh position={[12.2, 0, 0.2]}>
        <planeGeometry args={[0.2, 10.5]} />
        <meshStandardMaterial color="#ac0000" roughness={0.9} metalness={0.1} />
      </mesh>
      
      {/* Curtain top */}
      <mesh position={[0, 5.2, 0.2]}>
        <planeGeometry args={[24.3, 0.2]} />
        <meshStandardMaterial color="#ac0000" roughness={0.9} metalness={0.1} />
      </mesh>
    </group>
  );
}