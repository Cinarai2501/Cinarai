"use client";

import Image from 'next/image';
import clsx from 'clsx';

interface RobotMascotProps {
  variant?: 'desktop' | 'mobile' | 'fab' | 'inline';
  className?: string;
  isThinking?: boolean;
  isTyping?: boolean;
}

export default function RobotMascot({ variant = 'desktop', className, isThinking = false, isTyping = false }: RobotMascotProps) {
  const size = variant === 'fab' || variant === 'desktop' ? 64 : variant === 'mobile' ? 40 : 24;
  const base = 'rounded-full overflow-hidden bg-white shadow-md';

  const anim = clsx(
    'transition-transform duration-200 ease-out',
    'hover:scale-105',
    'ai-float',
    isThinking && 'ai-thinking',
    isTyping && 'ai-typing-glow',
  );

  return (
    <div className={clsx(base, anim, className)} style={{ width: size, height: size }}>
      <Image
        src="/images/ai/RobotAI.png"
        alt=""
        width={size}
        height={size}
        className="h-full w-full object-cover"
        onError={(e) => {
          const target = e.currentTarget;
          if (target.src !== '/images/ai/RobotAI.png') {
            target.src = '/images/ai/RobotAI.png';
          }
        }}
      />
    </div>
  );
}
