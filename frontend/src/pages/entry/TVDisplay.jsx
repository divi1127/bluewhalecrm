import React, { useEffect, useRef, useState } from "react";
import {
  Clock,
  AlertTriangle,
  Volume2,
  ShieldAlert,
  Users,
  CheckCircle2,
  Sparkles,
  Gamepad2,
  MapPin,
  TrendingUp,
} from "lucide-react";
import api from "../../api/axios";
import logoImg from "../../assets/logo.jpeg";

const formatRemaining = (expiryTime) => {
  if (!expiryTime) return { text: "UNTIMED", expired: false, warning: false };
  const diffMs = new Date(expiryTime) - new Date();
  if (diffMs <= 0) return { text: "EXPIRED", expired: true, warning: false };
  const mins = Math.floor(diffMs / 60000);
  const secs = Math.floor((diffMs % 60000) / 1000);
  const warning = diffMs <= 5 * 60000; // last 5 minutes
  return { text: `${mins}m ${secs.toString().padStart(2, "0")}s`, expired: false, warning };
};

// Audio: Web Audio API chimes
const playScanChime = (isSuccess = true) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (isSuccess) {
      // Pleasant upward double chime
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch {
    // AudioContext blocked or unsupported
  }
};

const playAlertSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const playBeep = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    playBeep(880, ctx.currentTime, 0.2);
    playBeep(880, ctx.currentTime + 0.25, 0.2);
    playBeep(1100, ctx.currentTime + 0.5, 0.4);
  } catch {
    // AudioContext blocked or unsupported
  }
};

