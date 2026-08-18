import React from "react";

// Small dashboard metric tile
const StatCard = ({ label, value, icon: Icon, accent = "teal", delta }) => {
  const accents = {
    teal: "bg-teal-50 text-teal-600",
    coral: "bg-coral-50 text-coral-500",
    ocean: "bg-ocean-50 text-ocean-600",
  };
  const hasDelta = typeof delta === "number";
  return (
    <div className="card flex items-center gap-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accents[accent] || accents.teal}`}>
        {Icon && <Icon size={20} />}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-ocean-400">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-ocean-900">{value}</p>
          {hasDelta && (
            <span className={`text-xs font-bold ${delta >= 0 ? "text-teal-500" : "text-coral-500"}`}>
              {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
