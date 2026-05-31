import React from "react";

const Spinner = () => (
  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
    <path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" opacity="0.75" />
  </svg>
);

const variantStyles = {
  primary: {
    background: "linear-gradient(135deg, #00C8FF 0%, #0077FF 100%)",
    color: "#FFFFFF",
    border: "none",
    boxShadow: "0 4px 16px rgba(0, 200, 255, 0.3)",
    hover: {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 30px rgba(0, 200, 255, 0.5)",
    },
  },
  secondary: {
    background: "transparent",
    color: "#00C8FF",
    border: "1px solid #00C8FF",
    boxShadow: "none",
    hover: {
      transform: "translateY(-2px)",
      background: "rgba(0, 200, 255, 0.08)",
    },
  },
  danger: {
    background: "rgba(255, 77, 109, 0.1)",
    color: "#FF4D6D",
    border: "1px solid rgba(255, 77, 109, 0.3)",
    boxShadow: "none",
    hover: {
      transform: "translateY(-2px)",
      background: "rgba(255, 77, 109, 0.2)",
    },
  },
};

const sizeStyles = {
  sm: { padding: "8px 20px", fontSize: "0.8rem" },
  md: { padding: "14px 32px", fontSize: "0.9rem" },
  lg: { padding: "16px 36px", fontSize: "1rem" },
};

const Button = ({ children, isLoading, type = "button", onClick, variant = "primary", size = "md", fullWidth, style }) => {
  const v = variantStyles[variant] || variantStyles.primary;
  const s = sizeStyles[size] || sizeStyles.md;

  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <button
      type={type}
      disabled={isLoading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 600,
        borderRadius: "9999px",
        cursor: isLoading ? "not-allowed" : "pointer",
        transition: "all 0.25s ease",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        width: fullWidth ? "100%" : "auto",
        ...s,
        ...v,
        ...(isHovered ? v.hover : {}),
        ...(isLoading ? { opacity: 0.55, cursor: "not-allowed", transform: "none", boxShadow: "none" } : {}),
        ...style,
      }}
    >
      {isLoading && <Spinner />}
      {isLoading ? "Chargement..." : children}
    </button>
  );
};

export default Button;
