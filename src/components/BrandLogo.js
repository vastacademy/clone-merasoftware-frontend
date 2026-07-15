import React from "react";

const BrandLogo = ({ className = "" }) => (
  <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 font-bold text-white ${className}`}>
    M
  </span>
);

export default BrandLogo;
