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
    'stroke="#DADAE8" stroke-width="13" fill="none" stroke-linecap="round"/>' +
    '<line x1="68" y1="11" x2="78" y2="11" stroke="#DADAE8" stroke-width="3" stroke-linecap="round"/>' +
    '<line x1="72" y1="7" x2="82" y2="7" stroke="#DADAE8" stroke-width="3" stroke-linecap="round"/>' +
    '<line x1="38" y1="89" x2="48" y2="89" stroke="#DADAE8" stroke-width="3" stroke-linecap="round"/>' +
    '<line x1="42" y1="93" x2="52" y2="93" stroke="#DADAE8" stroke-width="3" stroke-linecap="round"/>' +
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
          opacity: 0.15,
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
