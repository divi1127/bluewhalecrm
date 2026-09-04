import React, { useEffect, useState } from "react";
import { AlertCircle, Inbox, Download } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import api from "../../api/axios";

const PIE_COLORS = ["#14b8a6", "#276e8c", "#ff7043", "#f59e0b", "#8b5cf6", "#3f8fae", "#a7d3e1"];
const tooltipStyle = { borderRadius: 12, border: "1px solid #d3e9f0", fontSize: 12 };

const tabs = [
  { key: "sales", label: "Sales" },
  { key: "customers", label: "Customers" },
  { key: "entries", label: "Entries" },
  { key: "coupons", label: "Coupons" },
  { key: "bookings", label: "Bookings" },
  { key: "staff", label: "Staff" },
];

const Reports = () => {
  const [activeTab, setActiveTab] = useState("sales");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [range, setRange] = useState({ from: "", to: "" });

  const load = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const { data: res } = await api.get(`/reports/${activeTab}`, { params: range });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const switchTab = (key) => {
    if (key === activeTab) return;
    setData(null);
    setActiveTab(key);
  };

  const renderBreakdown = (obj) => (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {Object.entries(obj || {}).map(([key, value]) => (
        <div key={key} className="rounded-lg bg-ocean-50 px-3 py-2">
          <p className="text-xs font-semibold uppercase text-ocean-400">{key}</p>
          <p className="text-sm font-bold text-ocean-900">{typeof value === "number" && key.toLowerCase().includes("revenue") ? `₹${value}` : value}</p>
        </div>
      ))}
    </div>
  );

  // Convert breakdown object to recharts-friendly array
  const breakdownToData = (obj, labelKey = "name", valueKey = "value") =>
    Object.entries(obj || {}).map(([key, val]) => ({ [labelKey]: key, [valueKey]: val }));

  const money = (v) => `₹${(v || 0).toLocaleString("en-IN")}`;

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-ocean-900">Reports</h2>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === t.key ? "bg-ocean-700 text-white" : "bg-white text-ocean-600 border border-ocean-100 hover:bg-ocean-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label">From</label>
          <input type="date" className="input-field" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input-field" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
        </div>
        <button onClick={load} className="btn-accent">
          Apply Filter
        </button>
      </div>

      {loading && <p className="text-sm text-ocean-400">Loading report...</p>}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-coral-200 bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-600">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {!loading && !error && !data && (
        <div className="card flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-ocean-400">
          <Inbox size={28} />
          No report data yet. Pick a period and click Apply Filter.
        </div>
      )}

      {!loading && !error && data && (
        <div className="card space-y-5">
          {activeTab === "sales" && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-teal-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-teal-500">Total Revenue</p>
                  <p className="text-xl font-bold text-ocean-900">₹{data.totalRevenue}</p>
                </div>
                <div className="rounded-lg bg-ocean-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-ocean-500">Total Bills</p>
                  <p className="text-xl font-bold text-ocean-900">{data.totalBills}</p>
                </div>
              </div>

              {/* Revenue by Day - Area Chart */}
              {data.byDay && Object.keys(data.byDay).length > 0 && (
                <div className="rounded-xl border border-ocean-100 bg-white p-4">
                  <p className="mb-3 text-sm font-bold text-ocean-700">Revenue Trend (by Day)</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={breakdownToData(data.byDay)} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="reportSalesGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eef6f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#3f8fae" }} tickLine={false} axisLine={{ stroke: "#d3e9f0" }} />
                        <YAxis tick={{ fontSize: 11, fill: "#3f8fae" }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} width={50} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [money(v), "Revenue"]} />
                        <Area type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={2} fill="url(#reportSalesGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Revenue by Package - Bar Chart */}
                {data.byPackage && Object.keys(data.byPackage).length > 0 && (
                  <div className="rounded-xl border border-ocean-100 bg-white p-4">
                    <p className="mb-3 text-sm font-bold text-ocean-700">Revenue by Package</p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={breakdownToData(data.byPackage)} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#eef6f9" />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#3f8fae" }} tickLine={false} axisLine={{ stroke: "#d3e9f0" }} />
                          <YAxis tick={{ fontSize: 11, fill: "#3f8fae" }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} width={50} />
                          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [money(v), "Revenue"]} />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {breakdownToData(data.byPackage).map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Payment Modes - Pie Chart */}
                {data.byPaymentMode && Object.keys(data.byPaymentMode).length > 0 && (
                  <div className="rounded-xl border border-ocean-100 bg-white p-4">
                    <p className="mb-3 text-sm font-bold text-ocean-700">Payment Modes</p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={breakdownToData(data.byPaymentMode)}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={3}
                          >
                            {breakdownToData(data.byPaymentMode).map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [money(v), name]} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* Staff Breakdown */}
              {data.byStaff && Object.keys(data.byStaff).length > 0 && (
                <div className="rounded-xl border border-ocean-100 bg-white p-4">
                  <p className="mb-3 text-sm font-bold text-ocean-700">Revenue by Staff</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={breakdownToData(data.byStaff)} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eef6f9" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: "#1c5570" }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [money(v), "Revenue"]} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                          {breakdownToData(data.byStaff).map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "customers" && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-teal-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-teal-500">New</p>
                  <p className="text-xl font-bold text-ocean-900">{data.newCount}</p>
                </div>
                <div className="rounded-lg bg-ocean-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-ocean-500">Repeat</p>
                  <p className="text-xl font-bold text-ocean-900">{data.repeatCount}</p>
                </div>
                <div className="rounded-lg bg-coral-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-coral-500">Inactive</p>
                  <p className="text-xl font-bold text-ocean-900">{data.inactiveCount}</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-bold text-ocean-700">Most Visited</p>
                <ul className="space-y-1 text-sm">
                  {data.mostVisited?.map((c) => (
                    <li key={c._id} className="flex justify-between border-b border-ocean-50 py-1">
                      <span>{c.name}</span>
                      <span className="font-semibold">{c.totalVisits} visits</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-sm font-bold text-ocean-700">Top Spenders</p>
                <ul className="space-y-1 text-sm">
                  {data.topSpenders?.map((c) => (
                    <li key={c._id} className="flex justify-between border-b border-ocean-50 py-1">
                      <span>{c.name}</span>
                      <span className="font-semibold">₹{c.totalSpending}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {activeTab === "entries" && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-teal-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-teal-500">Total Entries</p>
                  <p className="text-xl font-bold text-ocean-900">{data.totalEntries}</p>
                </div>
                <div className="rounded-lg bg-ocean-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-ocean-500">Active</p>
                  <p className="text-xl font-bold text-ocean-900">{data.active}</p>
                </div>
                <div className="rounded-lg bg-coral-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-coral-500">Expired</p>
                  <p className="text-xl font-bold text-ocean-900">{data.expired}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Entries by Package - Pie Chart */}
                {data.byPackage && Object.keys(data.byPackage).length > 0 && (
                  <div className="rounded-xl border border-ocean-100 bg-white p-4">
                    <p className="mb-3 text-sm font-bold text-ocean-700">Entries by Package</p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={breakdownToData(data.byPackage)}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={3}
                          >
                            {breakdownToData(data.byPackage).map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Entry Status - Bar Chart */}
                <div className="rounded-xl border border-ocean-100 bg-white p-4">
                  <p className="mb-3 text-sm font-bold text-ocean-700">Entry Status Overview</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: "Active", value: data.active },
                          { name: "Expired", value: data.expired },
                          { name: "Total", value: data.totalEntries },
                        ]}
                        margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#eef6f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#3f8fae" }} tickLine={false} axisLine={{ stroke: "#d3e9f0" }} />
                        <YAxis tick={{ fontSize: 11, fill: "#3f8fae" }} tickLine={false} axisLine={false} width={30} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          <Cell fill="#14b8a6" />
                          <Cell fill="#ff7043" />
                          <Cell fill="#276e8c" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "coupons" &&
            (Array.isArray(data) ? (
              data.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-ocean-100 text-xs font-semibold uppercase text-ocean-500">
                      <th className="py-2">Partner</th>
                      <th>Campaign</th>
                      <th>Issued</th>
                      <th>Used</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((c, i) => (
                      <tr key={i} className="border-b border-ocean-50">
                        <td className="py-2">{c.partnerName}</td>
                        <td>{c.campaignName}</td>
                        <td>{c.issued}</td>
                        <td>{c.used}</td>
                        <td>₹{c.revenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              ) : (
                <p className="flex items-center gap-2 py-6 text-center text-sm text-ocean-400">
                  <Inbox size={16} /> No coupon campaigns yet.
                </p>
              )
            ) : (
              <p className="py-6 text-sm text-ocean-400">Unexpected coupon report format.</p>
            ))}

          {activeTab === "bookings" && data && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-ocean-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-ocean-500">Total</p>
                  <p className="text-xl font-bold text-ocean-900">{data.total}</p>
                </div>
                <div className="rounded-lg bg-teal-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-teal-500">Confirmed</p>
                  <p className="text-xl font-bold text-ocean-900">{data.confirmed}</p>
                </div>
                <div className="rounded-lg bg-amber-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-amber-500">Pending</p>
                  <p className="text-xl font-bold text-ocean-900">{data.pending}</p>
                </div>
                <div className="rounded-lg bg-coral-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-coral-500">Cancelled</p>
                  <p className="text-xl font-bold text-ocean-900">{data.cancelled}</p>
                </div>
                <div className="col-span-2 rounded-lg bg-ocean-50 px-4 py-3 sm:col-span-4">
                  <p className="text-xs font-semibold uppercase text-ocean-500">Party Revenue</p>
                  <p className="text-xl font-bold text-ocean-900">₹{data.revenue}</p>
                </div>
              </div>

              {/* Bookings Status - Pie Chart */}
              <div className="rounded-xl border border-ocean-100 bg-white p-4">
                <p className="mb-3 text-sm font-bold text-ocean-700">Bookings by Status</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Confirmed", value: data.confirmed },
                        { name: "Pending", value: data.pending },
                        { name: "Cancelled", value: data.cancelled },
                      ].filter(d => d.value > 0)}
                      margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef6f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#3f8fae" }} tickLine={false} axisLine={{ stroke: "#d3e9f0" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#3f8fae" }} tickLine={false} axisLine={false} width={30} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        <Cell fill="#14b8a6" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#ff7043" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {activeTab === "staff" && data && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <div className="rounded-lg bg-teal-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-teal-500">Present</p>
                  <p className="text-xl font-bold text-ocean-900">{data.present}</p>
                </div>
                <div className="rounded-lg bg-coral-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-coral-500">Absent</p>
                  <p className="text-xl font-bold text-ocean-900">{data.absent}</p>
                </div>
                <div className="rounded-lg bg-amber-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-amber-500">Half-day</p>
                  <p className="text-xl font-bold text-ocean-900">{data.halfDay}</p>
                </div>
                <div className="rounded-lg bg-ocean-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-ocean-500">Leave</p>
                  <p className="text-xl font-bold text-ocean-900">{data.leave}</p>
                </div>
                <div className="rounded-lg bg-ocean-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-ocean-500">OT Hours</p>
                  <p className="text-xl font-bold text-ocean-900">{data.totalOvertimeHours}</p>
                </div>
              </div>

              {/* Staff Attendance - Pie Chart */}
              <div className="rounded-xl border border-ocean-100 bg-white p-4">
                <p className="mb-3 text-sm font-bold text-ocean-700">Staff Attendance Breakdown</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Present", value: data.present },
                          { name: "Absent", value: data.absent },
                          { name: "Half-day", value: data.halfDay },
                          { name: "Leave", value: data.leave },
                        ].filter(d => d.value > 0)}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                      >
                        <Cell fill="#14b8a6" />
                        <Cell fill="#ff7043" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#8b5cf6" />
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
