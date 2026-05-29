import React from "react";

const Spinner = () => (
  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
    <path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" opacity="0.75" />
  </svg>
);

const variantClass = { primary: "btn-primary", ghost: "btn-ghost", danger: "btn-danger" };
const sizeClass = { sm: "btn-sm", md: "btn-md", lg: "btn-lg" };

const Button = ({ children, isLoading = false, type = "button", onClick, variant = "primary", size = "md", fullWidth = true }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading}
      className={`${variantClass[variant] || "btn-primary"} ${sizeClass[size] || "btn-md"} ${fullWidth ? "btn-full" : ""}`}
    >
      {isLoading && <Spinner />}
      {isLoading ? "Chargement..." : children}
    </button>
  );
};

export default Button;
