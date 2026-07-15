type IconProps = {
  className?: string;
};

export function PeopleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M16 19a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3" />
      <circle cx="10" cy="8" r="3" />
      <path d="M19 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M17 14a2 2 0 0 0-2 2" />
    </svg>
  );
}

export function SchoolIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M4 10 12 5l8 5-8 5-8-5Z" />
      <path d="M8 12v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4" />
      <path d="M20 10v7" />
    </svg>
  );
}

export function MenuBookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M6 4h8a3 3 0 0 1 3 3v12H9a3 3 0 0 0-3 3" />
      <path d="M5 4h9a2 2 0 0 1 2 2v13" />
      <path d="M8 8h6" />
      <path d="M8 12h5" />
    </svg>
  );
}

export function TrendingUpIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="m3 17 5-5 3 3 7-8" />
      <path d="m14 7 7 0 0 7" />
    </svg>
  );
}

export function SparkIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="m12 2 1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2Z" />
    </svg>
  );
}
