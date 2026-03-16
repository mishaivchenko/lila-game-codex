interface CanvaWingAccentProps {
  className?: string;
}

export const CanvaWingAccent = ({ className }: CanvaWingAccentProps) => (
  <svg
    aria-hidden="true"
    className={className}
    viewBox="0 0 280 176"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M24 114C72 102 107 77 132 26C156 77 191 102 256 114"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      opacity="0.5"
    />
    <path
      d="M52 126C94 113 120 96 132 48C145 96 171 113 228 126"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      opacity="0.3"
    />
    <path
      d="M8 146C56 145 90 129 112 98"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.18"
    />
    <path
      d="M272 146C224 145 190 129 168 98"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.18"
    />
    <circle cx="132" cy="26" r="7" fill="currentColor" opacity="0.18" />
    <circle cx="28" cy="114" r="4" fill="currentColor" opacity="0.14" />
    <circle cx="256" cy="114" r="4" fill="currentColor" opacity="0.14" />
    <circle cx="82" cy="126" r="3" fill="currentColor" opacity="0.12" />
    <circle cx="182" cy="126" r="3" fill="currentColor" opacity="0.12" />
  </svg>
);
