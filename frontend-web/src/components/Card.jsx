import React from "react";

const Card = ({ title, children, style }) => {
  return (
    <div
      style={{
        position: "relative",
        background: "rgba(21, 34, 50, 0.8)",
        border: "1px solid rgba(0, 200, 255, 0.15)",
        borderRadius: "12px",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.4)",
        padding: "1.5rem",
        overflow: "hidden",
        ...style,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "80px",
          height: "3px",
          background: "linear-gradient(90deg, #00C8FF 0%, #0077FF 100%)",
          borderRadius: "0 0 3px 0",
        }}
      />
      {title && (
        <h3
          style={{
            fontFamily: "Outfit, sans-serif",
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "#FFFFFF",
            marginBottom: "1rem",
          }}
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

export default Card;
