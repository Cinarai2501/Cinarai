"use client";

import Image from 'next/image';
import clsx from 'clsx';

interface RobotMascotProps {
  variant?: 'desktop' | 'mobile' | 'fab' | 'inline';
  className?: string;
  alt?: string;
  isThinking?: boolean;
  isTyping?: boolean;
}

export default function RobotMascot({ variant = 'desktop', className, alt = 'AI Tutor', isThinking = false, isTyping = false }: RobotMascotProps) {
  const size = variant === 'fab' ? 64 : variant === 'mobile' ? 40 : variant === 'inline' ? 24 : 48;
  const base = 'rounded-full overflow-hidden';

  const anim = clsx(
    'transition-transform duration-200 ease-out',
    'hover:scale-105',
    'ai-float',
    isThinking && 'ai-thinking',
    isTyping && 'ai-typing-glow',
  );

  return (
    <div className={clsx(base, anim, className)} style={{ width: size, height: size }}>
      <Image src="/images/ai/RobotAI.png" alt={alt} width={size} height={size} priority={false} />
    </div>
  );
}
