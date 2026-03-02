export default function BrickLogo({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="BrickLayer logo"
    >
      {/* Studs */}
      <rect x="6" y="0" width="12" height="10" rx="3" fill="currentColor" />
      <rect x="24" y="0" width="12" height="10" rx="3" fill="currentColor" />
      <rect x="42" y="0" width="12" height="10" rx="3" fill="currentColor" />
      {/* Body */}
      <rect x="0" y="8" width="60" height="36" rx="4" fill="currentColor" />
      {/* Highlight */}
      <rect x="4" y="12" width="52" height="4" rx="2" fill="rgba(255,255,255,0.25)" />
    </svg>
  );
}
