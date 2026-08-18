import React, { useEffect, useState } from "react";
import { Camera, MapPin, CalendarClock, CalendarOff, CheckCircle2, AlertTriangle, Save, ShieldAlert } from "lucide-react";
import Badge from "../../components/common/Badge";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const FACE_METHODS = [
  {
    value: "photo_capture_store",
    label: "Photo capture + store",
    desc: "Staff photo is captured and stored with each record — the park keeps an audit trail for every check-in/check-out.",
    recommended: true,
  },
  {
    value: "none",
    label: "Disabled",
    desc: "No photo required. Attendance is recorded without any face-verification step.",
    recommended: false,
  },
];

const ENFORCED_ON = [
  { value: "login", label: "Login" },
  { value: "checkin", label: "Attendance check-in" },
  { value: "checkout", label: "Attendance check-out" },
];

const GPS_MODES = [
  {
    value: "recorded",
    label: "Recorded, warn if off",
    desc: "Location is recorded with every check-in/check-out. If GPS is off, the staff member is shown a warning but can still proceed.",
    recommended: true,
  },
  {
    value: "required",
    label: "Required — block if off",
    desc: "Check-in/check-out is blocked until a valid GPS location is captured.",
    recommended: false,
  },
  {
    value: "off",
    label: "Off",
    desc: "No location is recorded.",
    recommended: false,
  },
];

const SCOPE_LABELS = { login: "Login", checkin: "Check-in", checkout: "Check-out" };

