export default function FishHookIcon({
  size = 44,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* HOOK */}
      <path
        d="M36 6
           C36 6, 30 6, 30 14
           C30 22, 44 24, 44 36
           C44 48, 30 56, 18 48
           C10 42, 12 32, 22 28"
        stroke="currentColor"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* FISH (bigger + raised) */}
      <g transform="translate(18 30) scale(1.25)">
        <path
          d="M4 4
             C10 0, 18 2, 22 8
             C18 14, 10 16, 4 12
             L0 16
             L1 8
             L0 0
             Z"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          strokeLinejoin="round"
        />

        {/* Eye */}
        <circle cx="15" cy="7" r="1.2" fill="currentColor" />
      </g>
    </svg>
  );
}