const TVDisplay = () => {
  const [stats, setStats] = useState({
    totalInside: 0,
    indoorCount: 0,
    outdoorCount: 0,
  });
  const [entries, setEntries] = useState([]);
  const [acknowledged, setAcknowledged] = useState(new Set());
  const [, forceTick] = useState(0);

  // Scan Event Flash Banner
  const [activeNotification, setActiveNotification] = useState(null);
  const lastProcessedEventIdRef = useRef(null);

  // Poll TV Live Endpoint every 1.5 seconds for instant updates
  const loadTvData = async () => {
    try {
      const { data } = await api.get("/entry/tv-live");
      if (data?.data) {
        setStats({
          totalInside: data.data.totalInside || 0,
          indoorCount: data.data.indoorCount || 0,
          outdoorCount: data.data.outdoorCount || 0,
        });

        if (data.data.insideTags) {
          setEntries(data.data.insideTags);
        }

        // Check if there's a fresh scan event to show
        const event = data.data.latestEvent;
        if (event && event.id !== lastProcessedEventIdRef.current) {
          lastProcessedEventIdRef.current = event.id;
          setActiveNotification(event);
          playScanChime(true);

          // Clear banner after 5.5 seconds smoothly
          setTimeout(() => {
            setActiveNotification((current) => (current?.id === event.id ? null : current));
          }, 5500);
        }
      }
    } catch (err) {
      console.error("TV live poll error", err);
    }
  };

  useEffect(() => {
    loadTvData();
    const pollInterval = setInterval(loadTvData, 1500);
    const tickInterval = setInterval(() => forceTick((t) => t + 1), 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(tickInterval);
    };
  }, []);

  // Filter out which active entries are currently expired
  const expiredEntries = entries.filter(
    (e) => e.status === "expired" || (e.expiryTime && formatRemaining(e.expiryTime).expired)
  );

  // Find which of the expired entries have NOT been acknowledged yet
  const unacknowledgedExpirations = expiredEntries.filter((e) => !acknowledged.has(e._id));

  // Loop alarm sound every 3 seconds if unacknowledged expirations exist
  useEffect(() => {
    if (unacknowledgedExpirations.length === 0) return;
    playAlertSound();
    const audioInterval = setInterval(playAlertSound, 3000);
    return () => clearInterval(audioInterval);
  }, [unacknowledgedExpirations.length]);

  const handleAcknowledgeAll = () => {
    const newAck = new Set(acknowledged);
    unacknowledgedExpirations.forEach((e) => newAck.add(e._id));
    setAcknowledged(newAck);
  };

  const hasExpired = expiredEntries.length > 0;

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-ocean-950 via-[#071322] to-ocean-950 p-4 text-white sm:p-8 overflow-x-hidden font-sans">
      {/* SCAN EVENT OVERLAY / BANNER NOTIFICATION */}
      {activeNotification && (
        <div className="fixed inset-x-0 top-6 z-50 flex justify-center px-4 animate-bounce-short">
          <div className="w-full max-w-2xl rounded-3xl border-2 border-teal-400 bg-ocean-900/95 p-6 text-white shadow-[0_20px_70px_rgba(20,184,166,0.5)] backdrop-blur-md">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-teal-500/20 text-teal-300 ring-4 ring-teal-400/40">
                <CheckCircle2 size={38} className="animate-pulse" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-2xl font-black uppercase tracking-wider text-teal-300 sm:text-3xl">
                    {activeNotification.title || "✓ ENTRY SUCCESSFUL"}
                  </h2>
                  <span className="rounded-full bg-teal-400/20 px-3 py-1 font-mono text-xs font-bold text-teal-200 uppercase tracking-widest border border-teal-400/30">
                    Verified
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div className="rounded-xl bg-ocean-950/60 p-2.5 border border-ocean-800">
                    <p className="text-[10px] uppercase font-bold text-ocean-400">Bill</p>
                    <p className="font-mono text-base font-black text-white">{activeNotification.billNumber}</p>
                  </div>

                  <div className="rounded-xl bg-ocean-950/60 p-2.5 border border-ocean-800">
                    <p className="text-[10px] uppercase font-bold text-ocean-400">Member</p>
                    <p className="font-mono text-base font-black text-teal-300">
                      Member {activeNotification.memberNumber}
                    </p>
                  </div>

                  <div className="rounded-xl bg-ocean-950/60 p-2.5 border border-ocean-800">
                    <p className="text-[10px] uppercase font-bold text-ocean-400">Area</p>
                    <p className="text-base font-black text-cyan-300">
                      {activeNotification.area}
                      {activeNotification.gameName && <span className="text-emerald-400 ml-1 text-xs uppercase block truncate">{activeNotification.gameName}</span>}
                    </p>
                  </div>

                  <div className="rounded-xl bg-ocean-950/60 p-2.5 border border-ocean-800">
                    <p className="text-[10px] uppercase font-bold text-ocean-400">Status</p>
                    <p className="text-sm font-black text-white">
                      {activeNotification.insideCount} / {activeNotification.totalMembers} Inside
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-ocean-300">
                  <span>Guest: <strong className="text-white">{activeNotification.customerName}</strong></span>
                  <span className="font-mono text-teal-400 font-bold">{activeNotification.tagId}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-ocean-800/80 pb-5">
        <div className="flex items-center gap-3.5">
          <img src={logoImg} alt="Gaming Centre" className="h-14 w-14 rounded-2xl object-cover shadow-md ring-2 ring-teal-500/30" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl font-black uppercase tracking-wider text-white sm:text-4xl">
                Gaming Centre
              </h1>
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
              </span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-400">
              Live Entry & Occupancy Monitor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-2xl bg-ocean-900/80 px-4 py-2.5 text-sm font-mono font-bold text-ocean-200 border border-ocean-800">
            <Clock size={18} className="text-teal-400" />
            <span>{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
          </div>
        </div>
      </div>

      {/* THREE HERO METRIC CARDS (TOTAL INSIDE, INDOOR, OUTDOOR) */}
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* TOTAL PEOPLE INSIDE */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-teal-500/30 bg-gradient-to-br from-teal-950/40 via-ocean-900 to-ocean-950 p-6 shadow-xl shadow-teal-950/40">
          <div className="flex items-center justify-between text-teal-300">
            <span className="text-xs font-black uppercase tracking-widest text-teal-400/90">
              Total People Inside
            </span>
            <Users size={28} className="opacity-80" />
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-6xl font-black tracking-tight text-white drop-shadow-[0_2px_12px_rgba(20,184,166,0.5)]">
              {stats.totalInside}
            </span>
            <span className="text-sm font-bold text-teal-300/80">Active in Park</span>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-ocean-800">
            <div
              className="h-full bg-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.8)] transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(15, stats.totalInside * 3))}%` }}
            />
          </div>
        </div>

        {/* INDOOR */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-ocean-900 to-ocean-950 p-6 shadow-xl shadow-cyan-950/40">
          <div className="flex items-center justify-between text-cyan-300">
            <span className="text-xs font-black uppercase tracking-widest text-cyan-400/90">
              Indoor Area
            </span>
            <Gamepad2 size={28} className="opacity-80" />
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-6xl font-black tracking-tight text-cyan-300 drop-shadow-[0_2px_12px_rgba(6,182,212,0.5)]">
              {stats.indoorCount}
            </span>
            <span className="text-sm font-bold text-cyan-400/80">Inside Arena</span>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-ocean-800">
            <div
              className="h-full bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)] transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(10, stats.indoorCount * 5))}%` }}
            />
          </div>
        </div>

        {/* OUTDOOR */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-ocean-900 to-ocean-950 p-6 shadow-xl shadow-emerald-950/40">
          <div className="flex items-center justify-between text-emerald-300">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400/90">
              Outdoor Area
            </span>
            <MapPin size={28} className="opacity-80" />
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-6xl font-black tracking-tight text-emerald-300 drop-shadow-[0_2px_12px_rgba(16,185,129,0.5)]">
              {stats.outdoorCount}
            </span>
            <span className="text-sm font-bold text-emerald-400/80">Outdoor Grounds</span>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-ocean-800">
            <div
              className="h-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)] transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(10, stats.outdoorCount * 5))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Global Expired Warning Banner */}
      {hasExpired && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-red-500 bg-red-500/15 px-5 py-4 animate-pulse">
          <AlertTriangle className="text-red-400 shrink-0" size={28} />
          <div>
            <p className="text-base font-black text-red-300">⚠️ Session Time Expired — Action Required</p>
            <p className="text-xs text-red-400">One or more customers have exceeded their allotted gaming session time.</p>
          </div>
          <Volume2 className="ml-auto text-red-400" size={24} />
        </div>
      )}

      {/* ACTIVE PLAYERS GRID */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-ocean-300 flex items-center gap-2">
            <Users size={16} className="text-teal-400" />
            Live Players On-Floor ({entries.length})
          </h2>
          <span className="text-xs text-ocean-400 font-mono">
            Auto-Sync Active (1.5s)
          </span>
        </div>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-ocean-800 bg-ocean-900/30 py-24 text-center">
            <Gamepad2 className="mb-3 h-16 w-16 text-ocean-600 opacity-40 animate-pulse" />
            <p className="text-2xl font-bold text-ocean-400">No active players inside</p>
            <p className="text-xs text-ocean-600 mt-1">
              When wrist tags are scanned at the entry gate, they will appear here live.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {entries.map((entry) => {
              const remaining = formatRemaining(entry.expiryTime);
              const isExpired = remaining.expired;
              const isWarning = remaining.warning && !isExpired;

              return (
                <div
                  key={entry._id}
                  className={`relative rounded-2xl border p-4 transition-all ${
                    isExpired
                      ? "border-red-500 bg-red-500/15 ring-2 ring-red-500/40"
                      : isWarning
                      ? "border-amber-400 bg-amber-400/10 ring-1 ring-amber-400/30"
                      : "border-ocean-800 bg-ocean-900/80 hover:border-ocean-700"
                  }`}
                >
                  {isExpired && (
                    <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 font-black text-[10px] text-white shadow-lg animate-bounce">
                      !
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-base font-black text-white">{entry.customer?.name || "Player"}</p>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                        entry.area === "Outdoor"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      }`}
                    >
                      {entry.area || "Indoor"}
                    </span>
                  </div>

                  <p className="text-xs text-ocean-300 truncate mt-0.5">{entry.package?.name}</p>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-ocean-400 border-t border-ocean-800/60 pt-2">
                    <span>Member {entry.memberNumber || 1}</span>
                    <span className="font-mono font-bold text-teal-400 bg-teal-950/70 px-1.5 py-0.5 rounded border border-teal-800/50">
                      {entry.tagId}
                    </span>
                  </div>

                  {entry.expiryTime && (
                    <div
                      className={`mt-3 flex items-center gap-2 text-xl font-black ${
                        isExpired ? "text-red-400" : isWarning ? "text-amber-400" : "text-teal-300"
                      }`}
                    >
                      {isExpired || isWarning ? (
                        <AlertTriangle size={18} className={isExpired ? "text-red-400 animate-pulse" : "text-amber-400"} />
                      ) : (
                        <Clock size={18} className="text-teal-400" />
                      )}
                      <span className="font-mono">{remaining.text}</span>
                    </div>
                  )}

                  {isExpired && (
                    <p className="mt-2 rounded-lg bg-red-500/20 px-2 py-1 text-center text-[10px] font-black uppercase tracking-wider text-red-300">
                      Session Expired — Please Exit
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* POPUP MODAL FOR EXPIRED PLAYERS (Must click OK to close) */}
      {unacknowledgedExpirations.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border-2 border-red-500/50 bg-ocean-950 p-6 text-center shadow-[0_10px_60px_rgba(239,68,68,0.4)] animate-scaleIn">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-red-500 ring-4 ring-red-500/30">
              <ShieldAlert size={36} className="animate-pulse" />
            </div>

            <h2 className="text-2xl font-black uppercase tracking-wider text-white">
              ⚠️ Session Expired!
            </h2>
            <p className="mt-2 text-xs text-ocean-300">
              The following player session(s) have run out of time. Please guide them to the exit:
            </p>

            <div className="my-4 max-h-52 overflow-y-auto space-y-2 rounded-2xl bg-ocean-900/80 p-3 text-left border border-ocean-800">
              {unacknowledgedExpirations.map((e) => (
                <div key={e._id} className="flex items-center justify-between border-b border-ocean-800 pb-2 last:border-b-0 last:pb-0">
                  <div>
                    <p className="font-bold text-white text-sm">{e.customer?.name}</p>
                    <p className="text-[11px] text-ocean-400">
                      Member {e.memberNumber || 1} · {e.tagId}
                    </p>
                  </div>
                  <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-400">
                    Expired
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleAcknowledgeAll}
              className="mt-2 w-full rounded-2xl bg-red-600 px-6 py-3.5 font-bold uppercase tracking-wider text-white shadow-lg shadow-red-600/30 transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              OK, Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TVDisplay;