const AttendanceSettings = () => {
  const { can } = useAuth();
  const canEdit = can("settings", "edit");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState({
    method: "photo_capture_store",
    enforcedOn: ["login", "checkin", "checkout"],
    gps: "recorded",
    allowedLeaves: 2,
  });

  useEffect(() => {
    api
      .get("/settings/attendance")
      .then(({ data }) => {
        const s = data.data;
        setForm({
          method: s.faceVerification?.method || "photo_capture_store",
          enforcedOn: s.faceVerification?.enforcedOn || ["login", "checkin", "checkout"],
          gps: s.gps?.enforcement || "recorded",
          allowedLeaves: s.salary?.allowedLeavesPerMonth ?? 2,
        });
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const flash = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 5000);
  };

  const toggleScope = (value) =>
    setForm((f) => ({
      ...f,
      enforcedOn: f.enforcedOn.includes(value)
        ? f.enforcedOn.filter((v) => v !== value)
        : [...f.enforcedOn, value],
    }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put("/settings/attendance", {
        faceVerification: { method: form.method, enforcedOn: form.enforcedOn },
        gps: { enforcement: form.gps },
        salary: { allowedLeavesPerMonth: form.allowedLeaves },
      });
      const s = data.data;
      setForm({
        method: s.faceVerification?.method || form.method,
        enforcedOn: s.faceVerification?.enforcedOn || form.enforcedOn,
        gps: s.gps?.enforcement || form.gps,
        allowedLeaves: s.salary?.allowedLeavesPerMonth ?? form.allowedLeaves,
      });
      flash("Attendance enforcement settings saved");
    } catch (err) {
      flash(err.response?.data?.message || "Could not save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const methodMeta = FACE_METHODS.find((m) => m.value === form.method);
  const gpsMeta = GPS_MODES.find((m) => m.value === form.gps);

  if (!loaded) {
    return (
      <div className="card max-w-2xl py-12 text-center text-sm text-ocean-400">Loading settings…</div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {msg && (
        <div
          className={`flex items-start gap-2 rounded-xl border p-4 text-sm font-semibold ${
            msg.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-teal-200 bg-teal-50 text-teal-800"
          }`}
        >
          {msg.type === "error" ? <AlertTriangle size={16} className="mt-0.5" /> : <CheckCircle2 size={16} className="mt-0.5" />}
          {msg.text}
        </div>
      )}

      {/* ── Face verification method ── */}
      <div className="card">
        <h3 className="mb-1 flex items-center gap-2 font-bold text-ocean-900">
          <Camera size={18} className="text-teal-500" /> Face verification method
        </h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {FACE_METHODS.map((m) => (
            <label
              key={m.value}
              className={`cursor-pointer rounded-xl border-2 p-4 transition ${
                form.method === m.value
                  ? "border-teal-500 bg-teal-50/60"
                  : "border-ocean-100 bg-white hover:border-ocean-200"
              }`}
            >
              <input
                type="radio"
                name="method"
                className="sr-only"
                checked={form.method === m.value}
                onChange={() => setForm((f) => ({ ...f, method: m.value }))}
              />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ocean-900">{m.label}</span>
                {m.recommended && <Badge color="teal">Recommended</Badge>}
              </div>
              <p className="mt-1 text-xs text-ocean-500">{m.desc}</p>
            </label>
          ))}
        </div>
      </div>

      {/* ── When enforced ── */}
      <div className="card">
        <h3 className="mb-1 flex items-center gap-2 font-bold text-ocean-900">
          <CalendarClock size={18} className="text-teal-500" /> When enforced
        </h3>
        <p className="mb-3 text-xs text-ocean-500">
          Where the photo + location are captured. Unselecting a step softens the enforcement for it.
        </p>
        <div className="flex flex-wrap gap-2">
          {ENFORCED_ON.map((s) => {
            const on = form.enforcedOn.includes(s.value);
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => toggleScope(s.value)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  on
                    ? "border-teal-500 bg-teal-500 text-white"
                    : "border-ocean-200 bg-white text-ocean-600 hover:border-ocean-300"
                }`}
              >
                {s.label} {on ? "· On" : "· Off"}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-ocean-400">
          Currently enforced at:{" "}
          {form.enforcedOn.length > 0
            ? form.enforcedOn.map((v) => SCOPE_LABELS[v]).join(", ")
            : "Nowhere (records still captured)"}
        </p>
      </div>

      {/* ── GPS enforcement ── */}
      <div className="card">
        <h3 className="mb-1 flex items-center gap-2 font-bold text-ocean-900">
          <MapPin size={18} className="text-teal-500" /> GPS enforcement
        </h3>
        <div className="mt-3 space-y-3">
          {GPS_MODES.map((m) => (
            <label
              key={m.value}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition ${
                form.gps === m.value
                  ? "border-teal-500 bg-teal-50/60"
                  : "border-ocean-100 bg-white hover:border-ocean-200"
              }`}
            >
              <input
                type="radio"
                name="gps"
                className="mt-0.5"
                checked={form.gps === m.value}
                onChange={() => setForm((f) => ({ ...f, gps: m.value }))}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ocean-900">{m.label}</span>
                  {m.recommended && <Badge color="teal">Recommended</Badge>}
                </div>
                <p className="mt-1 text-xs text-ocean-500">{m.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* ── Leave & Salary policy ── */}
      <div className="card">
        <h3 className="mb-1 flex items-center gap-2 font-bold text-ocean-900">
          <CalendarOff size={18} className="text-teal-500" /> Leave & Salary policy
        </h3>
        <p className="mb-3 text-xs text-ocean-500">
          Paid leaves allowed per month for every staff member and cashier. Any leave taken beyond this
          deducts one day's salary for each extra day.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-40">
            <label className="label">Paid leaves / month</label>
            <input
              type="number"
              min="0"
              max="31"
              className="input-field"
              value={form.allowedLeaves}
              onChange={(e) => setForm((f) => ({ ...f, allowedLeaves: Math.max(0, Number(e.target.value) || 0) }))}
            />
          </div>
          <p className="pb-2 text-xs text-ocean-400">
            e.g. 3 leaves in a month with {form.allowedLeaves} allowed → 1 day's salary deducted.
          </p>
        </div>
      </div>

      {/* ── Review ── */}
      <div className="card border-ocean-200 bg-ocean-50/40">
        <h3 className="mb-3 flex items-center gap-2 font-bold text-ocean-900">
          <CheckCircle2 size={18} className="text-teal-500" /> Review
        </h3>
        <div className="space-y-2 text-sm text-ocean-800">
          <p>
            <span className="font-semibold">Face verification method:</span> {methodMeta?.label}
            {methodMeta?.recommended && <span className="ml-1 text-xs text-teal-600">(Recommended)</span>}
          </p>
          <p>
            <span className="font-semibold">When enforced:</span>{" "}
            {form.enforcedOn.length > 0 ? form.enforcedOn.map((v) => SCOPE_LABELS[v]).join(" + ") : "None"}
            {form.enforcedOn.includes("login") && form.enforcedOn.includes("checkin") && form.enforcedOn.includes("checkout") && (
              <span className="ml-1 text-xs text-teal-600">(Recommended)</span>
            )}
          </p>
          <p>
            <span className="font-semibold">GPS enforcement:</span> {gpsMeta?.label}
            {gpsMeta?.recommended && <span className="ml-1 text-xs text-teal-600">(Recommended)</span>}
          </p>
          <p>
            <span className="font-semibold">Leave policy:</span> {form.allowedLeaves} paid{" "}
            {form.allowedLeaves === 1 ? "leave" : "leaves"} per month — extra leaves deduct one day's salary each.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {!canEdit ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
            <ShieldAlert size={15} className="mt-0.5 shrink-0" />
            View only — you don't have permission to change these settings.
          </div>
        ) : (
          <button type="submit" className="btn-accent" disabled={saving}>
            <Save size={16} /> {saving ? "Saving…" : "Confirm"}
          </button>
        )}
      </div>
    </form>
  );
};

export default AttendanceSettings;
