'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export default function RealisticSpiralGalaxy({
  isGalacticView,
}: {
  isGalacticView: boolean;
}) {
  const galaxyRef = useRef<THREE.Group>(null);

  const starGeometry = useMemo(() => {
    const count = 80000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const armCount = 4;
      const armIndex = Math.floor(Math.random() * armCount);
      const armAngle = (armIndex / armCount) * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.7) * 55;
      const pitch = 0.25;
      const scatterAmount = 0.3 + (r / 55) * 0.5;
      const scatter = (Math.random() - 0.5) * scatterAmount * 2;
      const angle = r * pitch + armAngle + scatter;
      const heightScale = 0.03 + (1 - r / 55) * 0.07;
      const y = (Math.random() - 0.5) * heightScale * r;

      positions[i3] = Math.cos(angle) * r;
      positions[i3 + 1] = y;
      positions[i3 + 2] = Math.sin(angle) * r;

      let color: THREE.Color;
      if (r < 10) {
        color = new THREE.Color().setHSL(
          0.08 + Math.random() * 0.05,
          0.8,
          0.6 + Math.random() * 0.3
        );
      } else if (r < 25) {
        color = new THREE.Color().setHSL(
          0.6 + Math.random() * 0.1,
          0.3,
          0.7 + Math.random() * 0.3
        );
      } else {
        color = new THREE.Color().setHSL(
          0.65 + Math.random() * 0.15,
          0.5,
          0.5 + Math.random() * 0.3
        );
      }

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      sizes[i] = 0.1 + Math.random() * 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geometry;
  }, []);

  const dustGeometry = useMemo(() => {
    const count = 20000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = Math.random() * 50;
      const angle = r * 0.2 + Math.random() * 0.5;
      const y = (Math.random() - 0.5) * 1.5;

      positions[i3] = Math.cos(angle) * r;
      positions[i3 + 1] = y;
      positions[i3 + 2] = Math.sin(angle) * r;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  useFrame(({ clock }) => {
    if (galaxyRef.current) {
      galaxyRef.current.rotation.y = clock.getElapsedTime() * 0.005;
    }
  });

  if (!isGalacticView) return null;

  return (
    <group ref={galaxyRef}>
      <pointLight position={[0, 0, 0]} intensity={1000} distance={80} color="#ffcc88" />

      <points geometry={starGeometry}>
        <pointsMaterial
          size={0.15}
          vertexColors
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      <points geometry={dustGeometry}>
        <pointsMaterial
          size={0.5}
          color="#8B7355"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 4, 64]} />
        <meshBasicMaterial color="#ff8844" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      <group position={[28, 0.5, 12]}>
        <Html center distanceFactor={25}>
          <div className="flex flex-col items-center pointer-events-none select-none">
            <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-[0_0_15px_#f59e0b] uppercase tracking-widest whitespace-nowrap border border-white/40">
              ☀️ Solar System
            </span>
          </div>
        </Html>
      </group>
    </group>
  );
}