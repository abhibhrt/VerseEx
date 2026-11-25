'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export interface MoonData {
  name: string;
  distance: number;
  size: number;
  color: string;
  speed: number;
  tilt?: number;
}

export interface CelestialData {
  name: string;
  wikiName: string;
  distance: number;
  size: number;
  color: string;
  speed: number;
  hasRing?: boolean;
  image: string;
  description: string;
  tilt?: number;
  rotationSpeed?: number;
  moons?: MoonData[];
}

export const celestialBodies: CelestialData[] = [
  {
    name: 'Sun',
    wikiName: 'Sun',
    distance: 0,
    size: 2.8,
    color: '#ffaa00',
    speed: 0,
    image: '',
    description: 'Loading from Wikipedia...',
    moons: [],
  },
  {
    name: 'Mercury',
    wikiName: 'Mercury_(planet)',
    distance: 4.5,
    size: 0.25,
    color: '#a5a5a5',
    speed: 1.6,
    image: '',
    description: 'Loading from Wikipedia...',
    tilt: 0.03,
    rotationSpeed: 0.005,
    moons: [],
  },
  {
    name: 'Venus',
    wikiName: 'Venus',
    distance: 7,
    size: 0.45,
    color: '#e8cda0',
    speed: 1.2,
    image: '',
    description: 'Loading from Wikipedia...',
    tilt: 2.64,
    rotationSpeed: 0.003,
    moons: [],
  },
  {
    name: 'Earth',
    wikiName: 'Earth',
    distance: 10,
    size: 0.5,
    color: '#4d9de0',
    speed: 1.0,
    image: '',
    description: 'Loading from Wikipedia...',
    tilt: 0.41,
    rotationSpeed: 0.02,
    moons: [
      { name: 'Moon', distance: 0.8, size: 0.13, color: '#b0b0b0', speed: 0.8, tilt: 0.09 },
    ],
  },
  {
    name: 'Mars',
    wikiName: 'Mars',
    distance: 13.5,
    size: 0.35,
    color: '#c1440e',
    speed: 0.8,
    image: '',
    description: 'Loading from Wikipedia...',
    tilt: 0.44,
    rotationSpeed: 0.019,
    moons: [
      { name: 'Phobos', distance: 0.5, size: 0.06, color: '#8a7a6a', speed: 2.5, tilt: 0.1 },
      { name: 'Deimos', distance: 0.7, size: 0.04, color: '#7a6a5a', speed: 1.8, tilt: 0.15 },
    ],
  },
  {
    name: 'Jupiter',
    wikiName: 'Jupiter',
    distance: 18.5,
    size: 1.4,
    color: '#d4a06a',
    speed: 0.5,
    image: '',
    description: 'Loading from Wikipedia...',
    tilt: 0.05,
    rotationSpeed: 0.04,
    moons: [
      { name: 'Io', distance: 1.8, size: 0.15, color: '#e8c86a', speed: 2.0, tilt: 0.04 },
      { name: 'Europa', distance: 2.2, size: 0.13, color: '#b0c8d0', speed: 1.7, tilt: 0.01 },
      { name: 'Ganymede', distance: 2.7, size: 0.18, color: '#a0a0a0', speed: 1.3, tilt: 0.02 },
      { name: 'Callisto', distance: 3.3, size: 0.16, color: '#6a6a6a', speed: 1.0, tilt: 0.03 },
    ],
  },
  {
    name: 'Saturn',
    wikiName: 'Saturn',
    distance: 24,
    size: 1.1,
    color: '#ead6b8',
    speed: 0.4,
    hasRing: true,
    image: '',
    description: 'Loading from Wikipedia...',
    tilt: 0.47,
    rotationSpeed: 0.038,
    moons: [
      { name: 'Titan', distance: 2.0, size: 0.2, color: '#d4a060', speed: 1.2, tilt: 0.03 },
      { name: 'Rhea', distance: 1.6, size: 0.12, color: '#a0a0a0', speed: 1.5, tilt: 0.02 },
      { name: 'Dione', distance: 1.3, size: 0.1, color: '#b0b0b0', speed: 1.8, tilt: 0.01 },
      { name: 'Tethys', distance: 1.1, size: 0.09, color: '#c0c0c0', speed: 2.1, tilt: 0.02 },
    ],
  },
  {
    name: 'Uranus',
    wikiName: 'Uranus',
    distance: 29.5,
    size: 0.9,
    color: '#7ec8e3',
    speed: 0.3,
    image: '',
    description: 'Loading from Wikipedia...',
    tilt: 1.71,
    rotationSpeed: 0.03,
    moons: [
      { name: 'Titania', distance: 1.5, size: 0.14, color: '#a0a0a0', speed: 1.5, tilt: 0.02 },
      { name: 'Oberon', distance: 1.8, size: 0.13, color: '#8a8a8a', speed: 1.2, tilt: 0.03 },
      { name: 'Umbriel', distance: 1.2, size: 0.1, color: '#6a6a6a', speed: 2.0, tilt: 0.01 },
      { name: 'Ariel', distance: 1.0, size: 0.11, color: '#b0b0b0', speed: 2.3, tilt: 0.02 },
    ],
  },
  {
    name: 'Neptune',
    wikiName: 'Neptune',
    distance: 34.5,
    size: 0.85,
    color: '#3b4cb0',
    speed: 0.2,
    image: '',
    description: 'Loading from Wikipedia...',
    tilt: 0.49,
    rotationSpeed: 0.032,
    moons: [
      { name: 'Triton', distance: 1.6, size: 0.18, color: '#c0c8d0', speed: 1.5, tilt: 2.2 },
      { name: 'Nereid', distance: 2.2, size: 0.08, color: '#8a8a8a', speed: 0.8, tilt: 0.5 },
      { name: 'Proteus', distance: 1.2, size: 0.1, color: '#7a7a7a', speed: 2.0, tilt: 0.1 },
    ],
  },
];

