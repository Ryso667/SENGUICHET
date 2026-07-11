// Fichier : BackgroundPattern.jsx
// Rôle : Fond filigrane répété avec le logo ticket en S de SENGUICHET

import React from "react";

/**
 * BackgroundPattern – Calque de fond avec un motif répété de tickets en S
 * @param {{ children: React.ReactNode, style?: React.CSSProperties }} props
 */
export default function BackgroundPattern({ children, style }) {
  return (
    <div style={{ position: "relative", ...style }}>
      <svg
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0.12,
        }}
      >
        <defs>
          <pattern id="ticket-pattern" width="120" height="120" patternUnits="userSpaceOnUse">
            <path
              d="M75 15 Q92 15 92 32 Q92 52 58 52 Q28 52 28 68 Q28 85 45 85"
              stroke="#EAEAF0"
              strokeWidth="13"
              fill="none"
              strokeLinecap="round"
            />
            <line x1="70" y1="12" x2="70" y2="18" stroke="#EAEAF0" strokeWidth="2" strokeLinecap="round" />
            <line x1="80" y1="12" x2="80" y2="18" stroke="#EAEAF0" strokeWidth="2" strokeLinecap="round" />
            <line x1="40" y1="88" x2="40" y2="94" stroke="#EAEAF0" strokeWidth="2" strokeLinecap="round" />
            <line x1="50" y1="88" x2="50" y2="94" stroke="#EAEAF0" strokeWidth="2" strokeLinecap="round" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ticket-pattern)" />
      </svg>

      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
