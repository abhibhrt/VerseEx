'webgpu';
'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';

interface CelestialData {
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

interface MoonData {
  name: string;
  distance: number;
  size: number;
  color: string;
  speed: number;
  tilt?: number;
}

const celestialBodies: CelestialData[] = [
  {
    name: 'Sun',
    wikiName: 'Sun',
    distance: 0,
    size: 2.8,
    color: '#ffaa00',
    speed: 0,
    image: '',
    description: 'Loading from Wikipedia...',
    moons: []
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
    moons: []
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
    moons: []
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
      { name: 'Moon', distance: 0.8, size: 0.13, color: '#b0b0b0', speed: 0.8, tilt: 0.09 }
    ]
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
      { name: 'Deimos', distance: 0.7, size: 0.04, color: '#7a6a5a', speed: 1.8, tilt: 0.15 }
    ]
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
      { name: 'Callisto', distance: 3.3, size: 0.16, color: '#6a6a6a', speed: 1.0, tilt: 0.03 }
    ]
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
      { name: 'Tethys', distance: 1.1, size: 0.09, color: '#c0c0c0', speed: 2.1, tilt: 0.02 }
    ]
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
      { name: 'Ariel', distance: 1.0, size: 0.11, color: '#b0b0b0', speed: 2.3, tilt: 0.02 }
    ]
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
      { name: 'Proteus', distance: 1.2, size: 0.1, color: '#7a7a7a', speed: 2.0, tilt: 0.1 }
    ]
  },
];

