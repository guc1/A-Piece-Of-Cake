'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Text, useCursor } from '@react-three/drei';
import { slices } from './slices';

interface Cake3DProps {
  activeSlug: string | null;
  userId: string | number;
  onSelect?: (slug: string) => void;
}

interface SliceData {
  slug: string;
  color: string;
  thetaStart: number;
  thetaLength: number;
  midAngle: number;
  dir: THREE.Vector3;
  href: string;
}

export function Cake3D({ activeSlug, userId, onSelect }: Cake3DProps) {
  const [reduced, setReduced] = useState(false);
  const [textColor, setTextColor] = useState('#000');

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReduced(media.matches);
    handler();
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const update = () => {
      const color = getComputedStyle(document.documentElement)
        .getPropertyValue('--text')
        .trim();
      if (color) setTextColor(color);
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    });
    return () => observer.disconnect();
  }, []);

  const sliceData = useMemo<SliceData[]>(() => {
    const theta = (Math.PI * 2) / slices.length;
    return slices.map((s, i) => {
      const thetaStart = i * theta;
      const thetaLength = theta;
      const midAngle = thetaStart + thetaLength / 2;
      const dir = new THREE.Vector3(Math.cos(midAngle), 0, Math.sin(midAngle));
      return {
        slug: s.slug,
        color: s.color,
        thetaStart,
        thetaLength,
        midAngle,
        dir,
        href: s.href,
      };
    });
  }, []);

  const distance = reduced ? 0.6 : 2;
  const scaleActive = reduced ? 1.02 : 1.06;
  const radius = 1;
  const height = 0.4;

  return (
    <div className="w-full max-w-[min(80vw,60vh)] aspect-square">
      <Canvas
        data-active-slice={activeSlug ?? 'none'}
        camera={{ fov: 40, position: [0, 1.6, 3.2] }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 5, 5]} intensity={0.4} />
        <group rotation-x={-0.28} scale={1.3}>
          {sliceData.map((slice) => (
            <SliceMesh
              key={slice.slug}
              data={slice}
              active={activeSlug === slice.slug}
              distance={distance}
              scaleActive={scaleActive}
              radius={radius}
              height={height}
              onSelect={onSelect}
              userId={userId}
              textColor={textColor}
            />
          ))}
        </group>
        <ContactShadows
          position={[0, -height / 2 - 0.05, 0]}
          scale={5}
          blur={2}
          opacity={0.4}
        />
      </Canvas>
    </div>
  );
}

interface SliceMeshProps {
  data: SliceData;
  active: boolean;
  distance: number;
  scaleActive: number;
  radius: number;
  height: number;
  onSelect?: (slug: string) => void;
  userId: string | number;
  textColor: string;
}

function SliceMesh({
  data,
  active,
  distance,
  scaleActive,
  radius,
  height,
  onSelect,
  userId,
  textColor,
}: SliceMeshProps) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  const target = useRef(new THREE.Vector3());
  const scaleV = useRef(new THREE.Vector3(1, 1, 1));

  useFrame(() => {
    if (!group.current) return;
    const out = data.dir.clone().multiplyScalar(active ? distance : 0);
    target.current.lerp(out, 0.1);
    group.current.position.copy(target.current);
    const s = active ? scaleActive : 1;
    scaleV.current.lerp(new THREE.Vector3(s, s, s), 0.1);
    group.current.scale.copy(scaleV.current);
  });

  const fontSize = radius * 0.18;
  const labelPos = data.dir.clone().multiplyScalar(radius * 0.72);
  labelPos.y = height / 2 + 0.02;
  const strokeColor = textColor.toLowerCase() === '#fff' ? '#000' : '#fff';
  const handleSelect = () => onSelect?.(data.slug);

  return (
    <group ref={group} id={`cak3seg-${data.slug}-${userId}`}>
      <mesh>
        <cylinderGeometry
          args={[
            radius,
            radius,
            height,
            64,
            1,
            false,
            data.thetaStart,
            data.thetaLength,
          ]}
        />
        <meshStandardMaterial color={data.color} />
      </mesh>
      <Text
        id={`cak3lbl-${data.slug}-${userId}`}
        billboard
        position={[labelPos.x, labelPos.y, labelPos.z]}
        fontSize={fontSize}
        maxWidth={radius}
        color={textColor}
        strokeColor={strokeColor}
        strokeWidth={0.8}
        strokeOpacity={0.25}
        anchorX="center"
        anchorY="middle"
      >
        {data.slug.charAt(0).toUpperCase() + data.slug.slice(1)}
      </Text>
      <mesh
        position={[0, height / 2 + 0.01, 0]}
        onClick={handleSelect}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleSelect();
        }}
      >
        <cylinderGeometry
          args={[
            radius,
            radius,
            0.02,
            64,
            1,
            false,
            data.thetaStart,
            data.thetaLength,
          ]}
        />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}
