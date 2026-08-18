import React, { useEffect, useState } from "react";
import { Search, History, MapPin, Phone, Wallet, Repeat, CalendarCheck } from "lucide-react";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import StatCard from "../../components/common/StatCard";
import api from "../../api/axios";

const typeColors = { new: "teal", regular: "ocean", vip: "amber", inactive: "gray" };

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState(null); // { customer, bills }

  const load = async (q = "") => {
    setLoading(true);
    const { data } = await api.get("/customers", { params: { search: q, limit: 50 } });
    setCustomers(data.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    load(search);
  };

  const handleHistory = async (row) => {
    const [custRes, billsRes] = await Promise.all([
      api.get(`/customers/${row._id}`),
      api.get(`/billing/customer/${row._id}`),
    ]);
    setHistory({ customer: custRes.data.data, bills: billsRes.data.data });
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "mobile", label: "Mobile" },
    {
      key: "customerType",
      label: "Type",
      render: (row) => <Badge color={typeColors[row.customerType]}>{row.customerType}</Badge>,
    },
    { key: "totalVisits", label: "Visits" },
    { key: "totalSpending", label: "Total Spent", render: (row) => `₹${row.totalSpending}` },
    {
      key: "lastVisitDate",
      label: "Last Visit",
      render: (row) => (row.lastVisitDate ? new Date(row.lastVisitDate).toLocaleDateString("en-IN") : "—"),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <button onClick={() => handleHistory(row)} className="btn-secondary py-1.5 text-xs">
          <History size={14} /> History
        </button>
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
    { key: "baseAmount", label: "Base", render: (row) => `₹${row.baseAmount}` },
    { key: "discount", label: "Discount", render: (row) => (row.discount ? `-₹${row.discount}` : "—") },
    { key: "finalAmount", label: "Paid", render: (row) => <span className="font-bold text-ocean-900">₹{row.finalAmount}</span> },
    { key: "paymentMode", label: "Payment" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ocean-900">Customer CRM</h2>
      </div>

      <form onSubmit={handleSearch} className="flex max-w-md gap-2">
        <input
          className="input-field"
          placeholder="Search by name or mobile"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn-secondary shrink-0">
          <Search size={16} /> Search
        </button>
      </form>

      {loading ? <p className="text-sm text-ocean-400">Loading...</p> : <Table columns={columns} rows={customers} />}

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
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-display text-xl font-extrabold">{history.customer.name}</p>
                  <div className="mt-2 space-y-1 text-sm text-teal-100">
                    <p className="flex items-center gap-1.5"><Phone size={13} /> {history.customer.mobile}</p>
                    {history.customer.whatsapp && (
                      <p className="flex items-center gap-1.5"><Repeat size={13} /> {history.customer.whatsapp}</p>
                    )}
                    {history.customer.address && (
                      <p className="flex items-center gap-1.5"><MapPin size={13} /> {history.customer.address}</p>
                    )}
                  </div>
                </div>
                <Badge color={typeColors[history.customer.customerType]}>{history.customer.customerType}</Badge>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard label="Total Visits" value={history.customer.totalVisits} icon={CalendarCheck} accent="ocean" />
              <StatCard label="Total Spending" value={`₹${history.customer.totalSpending}`} icon={Wallet} accent="teal" />
              <StatCard
                label="Last Visit"
                value={history.customer.lastVisitDate ? new Date(history.customer.lastVisitDate).toLocaleDateString("en-IN") : "—"}
                icon={History}
                accent="coral"
              />
            </div>

            <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-ocean-500">Spending History</h4>
            <Table columns={historyColumns} rows={history.bills} emptyMessage="No bills yet for this customer" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
