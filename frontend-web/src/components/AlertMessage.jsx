import React, { useState } from "react";

const icons = {
  success: "✓",
  error: "✗",
  warning: "⚡",
};

const colors = {
  success: { bg: "rgba(0, 229, 160, 0.1)", border: "rgba(0, 229, 160, 0.25)", color: "#00E5A0" },
  error: { bg: "rgba(255, 77, 109, 0.1)", border: "rgba(255, 77, 109, 0.25)", color: "#FF4D6D" },
  warning: { bg: "rgba(255, 179, 71, 0.1)", border: "rgba(255, 179, 71, 0.25)", color: "#FFB347" },
};

const AlertMessage = ({ message, type = "error", dismissible = true, style }) => {
  const [visible, setVisible] = useState(true);
  if (!message || !visible) return null;

  const c = colors[type] || colors.error;
  const icon = icons[type] || "ℹ";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        padding: "0.75rem 1rem",
        borderRadius: "12px",
        fontSize: "0.85rem",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.color,
        animation: "fadeInDown 0.3s ease",
        ...style,
      }}
    >
      <span style={{ flexShrink: 0, fontSize: "1rem", lineHeight: 1.4 }}>{icon}</span>
      <span style={{ flex: 1, color: c.color }}>{message}</span>
      {dismissible && (
        <button
          onClick={() => setVisible(false)}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.35)",
            cursor: "pointer",
            padding: 0,
            fontSize: "1.1rem",
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default AlertMessage;
