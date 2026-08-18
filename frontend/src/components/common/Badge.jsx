import React from "react";

const styles = {
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  gray: "bg-ocean-50 text-ocean-500",
  teal: "bg-teal-50 text-teal-600",
  ocean: "bg-ocean-100 text-ocean-700",
};

const Badge = ({ children, color = "gray" }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[color] || styles.gray}`}>
    {children}
  </span>
);

export default Badge;
