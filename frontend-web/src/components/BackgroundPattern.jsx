import React from 'react';

const BackgroundPattern = ({ children, style }) => {
  return (
    <div style={{ position: 'relative', ...style }}>
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.15,
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="ticket-pattern"
            x="0"
            y="0"
            width="120"
            height="120"
            patternUnits="userSpaceOnUse"
          >
            {/* Forme S du ticket — courbe dans les deux sens */}
            <path
              d="M75 15 Q92 15 92 32 Q92 52 58 52 Q28 52 28 68 Q28 85 45 85"
              stroke="#BBBBCC"
              strokeWidth="13"
              fill="none"
              strokeLinecap="round"
            />
            {/* Perforations haut */}
            <line x1="68" y1="10" x2="82" y2="10" stroke="#BBBBCC" strokeWidth="3"/>
            <line x1="68" y1="6" x2="82" y2="6" stroke="#BBBBCC" strokeWidth="3"/>
            {/* Perforations bas */}
            <line x1="36" y1="90" x2="50" y2="90" stroke="#BBBBCC" strokeWidth="3"/>
            <line x1="36" y1="94" x2="50" y2="94" stroke="#BBBBCC" strokeWidth="3"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ticket-pattern)" />
      </svg>
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
};

export default BackgroundPattern;