function createPlanetTexture(
  baseColor: string,
  type: 'gas' | 'rocky' | 'icy' = 'rocky',
  hasAtmosphere = false
) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const color = new THREE.Color(baseColor);

  const gradient = ctx.createRadialGradient(512, 256, 0, 512, 256, 512);
  gradient.addColorStop(0, color.clone().multiplyScalar(1.2).getStyle());
  gradient.addColorStop(0.5, color.getStyle());
  gradient.addColorStop(1, color.clone().multiplyScalar(0.7).getStyle());
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 512);

  if (type === 'gas') {
    for (let i = 0; i < 20; i++) {
      const y = Math.random() * 512;
      const height = 10 + Math.random() * 40;
      const opacity = 0.1 + Math.random() * 0.3;
      const bandColor = color.clone().multiplyScalar(0.8 + Math.random() * 0.4);
      ctx.fillStyle = bandColor.getStyle();
      ctx.globalAlpha = opacity;
      ctx.fillRect(0, y, 1024, height);
    }

    for (let i = 0; i < 15; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const radius = 10 + Math.random() * 50;
      const stormGrad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      stormGrad.addColorStop(0, 'rgba(255,255,255,0.3)');
      stormGrad.addColorStop(0.5, 'rgba(255,255,255,0.1)');
      stormGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = stormGrad;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
  } else if (type === 'icy') {
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const length = 20 + Math.random() * 80;
      const angle = Math.random() * Math.PI * 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1 + Math.random() * 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }
  } else {
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const radius = 3 + Math.random() * 15;
      const craterGrad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      craterGrad.addColorStop(0, 'rgba(0,0,0,0.2)');
      craterGrad.addColorStop(0.7, 'rgba(0,0,0,0.1)');
      craterGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = craterGrad;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const width = 10 + Math.random() * 30;
      const height = 5 + Math.random() * 20;
      const ridgeGrad = ctx.createLinearGradient(x, y, x, y - height);
      ridgeGrad.addColorStop(0, 'rgba(0,0,0,0)');
      ridgeGrad.addColorStop(0.5, 'rgba(0,0,0,0.15)');
      ridgeGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ridgeGrad;
      ctx.beginPath();
      ctx.moveTo(x - width / 2, y);
      ctx.quadraticCurveTo(x, y - height, x + width / 2, y);
      ctx.fill();
    }
  }

  if (hasAtmosphere) {
    const atmoGrad = ctx.createRadialGradient(512, 256, 200, 512, 256, 512);
    atmoGrad.addColorStop(0, 'rgba(100,180,255,0)');
    atmoGrad.addColorStop(0.7, 'rgba(100,180,255,0)');
    atmoGrad.addColorStop(1, 'rgba(100,180,255,0.2)');
    ctx.fillStyle = atmoGrad;
    ctx.fillRect(0, 0, 1024, 512);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  return texture;
}

