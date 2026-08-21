import React, { useEffect, useState } from "react";
import { Plus, CheckCircle2, ScanFace, Camera } from "lucide-react";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import FaceCaptureModal from "../../components/face/FaceCaptureModal";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const emptyForm = { name: "", phone: "", designation: "", dob: "", joiningDate: "", salaryType: "monthly", salaryAmount: "" };
const thisMonth = () => new Date().toISOString().slice(0, 7);
const fmtMoney = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const StaffList = () => {
  const { can } = useAuth();
  const [staff, setStaff] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [createdLogin, setCreatedLogin] = useState(null);
  const [faceTarget, setFaceTarget] = useState(null);
  const [savingFace, setSavingFace] = useState(false);
  const [faceMsg, setFaceMsg] = useState(null);
  const [month, setMonth] = useState(thisMonth());
  const [monthly, setMonthly] = useState({}); // staffId -> monthly totals

  const canCreate = can("staff", "create");

  const load = () => api.get("/staff").then(({ data }) => setStaff(data.data));

  const loadMonthly = (m = month) =>
    api
      .get("/staff/monthly-summary", { params: { month: m } })
      .then(({ data }) => {
        const map = {};
        for (const row of data.data.rows) map[row.staffId] = row;
        setMonthly(map);
      })
      .catch(() => setMonthly({}));

  useEffect(() => {
    load();
    loadMonthly();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const { data } = await api.post("/staff", form);
    setCreatedLogin(data.data.login);
    setForm(emptyForm);
    setShowForm(false);
    load();
  };

  const handleFaceCaptured = async (descriptor) => {
    setSavingFace(true);
    try {
      await api.post(`/staff/${faceTarget._id}/face`, { descriptor });
      setFaceMsg(`Face registered for ${faceTarget.name} — they can now log in at the register.`);
      setFaceTarget(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Could not save the face. Please try again.");
    } finally {
      setSavingFace(false);
    }
  };

  const handleClearFace = async (row) => {
    if (!window.confirm(`Remove the registered face for ${row.name}?`)) return;
    await api.delete(`/staff/${row._id}/face`);
    setFaceMsg(`Face removed for ${row.name}.`);
    load();
  };

  const fmtDob = (row) => {
    if (!row.dob) return "—";
    return new Date(row.dob).toLocaleDateString("en-IN");
  };

  const columns = [
    { key: "staffId", label: "Login ID" },
    { key: "name", label: "Name" },
    { key: "designation", label: "Designation" },
    { key: "phone", label: "Phone" },
    { key: "dob", label: "Date of Birth", render: fmtDob },
    { key: "salaryType", label: "Salary Type" },
    { key: "salaryAmount", label: "Salary", render: (row) => `₹${row.salaryAmount}` },
    { key: "joiningDate", label: "Joined", render: (row) => new Date(row.joiningDate).toLocaleDateString("en-IN") },
    { key: "active", label: "Status", render: (row) => <Badge color={row.active ? "green" : "gray"}>{row.active ? "Active" : "Inactive"}</Badge> },
    {
      key: "presentDays",
      label: `Present (${month})`,
      render: (row) => {
        const m = monthly[row.staffId];
        if (!m) return <span className="text-ocean-300">—</span>;
        return (
          <span className="text-sm">
            <span className="font-bold text-emerald-600">{m.presentDays}</span>
            <span className="text-xs text-ocean-400"> / {m.presentDays + m.halfDays + m.leaveDays + m.absentDays} marked</span>
            {m.lateDays > 0 && <span className="ml-1 text-xs font-semibold text-amber-600">· {m.lateDays} late</span>}
          </span>
        );
      },
    },
    {
      key: "netSalary",
      label: `Salary (${month})`,
      render: (row) => {
        const m = monthly[row.staffId];
        if (!m) return <span className="text-ocean-300">—</span>;
        return <span className="font-semibold text-teal-600">{fmtMoney(m.netSalary)}</span>;
      },
    },
    {
      key: "face",
      label: "Face Login",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Badge color={row.faceRegistered ? "green" : "gray"}>{row.faceRegistered ? "Registered" : "Not set"}</Badge>
          <button onClick={() => setFaceTarget(row)} className="btn-secondary py-1.5 text-xs" title="Register face">
            <Camera size={13} /> {row.faceRegistered ? "Update" : "Register"}
          </button>
          {row.faceRegistered && (
            <button onClick={() => handleClearFace(row)} className="btn-secondary py-1.5 text-xs text-coral-600" title="Remove face">
              Clear
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-ocean-900">Staff Master</h2>
        <div className="flex items-end gap-3">
          <div>
            <label className="label">Monthly totals for</label>
            <input
              type="month"
              className="input-field"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value || thisMonth());
                if (e.target.value) loadMonthly(e.target.value);
              }}
            />
          </div>
          {canCreate && (
            <button onClick={() => setShowForm((s) => !s)} className="btn-accent">
              <Plus size={16} /> New Staff
            </button>
          )}
        </div>
      </div>

      {createdLogin && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">
          <p className="mb-1 flex items-center gap-2 font-bold">
            <CheckCircle2 size={16} className="text-teal-500" /> Staff login created
          </p>
          <p>
            Login ID: <strong className="font-mono">{createdLogin.username}</strong> &nbsp;·&nbsp; Password (DOB):{" "}
            <strong className="font-mono">{createdLogin.password}</strong>
          </p>
          <p className="mt-1 text-xs text-teal-600">Share these credentials with the staff member. Log in with the Login ID, then mark attendance from "My Attendance".</p>
        </div>
      )}

      {faceMsg && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">
          <p className="flex items-center gap-2">
            <ScanFace size={16} className="text-teal-500" /> {faceMsg}
          </p>
        </div>
      )}

      {canCreate && showForm && (
        <form onSubmit={handleCreate} className="card grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Name</label>
            <input className="input-field" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Designation</label>
            <input className="input-field" required value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          </div>
          <div>
            <label className="label">Date of Birth (used as login password)</label>
            <input type="date" className="input-field" required value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
          </div>
          <div>
            <label className="label">Joining Date</label>
            <input type="date" className="input-field" required value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} />
          </div>
          <div>
            <label className="label">Salary Type</label>
            <select className="input-field" value={form.salaryType} onChange={(e) => setForm({ ...form, salaryType: e.target.value })}>
              <option value="monthly">Monthly</option>
              <option value="daily">Daily</option>
            </select>
          </div>
          <div>
            <label className="label">Salary Amount (₹)</label>
            <input type="number" className="input-field" required value={form.salaryAmount} onChange={(e) => setForm({ ...form, salaryAmount: e.target.value })} />
          </div>
          <div className="col-span-2">
            <button type="submit" className="btn-accent w-full">Add Staff Member</button>
          </div>
        </form>
      )}

      <Table columns={columns} rows={staff} />

      {faceTarget && (
        <FaceCaptureModal
          onCaptured={savingFace ? () => {} : handleFaceCaptured}
          onClose={() => setFaceTarget(null)}
        />
      )}
    </div>
  );
};

export default StaffList;
