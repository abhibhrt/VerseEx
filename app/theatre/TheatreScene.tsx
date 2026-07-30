// components/theatre/TheatreScene.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import TheatreScreen from './TheatreScreen';
import TheatreSeats from './TheatreSeats';

interface TheatreSceneProps {
  isStarted: boolean;
  initialSeat?: [number, number, number];
}

export default function TheatreScene({ 
  isStarted, 
  initialSeat
}: TheatreSceneProps) {
  const [seated, setSeated] = useState(false);
  const [seatPos, setSeatPos] = useState<[number, number, number]>(initialSeat || [0, 0, 0]);
  const [autoSeated, setAutoSeated] = useState(false);
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setBlink(prev => !prev), 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSeated(false);
        setAutoSeated(false);
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
          controlsRef.current.minDistance = 2;
          controlsRef.current.maxDistance = 30;
          controlsRef.current.minAzimuthAngle = -Infinity;
          controlsRef.current.maxAzimuthAngle = Infinity;
          controlsRef.current.minPolarAngle = 0;
          controlsRef.current.maxPolarAngle = Math.PI;
          controlsRef.current.target.set(0, 3, -22);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    if (initialSeat) {
      setTimeout(() => {
        handleSeatClick(initialSeat);
        setAutoSeated(true);
      }, 800);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useFrame(() => {
    if (seated && controlsRef.current) {
      camera.position.set(seatPos[0], seatPos[1] + 0.9, seatPos[2] + 0.3);
      controlsRef.current.target.set(seatPos[0], 6.2, -22);
    }
  });

  const handleSeatClick = (position: [number, number, number]) => {
    setSeatPos(position);
    setSeated(true);
    if (controlsRef.current) {
      camera.position.set(position[0], position[1] + 0.9, position[2] + 0.3);
      controlsRef.current.target.set(position[0], 6.2, -22);
      
      controlsRef.current.enableZoom = false;
      controlsRef.current.enablePan = false;
      
      controlsRef.current.minAzimuthAngle = -0.5;
      controlsRef.current.maxAzimuthAngle = 0.5;
      controlsRef.current.minPolarAngle = Math.PI / 2 - 0.3;
      controlsRef.current.maxPolarAngle = Math.PI / 2 + 0.15;
    }
  };

  // Night vision camera component
  const NightVisionCamera = ({ x, delay }: { x: number; delay: boolean }) => (
    <group position={[x, 14, -24]}>
      <mesh>
        <cylinderGeometry args={[0.25, 0.3, 0.2, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.15]}>
        <circleGeometry args={[0.18, 16]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.3} metalness={0.9} />
      </mesh>
      <mesh position={[delay ? -0.15 : 0.15, 0.1, 0.18]}>
        <circleGeometry args={[0.04, 8]} />
        <meshStandardMaterial 
          color="#ff0000" 
          emissive="#ff0000" 
          emissiveIntensity={blink ? 2.0 : 0.1} 
        />
      </mesh>
      {blink && <pointLight position={[0.15, 0.1, 0.3]} intensity={0.3} color="#ff0000" distance={2} />}
    </group>
  );

  return (
    <>
      <color attach="background" args={['#0a0a0a']} />
      <fog attach="fog" args={['#0a0a0a', 25, 45]} />

      <OrbitControls
        ref={controlsRef}
        enablePan={!seated}
        enableZoom={!seated}
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={2}
        maxDistance={30}
        dampingFactor={0.05}
        rotateSpeed={0.3}
      />

      <ambientLight intensity={0.02} />
      <pointLight position={[0, 12, 5]} intensity={0.03} color="#ffd700" />
      <pointLight position={[8, 12, 5]} intensity={0.02} color="#ffd700" />
      <pointLight position={[-8, 12, 5]} intensity={0.02} color="#ffd700"/>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -10]} receiveShadow>
        <planeGeometry args={[24, 30]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.95} metalness={0.0} emissive="#0a0a0a" emissiveIntensity={0.2} />
      </mesh>

      <mesh position={[0, 7.5, -24.5]} receiveShadow>
        <planeGeometry args={[24, 15]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.9} metalness={0.1} />
      </mesh>

      <mesh position={[-12, 7.5, -12]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[34, 15]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh position={[12, 7.5, -12]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[34, 15]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.9} metalness={0.1} />
      </mesh>

      {Array.from({ length: 14 }).map((_, i) => (
        <mesh key={`panel-${i}`} position={[-18.5, 2 + i * 1.0, -5 - i * 1.2]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.8, 0.8]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.2} />
        </mesh>
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -8]}>
        <planeGeometry args={[3, 18]} />
        <meshStandardMaterial color="#1a0a0a" roughness={1} metalness={0} />
      </mesh>

      {Array.from({ length: 7 }).map((_, i) => (
        <pointLight key={`steplight-${i}`} position={[0, 0.2, -2 - i * 2.0]} intensity={0.02} color="#ff6600" distance={3} />
      ))}

      <TheatreScreen isStarted={isStarted} />
      <TheatreSeats onSeatClick={handleSeatClick} selectedSeat={autoSeated ? seatPos : undefined} />

      <NightVisionCamera x={-6} delay={false} />
      <NightVisionCamera x={6} delay={true} />

      <Environment preset="night" background={false} />
    </>
  );
}