import React, { useEffect, useState } from "react";
import { Pencil, Plus, Power, KeyRound, UserCheck, ShieldCheck } from "lucide-react";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import api from "../../api/axios";

const MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "billing", label: "Billing" },
  { key: "billing_history", label: "Bill History" },
  { key: "entry", label: "Entry Scan" },
  { key: "customers", label: "Customer CRM" },
  { key: "enquiries", label: "Enquiries" },
  { key: "coupons", label: "Coupons" },
  { key: "bookings", label: "Party Bookings" },
  { key: "packages", label: "Packages" },
  { key: "staff", label: "Staff Master" },
  { key: "attendance", label: "Attendance" },
  { key: "reports", label: "Reports" },
  { key: "settings", label: "Attendance Settings" },
  { key: "users", label: "Users & Access" },
];

const ACTIONS = [
  { key: "view", label: "View" },
  { key: "create", label: "Create" },
  { key: "edit", label: "Edit" },
  { key: "delete", label: "Delete" },
];

const ROLE_LABELS = {
  super_admin: "Super Admin",
  admin: "Manager / Admin",
  billing_staff: "Billing Staff",
  cashier: "Cashier",
  entry_staff: "Entry Staff",
  hr_manager: "HR Manager",
};

const ROLE_COLORS = {
  super_admin: "red",
  admin: "amber",
  billing_staff: "teal",
  cashier: "teal",
  entry_staff: "gray",
  hr_manager: "amber",
};

const emptyForm = {
  name: "",
  email: "",
  username: "",
  phone: "",
  dob: "",
  password: "",
  role: "billing_staff",
  permissions: {},
  staffId: "",
};

