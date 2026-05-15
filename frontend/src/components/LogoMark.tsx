type LogoMarkProps = {
  className?: string
  variant?: 'dark' | 'light'
}

export function LogoMark({ className = '', variant = 'dark' }: LogoMarkProps) {
  const stroke = variant === 'light' ? '#ffffff' : '#0a0a0a'
  const fill = variant === 'light' ? '#ffffff' : '#0a0a0a'

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect x="4" y="4" width="18" height="18" stroke={stroke} strokeWidth="2.5" fill="none" />
      <rect x="26" y="4" width="18" height="18" stroke={stroke} strokeWidth="2.5" fill="none" />
      <rect x="4" y="26" width="18" height="18" stroke={stroke} strokeWidth="2.5" fill="none" />
      <rect x="26" y="26" width="18" height="18" stroke={stroke} strokeWidth="2.5" fill={fill} />
      <path
        d="M22 13h4v22h-4zM13 22h22v4H13z"
        stroke={stroke}
        strokeWidth="2"
        opacity="0.35"
      />
    </svg>
  )
}
