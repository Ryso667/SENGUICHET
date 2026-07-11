// Fichier : BackgroundPattern.jsx
// Rôle : Fond filigrane répété avec le logo ticket en S de SENGUICHET
// Le motif utilise une image de fond SVG intégrée en data URI pour un rendu fiable

import React from "react";

/**
 * BackgroundPattern – Calque de fond avec un motif répété de tickets en S
 * @param {{ children: React.ReactNode, style?: React.CSSProperties }} props
 */
export default function BackgroundPattern({ children, style }) {
  const svgPattern = encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">' +
    '<path d="M75 15 Q92 15 92 32 Q92 52 58 52 Q28 52 28 68 Q28 85 45 85" ' +
    'stroke="#D8D8E0" stroke-width="13" fill="none" stroke-linecap="round"/>' +
    '<line x1="70" y1="12" x2="70" y2="18" stroke="#D8D8E0" stroke-width="2" stroke-linecap="round"/>' +
    '<line x1="80" y1="12" x2="80" y2="18" stroke="#D8D8E0" stroke-width="2" stroke-linecap="round"/>' +
    '<line x1="40" y1="88" x2="40" y2="94" stroke="#D8D8E0" stroke-width="2" stroke-linecap="round"/>' +
    '<line x1="50" y1="88" x2="50" y2="94" stroke="#D8D8E0" stroke-width="2" stroke-linecap="round"/>' +
    "</svg>"
  );

  const patternUrl = `url("data:image/svg+xml,${svgPattern}")`;

  return (
    <div
      style={{
        position: "relative",
        backgroundColor: "#FFFFFF",
        ...style,
      }}
    >
      {/* Calque du motif filigrane */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0.25,
          backgroundImage: patternUrl,
          backgroundRepeat: "repeat",
          backgroundSize: "120px 120px",
        }}
      />

      {/* Contenu de la page */}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