// Enhanced planet texture generation with realistic features
function createPlanetTexture(baseColor: string, type: 'gas' | 'rocky' | 'icy' = 'rocky', hasAtmosphere = false) {
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
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
      gradient.addColorStop(0.5, 'rgba(255,255,255,0.1)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
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
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, 'rgba(0,0,0,0.2)');
      gradient.addColorStop(0.7, 'rgba(0,0,0,0.1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const width = 10 + Math.random() * 30;
      const height = 5 + Math.random() * 20;
      const gradient = ctx.createLinearGradient(x, y, x, y - height);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(0.5, 'rgba(0,0,0,0.15)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(x - width / 2, y);
      ctx.quadraticCurveTo(x, y - height, x + width / 2, y);
      ctx.fill();
    }
  }

  if (hasAtmosphere) {
    const gradient = ctx.createRadialGradient(512, 256, 200, 512, 256, 512);
    gradient.addColorStop(0, 'rgba(100,180,255,0)');
    gradient.addColorStop(0.7, 'rgba(100,180,255,0)');
    gradient.addColorStop(1, 'rgba(100,180,255,0.2)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 512);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  return texture;
}

// Moon component
function Moon({
  data,
  parentSize,
  planetPosition
}: {
  data: MoonData;
  parentSize: number;
  planetPosition: { x: number; z: number };
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
    <group ref={moonRef} position={[planetPosition.x, 0, planetPosition.z]}>
      <mesh ref={meshRef} rotation={[data.tilt || 0, 0, 0]}>
        <sphereGeometry args={[data.size, 16, 16]} />
        <meshStandardMaterial
          color={data.color}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}

// Realistic galaxy with proper spiral arms and dust
function RealisticSpiralGalaxy({ isGalacticView }: { isGalacticView: boolean }) {
  const galaxyRef = useRef<THREE.Group>(null);

  const [starGeometry] = useState(() => {
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

      const temp = Math.random();
      let color: THREE.Color;
      if (r < 10) {
        color = new THREE.Color().setHSL(0.08 + Math.random() * 0.05, 0.8, 0.6 + Math.random() * 0.3);
      } else if (r < 25) {
        color = new THREE.Color().setHSL(0.6 + Math.random() * 0.1, 0.3, 0.7 + Math.random() * 0.3);
      } else {
        color = new THREE.Color().setHSL(0.65 + Math.random() * 0.15, 0.5, 0.5 + Math.random() * 0.3);
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
  });

  const [dustGeometry] = useState(() => {
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
  });

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

// Enhanced planet with realistic textures and features
function RealisticPlanet({
  body,
  isSelected,
  onSelect
}: {
  body: CelestialData;
  isSelected: boolean;
  onSelect: (body: CelestialData) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const moonGroupRef = useRef<THREE.Group>(null);

  // Track planet position for moons
  const [planetPosition, setPlanetPosition] = useState({ x: 0, z: 0 });

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
      const x = Math.cos(elapsedTime * orbitSpeed) * body.distance;
      const z = Math.sin(elapsedTime * orbitSpeed) * body.distance;
      groupRef.current.position.x = x;
      groupRef.current.position.z = z;

      // Update planet position for moons
      setPlanetPosition({ x, z });
    }

    if (meshRef.current) {
      meshRef.current.rotation.y += (body.rotationSpeed || 0.01);
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
          {/* Main planet */}
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

          {/* Clouds */}
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

          {/* Atmosphere glow */}
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

          {/* Sun glow */}
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

          {/* Saturn rings */}
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

          {/* Selection indicator */}
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

        {/* Moons */}
        {hasMoons && !isStar && (
          <group ref={moonGroupRef}>
            {body.moons!.map((moon, index) => (
              <Moon
                key={index}
                data={moon}
                parentSize={body.size}
                planetPosition={planetPosition}
              />
            ))}
          </group>
        )}
      </group>
    </group>
  );
}

// Asteroid belt between Mars and Jupiter
function AsteroidBelt() {
  const beltRef = useRef<THREE.Group>(null);
  const [asteroidGeometry] = useState(() => {
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
  });

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

// Solar System group
function SolarSystemGroup({
  selectedBody,
  onSelect,
  isGalacticView
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

export default function SolarSystemApp() {
  const [selectedBody, setSelectedBody] = useState<CelestialData | null>(null);
  const [isGalacticView, setIsGalacticView] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedBody) return;

    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${selectedBody.wikiName}`)
      .then((res) => res.json())
      .then((data) => {
        setSelectedBody((prev) => {
          if (!prev || prev.name !== selectedBody.name) return prev;
          return {
            ...prev,
            image: data.originalimage?.source || data.thumbnail?.source || '',
            description: data.extract || 'No information available from Wikipedia.',
          };
        });
      })
      .catch((err) => console.error('Wikipedia fetch error:', err));
  }, [selectedBody?.name]);

  // Count total moons for display
  const totalMoons = celestialBodies.reduce((acc, body) => acc + (body.moons?.length || 0), 0);

  return (
    <div className="relative w-full h-screen bg-[#020204] text-white font-sans overflow-hidden select-none">

      {/* Wikipedia info panel */}
      {selectedBody && (
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-40 w-[calc(100vw-32px)] sm:w-80 max-h-[calc(100vh-120px)] overflow-y-auto bg-black/85 backdrop-blur-2xl border border-white/15 p-4 md:p-5 rounded-2xl shadow-2xl flex flex-col gap-3.5 mt-20">
          <div className="w-full h-32 md:h-40 rounded-xl overflow-hidden border border-white/10 relative bg-black/50">
            {selectedBody.image ? (
              <img
                src={selectedBody.image}
                alt={selectedBody.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-white/40">
                Loading Wikipedia Image...
              </div>
            )}
          </div>

          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <h2 className="text-lg md:text-xl font-bold text-cyan-400">{selectedBody.name}</h2>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30 uppercase tracking-widest font-semibold">
              Wikipedia
            </span>
          </div>

          {selectedBody.moons && selectedBody.moons.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-[10px] text-white/50">Moons:</span>
              {selectedBody.moons.map((moon, idx) => (
                <span key={idx} className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-white/70">
                  {moon.name}
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-white/80 leading-relaxed">
            {selectedBody.description}
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 px-3 py-2 rounded-2xl flex items-center gap-2 shadow-2xl overflow-x-auto max-w-[95vw] bg-black/30 backdrop-blur-sm border border-white/5">
        <button
          onClick={() => setSelectedBody(null)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${selectedBody === null ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
            }`}
        >
          Clear
        </button>

        {celestialBodies.map((body) => (
          <button
            key={body.name}
            onClick={() => {
              setIsGalacticView(false);
              setSelectedBody(body);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${selectedBody?.name === body.name && !isGalacticView
                ? 'bg-cyan-500 text-black'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
          >
            {body.name}
            {body.moons && body.moons.length > 0 && (
              <span className="ml-1 text-[8px] opacity-50">({body.moons.length})</span>
            )}
          </button>
        ))}

        <div className="w-[1px] h-5 bg-white/20 mx-1"></div>

        <button
          onClick={() => {
            setIsGalacticView(!isGalacticView);
            setSelectedBody(null);
          }}
          className="relative w-14 h-6 rounded-full transition-colors duration-300 cursor-pointer flex-shrink-0"
          style={{
            backgroundColor: isGalacticView ? '#a855f7' : 'rgba(168, 85, 247, 0.2)',
            border: isGalacticView ? 'none' : '1px solid rgba(168, 85, 247, 0.3)'
          }}
        >
          <span
            className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-md"
            style={{
              transform: isGalacticView ? 'translateX(30px)' : 'translateX(0)'
            }}
          />
        </button>
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{
          position: [0, isGalacticView ? 60 : 20, isGalacticView ? 90 : 35],
          fov: 50
        }}
        className="w-full h-full"
        gl={{
          antialias: true,
          powerPreference: "high-performance"
        }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 10]} intensity={0.5} />

        <RealisticSpiralGalaxy isGalacticView={isGalacticView} />

        <SolarSystemGroup
          selectedBody={selectedBody}
          onSelect={setSelectedBody}
          isGalacticView={isGalacticView}
        />

        <Stars
          radius={300}
          depth={100}
          count={20000}
          factor={4}
          saturation={0}
          fade
          speed={0.5}
        />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxDistance={isGalacticView ? 300 : 80}
          minDistance={isGalacticView ? 20 : 3}
          autoRotate={false}
          autoRotateSpeed={0.3}
        />
      </Canvas>
    </div>
  );
}