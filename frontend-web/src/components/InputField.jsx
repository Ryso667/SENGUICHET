import React, { useState } from "react";

const InputField = ({ label, name, type = "text", value, onChange, placeholder, error, icon, register, errors, rules }) => {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = type === "password";

  const isHookForm = !!register;
  const errMsg = isHookForm ? (errors?.[name]?.message) : error;

  const inputProps = isHookForm
    ? { ...register(name, rules) }
    : { value, onChange };

  return (
    <div style={{ width: "100%", marginBottom: "1rem" }}>
      {label && (
        <label
          htmlFor={name}
          style={{
            display: "block",
            fontSize: "0.75rem",
            marginBottom: "0.5rem",
            color: "#A0B4C8",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 500,
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {icon && (
          <span style={{ position: "absolute", left: "16px", color: "#A0B4C8", fontSize: "1rem", pointerEvents: "none" }}>
            {icon}
          </span>
        )}
        <input
          id={name}
          type={isPassword && show ? "text" : type}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...inputProps}
          style={{
            width: "100%",
            padding: icon ? "14px 16px 14px 46px" : "14px 16px",
            fontSize: "0.9rem",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: "#FFFFFF",
            background: "#152232",
            border: errMsg
              ? "1px solid #FF4D6D"
              : focused
              ? "1px solid #00C8FF"
              : "1px solid #1E3448",
            borderRadius: "8px",
            outline: "none",
            transition: "all 0.25s ease",
            boxShadow: errMsg
              ? "0 0 0 4px rgba(255, 77, 109, 0.12)"
              : focused
              ? "0 0 0 4px rgba(0, 200, 255, 0.12)"
              : "none",
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            style={{ position: "absolute", right: "16px", background: "none", border: "none", color: "#A0B4C8", cursor: "pointer", padding: 0, fontSize: "1rem" }}
            tabIndex={-1}
          >
            {show ? "🙈" : "👁️"}
          </button>
        )}
      </div>
      {errMsg && (
        <p style={{ marginTop: "0.375rem", fontSize: "0.75rem", color: "#FF4D6D" }}>
          {errMsg}
        </p>
      )}
    </div>
  );
};

export default InputField;
