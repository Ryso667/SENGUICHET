import React from "react";

const PageLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#0A0B1A] relative" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="orb-indigo" />
      <div className="orb-accent" />
      <div className="relative" style={{ zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
};

export default PageLayout;
