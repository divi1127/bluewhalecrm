import React, { useEffect, useState } from "react";
import { Search, MessageSquare, Trash2, Eye } from "lucide-react";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import api from "../../api/axios";

const statusColors = { new: "coral", contacted: "teal", closed: "gray" };
const sourceLabels = { landing: "Website", walk_in: "Walk-in", phone: "Phone" };

const Enquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");

  const load = async (q = "", st = "") => {
    setLoading(true);
    const { data } = await api.get("/enquiries", { params: { search: q, status: st, limit: 50 } });
    setEnquiries(data.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    load(search, status);
  };

  const handleFilter = (st) => {
    setStatus(st);
    load(search, st);
  };

  const open = (row) => {
    setSelected(row);
    setNote(row.notes || "");
  };

  const saveStatus = async (e) => {
    const newStatus = e.target.value;
    if (!newStatus || newStatus === selected.status) return;
    const { data } = await api.put(`/enquiries/${selected._id}`, { status: newStatus, notes: note });
    setSelected(data.data);
    setEnquiries((prev) => prev.map((en) => (en._id === data.data._id ? data.data : en)));
  };

  const saveNote = async () => {
    if (note === selected.notes) return;
    const { data } = await api.put(`/enquiries/${selected._id}`, { notes: note });
    setSelected(data.data);
    setEnquiries((prev) => prev.map((en) => (en._id === data.data._id ? data.data : en)));
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete this enquiry from ${row.name}?`)) return;
    await api.delete(`/enquiries/${row._id}`);
    setEnquiries((prev) => prev.filter((en) => en._id !== row._id));
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "mobile", label: "Mobile" },
    { key: "email", label: "Email", render: (row) => row.email || "—" },
    {
      key: "message",
      label: "Message",
      render: (row) => (row.message ? <span className="max-w-[260px] truncate block">{row.message}</span> : "—"),
    },
    { key: "source", label: "Source", render: (row) => sourceLabels[row.source] || row.source },
    {
      key: "status",
      label: "Status",
      render: (row) => <Badge color={statusColors[row.status]}>{row.status}</Badge>,
    },
    {
      key: "createdAt",
      label: "Received",
      render: (row) => new Date(row.createdAt).toLocaleDateString("en-IN"),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button onClick={() => open(row)} className="btn-secondary py-1.5 text-xs">
            <Eye size={14} /> View
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="btn-secondary border-coral-200 py-1.5 text-xs text-coral-600 hover:bg-coral-50"
            title="Delete enquiry"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ocean-900">Enquiries</h2>
        <div className="flex items-center gap-1">
          {["", "new", "contacted", "closed"].map((st) => (
            <button
              key={st || "all"}
              onClick={() => handleFilter(st)}
              className={`btn-secondary px-3 py-1.5 text-xs ${status === st ? "bg-ocean-700 text-white" : ""}`}
            >
              {st ? st[0].toUpperCase() + st.slice(1) : "All"}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex max-w-md gap-2">
        <input
          className="input-field"
          placeholder="Search by name, mobile or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn-secondary shrink-0">
          <Search size={16} /> Search
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-ocean-400">Loading...</p>
      ) : (
        <Table columns={columns} rows={enquiries} emptyMessage="No enquiries yet" />
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-ocean-900">
                <MessageSquare size={18} /> Enquiry Details
              </h3>
              <button onClick={() => setSelected(null)} className="btn-accent">
                Close
              </button>
            </div>

            <div className="mb-4 space-y-2 rounded-xl bg-ocean-50 p-4 text-sm">
              <p>
                <strong className="text-ocean-900">{selected.name}</strong> ·{" "}
                <span className="text-ocean-600">{selected.mobile}</span>
              </p>
              {selected.email && <p className="text-ocean-600">{selected.email}</p>}
              <Badge color={statusColors[selected.status]}>{selected.status}</Badge>
            </div>

            {selected.message && (
              <p className="mb-4 rounded-xl border border-ocean-100 p-4 text-sm text-ocean-700">{selected.message}</p>
            )}

            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-ocean-500">Status</label>
            <select value={selected.status} onChange={saveStatus} className="input-field mb-4">
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="closed">Closed</option>
            </select>

            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-ocean-500">Follow-up Note</label>
            <textarea
              className="input-field mb-3"
              rows="3"
              placeholder="Note how this lead was followed up..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setSelected(null)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={saveNote} className="btn-primary">
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Enquiries;