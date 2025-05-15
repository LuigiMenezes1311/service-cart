interface V4LogoProps {
  variant?: "primary" | "simplified" | "icon-only"
  colorMode?: "light" | "dark"
  width?: number
  height?: number
  className?: string
}

export function V4Logo({
  variant = "primary",
  colorMode = "light",
  width = 180,
  height = 60,
  className = "",
}: V4LogoProps) {
  // Color schemes
  const colors = {
    light: {
      primary: "#e32438",
      secondary: "#0f172a",
      tertiary: "#94a3b8",
      background: "transparent",
    },
    dark: {
      primary: "#e32438",
      secondary: "#ffffff",
      tertiary: "#cbd5e1",
      background: "transparent",
    },
  }

  const currentColors = colors[colorMode]

  // Icon-only variant
  if (variant === "icon-only") {
    return (
      <svg
        width={height} // Make it square
        height={height}
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <rect width="60" height="60" rx="12" fill={currentColors.background} />
        <path
          d="M15 45L30 15L45 45"
          stroke={currentColors.primary}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M22 30L30 15L38 30"
          stroke={currentColors.secondary}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M30 15L30 45"
          stroke={currentColors.tertiary}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="2 6"
        />
        <path d="M20 38H40" stroke={currentColors.secondary} strokeWidth="3" strokeLinecap="round" />
      </svg>
    )
  }

  // Simplified variant
  if (variant === "simplified") {
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 180 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <rect width="180" height="60" rx="0" fill={currentColors.background} />
        <path
          d="M15 45L30 15L45 45"
          stroke={currentColors.primary}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M22 30L30 15L38 30"
          stroke={currentColors.secondary}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M60 30H65" stroke={currentColors.tertiary} strokeWidth="2" strokeLinecap="round" />
        <text
          x="70"
          y="35"
          fontFamily="Arial, sans-serif"
          fontSize="22"
          fontWeight="700"
          fill={currentColors.secondary}
        >
          COMPANY
        </text>
      </svg>
    )
  }

  // Primary (default) variant
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 180 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="180" height="60" rx="0" fill={currentColors.background} />
      <path
        d="M15 45L30 15L45 45"
        stroke={currentColors.primary}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 30L30 15L38 30"
        stroke={currentColors.secondary}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M30 15L30 45"
        stroke={currentColors.tertiary}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 6"
      />
      <path d="M20 38H40" stroke={currentColors.secondary} strokeWidth="3" strokeLinecap="round" />
      <text x="55" y="35" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="700" fill={currentColors.secondary}>
        v4
      </text>
      <path d="M60 40H80" stroke={currentColors.tertiary} strokeWidth="2" strokeLinecap="round" />
      <text x="85" y="35" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="700" fill={currentColors.secondary}>
        COMPANY
      </text>
    </svg>
  )
}

