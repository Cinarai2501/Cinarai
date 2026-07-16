import Image from 'next/image';

export type AppLogoVariant = 'login' | 'splash' | 'header' | 'drawer';

interface AppLogoProps {
  variant?: AppLogoVariant;
  className?: string;
  alt?: string;
  priority?: boolean;
}

const variantConfig: Record<AppLogoVariant, { width: number; height: number; className: string }> = {
  login: {
    width: 260,
    height: 260,
    className: 'h-auto w-[clamp(190px,68vw,260px)] max-w-[78vw] object-contain',
  },
  splash: {
    width: 220,
    height: 220,
    className: 'h-auto w-[clamp(180px,60vw,220px)] max-w-[70vw] object-contain',
  },
  header: {
    width: 140,
    height: 140,
    className: 'h-[48px] w-auto object-contain',
  },
  drawer: {
    width: 160,
    height: 160,
    className: 'h-[96px] w-[96px] object-contain',
  },
};

export function AppLogo({
  variant = 'login',
  className,
  alt = 'CINARAI',
  priority = false,
}: AppLogoProps) {
  const config = variantConfig[variant];

  return (
    <Image
      src="/images/logo/logo.png"
      alt={alt}
      width={config.width}
      height={config.height}
      priority={priority}
      quality={100}
      sizes="(max-width: 640px) 70vw, (max-width: 1024px) 220px, 220px"
      className={[config.className, className].filter(Boolean).join(' ')}
    />
  );
}
