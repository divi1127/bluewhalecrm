import React, { useEffect, useState } from "react";
import { ScanLine, CheckCircle2, XCircle, LogOut, LogIn, Undo2, MapPin, Users, Clock } from "lucide-react";
import api from "../../api/axios";

// Extract tag ID and zone from verification URL
const extractTagInfo = (raw) => {
  const s = String(raw).trim();
  let zone = null;
  if (s.includes("zone=indoor") || s.includes("INDOOR")) zone = "indoor";
  if (s.includes("zone=outdoor") || s.includes("OUTDOOR")) zone = "outdoor";

  let tagId = s;
  if (s.startsWith("{")) {
    try {
      tagId = JSON.parse(s).id || s;
    } catch {
      tagId = s;
    }
  }
  if (s.startsWith("http")) {
    const m = s.match(/\/scan-tag\/([^/?#]+)/);
    if (m) tagId = decodeURIComponent(m[1]);
    const q = s.match(/[?&]tagId=([^&]+)/);
    if (q) tagId = decodeURIComponent(q[1]);
  }
  return { tagId, zone };
};

const extractTagId = (raw) => extractTagInfo(raw).tagId;

const ScanEntry = () => {
  const [mode, setMode] = useState("entry"); // "entry" | "exit"
  const [zone, setZone] = useState("indoor"); // "indoor" | "outdoor"
  const [tagId, setTagId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeGuests, setActiveGuests] = useState([]);

  // Fetch active guests inside the park
  const loadActiveGuests = async () => {
    try {
      const { data } = await api.get("/entry/active");
      setActiveGuests(data.data || []);
    } catch (err) {
      console.error("Failed to load active guests", err);
    }
  };

  useEffect(() => {
    loadActiveGuests();
    const interval = setInterval(loadActiveGuests, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleScan = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    const info = extractTagInfo(tagId);
    // Use selected zone as fallback if not in the scanned QR URL
    const targetZone = info.zone || zone;

    try {
      const endpoint = mode === "entry" ? "/entry/scan" : "/entry/exit";
      const { data } = await api.post(endpoint, { tagId: info.tagId, zone: targetZone });
      setResult({ ...data.data, scannedZone: targetZone });
      loadActiveGuests();
    } catch (err) {
      setError(err.response?.data?.message || "Scan failed");
    } finally {
      setLoading(false);
      setTagId("");
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setResult(null);
    setError(null);
    setTagId("");
  };

  const isExit = mode === "exit";

  // Filter list based on selected zone's active status
  const displayedGuests = activeGuests.filter((g) => {
    if (zone === "indoor") return g.indoorStatus === "active";
    if (zone === "outdoor") return g.outdoorStatus === "active";
    return g.status === "active";
  });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* SCANNING CONTROL CARD */}
      <div className="card">
        {/* Entry/Exit Action Mode Selector */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => switchMode("entry")}
            className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-bold transition flex items-center justify-center gap-1.5 ${
              !isExit ? "bg-teal-500 text-white shadow-sm" : "bg-ocean-50 text-ocean-600 hover:bg-ocean-100"
            }`}
          >
            <LogIn size={15} /> Entry Scan
          </button>
          <button
            onClick={() => switchMode("exit")}
            className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-bold transition flex items-center justify-center gap-1.5 ${
              isExit ? "bg-coral-500 text-white shadow-sm" : "bg-ocean-50 text-ocean-600 hover:bg-ocean-100"
            }`}
          >
            <LogOut size={15} /> Exit Scan
          </button>
        </div>

        {/* Zone Selector */}
        <div className="mb-5">
          <label className="label text-[10px] font-bold uppercase tracking-wider text-ocean-400">Select Scanning Gate</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {[
              { id: "indoor", label: "Indoor Zone" },
              { id: "outdoor", label: "Outdoor Zone" },
            ].map((z) => (
              <button
                key={z.id}
                type="button"
                onClick={() => {
                  setZone(z.id);
                  setResult(null);
                  setError(null);
                }}
                className={`rounded-lg py-1.5 text-xs font-semibold border transition ${
                  zone === z.id
                    ? "bg-ocean-900 text-white border-ocean-900"
                    : "bg-white text-ocean-700 border-ocean-200 hover:bg-ocean-50"
                }`}
              >
                {z.label}
              </button>
            ))}
          </div>
        </div>

        <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-ocean-900">
          <ScanLine size={20} className={isExit ? "text-coral-500" : "text-teal-500"} />
          {isExit ? "Exit QR Verification" : "Entry QR Verification"}
        </h2>
        <p className="mb-5 text-xs text-ocean-400">
          {isExit
            ? `Scan QR or type Tag ID to check customer out of ${zone === "general" ? "the Park" : zone === "indoor" ? "Indoor Zone" : "Outdoor Zone"}.`
            : `Scan QR or type Tag ID to allow entry into ${zone === "general" ? "the Park" : zone === "indoor" ? "Indoor Zone" : "Outdoor Zone"}.`}
        </p>

        <form onSubmit={handleScan} className="flex gap-2">
          <input
            autoFocus
            className="input-field font-mono"
            placeholder="WT-XXXXXXXX"
            value={tagId}
            onChange={(e) => setTagId(e.target.value.toUpperCase())}
          />
          <button type="submit" disabled={loading || !tagId} className={`btn-accent shrink-0 ${isExit ? "!bg-coral-500" : ""}`}>
            {loading ? "Checking..." : isExit ? "Check Out" : "Verify"}
          </button>
        </form>
      </div>

      {/* SCAN RESULTS */}
      {error && (
        <div className="card flex items-start gap-3 border-coral-200 bg-coral-50 animate-shake">
          <XCircle className="mt-0.5 shrink-0 text-coral-500" size={20} />
          <p className="text-sm font-semibold text-coral-600">{error}</p>
        </div>
      )}

      {result && !isExit && (
        <div className="card border-teal-200 bg-teal-50/50">
          <div className="mb-3 flex items-center gap-2 text-teal-700">
            <CheckCircle2 size={22} />
            <p className="font-bold">Entry Allowed — {result.scannedZone?.toUpperCase()}</p>
          </div>
          <div className="space-y-1 text-sm text-ocean-800">
            <p><span className="text-ocean-400 font-semibold">Customer:</span> {result.customer?.name}</p>
            <p><span className="text-ocean-400 font-semibold">Package:</span> {result.package?.name}</p>
            {result.scannedZone === "indoor" ? (
              <p><span className="text-ocean-400 font-semibold">Indoor Entry Time:</span> {new Date(result.indoorEntryTime).toLocaleTimeString("en-IN")}</p>
            ) : result.scannedZone === "outdoor" ? (
              <p><span className="text-ocean-400 font-semibold">Outdoor Entry Time:</span> {new Date(result.outdoorEntryTime).toLocaleTimeString("en-IN")}</p>
            ) : (
              <p><span className="text-ocean-400 font-semibold">Entry Time:</span> {new Date(result.entryTime).toLocaleTimeString("en-IN")}</p>
            )}
            <p><span className="text-ocean-400 font-semibold">Expires At:</span> {new Date(result.expiryTime).toLocaleTimeString("en-IN")}</p>
          </div>
        </div>
      )}

      {result && isExit && (
        <div className="card border-ocean-200 bg-ocean-50">
          <div className="mb-3 flex items-center gap-2 text-ocean-700">
            <Undo2 size={22} />
            <p className="font-bold">Exit Recorded — {result.scannedZone?.toUpperCase()}</p>
          </div>
          <div className="space-y-1 text-sm text-ocean-800">
            <p><span className="text-ocean-400 font-semibold">Customer:</span> {result.customer?.name}</p>
            <p><span className="text-ocean-400 font-semibold">Package:</span> {result.package?.name}</p>
            <p><span className="text-ocean-400 font-semibold">Status:</span> Checked Out</p>
          </div>
        </div>
      )}

      {/* ACTIVE GUESTS LIST (DISAPPEAR ON EXIT) */}
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ocean-700">
            <Users size={16} className="text-teal-600" />
            Active Guests in {zone === "general" ? "Park" : zone === "indoor" ? "Indoor" : "Outdoor"} ({displayedGuests.length})
          </h3>
          <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-bold text-teal-700 uppercase tracking-wider">
            Live
          </span>
        </div>
        
        {displayedGuests.length === 0 ? (
          <p className="text-xs text-ocean-400 py-3 text-center bg-ocean-50/50 rounded-xl border border-dashed border-ocean-100">
            No active entries in this section.
          </p>
        ) : (
          <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
            {displayedGuests.map((guest) => {
              const entryTime = zone === "indoor" ? guest.indoorEntryTime : zone === "outdoor" ? guest.outdoorEntryTime : guest.entryTime;
              return (
                <div key={guest._id} className="flex items-center justify-between rounded-xl border border-ocean-100 bg-white p-3 hover:border-ocean-200 transition-all">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ocean-900 truncate">{guest.customer?.name}</p>
                    <p className="text-[10px] text-ocean-400 font-medium">{guest.package?.name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-[10px] text-ocean-500 shrink-0 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      In: {entryTime ? new Date(entryTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "-"}
                    </span>
                    <span className="font-mono text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded font-bold">
                      {guest.tagId}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanEntry;

export { extractTagId };
