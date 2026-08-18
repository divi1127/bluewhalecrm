import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ScanFace, Receipt, IndianRupee, Users, TicketCheck, ListOrdered, LogOut, Plus } from "lucide-react";
import StatCard from "../../components/common/StatCard";
import Badge from "../../components/common/Badge";
import Table from "../../components/common/Table";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const CashierDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [{ data: dash }, { data: bills }] = await Promise.all([
          api.get("/dashboard", { params: { period: "daily" } }),
          api.get("/billing", { params: { limit: 8 } }),
        ]);
        setStats(dash.data.current);
        setRecent(bills.data);
      } catch {
        // non-critical
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const columns = [
    { key: "billNumber", label: "Bill No." },
    { key: "customer", label: "Customer", render: (row) => row.customer?.name || "Walk-in" },
    { key: "package", label: "Package", render: (row) => row.package?.name },
    {
      key: "createdAt",
      label: "Time",
      render: (row) => new Date(row.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    },
    { key: "finalAmount", label: "Amount", render: (row) => <span className="font-bold text-ocean-900">₹{row.finalAmount}</span> },
    { key: "paymentMode", label: "Payment", render: (row) => <Badge color="ocean">{row.paymentMode}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 text-white">
            <ScanFace size={26} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ocean-400">Cashier Dashboard</p>
            <h2 className="font-display text-xl font-bold text-ocean-900">Welcome, {user?.name || "Cashier"}</h2>
            <p className="text-sm text-ocean-500">
              {user?.staff?.designation || "Cashier"} · <Badge color="teal">Cashier</Badge>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/billing" className="btn-accent inline-flex items-center gap-2">
            <Plus size={16} /> New Bill
          </Link>
          <Link to="/billing/history" className="btn-secondary inline-flex items-center gap-2">
            <ListOrdered size={15} /> History
          </Link>
          <button onClick={logout} className="btn-secondary">
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Today's Sales" value={stats ? `₹${stats.sales.toLocaleString("en-IN")}` : "—"} icon={IndianRupee} accent="teal" />
        <StatCard label="Today's Bills" value={stats?.bills ?? "—"} icon={Receipt} accent="ocean" />
        <StatCard label="Today's Visitors" value={stats?.visitors ?? "—"} icon={Users} accent="coral" />
        <StatCard label="Coupons Redeemed" value={stats?.coupons ?? "—"} icon={TicketCheck} accent="ocean" />
      </div>

      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-ocean-900">Recent Bills</h3>
          <Link to="/billing/history" className="text-xs font-semibold text-teal-600 hover:underline">
            View all
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-ocean-400">Loading...</p>
        ) : (
          <Table columns={columns} rows={recent} emptyMessage="No bills yet today" />
        )}
      </div>
    </div>
  );
};

export default CashierDashboard;