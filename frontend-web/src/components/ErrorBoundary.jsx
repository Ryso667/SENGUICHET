// Fichier : ErrorBoundary.jsx
// Rôle : Capture les erreurs React non gérées et affiche une UI de secours

import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>
          <h1 style={{ color: "#e74c3c" }}>Une erreur est survenue</h1>
          <p style={{ color: "#666" }}>Veuillez rafraîchir la page ou réessayer plus tard.</p>
          <button onClick={() => window.location.reload()} style={{ padding: "10px 20px", background: "#00C8FF", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
            Rafraîchir
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
