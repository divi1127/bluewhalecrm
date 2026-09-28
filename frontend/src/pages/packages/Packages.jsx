import React, { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import { useAuth } from "../../context/AuthContext";
import { formatDuration } from "../../utils/format";
import api from "../../api/axios";

const emptyForm = { name: "", price: "", below5Price: "", durationValue: "", durationUnit: "minutes", description: "" };

const Packages = () => {
  const { can } = useAuth();
  const [packages, setPackages] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const canCreate = can("packages", "create");
  const canEdit = can("packages", "edit");
  const canDelete = can("packages", "delete");

  const load = () => api.get("/packages").then(({ data }) => setPackages(data.data));

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await api.put(`/packages/${editingId}`, form);
    } else {
      await api.post("/packages", form);
    }
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    load();
  };

  const handleEdit = (pkg) => {
    setForm({
      name: pkg.name,
      price: pkg.price,
      below5Price: pkg.below5Price || "",
      durationValue: pkg.durationValue,
      durationUnit: pkg.durationUnit || "minutes",
      description: pkg.description || "",
    });
    setEditingId(pkg._id);
    setShowForm(true);
  };

  const handleToggleActive = async (pkg) => {
    if (pkg.active) {
      await api.put(`/packages/${pkg._id}`, { active: false });
    } else {
      await api.put(`/packages/${pkg._id}`, { active: true });
    }
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this package?")) return;
    try {
      await api.delete(`/packages/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "description", label: "Description" },
    { key: "price", label: "Price", render: (row) => `₹${row.price}` },
    { key: "below5Price", label: "Below-10 Price", render: (row) => (row.below5Price ? `₹${row.below5Price}` : "Free") },
    { key: "durationMinutes", label: "Duration", render: (row) => formatDuration(row) },
    { key: "active", label: "Status", render: (row) => <Badge color={row.active ? "green" : "gray"}>{row.active ? "Active" : "Inactive"}</Badge> },
    ...((canEdit || canDelete)
      ? [
          {
            key: "actions",
            label: "",
            render: (row) => (
              <div className="flex items-center gap-2">
                {canEdit && (
                  <button onClick={() => handleEdit(row)} title="Edit" className="btn-secondary py-1.5 text-xs">
                    <Pencil size={14} />
                  </button>
                )}
                {canEdit && (
                  <button onClick={() => handleToggleActive(row)} className="btn-secondary py-1.5 text-xs">
                    {row.active ? "Deactivate" : "Activate"}
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => handleDelete(row._id)} className="btn-secondary py-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50" title="Delete Permanently">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-ocean-900">Ticket / Packages</h2>
        {canCreate && (
          <button onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm((s) => !s); }} className="btn-accent">
            <Plus size={16} /> {showForm ? "Close" : "New Package"}
          </button>
        )}
      </div>

      {(canCreate || canEdit) && showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="label">Name</label>
            <input className="input-field" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Price (₹)</label>
            <input type="number" className="input-field" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div>
            <label className="label">Below-5 Price (₹ per child)</label>
            <input type="number" min="0" className="input-field" value={form.below5Price} placeholder="0 = free" onChange={(e) => setForm({ ...form, below5Price: e.target.value })} />
          </div>
          <div>
            <label className="label">Duration</label>
            <input type="number" className="input-field" required value={form.durationValue} onChange={(e) => setForm({ ...form, durationValue: e.target.value })} />
          </div>
          <div>
            <label className="label">Duration Unit</label>
            <select className="input-field" value={form.durationUnit} onChange={(e) => setForm({ ...form, durationUnit: e.target.value })}>
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
            </select>
          </div>
          <div className="col-span-1 md:col-span-2">
            <label className="label">Description</label>
            <input className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="col-span-1 md:col-span-2">
            <button type="submit" className="btn-accent w-full">
              {editingId ? "Update Package" : "Create Package"}
            </button>
          </div>
        </form>
      )}

      <Table columns={columns} rows={packages} />
    </div>
  );
};

export default Packages;
