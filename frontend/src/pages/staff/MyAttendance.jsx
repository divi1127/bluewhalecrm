import React, { useEffect, useState } from "react";
import { LogIn, LogOut, UserCircle2, MapPin, AlertTriangle } from "lucide-react";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import FaceCapture from "../../components/common/FaceCapture";
import api from "../../api/axios";

const statusColors = { present: "green", absent: "red", "half-day": "amber", leave: "gray" };

const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—");

// Capture a GPS position if the browser allows it. Returns null when unavailable/denied.
const getPosition = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  });

const MyAttendance = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState(null);
  const [pendingAction, setPendingAction] = useState(null); // "checkin" | "checkout"
  const [gpsNote, setGpsNote] = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get("/attendance/me");
      setData(data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load your attendance");
    }
  };

  useEffect(() => {
    load();
    api.get("/settings/attendance").then(({ data }) => setSettings(data.data)).catch(() => setSettings(null));
  }, []);

  // Decide what the current step requires based on enforcement settings.
  const faceRequiredFor = (scope) =>
    settings?.faceVerification?.method === "photo_capture_store" &&
    (settings.faceVerification.enforcedOn || []).includes(scope);

  const gpsMode = () => settings?.gps?.enforcement || "recorded";

  const runAction = async (scope, facePhoto, gps) => {
    setBusy(true);
    setGpsNote(null);
    try {
      const payload = {};
      if (facePhoto) payload.facePhoto = facePhoto;
      if (gps) payload.gps = gps;

      if (scope === "checkin") await api.post("/attendance/me/checkin", payload);
      else await api.post("/attendance/me/checkout", payload);
      setPendingAction(null);
      load();
    } catch (err) {
      const msg = err.response?.data?.message;
      setGpsNote({ type: "error", text: msg || "Something went wrong" });
      setPendingAction(null);
    } finally {
      setBusy(false);
    }
  };

  const handleAction = async (scope) => {
    const gps = await getPosition();
    const mode = gpsMode();

    if (mode === "required" && !gps) {
      setGpsNote({
        type: "error",
        text: "GPS location is required for attendance — enable your location and try again.",
      });
      return;
    }
    if (mode !== "off" && !gps) {
      setGpsNote({
        type: "warn",
        text: "Could not get your location — recording this attendance without GPS.",
      });
    }

    if (faceRequiredFor(scope)) {
      setPendingAction({ scope, gps });
    } else {
      await runAction(scope, null, gps);
    }
  };

  const today = data?.today;
  const columns = [
    { key: "date", label: "Date" },
    { key: "checkIn", label: "Check In", render: (row) => fmtTime(row.checkIn) },
    { key: "checkOut", label: "Check Out", render: (row) => fmtTime(row.checkOut) },
    { key: "status", label: "Status", render: (row) => <Badge color={statusColors[row.status]}>{row.status}</Badge> },
    { key: "overtimeHours", label: "Overtime (hrs)", render: (row) => row.overtimeHours || 0 },
    {
      key: "gps",
      label: "Location",
      render: (row) =>
        row.gps && typeof row.gps.lat === "number" ? (
          <span className="inline-flex items-center gap-1 text-xs text-ocean-500">
            <MapPin size={12} />
            {row.gps.lat.toFixed(4)}, {row.gps.lng.toFixed(4)}
          </span>
        ) : (
          "—"
        ),
    },
  ];

  if (error) {
    return (
      <div className="card max-w-2xl">
        <p className="text-sm font-medium text-coral-500">{error}</p>
      </div>
    );
  }

  if (!data?.staff) {
    return (
      <div className="card flex max-w-2xl items-start gap-3">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500" />
        <div>
          <h2 className="text-base font-bold text-ocean-900">My Attendance unavailable</h2>
          <p className="mt-1 text-sm text-ocean-500">
            No staff profile is linked to this login, so you can't view or mark attendance here. Contact an admin to link your account to a staff member.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card max-w-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ocean-100 text-ocean-600">
            <UserCircle2 size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ocean-900">{data?.staff?.name || "My Attendance"}</h2>
            <p className="text-sm text-ocean-400">
              {data?.staff?.staffId} · {data?.staff?.designation}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-ocean-100 bg-ocean-50/40 p-4">
          <p className="mb-3 text-sm font-semibold text-ocean-700">Today's Status</p>
          <div className="flex flex-wrap items-center gap-4">
            <Badge color={today ? statusColors[today.status] : "gray"}>
              {today ? today.status : "Not marked"}
            </Badge>
            <div className="flex items-center gap-3 text-sm text-ocean-600">
              <span>
                In: <strong className="text-ocean-900">{fmtTime(today?.checkIn)}</strong>
              </span>
              <span>
                Out: <strong className="text-ocean-900">{fmtTime(today?.checkOut)}</strong>
              </span>
            </div>
            <div className="ml-auto flex flex-wrap gap-2">
              <button
                onClick={() => handleAction("checkin")}
                disabled={busy || !!today?.checkIn}
                className="btn-secondary"
              >
                <LogIn size={15} /> Check In
              </button>
              <button
                onClick={() => handleAction("checkout")}
                disabled={busy || !today?.checkIn || !!today?.checkOut}
                className="btn-secondary"
              >
                <LogOut size={15} /> Check Out
              </button>
            </div>
          </div>
          {gpsNote && (
            <div
              className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${
                gpsNote.type === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              {gpsNote.type === "error" ? <AlertTriangle size={14} className="mt-0.5 shrink-0" /> : <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
              {gpsNote.text}
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-bold text-ocean-900">Recent Attendance</h3>
        <Table columns={columns} rows={data?.recent || []} emptyMessage="No attendance records yet" />
      </div>

      {pendingAction && (
        <FaceCapture
          onCapture={(photo) => runAction(pendingAction.scope, photo, pendingAction.gps)}
          onClose={() => setPendingAction(null)}
        />
      )}
    </div>
  );
};

export default MyAttendance;