function Moon({
  data,
  parentSize,
}: {
  data: MoonData;
  parentSize: number;
}) {
  const moonRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const elapsedTime = clock.getElapsedTime();
    if (moonRef.current) {
      const angle = elapsedTime * data.speed * 0.5;
      const distance = data.distance + parentSize * 0.5;
      moonRef.current.position.x = Math.cos(angle) * distance;
      moonRef.current.position.z = Math.sin(angle) * distance;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group ref={moonRef}>
      <mesh ref={meshRef} rotation={[data.tilt || 0, 0, 0]}>
        <sphereGeometry args={[data.size, 16, 16]} />
        <meshStandardMaterial color={data.color} roughness={0.8} metalness={0.1} />
      </mesh>
    </group>
  );
}

function RealisticPlanet({
  body,
  isSelected,
  onSelect,
}: {
  body: CelestialData;
  isSelected: boolean;
  onSelect: (body: CelestialData) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  const textures = useMemo(() => {
    let type: 'rocky' | 'gas' | 'icy' = 'rocky';
    let hasAtmosphere = false;

    if (body.name === 'Jupiter' || body.name === 'Saturn') {
      type = 'gas';
    } else if (body.name === 'Uranus' || body.name === 'Neptune') {
      type = 'icy';
    } else if (body.name === 'Earth') {
      hasAtmosphere = true;
    }

    const mainTexture = createPlanetTexture(body.color, type, hasAtmosphere);
    const cloudTexture = hasAtmosphere ? createPlanetTexture('#ffffff', 'gas') : null;

    return { mainTexture, cloudTexture };
  }, [body.color, body.name]);

  useFrame(({ clock }) => {
    const elapsedTime = clock.getElapsedTime();

    if (groupRef.current && body.distance > 0) {
      const orbitSpeed = body.speed * 0.3;
      groupRef.current.position.x = Math.cos(elapsedTime * orbitSpeed) * body.distance;
      groupRef.current.position.z = Math.sin(elapsedTime * orbitSpeed) * body.distance;
    }

    if (meshRef.current) {
      meshRef.current.rotation.y += body.rotationSpeed || 0.01;
    }

    if (cloudRef.current) {
      cloudRef.current.rotation.y += (body.rotationSpeed || 0.01) * 1.2;
    }
  });

  const isStar = body.distance === 0;
  const hasMoons = body.moons && body.moons.length > 0;

  return (
    <group>
      {body.distance > 0 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.distance - 0.05, body.distance + 0.05, 128]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.08} side={THREE.DoubleSide} />
        </mesh>
      )}

      <group ref={groupRef}>
        <group
          onClick={(e) => {
            e.stopPropagation();
            if (!isStar) onSelect(body);
          }}
        >
          <mesh ref={meshRef} rotation={[body.tilt || 0, 0, 0]}>
            <sphereGeometry args={[body.size, 48, 48]} />
            <meshStandardMaterial
              map={textures.mainTexture}
              roughness={isStar ? 0.4 : 0.7}
              metalness={isStar ? 0.8 : 0.1}
              emissive={isStar ? new THREE.Color('#ffaa00') : new THREE.Color('#000000')}
              emissiveIntensity={isStar ? 0.5 : 0}
            />
          </mesh>

          {textures.cloudTexture && (
            <mesh ref={cloudRef} rotation={[body.tilt || 0, 0, 0]} scale={1.01}>
              <sphereGeometry args={[body.size, 48, 48]} />
              <meshStandardMaterial
                map={textures.cloudTexture}
                transparent
                opacity={0.2}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          )}

          {(body.name === 'Earth' || body.name === 'Venus') && (
            <mesh ref={atmosphereRef} scale={1.05}>
              <sphereGeometry args={[body.size, 32, 32]} />
              <meshBasicMaterial
                color={body.name === 'Earth' ? '#4d9de0' : '#e8cda0'}
                transparent
                opacity={0.08}
                side={THREE.BackSide}
              />
            </mesh>
          )}

          {isStar && (
            <>
              <pointLight intensity={500} distance={120} color="#ffaa00" />
              <mesh scale={1.2}>
                <sphereGeometry args={[body.size, 32, 32]} />
                <meshBasicMaterial
                  color="#ffaa00"
                  transparent
                  opacity={0.1}
                  side={THREE.BackSide}
                />
              </mesh>
            </>
          )}

          {body.hasRing && (
            <mesh rotation={[Math.PI / 2.5, 0, 0]}>
              <ringGeometry args={[body.size * 1.3, body.size * 2.1, 128]} />
              <meshBasicMaterial
                color="#c8b89a"
                transparent
                opacity={0.6}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}

          {isSelected && !isStar && (
            <Html position={[0, body.size + 0.8, 0]} center distanceFactor={15}>
              <div className="flex flex-col items-center pointer-events-none select-none">
                <span className="bg-cyan-500 text-black text-[10px] font-extrabold px-2 py-0.5 rounded shadow-md uppercase tracking-wider whitespace-nowrap">
                  {body.name}
                </span>
                <div className="w-0.5 h-3 bg-cyan-400"></div>
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></div>
              </div>
            </Html>
          )}
        </group>

        {hasMoons && !isStar && (
          <group>
            {body.moons!.map((moon, index) => (
              <Moon key={index} data={moon} parentSize={body.size} />
            ))}
          </group>
        )}
      </group>
    </group>
  );
}

