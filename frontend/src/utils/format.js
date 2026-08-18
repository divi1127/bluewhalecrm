export const formatDuration = (pkg = {}) => {
  const mins = Number(pkg.durationMinutes) || 0;
  const unit = pkg.durationUnit || "minutes";
  if (unit === "hours") {
    const hours = mins / 60;
    const display = hours % 1 === 0 ? hours : hours.toFixed(1);
    return `${display} hr${hours > 1 ? "s" : ""}`;
  }
  return `${mins} min`;
};
