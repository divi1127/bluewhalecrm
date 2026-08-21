import React, { useEffect, useState } from "react";
import { IndianRupee, CalendarClock, AlertCircle, TrendingDown, Wallet, Eye, X } from "lucide-react";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import api from "../../api/axios";

const fmtMoney = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const thisMonth = () => new Date().toISOString().slice(0, 7);

const Salary = () => {
  const [month, setMonth] = useState(thisMonth());
  const [data, setData] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async (m = month) => {
    setLoading(true);
    try {
      const { data } = await api.get("/salary/summary", { params: { month: m } });
      setData(data.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDetail = async (staffId) => {
    const { data } = await api.get(`/salary/staff/${staffId}`, { params: { month } });
    setDetail(data.data);
  };

  const totals = data?.totals;

  const columns = [
    { key: "name", label: "STAFF", render: (r) => (
        <div>
          <span className="font-semibold text-ocean-900">{r.staff.name}</span>
          <p className="text-xs text-ocean-400">{r.staff.designation} · {r.salaryType === "monthly" ? `${fmtMoney(r.salaryAmount)}/mo` : `${fmtMoney(r.salaryAmount)}/day`}</p>
        </div>
      )
    },
    { key: "presentDays", label: "PRESENT", render: (r) => <span className="font-semibold text-emerald-600">{r.presentDays}</span> },
    { key: "halfDays", label: "HALF", render: (r) => r.halfDays },
    { key: "leaveDays", label: "LEAVE", render: (r) => (
        <span>
          {r.leaveDays}
          {r.unpaidLeaveDays > 0 && <span className="ml-1 text-xs text-coral-500">({r.unpaidLeaveDays} unpaid)</span>}
        </span>
      )
    },
    { key: "absentDays", label: "ABSENT", render: (r) => <span className="text-coral-500">{r.absentDays}</span> },
    { key: "lateDays", label: "LATE", render: (r) => (
        <Badge color={r.lateDays > 0 ? "amber" : "gray"}>
          {r.lateDays}{r.lateDeduction > 0 ? ` · −${fmtMoney(r.lateDeduction)}` : ""}
        </Badge>
      )
    },
    { key: "overtime", label: "OVERTIME", render: (r) => (
        <span>
          {r.totalOvertimeHours}h
          {r.overtimePay > 0 && <span className="ml-1 text-xs text-emerald-600">+{fmtMoney(r.overtimePay)}</span>}
        </span>
      )
    },
    { key: "netSalary", label: "NET SALARY", render: (r) => <span className="font-bold text-teal-600">{fmtMoney(r.netSalary)}</span> },
    {
      key: "actions",
      label: "",
      render: (r) => (
        <button onClick={() => openDetail(r.staff._id)} className="btn-secondary py-1 text-xs" title="Day-by-day detail">
          <Eye size={13} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-ocean-900">Salary</h1>
          <p className="text-sm text-ocean-500 mt-1">
            Monthly payroll computed from attendance — present days, leaves, late marks and overtime.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label className="label">Month</label>
            <input
              type="month"
              className="input-field"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                if (e.target.value) load(e.target.value);
              }}
            />
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex items-center justify-between !py-4">
          <div>
            <p className="text-xs font-medium text-ocean-500">Net Payroll ({data?.rows?.length || 0} staff)</p>
            <p className="mt-1 text-2xl font-bold text-teal-600">{fmtMoney(totals?.netSalary)}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-500">
            <Wallet size={20} />
          </div>
        </div>
        <div className="card flex items-center justify-between !py-4">
          <div>
            <p className="text-xs font-medium text-ocean-500">Total Present Days</p>
            <p className="mt-1 text-2xl font-bold text-ocean-900">{totals?.presentDays ?? 0}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
            <CalendarClock size={20} />
          </div>
        </div>
        <div className="card flex items-center justify-between !py-4">
          <div>
            <p className="text-xs font-medium text-ocean-500">Late Marks</p>
            <p className="mt-1 text-2xl font-bold text-ocean-900">{totals?.lateDays ?? 0}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
            <AlertCircle size={20} />
          </div>
        </div>
        <div className="card flex items-center justify-between !py-4">
          <div>
            <p className="text-xs font-medium text-ocean-500">Deductions (leave + late)</p>
            <p className="mt-1 text-2xl font-bold text-coral-500">{fmtMoney(totals?.deductions)}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-coral-50 text-coral-500">
            <TrendingDown size={20} />
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <IndianRupee size={18} className="text-teal-500" />
          <h3 className="font-bold text-ocean-900">Payroll for {month}</h3>
          {loading && <span className="text-xs text-ocean-400">loading…</span>}
        </div>
        <Table columns={columns} rows={data?.rows || []} emptyMessage={loading ? "Loading…" : "No active staff found."} />
      </div>

      {/* Day-by-day detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="flex items-center gap-2 font-bold text-ocean-900">
                  <IndianRupee size={18} className="text-teal-500" /> {detail.staff.name} — {detail.month}
                </h3>
                <p className="mt-1 text-xs text-ocean-500">
                  Present {detail.presentDays} · Half {detail.halfDays} · Leave {detail.leaveDays} · Absent{" "}
                  {detail.absentDays} · Late {detail.lateDays} · OT {detail.totalOvertimeHours}h
                </p>
              </div>
              <button onClick={() => setDetail(null)} className="text-ocean-400 hover:text-ocean-700">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2 rounded-lg bg-ocean-50 p-4 text-sm">
              <div className="flex justify-between"><span className="text-ocean-600">Per day:</span> <strong>{fmtMoney(detail.perDaySalary)}</strong></div>
              <div className="flex justify-between"><span className="text-ocean-600">Overtime pay:</span> <strong className="text-emerald-600">+{fmtMoney(detail.overtimePay)}</strong></div>
              <div className="flex justify-between"><span className="text-ocean-600">Leave deduction:</span> <strong className="text-coral-500">−{fmtMoney(detail.leaveDeduction)}</strong></div>
              <div className="flex justify-between"><span className="text-ocean-600">Late deduction:</span> <strong className="text-coral-500">−{fmtMoney(detail.lateDeduction)}</strong></div>
              <div className="mt-2 flex items-center justify-between border-t border-ocean-200 pt-3">
                <span className="font-bold text-ocean-900">Net Salary</span>
                <span className="text-xl font-bold text-teal-600">{fmtMoney(detail.netSalary)}</span>
              </div>
            </div>

            <h4 className="mb-2 mt-4 text-sm font-bold text-ocean-900">Day records</h4>
            {detail.days?.length ? (
              <div className="overflow-x-auto rounded-xl border border-ocean-100">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-ocean-100 bg-ocean-50 text-xs uppercase text-ocean-500">
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">In</th>
                      <th className="px-3 py-2">Out</th>
                      <th className="px-3 py-2">Late</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.days.map((d) => (
                      <tr key={d.date} className="border-b border-ocean-50 last:border-0">
                        <td className="px-3 py-1.5">{d.date}</td>
                        <td className="px-3 py-1.5"><Badge color={d.status === "present" ? "green" : d.status === "absent" ? "red" : d.status === "half-day" ? "amber" : "gray"}>{d.status}</Badge></td>
                        <td className="px-3 py-1.5">{d.checkIn ? new Date(d.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                        <td className="px-3 py-1.5">{d.checkOut ? new Date(d.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                        <td className="px-3 py-1.5">{d.lateMinutes > 0 ? <span className="font-semibold text-amber-600">{d.lateMinutes} min</span> : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-ocean-400">No attendance records for this month.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Salary;
