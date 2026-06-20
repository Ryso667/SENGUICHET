import React from "react";
import { Outlet } from "react-router-dom";
import AcheteurBottomNav from "../components/AcheteurBottomNav";

export default function AcheteurLayout() {
  return (
    <div style={{ minHeight: "100vh", background: "#F0F4F8" }}>
      <Outlet />
      <AcheteurBottomNav />
    </div>
  );
}