const Control = () => {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const [staffList, setStaffList] = useState([]);

  const load = () => {
    api.get("/users").then(({ data }) => setUsers(data.data));
    api.get("/staff?active=true").then(({ data }) => setStaffList(data.data));
  };

  useEffect(() => {
    load();
  }, []);

  const flash = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let userId = editingId;
      if (editingId) {
        await api.put(`/users/${editingId}`, {
          name: form.name,
          email: form.email,
          username: form.username,
          phone: form.phone,
          dob: form.dob || undefined,
          role: form.role,
          permissions: form.permissions,
          password: form.password || undefined,
        });
        flash("User access updated");
      } else {
        const { data } = await api.post("/users", form);
        userId = data.data._id;
        flash("User created");
      }

      if (form.staffId) {
        await api.post(`/users/${userId}/link-staff`, { staffId: form.staffId });
      }

      resetForm();
      load();
    } catch (err) {
      flash(err.response?.data?.message || "Something went wrong", "error");
    }
  };

  const handleEdit = (u) => {
    const raw = u.permissions;
    const perms =
      raw && typeof raw === "object" && !Array.isArray(raw)
        ? raw
        : {};
    setForm({
      name: u.name,
      email: u.email || "",
      username: u.username || "",
      phone: u.phone || "",
      dob: u.dob || "",
      password: "",
      role: u.role,
      permissions: perms,
      staffId: u.staff?._id || "",
    });
    setEditingId(u._id);
    setShowForm(true);
  };

  const handleToggleActive = async (u) => {
    try {
      if (u.active) {
        await api.delete(`/users/${u._id}`);
        flash(`${u.name} deactivated — login revoked`);
      } else {
        await api.put(`/users/${u._id}`, { active: true });
        flash(`${u.name} activated`);
      }
      load();
    } catch (err) {
      flash(err.response?.data?.message || "Something went wrong", "error");
    }
  };

  const handleResetPassword = (u) => {
    setResetTarget(u);
    setNewPassword("");
  };

  const confirmResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      flash("Please type a new password (at least 6 characters)", "error");
      return;
    }
    try {
      const { data } = await api.post(`/users/${resetTarget._id}/reset-password`, { password: newPassword });
      flash(
        `Password set for ${resetTarget.name}: ${data.data.username || data.data.email} / ${data.data.password}`,
        "success"
      );
      setResetTarget(null);
      setNewPassword("");
    } catch (err) {
      flash(err.response?.data?.message || "Something went wrong", "error");
    }
  };

  const toggleAction = (key, action) => {
    setForm((f) => {
      const cur = f.permissions[key] || { view: false, create: false, edit: false, delete: false };
      const next = { ...cur, [action]: !cur[action] };
      return { ...f, permissions: { ...f.permissions, [key]: next } };
    });
  };

  const permissionCount = (u) => {
    const p = u.permissions;
    if (!p) return 0;
    if (Array.isArray(p)) return p.length;
    return Object.values(p).filter((m) => Object.values(m || {}).some(Boolean)).length;
  };

  const permissionLabel = (u) => {
    const p = u.permissions;
    if (!p || (Array.isArray(p) ? p.length === 0 : Object.keys(p).length === 0)) return "All modules (by role)";
    if (Array.isArray(p)) return p.map((k) => MODULES.find((m) => m.key === k)?.label || k).join(", ");
    return MODULES.filter((m) => p[m.key] && Object.values(p[m.key]).some(Boolean))
      .map((m) => m.label)
      .join(", ");
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "username", label: "Login ID", render: (row) => (row.username ? <span className="font-mono text-xs">{row.username}</span> : "—") },
    { key: "email", label: "Email", render: (row) => <span className="text-xs text-ocean-500">{row.email || "—"}</span> },
    {
      key: "role",
      label: "Role",
      render: (row) => <Badge color={ROLE_COLORS[row.role] || "gray"}>{ROLE_LABELS[row.role] || row.role}</Badge>,
    },
    {
      key: "staff",
      label: "Staff Link",
      render: (row) => (row.staff ? `${row.staff.name} (${row.staff.staffId})` : <span className="text-ocean-300">Standalone</span>),
    },
    { key: "active", label: "Status", render: (row) => <Badge color={row.active ? "green" : "gray"}>{row.active ? "Active" : "Inactive"}</Badge> },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button onClick={() => handleEdit(row)} title="Edit / Access" className="btn-secondary py-1.5 text-xs">
            <Pencil size={13} />
          </button>
          <button onClick={() => handleResetPassword(row)} title="Reset password" className="btn-secondary py-1.5 text-xs">
            <KeyRound size={13} />
          </button>
          <button onClick={() => handleToggleActive(row)} title={row.active ? "Deactivate" : "Activate"} className="btn-secondary py-1.5 text-xs">
            <Power size={13} />
          </button>
        </div>
      ),
    },
  ];

  const cashierUsers = users.filter((u) => ["cashier", "billing_staff"].includes(u.role));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ocean-900">Control — Users & Access</h2>
        <button
          onClick={() => { resetForm(); setShowForm((s) => !s); }}
          className="btn-accent"
        >
          <Plus size={16} /> {showForm ? "Close" : "New User"}
        </button>
      </div>

      {msg && (
        <div className={`rounded-xl border p-4 text-sm ${msg.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-teal-200 bg-teal-50 text-teal-800"}`}>
          {msg.text}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setTab("users")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${tab === "users" ? "bg-ocean-700 text-white" : "bg-white text-ocean-600 ring-1 ring-ocean-100"}`}
        >
          <ShieldCheck size={15} /> Users & Access
        </button>
        <button
          onClick={() => setTab("cashiers")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${tab === "cashiers" ? "bg-teal-500 text-white" : "bg-white text-ocean-600 ring-1 ring-ocean-100"}`}
        >
          <UserCheck size={15} /> Cashier Staff ({cashierUsers.length})
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-2 gap-3">
          <div>
            <label className="label">Full Name</label>
            <input className="input-field" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="admin">Manager / Admin</option>
              <option value="billing_staff">Billing Staff</option>
              <option value="cashier">Cashier</option>
              <option value="entry_staff">Entry Staff</option>
              <option value="hr_manager">HR Manager</option>
            </select>
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Login ID (username)</label>
            <input className="input-field" placeholder="optional, else email is used" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div>
            <label className="label">Password {editingId ? "(leave blank to keep)" : "(blank = DOB as password)"}</label>
            <input type="text" className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label className="label">Date of Birth</label>
            <input type="date" className="input-field" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">Link to Staff Profile (optional)</label>
            <select className="input-field" value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })}>
              <option value="">-- None --</option>
              {staffList.map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.staffId})</option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="label">Module Permissions</label>
            <p className="mb-2 text-xs text-ocean-400">
              Tick the actions a user may perform in each module. A module with no ticked actions = no access.
              Leave everything empty = full access by role.
            </p>
            <div className="overflow-x-auto rounded-xl border border-ocean-100">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-ocean-100 bg-ocean-50 text-xs font-semibold uppercase text-ocean-500">
                    <th className="px-3 py-2">Module</th>
                    {ACTIONS.map((a) => (
                      <th key={a.key} className="px-3 py-2 text-center">{a.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODULES.map((m) => {
                    const row = form.permissions[m.key] || {};
                    return (
                      <tr key={m.key} className="border-b border-ocean-50 last:border-0">
                        <td className="px-3 py-1.5 font-semibold text-ocean-700">{m.label}</td>
                        {ACTIONS.map((a) => (
                          <td key={a.key} className="px-3 py-1.5 text-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-teal-500"
                              checked={!!row[a.key]}
                              onChange={() => toggleAction(m.key, a.key)}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-span-2">
            <button type="submit" className="btn-accent w-full">
              {editingId ? "Update User & Access" : "Create User"}
            </button>
          </div>
        </form>
      )}

      {tab === "users" && <Table columns={columns} rows={users} emptyMessage="No users found" />}

      {tab === "cashiers" && (
        <div className="space-y-4">
          <div className="card flex flex-wrap gap-6 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ocean-400">Cashier accounts</p>
              <p className="mt-1 text-2xl font-extrabold text-ocean-900">{cashierUsers.length}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ocean-400">Active cashiers</p>
              <p className="mt-1 text-2xl font-extrabold text-teal-500">{cashierUsers.filter((u) => u.active).length}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ocean-400">Deactivated</p>
              <p className="mt-1 text-2xl font-extrabold text-coral-500">{cashierUsers.filter((u) => !u.active).length}</p>
            </div>
          </div>

          {cashierUsers.length === 0 ? (
            <div className="card py-12 text-center text-sm text-ocean-400">
              No cashier accounts yet. Use <strong>New User</strong> and pick the <strong>Cashier</strong> role.
            </div>
          ) : (
            <Table columns={columns} rows={cashierUsers} />
          )}

          <div className="card">
            <h3 className="mb-2 text-sm font-bold text-ocean-900">Cashier module access</h3>
            <p className="mb-3 text-xs text-ocean-500">
              Cashiers are allowed to open Billing by default. Additional modules can be granted per cashier from their edit window above.
            </p>
            <div className="flex flex-wrap gap-2">
              {cashierUsers.map((u) => (
                <span key={u._id} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${u.active ? "bg-teal-50 text-teal-700 ring-1 ring-teal-200" : "bg-ocean-50 text-ocean-400"}`}>
                  {u.username || u.email || u.name} —{" "}
                  {permissionCount(u) === 0 ? "All modules" : `${permissionCount(u)} modules (${permissionLabel(u)})`}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <h3 className="mb-1 text-lg font-bold text-ocean-900">Reset Password</h3>
            <p className="mb-4 text-sm text-ocean-500">
              Type the new password for <strong>{resetTarget.name}</strong> and set it. They will log in with this
              password.
            </p>
            <input
              type="text"
              className="input-field mb-4"
              placeholder="New password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setResetTarget(null)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={confirmResetPassword} className="btn-primary">
                Set Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Control;
