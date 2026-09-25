import React, { useEffect, useState, useRef } from "react";
import {
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  LogOut,
  LogIn,
  MapPin,
  Users,
  Clock,
  Camera,
  Layers,
  ArrowRight,
} from "lucide-react";
import api from "../../api/axios";
import QrScanner from "../../components/common/QrScanner";

// Extract tag ID and zone from verification URL / barcode scan
const extractTagInfo = (raw) => {
  const s = String(raw).trim();
  let zone = null;
  if (s.includes("zone=indoor") || s.includes("INDOOR")) zone = "Indoor";
  if (s.includes("zone=outdoor") || s.includes("OUTDOOR")) zone = "Outdoor";

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
  // Separate barcode IDs: WT-XXXX-IND (indoor) / WT-XXXX-OUT (outdoor)
  if (!zone && /-IND$/.test(tagId)) zone = "Indoor";
  if (!zone && /-OUT$/.test(tagId)) zone = "Outdoor";
  tagId = tagId.replace(/-IND$|-OUT$/, "");
  return { tagId, zone };
};

const ScanEntry = () => {
  const [mode, setMode] = useState("entry"); // "entry" | "exit"
  const [area, setArea] = useState("Indoor"); // "Indoor" | "Outdoor"
  const [outdoorGame, setOutdoorGame] = useState("Zipline");
  const [tagId, setTagId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  // Real-time Gaming Centre statistics
  const [stats, setStats] = useState({
    totalInside: 0,
    indoorCount: 0,
    outdoorCount: 0,
  });
  const [activeGuests, setActiveGuests] = useState([]);
  const inputRef = useRef(null);

  // Fetch live stats and active guests
  const loadLiveData = async () => {
    try {
      const { data } = await api.get("/entry/tv-live");
      if (data?.data) {
        setStats({
          totalInside: data.data.totalInside || 0,
          indoorCount: data.data.indoorCount || 0,
          outdoorCount: data.data.outdoorCount || 0,
        });
        setActiveGuests(data.data.insideTags || []);
      }
    } catch (err) {
      console.error("Failed to load live data", err);
    }
  };

  useEffect(() => {
    loadLiveData();
    const interval = setInterval(loadLiveData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Ensure input field is always focused for fast barcode/RFID scanning
  useEffect(() => {
    if (!scannerOpen) {
      inputRef.current?.focus();
    }
  }, [mode, area, scannerOpen]);

  const handleScan = async (e) => {
    if (e) e.preventDefault();
    if (!tagId.trim()) return;

    setError(null);
    setResult(null);
    setLoading(true);

    const info = extractTagInfo(tagId);
    const targetArea = info.zone || area;

    try {
      const endpoint = mode === "entry" ? "/entry/scan" : "/entry/exit";
      const { data } = await api.post(endpoint, {
        tagId: info.tagId,
        zone: targetArea,
        gameName: targetArea === "Outdoor" ? outdoorGame : undefined,
      });

      setResult({
        ...data.data,
        actionType: mode,
        message: data.message || (mode === "entry" ? "✓ ENTRY SUCCESSFUL" : "✓ EXIT SUCCESSFUL"),
      });

      // Refresh counts immediately
      loadLiveData();
    } catch (err) {
      const msg = err.response?.data?.message || "Scan failed";
      setError(msg);
    } finally {
      setLoading(false);
      setTagId("");
      inputRef.current?.focus();
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setResult(null);
    setError(null);
    setTagId("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCameraScan = (decodedText) => {
    setScannerOpen(false);
    setTagId(decodedText);
    setTimeout(() => {
      handleScanDirect(decodedText);
    }, 150);
  };

  const handleScanDirect = async (scannedId) => {
    if (!scannedId) return;
    setError(null);
    setResult(null);
    setLoading(true);

    const info = extractTagInfo(scannedId);
    const targetArea = info.zone || area;

    try {
      const endpoint = mode === "entry" ? "/entry/scan" : "/entry/exit";
      const { data } = await api.post(endpoint, {
        tagId: info.tagId,
        zone: targetArea,
        gameName: targetArea === "Outdoor" ? outdoorGame : undefined,
      });
      setResult({
        ...data.data,
        actionType: mode,
        message: data.message || (mode === "entry" ? "✓ ENTRY SUCCESSFUL" : "✓ EXIT SUCCESSFUL"),
      });
      loadLiveData();
    } catch (err) {
      setError(err.response?.data?.message || "Scan failed");
    } finally {
      setLoading(false);
      setTagId("");
      inputRef.current?.focus();
    }
  };

  const isExit = mode === "exit";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* GAMING CENTRE LIVE STATS BAR */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-ocean-200 bg-gradient-to-br from-ocean-900 to-ocean-950 p-4 text-white shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ocean-300">Total People Inside</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-black tracking-tight text-white">{stats.totalInside}</span>
            <Users size={22} className="text-teal-400 opacity-80" />
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4 text-cyan-950 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-700">Indoor Zone</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-black tracking-tight text-cyan-800">{stats.indoorCount}</span>
            <span className="rounded-full bg-cyan-200/70 px-2 py-0.5 text-[10px] font-bold text-cyan-900">Indoor</span>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-950 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Outdoor Zone</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-black tracking-tight text-emerald-800">{stats.outdoorCount}</span>
            <span className="rounded-full bg-emerald-200/70 px-2 py-0.5 text-[10px] font-bold text-emerald-900">Outdoor</span>
          </div>
        </div>
      </div>

      {/* SCANNING WORKSTATION CARD */}
      <div className="card shadow-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-ocean-100 pb-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black text-ocean-900">
              <ScanLine size={24} className={isExit ? "text-coral-500" : "text-teal-500"} />
              Gaming Centre {isExit ? "Exit Gate" : "Entry Gate"}
            </h2>
            <p className="text-xs text-ocean-500 mt-0.5">
              Scan wrist tags to update member status and TV display in real time
            </p>
          </div>

          {/* Area Selector (Indoor / Outdoor) */}
          <div className="flex items-center gap-1.5 rounded-xl bg-ocean-100/70 p-1">
            <button
              type="button"
              onClick={() => {
                setArea("Indoor");
                setResult(null);
                setError(null);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                area === "Indoor"
                  ? "bg-white text-ocean-900 shadow-sm"
                  : "text-ocean-600 hover:text-ocean-900"
              }`}
            >
              🏢 Indoor
            </button>
            <button
              type="button"
              onClick={() => {
                setArea("Outdoor");
                setResult(null);
                setError(null);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                area === "Outdoor"
                  ? "bg-white text-ocean-900 shadow-sm"
                  : "text-ocean-600 hover:text-ocean-900"
              }`}
            >
              🌳 Outdoor
            </button>
          </div>
        </div>

        {/* Mode Switcher: Entry vs Exit */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => switchMode("entry")}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition ${
              !isExit
                ? "bg-teal-600 text-white shadow-md shadow-teal-600/20 ring-2 ring-teal-500/20"
                : "bg-ocean-50 text-ocean-700 hover:bg-ocean-100"
            }`}
          >
            <LogIn size={18} />
            Entry Scan
          </button>
          <button
            type="button"
            onClick={() => switchMode("exit")}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition ${
              isExit
                ? "bg-coral-500 text-white shadow-md shadow-coral-500/20 ring-2 ring-coral-500/20"
                : "bg-ocean-50 text-ocean-700 hover:bg-ocean-100"
            }`}
          >
            <LogOut size={18} />
            Exit Scan
          </button>
        </div>

        {/* Outdoor Game Selector */}
        {area === "Outdoor" && !isExit && (
          <div className="mt-4 flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-ocean-600">
              Select Outdoor Game
            </label>
            <select
              value={outdoorGame}
              onChange={(e) => setOutdoorGame(e.target.value)}
              className="input-field h-11 px-3 text-sm font-semibold text-ocean-900 border-ocean-200 focus:border-emerald-500 focus:ring-emerald-500"
            >
              <option value="Zipline">Zipline</option>
              <option value="Zipcycle">Zipcycle</option>
              <option value="Wall Climbing">Wall Climbing</option>
              <option value="Rocket Ejector">Rocket Ejector</option>
              <option value="Human Gyro">Human Gyro</option>
            </select>
          </div>
        )}

        {/* Fast Scanner Input */}
        <form onSubmit={handleScan} className="mt-5 flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              autoFocus
              className="input-field font-mono text-base tracking-wider uppercase pl-3 pr-10 h-12"
              placeholder="SCAN OR ENTER WRIST TAG (E.G. WT001)..."
              value={tagId}
              onChange={(e) => setTagId(e.target.value.toUpperCase())}
            />
            {tagId && (
              <button
                type="button"
                onClick={() => setTagId("")}
                className="absolute right-3 top-3 text-ocean-400 hover:text-ocean-600 text-xs font-bold"
              >
                CLEAR
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="btn-secondary shrink-0 px-4 h-12"
            title="Scan QR with camera"
          >
            <Camera size={20} className="text-teal-600" />
          </button>
          <button
            type="submit"
            disabled={loading || !tagId}
            className={`btn-accent shrink-0 px-6 h-12 font-bold tracking-wide ${
              isExit ? "!bg-coral-500 hover:!bg-coral-600" : "!bg-teal-600 hover:!bg-teal-700"
            }`}
          >
            {loading ? "Processing..." : isExit ? "Record Exit" : "Record Entry"}
          </button>
        </form>
        <p className="mt-2 text-xs text-ocean-400">
          Tip: Handheld RFID/barcode scanners submit automatically upon reading tag.
        </p>
      </div>

      {/* ERROR FEEDBACK BANNER */}
      {error && (
        <div className="rounded-2xl border-2 border-coral-400 bg-coral-50 p-5 shadow-sm animate-shake">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral-100 text-coral-600">
              <AlertTriangle size={22} />
            </div>
            <div>
              <p className="text-base font-black text-coral-700">{error}</p>
              <p className="text-xs text-coral-600 mt-0.5">
                {error.includes("ALREADY INSIDE") && "This wrist tag has already been scanned for entry."}
                {error.includes("INVALID EXIT") && "Cannot record exit for a wrist tag that has not entered."}
                {error.includes("UNKNOWN WRIST TAG") && "The scanned tag ID does not exist in any bill."}
                {error.includes("ALREADY EXITED") && "This wrist tag was already checked out previously."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS RESULT CARD (WITH MULTI-MEMBER BREAKDOWN) */}
      {result && (
        <div
          className={`rounded-2xl border-2 p-6 shadow-lg transition-all ${
            result.actionType === "exit"
              ? "border-coral-300 bg-gradient-to-br from-coral-50/50 to-white"
              : "border-teal-400 bg-gradient-to-br from-teal-50/50 to-white"
          }`}
        >
          {/* Top Status Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ocean-100 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2
                size={28}
                className={result.actionType === "exit" ? "text-coral-500" : "text-teal-600"}
              />
              <div>
                <h3 className="text-xl font-black tracking-tight text-ocean-900">
                  {result.message}
                </h3>
                <p className="text-xs text-ocean-500">
                  Tag ID: <span className="font-mono font-bold text-ocean-800">{result.tag?.tagId}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-ocean-100 px-3 py-1 font-mono text-sm font-black text-ocean-800">
                Bill: {result.billNumber}
              </span>
              <span
                className={`rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  result.area === "Outdoor"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-cyan-100 text-cyan-800"
                }`}
              >
                {result.area}
              </span>
            </div>
          </div>

          {/* Group Summary: X / Y Inside */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-3.5 border border-ocean-100 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ocean-400">Scanned Member</p>
              <p className="text-lg font-black text-ocean-900">
                Member {result.memberNumber}
              </p>
              <p className="text-xs text-ocean-500 truncate">{result.tag?.customer?.name || "Customer"}</p>
            </div>

            <div className="rounded-xl bg-white p-3.5 border border-ocean-100 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ocean-400">Group Inside Count</p>
              <p className="text-lg font-black text-teal-600">
                {result.insideCount} / {result.totalMembers} Members Inside
              </p>
              {/* Progress bar */}
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ocean-100">
                <div
                  className="h-full bg-teal-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.round((result.insideCount / (result.totalMembers || 1)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            <div className="rounded-xl bg-white p-3.5 border border-ocean-100 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ocean-400">Package & Time</p>
              <p className="text-sm font-bold text-ocean-900 truncate">
                {result.tag?.package?.name || "Entry"}
                {result.gameName && <span className="ml-1 text-emerald-600">({result.gameName})</span>}
              </p>
              <p className="text-xs text-ocean-500">
                {result.actionType === "exit"
                  ? `Exited at ${new Date().toLocaleTimeString("en-IN")}`
                  : `Entered at ${new Date().toLocaleTimeString("en-IN")}`}
              </p>
            </div>
          </div>

          {/* Member-by-Member Breakdown */}
          {result.membersList && result.membersList.length > 0 && (
            <div className="mt-5 rounded-xl border border-ocean-100 bg-white p-4">
              <p className="mb-3 text-xs font-black uppercase tracking-wider text-ocean-600 flex items-center gap-1.5">
                <Users size={14} />
                Bill {result.billNumber} — All Members Status
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {result.membersList.map((m) => {
                  const isCurrent = m.tagId === result.tag?.tagId;
                  const isInside = m.status === "INSIDE";
                  const isExited = m.status === "EXITED";

                  return (
                    <div
                      key={m.tagId}
                      className={`flex items-center justify-between rounded-lg p-2.5 text-xs transition border ${
                        isCurrent
                          ? "border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20"
                          : "border-ocean-100 bg-ocean-50/40"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-ocean-900 block">
                          Member {m.memberNumber} {isCurrent && "★"}
                        </span>
                        <span className="font-mono text-[10px] text-ocean-500">{m.tagId}</span>
                      </div>
                      <span
                        className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                          isInside
                            ? "bg-emerald-100 text-emerald-800"
                            : isExited
                            ? "bg-ocean-200 text-ocean-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ACTIVE GUESTS IN GAMING CENTRE */}
      <div className="card shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ocean-800">
            <Users size={16} className="text-teal-600" />
            Currently Inside Gaming Centre ({activeGuests.length})
          </h3>
          <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-bold text-teal-700 uppercase tracking-wider">
            Live TV Sync
          </span>
        </div>

        {activeGuests.length === 0 ? (
          <p className="text-xs text-ocean-400 py-6 text-center bg-ocean-50/50 rounded-xl border border-dashed border-ocean-200">
            No active customers currently inside.
          </p>
        ) : (
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
            {activeGuests.map((guest) => (
              <div
                key={guest._id}
                className="flex items-center justify-between rounded-xl border border-ocean-100 bg-white p-3 hover:border-ocean-300 transition shadow-sm"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-ocean-900 truncate">
                      {guest.customer?.name || "Guest"}
                    </p>
                    {guest.bill?.billNumber && (
                      <span className="rounded bg-ocean-100 px-1.5 py-0.5 text-[10px] font-mono font-bold text-ocean-700">
                        {guest.bill.billNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-ocean-400">
                    Member {guest.memberNumber || 1} · {guest.package?.name}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1 text-[11px] text-ocean-500 shrink-0">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      guest.area === "Outdoor"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-cyan-100 text-cyan-800"
                    }`}
                  >
                    {guest.area || "Indoor"}
                  </span>
                  <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                    {guest.tagId}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {scannerOpen && (
        <QrScanner onScan={handleCameraScan} onClose={() => setScannerOpen(false)} />
      )}
    </div>
  );
};

export default ScanEntry;
export { extractTagInfo };