function AsteroidBelt() {
  const beltRef = useRef<THREE.Group>(null);
  const asteroidGeometry = useMemo(() => {
    const count = 8000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const innerRadius = 14.5;
    const outerRadius = 17.5;
    const height = 0.8;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const angle = Math.random() * Math.PI * 2;
      const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
      const y = (Math.random() - 0.5) * height;

      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = y;
      positions[i3 + 2] = Math.sin(angle) * radius;

      sizes[i] = 0.03 + Math.random() * 0.08;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geometry;
  }, []);

  useFrame(({ clock }) => {
    if (beltRef.current) {
      beltRef.current.rotation.y = clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <group ref={beltRef}>
      <points geometry={asteroidGeometry}>
        <pointsMaterial
          color="#8B7D6B"
          size={0.05}
          transparent
          opacity={0.4}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

export default function SolarSystemGroup({
  selectedBody,
  onSelect,
  isGalacticView,
}: {
  selectedBody: CelestialData | null;
  onSelect: (body: CelestialData) => void;
  isGalacticView: boolean;
}) {
  const systemRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (systemRef.current) {
      systemRef.current.visible = !isGalacticView;
    }
  });

  return (
    <group ref={systemRef}>
      {celestialBodies.map((body) => (
        <RealisticPlanet
          key={body.name}
          body={body}
          isSelected={selectedBody?.name === body.name}
          onSelect={onSelect}
        />
      ))}
      <AsteroidBelt />
    </group>
  );
}