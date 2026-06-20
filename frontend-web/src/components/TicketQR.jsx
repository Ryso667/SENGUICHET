import React, { useState, useEffect, useCallback, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function TicketQR({ qrPayload }) {
  const [payload, setPayload] = useState(qrPayload || "{}");
  const intervalRef = useRef(null);

  const refresh = useCallback(() => {
    if (!qrPayload) return;
    try {
      const base = JSON.parse(typeof qrPayload === "string" ? qrPayload : JSON.stringify(qrPayload));
      base.ts = Math.floor(Date.now() / 30000) * 30000;
      setPayload(JSON.stringify(base));
    } catch {
      setPayload(qrPayload);
    }
  }, [qrPayload]);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, 30000);
    return () => clearInterval(intervalRef.current);
  }, [refresh]);

  if (!payload) return null;

  return (
    <div className="flex items-center justify-center p-2" style={{ background: "#FFFFFF", borderRadius: 12 }}>
      <QRCodeSVG value={payload} size={180} level="H" includeMargin />
    </div>
  );
}
