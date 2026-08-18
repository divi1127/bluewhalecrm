import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ScanFace,
  ScanLine,
  Tv,
  Receipt,
  ListOrdered,
  UserCog,
  CalendarClock,
  IndianRupee,
  Users,
  TicketCheck,
  LogOut,
  Wallet,
} from "lucide-react";
import StatCard from "../../components/common/StatCard";
import Badge from "../../components/common/Badge";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const ROLE_LABELS = {
  billing_staff: "Billing Staff",
  entry_staff: "Entry Staff",
  hr_manager: "HR Manager",
  cashier: "Cashier",
  admin: "Manager",
  super_admin: "Super Admin",
};

const ROLE_ACTIONS = {
  entry_staff: [
    { to: "/entry", icon: ScanLine, label: "Entry Scan", desc: "Verify wrist tags at the gate" },
    { to: "/tv-display", icon: Tv, label: "TV Display", desc: "Show live entries on the kiosk" },
  ],
  billing_staff: [
    { to: "/billing", icon: Receipt, label: "New Bill", desc: "Raise a bill for a walk-in customer" },
    { to: "/billing/history", icon: ListOrdered, label: "Bill History", desc: "Search past bills and reprints" },
  ],
  hr_manager: [
    { to: "/staff", icon: UserCog, label: "Staff Master", desc: "Manage staff records and faces" },
    { to: "/staff/attendance", icon: Wallet, label: "Attendance & Salary", desc: "Mark attendance and compute salaries" },
  ],
};

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [activeTags, setActiveTags] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: dash }, { data: entry }] = await Promise.all([
          api.get("/dashboard", { params: { period: "daily" } }),
          api.get("/entry/active"),
        ]);
        setStats(dash.data.current);
        setActiveTags(Array.isArray(entry.data) ? entry.data.length : 0);
      } catch {
        // non-critical: leave tiles as —
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const myActions = ROLE_ACTIONS[user?.role] || ROLE_ACTIONS.billing_staff;

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-ocean-700 to-teal-500 text-white">
            <ScanFace size={26} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ocean-400">Staff Dashboard</p>
            <h2 className="font-display text-xl font-bold text-ocean-900">Welcome, {user?.name || "Staff"}</h2>
            <p className="text-sm text-ocean-500">
              {user?.staff?.designation || "BlueWhale Team"} ·{" "}
              <Badge color="ocean">{ROLE_LABELS[user?.role] || user?.role}</Badge>
            </p>
          </div>
        </div>
        <button onClick={logout} className="btn-secondary">
          <LogOut size={15} /> Sign out
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Today's Sales" value={stats ? `₹${stats.sales.toLocaleString("en-IN")}` : "—"} icon={IndianRupee} accent="teal" />
        <StatCard label="Today's Bills" value={stats?.bills ?? "—"} icon={Receipt} accent="ocean" />
        <StatCard label="Today's Visitors" value={stats?.visitors ?? "—"} icon={Users} accent="coral" />
        <StatCard label="Entries Today" value={stats?.entries ?? "—"} icon={ScanLine} accent="ocean" />
        <StatCard label="Active Wrist Tags" value={activeTags} icon={TicketCheck} accent="teal" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {myActions.map((a) => (
          <Link key={a.to} to={a.to} className="card group p-5 transition hover:ring-2 hover:ring-ocean-200">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ocean-50 text-ocean-700 group-hover:bg-teal-500 group-hover:text-white">
              <a.icon size={20} />
            </div>
            <p className="mt-3 font-display font-semibold text-ocean-900">{a.label}</p>
            <p className="mt-0.5 text-xs text-ocean-400">{a.desc}</p>
          </Link>
        ))}
        <Link to="/attendance/my" className="card group p-5 transition hover:ring-2 hover:ring-ocean-200">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ocean-50 text-ocean-700 group-hover:bg-teal-500 group-hover:text-white">
            <CalendarClock size={20} />
          </div>
          <p className="mt-3 font-display font-semibold text-ocean-900">My Attendance</p>
          <p className="mt-0.5 text-xs text-ocean-400">Check in / out and view your hours</p>
        </Link>
      </div>
    </div>
  );
};

export default StaffDashboard;