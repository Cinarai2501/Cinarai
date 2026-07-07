'use client';

export interface ShapeOverlayProps {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  color?: string;
  visible?: boolean;
  /** PoC: override color based on evaluation result */
  correct?: boolean | null;
}

/** Maps a selected answer text to overlay dimensions + color. Pure lookup, no evaluation. */
export interface ShapeConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
}

const SHAPE_CONFIGS: Record<string, ShapeConfig> = {
  kubus:  { x: 100, y: 60,  width: 180, height: 180, rotation: 0,  color: '#6366f1' },
  balok:  { x: 80,  y: 80,  width: 240, height: 150, rotation: 0,  color: '#0ea5e9' },
  limas:  { x: 110, y: 50,  width: 200, height: 200, rotation: 0,  color: '#f59e0b' },
  kerucut:{ x: 120, y: 55,  width: 160, height: 200, rotation: 0,  color: '#ef4444' },
  prisma: { x: 90,  y: 70,  width: 220, height: 170, rotation: 15, color: '#10b981' },
};

/** Returns the ShapeConfig for the given answer text, or null if no match. */
export function shapeConfigFromText(text: string | null | undefined): ShapeConfig | null {
  if (!text) return null;
  const key = text.toLowerCase();
  for (const [shape, config] of Object.entries(SHAPE_CONFIGS)) {
    if (key.includes(shape)) return config;
  }
  return null;
}

export default function ShapeOverlay({
  x,
  y,
  width,
  height,
  rotation = 0,
  color = '#6366f1',
  visible = true,
  correct = null,
}: ShapeOverlayProps) {
  if (!visible) return null;

  const resolvedColor =
    correct === true  ? '#22c55e' :
    correct === false ? '#ef4444' :
    color;

  const cx = x + width / 2;
  const cy = y + height / 2;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="poc-overlay-enter"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}
      width="100%"
      height="100%"
      aria-hidden="true"
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="none"
        stroke={resolvedColor}
        strokeWidth={3}
        strokeDasharray="8 4"
        transform={`rotate(${rotation}, ${cx}, ${cy})`}
        rx={4}
        style={{ transition: 'stroke 0.4s ease' }}
      />
    </svg>
  );
}
