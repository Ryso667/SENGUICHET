import React, { useState } from "react";

const config = {
  success: { icon: "✓", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.25)", color: "#22C55E" },
  error: { icon: "✗", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)", color: "#EF4444" },
  warning: { icon: "⚡", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)", color: "#F59E0B" },
  info: { icon: "ℹ", bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.25)", color: "#818CF8" },
};

const AlertMessage = ({ message, type = "error", dismissible = false }) => {
  const [visible, setVisible] = useState(true);
  if (!message || !visible) return null;

  const c = config[type] || config.error;

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color, fontFamily: "'Plus Jakarta Sans', sans-serif", animation: "fadeInDown 0.3s ease" }}
    >
      <span style={{ flexShrink: 0 }}>{c.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      {dismissible && (
        <button onClick={() => setVisible(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", padding: 0, fontSize: "1.1rem", lineHeight: 1 }}>×</button>
      )}
    </div>
  );
};

export default AlertMessage;
