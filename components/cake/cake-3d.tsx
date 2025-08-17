'use client';

import { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import { a, useSpring } from '@react-spring/three';
import * as THREE from 'three';

const slices = [
  { slug: 'planning', color: 'var(--planning)' },
  { slug: 'flavors', color: 'var(--flavors)' },
  { slug: 'ingredients', color: 'var(--ingredients)' },
  { slug: 'review', color: 'var(--review)' },
  { slug: 'people', color: 'var(--people)' },
  { slug: 'visibility', color: 'var(--visibility)' },
];

function usePrefersReducedMotion() {
  const [prefers, setPrefers] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listener = () => setPrefers(media.matches);
    listener();
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);
  return prefers;
}

interface WedgeProps {
  geometry: THREE.CylinderGeometry;
  color: string;
  dir: [number, number, number];
  active: boolean;
  id: string;
  reduced: boolean;
}

function Wedge({ geometry, color, dir, active, id, reduced }: WedgeProps) {
  const distance = reduced ? 0.12 : 0.32;
  const scale = reduced ? 1.02 : 1.06;
  const { position, scale: s } = useSpring({
    position: active ? dir.map((d) => d * distance) : [0, 0, 0],
    scale: active ? scale : 1,
    config: reduced
      ? { tension: 200, friction: 25 }
      : { mass: 1, tension: 240, friction: 16 },
  });

  return (
    <a.mesh
      id={id}
      geometry={geometry}
      castShadow
      receiveShadow
      position={position as any}
      scale={s as any}
      material-color={color}
      material-metalness={0.05}
      material-roughness={0.6}
    />
  );
}

function CakeSVG({
  activeSlug,
  userId,
  reduced,
}: {
  activeSlug: string | null;
  userId: string | number;
  reduced: boolean;
}) {
  const radius = 100;
  const gap = 0.04;
  const step = (Math.PI * 2) / 6;
  return (
    <svg
      viewBox="-110 -110 220 220"
      className="h-64 w-64"
      aria-hidden="true"
      data-active-slice={activeSlug ?? 'none'}
    >
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
        </filter>
      </defs>
      {slices.map((slice, i) => {
        const thetaStart = i * step;
        const thetaLength = step - gap;
        const mid = thetaStart + thetaLength / 2;
        const x1 = radius * Math.cos(thetaStart);
        const y1 = radius * Math.sin(thetaStart);
        const x2 = radius * Math.cos(thetaStart + thetaLength);
        const y2 = radius * Math.sin(thetaStart + thetaLength);
        const large = thetaLength > Math.PI ? 1 : 0;
        const d = `M0 0 L${x1} ${y1} A${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
        const dir = [Math.cos(mid), Math.sin(mid)];
        const amp = reduced ? 8 : 20;
        const translate =
          activeSlug === slice.slug
            ? `translate(${dir[0] * amp}, ${dir[1] * amp})`
            : '';
        return (
          <path
            key={slice.slug}
            id={`cak3seg-${slice.slug}-${userId}`}
            d={d}
            fill={slice.color}
            transform={translate}
            filter={activeSlug === slice.slug ? 'url(#shadow)' : undefined}
            style={{ transition: 'transform 0.25s ease-out' }}
          />
        );
      })}
    </svg>
  );
}

interface Cake3DProps {
  activeSlug: string | null;
  userId: string | number;
}

export function Cake3D({ activeSlug, userId }: Cake3DProps) {
  const [webgl, setWebgl] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl =
        canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setWebgl(!!gl);
    } catch {
      setWebgl(false);
    }
  }, []);

  const radius = 1.5;
  const height = 0.36;
  const gap = 0.03;
  const step = (Math.PI * 2) / 6;

  const wedges = useMemo(() => {
    return slices.map((slice, i) => {
      const thetaStart = i * step;
      const thetaLength = step - gap;
      const mid = thetaStart + thetaLength / 2;
      const geometry = new THREE.CylinderGeometry(
        radius,
        radius,
        height,
        64,
        1,
        false,
        thetaStart,
        thetaLength,
      );
      const dir: [number, number, number] = [Math.cos(mid), 0, Math.sin(mid)];
      return { ...slice, geometry, dir };
    });
  }, [gap, height, radius, step]);

  if (!webgl) {
    return (
      <CakeSVG activeSlug={activeSlug} userId={userId} reduced={reduced} />
    );
  }

  return (
    <Canvas
      className="h-64 w-64 pointer-events-none"
      shadows
      camera={{ position: [0, 2.5, 4], fov: 40 }}
      data-active-slice={activeSlug ?? 'none'}
    >
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <group rotation={[-0.28, 0, 0]}>
        {wedges.map((w) => (
          <Wedge
            key={w.slug}
            id={`cak3seg-${w.slug}-${userId}`}
            geometry={w.geometry}
            color={w.color}
            dir={w.dir}
            active={activeSlug === w.slug}
            reduced={reduced}
          />
        ))}
      </group>
      <ContactShadows
        position={[0, -height / 2, 0]}
        opacity={0.4}
        scale={4}
        blur={2}
        far={2}
      />
      <OrbitControls enabled={false} />
    </Canvas>
  );
}
