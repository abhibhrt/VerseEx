// components/theatre/TheatreSeats.tsx
'use client';

import React, { useState } from 'react';

interface TheatreSeatsProps {
  onSeatClick: (pos: [number, number, number]) => void;
  selectedSeat?: [number, number, number];
}

export default function TheatreSeats({ onSeatClick, selectedSeat }: TheatreSeatsProps) {
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);
  
  const rows = 7;
  const seatsPerRow = 18;
  const rowSpacing = 2.0;
  const seatSpacing = 0.85;
  const rowOffset = 0.4;

  const seatElements = [];

  for (let r = 0; r < rows; r++) {
    const isEvenRow = r % 2 === 0;
    const offsetX = isEvenRow ? 0 : rowOffset / 2;
    const rowZ = -2 - r * rowSpacing;
    
    for (let s = 0; s < seatsPerRow; s++) {
      const x = (s - seatsPerRow / 2 + 0.5) * seatSpacing + offsetX;
      const z = rowZ;
      const y = 0.1;
      const seatKey = `${r}-${s}`;
      const isHovered = hoveredSeat === seatKey;
      
      // Check if this is the selected seat
      const isSelected = selectedSeat && 
        Math.abs(selectedSeat[0] - x) < 0.01 && 
        Math.abs(selectedSeat[2] - z) < 0.01;

      const angleToScreen = Math.atan2(x, Math.abs(z + 15));

      seatElements.push(
        <group
          key={seatKey}
          position={[x, y, z]}
          rotation={[0, Math.PI + angleToScreen * 0.2, 0]}
          onClick={(e) => {
            e.stopPropagation();
            const headHeight = 2.2 + (r / rows) * 0.2;
            const backOffset = 0.5 + (r / rows) * 0.3;
            onSeatClick([x, y + headHeight, z + backOffset]);
          }}
          onPointerEnter={() => setHoveredSeat(seatKey)}
          onPointerLeave={() => setHoveredSeat(null)}
        >
          {/* Seat cushion - smaller for more seats */}
          <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.75, 0.12, 0.7]} />
            <meshStandardMaterial 
              color={isSelected ? "#ff0000" : isHovered ? "#cc0000" : "#6b0000"} 
              roughness={isSelected ? 0.3 : 0.5} 
              metalness={isSelected ? 0.3 : 0.1}
              emissive={isSelected ? "#ff0000" : "#000000"}
              emissiveIntensity={isSelected ? 0.3 : 0}
            />
          </mesh>

          {/* Seat bottom */}
          <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.7, 0.08, 0.65]} />
            <meshStandardMaterial 
              color={isSelected ? "#cc0000" : isHovered ? "#990000" : "#4a0000"} 
              roughness={0.7} 
            />
          </mesh>

          {/* Seat back - smaller */}
          <mesh position={[0, 0.8, -0.32]} rotation={[-0.1, 0, 0]} castShadow>
            <boxGeometry args={[0.7, 0.7, 0.12]} />
            <meshStandardMaterial 
              color={isSelected ? "#ff0000" : isHovered ? "#cc0000" : "#6b0000"} 
              roughness={isSelected ? 0.3 : 0.5} 
              metalness={isSelected ? 0.3 : 0.1}
              emissive={isSelected ? "#ff0000" : "#000000"}
              emissiveIntensity={isSelected ? 0.3 : 0}
            />
          </mesh>

          {/* Armrest left - smaller */}
          <mesh position={[-0.42, 0.45, -0.05]} castShadow>
            <boxGeometry args={[0.06, 0.25, 0.45]} />
            <meshStandardMaterial color="#3a0000" roughness={0.8} />
          </mesh>

          {/* Armrest right - smaller */}
          <mesh position={[0.42, 0.45, -0.05]} castShadow>
            <boxGeometry args={[0.06, 0.25, 0.45]} />
            <meshStandardMaterial color="#3a0000" roughness={0.8} />
          </mesh>

          {/* Cup holder - smaller */}
          <mesh position={[0.42, 0.7, 0.15]}>
            <cylinderGeometry args={[0.06, 0.05, 0.1, 8]} />
            <meshStandardMaterial color="#2a0000" roughness={0.9} metalness={0.2} />
          </mesh>

          {/* Headrest - smaller */}
          <mesh position={[0, 1.15, -0.38]} castShadow>
            <boxGeometry args={[0.5, 0.2, 0.08]} />
            <meshStandardMaterial 
              color={isSelected ? "#ff0000" : isHovered ? "#cc0000" : "#6b0000"} 
              roughness={isSelected ? 0.3 : 0.5}
              emissive={isSelected ? "#ff0000" : "#000000"}
              emissiveIntensity={isSelected ? 0.3 : 0}
            />
          </mesh>

          {/* Glow ring around selected seat */}
          {isSelected && (
            <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.5, 0.6, 32]} />
              <meshBasicMaterial color="#ff0000" transparent opacity={0.3} />
            </mesh>
          )}
        </group>
      );
    }
  }

  return (
    <group>
      {seatElements}
      
      {/* Center aisle glow - wider */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, -2.5]}>
        <planeGeometry args={[0.5, 15]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={0.1} transparent />
      </mesh>
    </group>
  );
}