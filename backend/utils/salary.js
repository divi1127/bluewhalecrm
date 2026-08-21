// Shared salary computation used by the attendance, salary and staff controllers.
// Leave policy: the first `allowedLeavesPerMonth` leaves are paid; any leave beyond
// that deducts one day's salary each. Late policy: every `latesPerDeduction` late
// days deduct one day's salary (0 disables the deduction).

const round2 = (n) => Math.round(n * 100) / 100;

const computeSalaryBreakdown = (staff, records, settings, month) => {
  const presentDays = records.filter((r) => r.status === "present").length;
  const halfDays = records.filter((r) => r.status === "half-day").length;
  const leaveDays = records.filter((r) => r.status === "leave").length;
  const absentDays = records.filter((r) => r.status === "absent").length;
  const totalOvertimeHours = records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);
  const lateDays = records.filter((r) => (r.lateMinutes || 0) > 0).length;

  const allowedLeaves = settings.salary?.allowedLeavesPerMonth ?? 2;
  const latesPerDeduction = settings.salary?.latesPerDeduction ?? 0;

  // First N leaves are paid; the rest are unpaid and deduct one day's salary each.
  const paidLeaves = Math.min(leaveDays, allowedLeaves);
  const unpaidLeaveDays = Math.max(leaveDays - allowedLeaves, 0);

  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const perDaySalary =
    staff.salaryType === "monthly" ? staff.salaryAmount / daysInMonth : staff.salaryAmount;

  const effectiveDays = presentDays + halfDays * 0.5 + paidLeaves;
  const overtimePay = totalOvertimeHours * (perDaySalary / 8); // assume 8-hr workday for OT rate
  const leaveDeduction = unpaidLeaveDays * perDaySalary;
  const lateDeduction =
    latesPerDeduction > 0 ? Math.floor(lateDays / latesPerDeduction) * perDaySalary : 0;
  const grossSalary = effectiveDays * perDaySalary + overtimePay;
  const netSalary = grossSalary - leaveDeduction - lateDeduction;

  return {
    staff: { _id: staff._id, staffId: staff.staffId, name: staff.name, designation: staff.designation },
    month,
    salaryType: staff.salaryType,
    salaryAmount: staff.salaryAmount,
    presentDays,
    halfDays,
    leaveDays,
    absentDays,
    lateDays,
    totalOvertimeHours,
    allowedLeaves,
    paidLeaves,
    unpaidLeaveDays,
    latesPerDeduction,
    perDaySalary: round2(perDaySalary),
    overtimePay: round2(overtimePay),
    leaveDeduction: round2(leaveDeduction),
    lateDeduction: round2(lateDeduction),
    grossSalary: round2(grossSalary),
    netSalary: round2(netSalary),
  };
};

module.exports = { computeSalaryBreakdown, round2 };
