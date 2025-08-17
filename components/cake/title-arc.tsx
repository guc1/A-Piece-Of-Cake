'use client';

import { useEffect, useState } from 'react';

interface TitleArcProps {
  reduced: boolean;
}

export function TitleArc({ reduced }: TitleArcProps) {
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(reduced);

  useEffect(() => {
    const resize = () => setWidth(window.innerWidth);
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    if (!reduced) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setVisible(true);
  }, [reduced]);

  if (!width) return null;

  const radius = Math.min(width * 0.34, 360);
  const sweep = 220;
  const startAngle = ((90 + sweep / 2) * Math.PI) / 180; // degrees to rad
  const endAngle = ((90 - sweep / 2) * Math.PI) / 180;
  const cx = width / 2;
  const cy = radius;
  const startX = cx + radius * Math.cos(startAngle);
  const startY = cy + radius * Math.sin(startAngle);
  const endX = cx + radius * Math.cos(endAngle);
  const endY = cy + radius * Math.sin(endAngle);
  const d = `M ${startX} ${startY} A ${radius} ${radius} 0 1 1 ${endX} ${endY}`;

  return (
    <svg
      width={width}
      height={radius}
      viewBox={`0 0 ${width} ${radius}`}
      style={{
        opacity: visible ? 1 : 0,
        transition: reduced ? undefined : 'opacity 220ms ease-out',
      }}
      aria-hidden="true"
    >
      <path id="cak3titlePath" d={d} fill="none" />
      <text
        id="cak3titleArc"
        fill="var(--text)"
        className="tracking-[0.04em]"
        style={{ fontSize: 'clamp(24px,4vh,42px)' }}
      >
        <textPath href="#cak3titlePath" startOffset="50%" textAnchor="middle">
          A Piece Of Cake
        </textPath>
      </text>
    </svg>
  );
}
