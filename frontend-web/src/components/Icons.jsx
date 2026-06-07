// Fichier : Icons.jsx
// Rôle : Composants d'icônes SVG premium pour l'interface SENGUICHET

import React from "react";

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const Ticket = ({ size = 18, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className} style={style}>
    <path d="M2 9a3 3 0 1 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 1 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    <path d="M9 10v.01M15 10v.01M9 13v.01M15 13v.01M9 16v.01M15 16v.01" />
  </svg>
);

export const LayoutGrid = ({ size = 18, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className} style={style}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

export const FileText = ({ size = 18, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className} style={style}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5Z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

export const Users = ({ size = 18, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className} style={style}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const Calendar = ({ size = 18, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className} style={style}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <circle cx="12" cy="16" r="1.5" />
  </svg>
);

export const BarChart = ({ size = 18, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className} style={style}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <path d="M3 20h18" />
  </svg>
);

export const Star = ({ size = 18, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const Edit = ({ size = 18, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className} style={style}>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <line x1="15" y1="5" x2="19" y2="9" />
  </svg>
);

export const LogOut = ({ size = 18, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className} style={style}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const Inbox = ({ size = 18, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className} style={style}>
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
  </svg>
);

export const Sparkle = ({ size = 18, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className} style={style}>
    <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1-8.313-12.454z" />
    <path d="M12 2v1M18 6l-1 1M20 12h-1M18 18l-1-1M12 20v1M7 18l-1 1M5 12H4M7 6L6 5" />
  </svg>
);

export const Circle = ({ size = 18, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className} style={style}>
    <circle cx="12" cy="12" r="10" />
  </svg>
);

export const Menu = ({ size = 18, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className} style={style}>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

export const X = ({ size = 18, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className} style={style}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const Check = ({ size = 18, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className} style={style}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const Send = ({ size = 18, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className} style={style}>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

export const XCircle = ({ size = 18, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className} style={style}>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

export const Shield = ({ size = 18, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className} style={style}>
    <path d="M12 2l7 4v5c0 5-3.5 9.73-7 11-3.5-1.27-7-6-7-11V6l7-4z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

export const ArrowLeft = ({ size = 18, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className} style={style}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

export const Lock = ({ size = 18, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className} style={style}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    <circle cx="12" cy="16" r="1" />
    <line x1="12" y1="16" x2="12" y2="13" />
  </svg>
);

export const Clipboard = ({ size = 18, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className} style={style}>
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <line x1="12" y1="11" x2="12" y2="17" />
    <line x1="9" y1="14" x2="15" y2="14" />
  </svg>
);

export const Loader = ({ size = 18, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...strokeProps} className={className} style={{ ...style, animation: "spinIcon 1s linear infinite" }}>
    <circle cx="12" cy="12" r="10" opacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
);

const iconMap = {
  ticket: Ticket,
  grid: LayoutGrid,
  file: FileText,
  users: Users,
  calendar: Calendar,
  chart: BarChart,
  star: Star,
  edit: Edit,
  logout: LogOut,
  inbox: Inbox,
  sparkle: Sparkle,
  circle: Circle,
  menu: Menu,
  x: X,
  check: Check,
  send: Send,
  xcircle: XCircle,
  loader: Loader,
  clipboard: Clipboard,
  lock: Lock,
  shield: Shield,
  arrowleft: ArrowLeft,
};

const Icon = ({ name, size, className, style, ...props }) => {
  const IconComponent = iconMap[name];
  if (!IconComponent) return null;
  return <IconComponent size={size} className={className} style={style} {...props} />;
};

export default Icon;
