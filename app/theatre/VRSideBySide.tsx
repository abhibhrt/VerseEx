// components/theatre/VRSideBySide.tsx
'use client';

import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface VRSideBySideProps {
  children: React.ReactNode;
  enabled?: boolean;
  ipd?: number; // Interpupillary distance (eye separation)
}

export default function VRSideBySide({ children, enabled = true, ipd = 0.064 }: VRSideBySideProps) {
  const { camera, gl, scene } = useThree();
  
  // Create refs for left and right cameras to maintain their own matrices
  const leftCameraRef = useRef(new THREE.PerspectiveCamera());
  const rightCameraRef = useRef(new THREE.PerspectiveCamera());

  useFrame(() => {
    if (!enabled) return;

    // Sync base camera properties (FOV, near, far, position, rotation)
    const aspect = (window.innerWidth / 2) / window.innerHeight;
    
    leftCameraRef.current.fov = (camera as THREE.PerspectiveCamera).fov;
    leftCameraRef.current.near = (camera as THREE.PerspectiveCamera).near;
    leftCameraRef.current.far = (camera as THREE.PerspectiveCamera).far;
    leftCameraRef.current.aspect = aspect;
    leftCameraRef.current.updateProjectionMatrix();

    rightCameraRef.current.fov = (camera as THREE.PerspectiveCamera).fov;
    rightCameraRef.current.near = (camera as THREE.PerspectiveCamera).near;
    rightCameraRef.current.far = (camera as THREE.PerspectiveCamera).far;
    rightCameraRef.current.aspect = aspect;
    rightCameraRef.current.updateProjectionMatrix();

    // Position cameras relative to main camera with an offset for left/right eyes (IPD)
    const halfIPD = ipd / 2;
    
    // Get camera right vector for horizontal offset
    const rightVector = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

    leftCameraRef.current.position.copy(camera.position).addScaledVector(rightVector, -halfIPD);
    leftCameraRef.current.quaternion.copy(camera.quaternion);

    rightCameraRef.current.position.copy(camera.position).addScaledVector(rightVector, halfIPD);
    rightCameraRef.current.quaternion.copy(camera.quaternion);

    // Disable default auto-rendering of the canvas
    gl.autoClear = false;
    gl.clear();

    const width = window.innerWidth;
    const height = window.innerHeight;
    const halfWidth = Math.floor(width / 2);

    // Render Left Eye (Left half of the screen)
    gl.setViewport(0, 0, halfWidth, height);
    gl.setScissor(0, 0, halfWidth, height);
    gl.setScissorTest(true);
    gl.render(scene, leftCameraRef.current);

    // Render Right Eye (Right half of the screen)
    gl.setViewport(halfWidth, 0, width - halfWidth, height);
    gl.setScissor(halfWidth, 0, width - halfWidth, height);
    gl.setScissorTest(true);
    gl.render(scene, rightCameraRef.current);

    // Reset scissor test and viewport
    gl.setScissorTest(false);
    gl.setViewport(0, 0, width, height);
  }, 1); // Priority 1 runs before default render

  return <>{children}</>;
}