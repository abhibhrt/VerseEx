// components/theatre/TheatreScreen.tsx
'use client';

import React from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface TheatreScreenProps {
  isStarted: boolean;
}

export default function TheatreScreen({
  isStarted,
}: TheatreScreenProps) {
  const videoId = '3_DQmfFjTlU';

  return (
    <group position={[0, 7.5, -24.5]}>
      {/* Screen */}
      <Html
        transform
        occlude
        position={[0, 0, 0.03]}
        rotation={[0, 0, 0]}
        distanceFactor={9.8}
        zIndexRange={[100, 0]}
      >
        <div
          style={{
            width: '940px',
            height: '380px',
            overflow: 'hidden',
            borderRadius: '4px',
            background: '#000',
            position: 'relative',
          }}
        >
          {isStarted ? (
            <div
              style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                pointerEvents: 'none',
              }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=0&disablekb=1&modestbranding=1&iv_load_policy=3&rel=0&playsinline=1&loop=1&playlist=${videoId}`}
                title="Cinema Screen"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
              />
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                background: '#000',
                fontSize: '26px',
                fontWeight: 600,
                fontFamily: 'sans-serif',
              }}
            >
              Click Start
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}