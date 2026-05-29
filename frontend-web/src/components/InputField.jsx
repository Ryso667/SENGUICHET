import React, { useState } from "react";

const InputField = ({ label, name, type = "text", register, errors, placeholder, rules, icon }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="w-full mb-4">
      {label && (
        <label htmlFor={name} className="block text-xs mb-2" style={{ color: "rgba(255,255,255,0.65)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500 }}>
          {label}
        </label>
      )}
      <div className="input-premium-wrapper">
        {icon && <span className="input-icon">{icon}</span>}
        <input
          id={name}
          type={isPassword && show ? "text" : type}
          placeholder={placeholder}
          {...register(name, rules)}
          className={`input-premium ${errors[name] ? "error" : ""} ${icon ? "pl-[46px]" : ""}`}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)} className="input-toggle" tabIndex={-1}>
            {show ? "🙈" : "👁️"}
          </button>
        )}
      </div>
      {errors[name] && (
        <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: "var(--error)", animation: "fadeInDown 0.3s ease" }}>
          <span>⚠️</span>
          <span>{errors[name].message}</span>
        </p>
      )}
    </div>
  );
};

export default InputField;
