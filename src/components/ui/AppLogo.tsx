import Image from 'next/image';

export type AppLogoVariant = 'login' | 'splash' | 'header' | 'drawer';

interface AppLogoProps {
  variant?: AppLogoVariant;
  className?: string;
  alt?: string;
  priority?: boolean;
}

const variantConfig: Record<AppLogoVariant, { width: number; height: number; className: string; sizes: string }> = {
  login: {
    width: 220,
    height: 220,
    className: 'h-auto w-[clamp(160px,54vw,220px)] max-w-[60vw] object-contain',
    sizes: '(max-width: 640px) 60vw, 220px',
  },
  splash: {
    width: 220,
    height: 220,
    className: 'h-auto w-[clamp(180px,60vw,220px)] max-w-[70vw] object-contain',
    sizes: '(max-width: 640px) 70vw, 220px',
  },
  header: {
    width: 140,
    height: 140,
    className: 'h-[48px] w-auto max-w-[140px] object-contain',
    sizes: '140px',
  },
  drawer: {
    width: 140,
    height: 140,
    className: 'h-[96px] w-[96px] max-w-[96px] object-contain',
    sizes: '96px',
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
      sizes={config.sizes}
      className={[config.className, 'rounded-none', className].filter(Boolean).join(' ')}
    />
  );
}
