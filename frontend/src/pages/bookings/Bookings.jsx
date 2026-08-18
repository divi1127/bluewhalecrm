import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const emptyForm = {
  customerName: "",
  customerMobile: "",
  eventType: "",
  eventDate: "",
  eventTime: "",
  guestCount: "",
  packageDetails: "",
  foodRequirements: "",
  decorationRequirements: "",
  additionalActivities: "",
  totalAmount: "",
  advancePaid: "",
};

const statusColors = {
  enquiry: "gray",
  advance_paid: "amber",
  confirmed: "teal",
  completed: "green",
  cancelled: "red",
};

const statusOptions = ["enquiry", "advance_paid", "confirmed", "completed", "cancelled"];

const sourceLabels = { online: "Online", staff: "Staff" };

const Bookings = () => {
  const { can } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("");

  const canCreate = can("bookings", "create");
  const canEdit = can("bookings", "edit");

  const load = () =>
    api.get("/bookings", { params: { source: source || undefined } }).then(({ data }) => {
      setBookings(data.data);
      setLoading(false);
    });

  useEffect(() => {
    load();
  }, [source]);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post("/bookings", form);
    setForm(emptyForm);
    setShowForm(false);
    load();
  };

  const handleStatusChange = async (id, status) => {
    await api.patch(`/bookings/${id}/status`, { status });
    load();
  };

  const columns = [
    { key: "customerName", label: "Customer" },
    { key: "eventType", label: "Event Type" },
    { key: "eventDate", label: "Date", render: (row) => new Date(row.eventDate).toLocaleDateString("en-IN") },
    { key: "eventTime", label: "Time" },
    { key: "guestCount", label: "Guests" },
    { key: "source", label: "Source", render: (row) => <Badge color={row.source === "online" ? "teal" : "ocean"}>{sourceLabels[row.source] || row.source}</Badge> },
    { key: "totalAmount", label: "Total", render: (row) => `₹${row.totalAmount}` },
    { key: "balanceAmount", label: "Balance", render: (row) => `₹${row.balanceAmount}` },
    {
      key: "status",
      label: "Status",
      render: (row) =>
        canEdit ? (
          <select
            className="rounded-lg border border-ocean-100 bg-white px-2 py-1 text-xs font-semibold"
            value={row.status}
            onChange={(e) => handleStatusChange(row._id, e.target.value)}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        ) : (
          <Badge color={statusColors[row.status] || "gray"}>{row.status.replace("_", " ")}</Badge>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ocean-900">Party / Event Bookings</h2>
        <div className="flex bg-ocean-50 rounded-lg p-1 border border-ocean-100">
          {[
            { v: "", label: "All Bookings" },
            { v: "online", label: "Online" },
            { v: "staff", label: "Staff" },
          ].map((o) => (
            <button
              key={o.v || "all"}
              onClick={() => setSource(o.v)}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${source === o.v ? "bg-white text-ocean-900 shadow-sm border border-ocean-200" : "text-ocean-500 hover:text-ocean-700 hover:bg-ocean-100/50"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
        {canCreate && (
          <button onClick={() => setShowForm((s) => !s)} className="btn-accent">
            <Plus size={16} /> New Booking
          </button>
        )}
      </div>

      {canCreate && showForm && (
        <form onSubmit={handleCreate} className="card grid grid-cols-2 gap-3">
          <div>
            <label className="label">Customer Name</label>
            <input className="input-field" required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
          </div>
          <div>
            <label className="label">Mobile</label>
            <input className="input-field" required value={form.customerMobile} onChange={(e) => setForm({ ...form, customerMobile: e.target.value })} />
          </div>
          <div>
            <label className="label">Event Type</label>
            <input className="input-field" required placeholder="Birthday, Corporate, Family..." value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })} />
          </div>
          <div>
            <label className="label">Guest Count</label>
            <input type="number" className="input-field" required value={form.guestCount} onChange={(e) => setForm({ ...form, guestCount: e.target.value })} />
          </div>
          <div>
            <label className="label">Event Date</label>
            <input type="date" className="input-field" required value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
          </div>
          <div>
            <label className="label">Event Time</label>
            <input className="input-field" required placeholder="4:00 PM - 7:00 PM" value={form.eventTime} onChange={(e) => setForm({ ...form, eventTime: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">Package Details</label>
            <input className="input-field" value={form.packageDetails} onChange={(e) => setForm({ ...form, packageDetails: e.target.value })} />
          </div>
          <div>
            <label className="label">Food Requirements</label>
            <input className="input-field" value={form.foodRequirements} onChange={(e) => setForm({ ...form, foodRequirements: e.target.value })} />
          </div>
          <div>
            <label className="label">Decoration Requirements</label>
            <input className="input-field" value={form.decorationRequirements} onChange={(e) => setForm({ ...form, decorationRequirements: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">Additional Activities</label>
            <input className="input-field" value={form.additionalActivities} onChange={(e) => setForm({ ...form, additionalActivities: e.target.value })} />
          </div>
          <div>
            <label className="label">Total Amount</label>
            <input type="number" className="input-field" required value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} />
          </div>
          <div>
            <label className="label">Advance Paid</label>
            <input type="number" className="input-field" value={form.advancePaid} onChange={(e) => setForm({ ...form, advancePaid: e.target.value })} />
          </div>
          <div className="col-span-2">
            <button type="submit" className="btn-accent w-full">Create Booking</button>
          </div>
        </form>
      )}

      {loading ? <p className="text-sm text-ocean-400">Loading...</p> : <Table columns={columns} rows={bookings} />}
    </div>
  );
};

export default Bookings;
