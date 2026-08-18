import React, { useEffect, useState } from "react";
import {
  Users,
  CalendarClock,
  Phone,
  MapPin,
  MessageCircle,
  Download,
  CheckCircle2,
  History,
  Mail,
} from "lucide-react";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import StatCard from "../../components/common/StatCard";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const typeColors = { new: "teal", regular: "ocean", vip: "amber", inactive: "gray" };
const statusColors = { none: "gray", pending: "amber", contacted: "teal", won: "green", lost: "red" };

const daysSince = (d) => {
  if (!d) return "Never";
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  return `${diff}d`;
};

const FollowUp = () => {
  const { can } = useAuth();
  const [days, setDays] = useState(30);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(null); // { customer }
  const [history, setHistory] = useState(null);

  const canEdit = can("customers", "edit");

  const load = async (d = days, t = type, s = status) => {
    setLoading(true);
    const { data } = await api.get("/customers/followup/list", {
      params: { days: d, type: t || undefined, status: s || undefined },
    });
    setCustomers(data.data);
    setStats(data.stats);
    setLoading(false);
  };

  useEffect(() => {
    load(30, "", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkFollowUp = async (e) => {
    e.preventDefault();
    await api.post(`/customers/${marking.customer._id}/followup`, {
      note: marking.note,
      status: marking.status,
    });
    setMarking(null);
    load();
  };

  const openMark = (c) => setMarking({ customer: c, note: c.followUpNote || "", status: c.followUpStatus || "contacted" });

  const handleHistory = async (row) => {
    const [custRes, billsRes] = await Promise.all([
      api.get(`/customers/${row._id}`),
      api.get(`/billing/customer/${row._id}`),
    ]);
    setHistory({ customer: custRes.data.data, bills: billsRes.data.data });
  };

  const copyNumbers = async () => {
    const nums = customers.map((c) => c.whatsapp || c.mobile).join(", ");
    try {
      await navigator.clipboard.writeText(nums);
      alert(`Copied ${customers.length} numbers to clipboard for WhatsApp broadcast.`);
    } catch {
      prompt("Copy these numbers for WhatsApp broadcast:", nums);
    }
  };

  const exportCSV = () => {
    const header = "Name,Mobile,WhatsApp,Type,Visits,Spent,LastVisit,Days Since,FollowUpStatus,FollowUpNote\n";
    const rows = customers
      .map((c) =>
        [
          `"${(c.name || "").replace(/"/g, '""')}"`,
          c.mobile,
          c.whatsapp || "",
          c.customerType,
          c.totalVisits,
          c.totalSpending,
          c.lastVisitDate ? new Date(c.lastVisitDate).toISOString().slice(0, 10) : "",
          daysSince(c.lastVisitDate),
          c.followUpStatus || "none",
          `"${(c.followUpNote || "").replace(/"/g, '""')}"`,
        ].join(",")
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `followup-list-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const columns = [
    { key: "name", label: "Name" },
    {
      key: "contact",
      label: "Contact",
      render: (row) => (
        <div className="text-xs">
          <p className="flex items-center gap-1 font-semibold text-ocean-800">
            <Phone size={11} className="text-ocean-400" /> {row.mobile}
          </p>
          {row.address && (
            <p className="mt-0.5 flex items-center gap-1 text-ocean-400">
              <MapPin size={11} /> {row.address}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "customerType",
      label: "Type",
      render: (row) => <Badge color={typeColors[row.customerType]}>{row.customerType}</Badge>,
    },
    { key: "totalVisits", label: "Visits" },
    { key: "totalSpending", label: "Spent", render: (row) => `₹${row.totalSpending}` },
    {
      key: "lastVisitDate",
      label: "Last Visit",
      render: (row) => (
        <div className="text-xs">
          <p className="font-semibold text-ocean-800">
            {row.lastVisitDate ? new Date(row.lastVisitDate).toLocaleDateString("en-IN") : "Never"}
          </p>
          <p className="text-coral-500">{daysSince(row.lastVisitDate)} ago</p>
        </div>
      ),
    },
    {
      key: "followUpStatus",
      label: "Status",
      render: (row) => <Badge color={statusColors[row.followUpStatus] || "gray"}>{row.followUpStatus}</Badge>,
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {canEdit && (
            <button onClick={() => openMark(row)} title="Mark as followed up" className="btn-secondary py-1.5 text-xs">
              <CheckCircle2 size={14} />
            </button>
          )}
          <a
            href={`https://wa.me/91${(row.whatsapp || row.mobile).replace(/\D/g, "")}?text=${encodeURIComponent(
              `Hi ${row.name}, this is BlueWhale Park! We miss you — here's a special offer for your next visit.`
            )}`}
            target="_blank"
            rel="noreferrer"
            title="WhatsApp"
            className="btn-secondary py-1.5 text-xs"
          >
            <MessageCircle size={14} className="text-teal-500" />
          </a>
          <button onClick={() => handleHistory(row)} title="History" className="btn-secondary py-1.5 text-xs">
            <History size={14} />
          </button>
        </div>
      ),
    },
  ];

  const historyColumns = [
    { key: "billNumber", label: "Bill No." },
    {
      key: "createdAt",
      label: "Date",
      render: (row) => new Date(row.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }),
    },
    { key: "package", label: "Package", render: (row) => row.package?.name },
    { key: "adults", label: "Guests", render: (row) => `${row.adults} A / ${row.children} C` },
    { key: "finalAmount", label: "Paid", render: (row) => <span className="font-bold text-ocean-900">₹{row.finalAmount}</span> },
    { key: "paymentMode", label: "Payment" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-ocean-900">Follow-up List</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={copyNumbers} className="btn-secondary">
            <MessageCircle size={16} /> Copy Numbers
          </button>
          <button onClick={exportCSV} className="btn-secondary">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>
      <p className="text-sm text-ocean-400">
        Customers who haven't visited recently — reach out via WhatsApp, then mark each follow-up as done.
      </p>

      {stats && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="To Follow Up" value={stats.total} icon={Users} accent="coral" />
          <StatCard label="Pending Contact" value={stats.pending} icon={CalendarClock} accent="ocean" />
          <StatCard label="VIPs Dormant" value={stats.byType.vip} icon={Mail} accent="amber" />
          <StatCard label="Inactive" value={stats.byType.inactive} icon={Users} accent="gray" />
          <StatCard label="Potential Revenue" value={`₹${stats.potentialRevenue}`} icon={CalendarClock} accent="teal" />
        </div>
      )}

      <div className="card flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Inactive for (days)</label>
          <input
            type="number"
            min="1"
            className="input-field w-32"
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Customer Type</label>
          <select className="input-field w-40" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All</option>
            <option value="new">New</option>
            <option value="regular">Regular</option>
            <option value="vip">VIP</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div>
          <label className="label">Follow-up Status</label>
          <select className="input-field w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="contacted">Contacted</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
        </div>
        <button onClick={() => load()} className="btn-accent">
          Apply
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-ocean-400">Loading...</p>
      ) : (
        <Table columns={columns} rows={customers} emptyMessage="No customers match this criteria" />
      )}

      {marking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleMarkFollowUp} className="w-full max-w-md rounded-2xl bg-white p-6">
            <h3 className="mb-1 text-lg font-bold text-ocean-900">Mark Follow-up</h3>
            <p className="mb-4 text-sm text-ocean-400">
              {marking.customer.name} · {marking.customer.mobile} — record your outreach.
            </p>
            <div className="mb-3">
              <label className="label">Result</label>
              <select
                className="input-field"
                value={marking.status}
                onChange={(e) => setMarking({ ...marking, status: e.target.value })}
              >
                <option value="contacted">Contacted</option>
                <option value="pending">Still Pending</option>
                <option value="won">Re-booked / Won</option>
                <option value="lost">Lost / Not Interested</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="label">Note</label>
              <textarea
                className="input-field min-h-24"
                placeholder="e.g. Sent Diwali offer via WhatsApp"
                value={marking.note}
                onChange={(e) => setMarking({ ...marking, note: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setMarking(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-accent">
                Save Follow-up
              </button>
            </div>
          </form>
        </div>
      )}

      {history && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-ocean-900">Customer Visit History</h3>
              <button onClick={() => setHistory(null)} className="btn-accent">
                Close
              </button>
            </div>
            <div className="mb-5 rounded-2xl border border-ocean-100 bg-gradient-to-r from-ocean-800 to-ocean-600 p-5 text-white">
              <p className="font-display text-xl font-extrabold">{history.customer.name}</p>
              <div className="mt-2 space-y-1 text-sm text-teal-100">
                <p className="flex items-center gap-1.5"><Phone size={13} /> {history.customer.mobile}</p>
                {history.customer.address && (
                  <p className="flex items-center gap-1.5"><MapPin size={13} /> {history.customer.address}</p>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <span>Visits: <strong>{history.customer.totalVisits}</strong></span>
                <span>Spent: <strong>₹{history.customer.totalSpending}</strong></span>
                <span>Type: <Badge color={typeColors[history.customer.customerType]}>{history.customer.customerType}</Badge></span>
                {history.customer.followUpNote && (
                  <span>Last note: <strong>{history.customer.followUpNote}</strong></span>
                )}
              </div>
            </div>
            <Table columns={historyColumns} rows={history.bills} emptyMessage="No bills yet for this customer" />
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUp;
