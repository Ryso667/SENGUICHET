import React from "react";

const statusConfig = {
  success: { label: "Succès", bg: "rgba(0, 229, 160, 0.15)", color: "#00E5A0" },
  pending: { label: "En attente", bg: "rgba(255, 179, 71, 0.15)", color: "#FFB347" },
  error: { label: "Erreur", bg: "rgba(255, 77, 109, 0.15)", color: "#FF4D6D" },
  scanned: { label: "Scanné", bg: "rgba(0, 200, 255, 0.15)", color: "#00C8FF" },
};

const Badge = ({ status = "pending", label, style }) => {
  const cfg = statusConfig[status] || statusConfig.pending;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.375rem",
        padding: "4px 12px",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        background: cfg.bg,
        color: cfg.color,
        ...style,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: cfg.color,
          flexShrink: 0,
        }}
      />
      {label || cfg.label}
    </span>
  );
};

export default Badge;
