import React, { useEffect, useRef, useState } from "react";
import { Waves, Clock, AlertTriangle, Volume2, ShieldAlert } from "lucide-react";
import api from "../../api/axios";

const formatRemaining = (expiryTime) => {
  const diffMs = new Date(expiryTime) - new Date();
  if (diffMs <= 0) return { text: "EXPIRED", expired: true, warning: false };
  const mins = Math.floor(diffMs / 60000);
  const secs = Math.floor((diffMs % 60000) / 1000);
  const warning = diffMs <= 5 * 60000; // last 5 minutes
  return { text: `${mins}m ${secs.toString().padStart(2, "0")}s`, expired: false, warning };
};

// Plays a short alert beep using Web Audio API
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
    // Three beep pattern
    playBeep(880, ctx.currentTime, 0.2);
    playBeep(880, ctx.currentTime + 0.25, 0.2);
    playBeep(1100, ctx.currentTime + 0.5, 0.4);
  } catch {
    // Web Audio not supported
  }
};

const TVDisplay = () => {
  const [entries, setEntries] = useState([]);
  const [acknowledged, setAcknowledged] = useState(new Set());
  const [, forceTick] = useState(0);

  useEffect(() => {
    const load = () =>
      api.get("/entry/active").then(({ data }) => setEntries(data.data));
    load();
    const dataInterval = setInterval(load, 5000);
    const tickInterval = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => {
      clearInterval(dataInterval);
      clearInterval(tickInterval);
    };
  }, []);

  // Filter out which active entries are currently expired
  const expiredEntries = entries.filter((e) => formatRemaining(e.expiryTime).expired);
  
  // Find which of the expired entries have NOT been acknowledged yet
  const unacknowledgedExpirations = expiredEntries.filter((e) => !acknowledged.has(e._id));

  // Loop the alarm beep sound every 2.5 seconds if there are unacknowledged expired guests
  useEffect(() => {
    if (unacknowledgedExpirations.length === 0) return;

    // Play immediately
    playAlertSound();

    const audioInterval = setInterval(() => {
      playAlertSound();
    }, 2500);

    return () => clearInterval(audioInterval);
  }, [unacknowledgedExpirations.length]);

  const handleAcknowledgeAll = () => {
    const newAck = new Set(acknowledged);
    unacknowledgedExpirations.forEach((e) => newAck.add(e._id));
    setAcknowledged(newAck);
  };

  const hasExpired = expiredEntries.length > 0;

  return (
    <div className="relative min-h-screen bg-ocean-950 p-4 text-white sm:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500">
            <Waves size={26} />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">BlueWhale Park</h1>
            <p className="text-ocean-300">Live Entry Status</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-ocean-400">
          <Clock size={16} />
          <span>{new Date().toLocaleTimeString("en-IN")}</span>
        </div>
      </div>

      {/* Global Expired Alert Banner */}
      {hasExpired && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-red-500 bg-red-500/10 px-4 py-4 animate-pulse sm:px-6">
          <AlertTriangle className="text-red-400 shrink-0" size={28} />
          <div>
            <p className="text-lg font-bold text-red-300">⚠ Time Expired — Action Required!</p>
            <p className="text-sm text-red-400">One or more customers have exceeded their session time. Please check them out.</p>
          </div>
          <Volume2 className="ml-auto text-red-400" size={22} />
        </div>
      )}

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Waves size={64} className="mb-4 text-ocean-700" />
          <p className="text-2xl font-bold text-ocean-500">No active customers inside the park</p>
          <p className="text-ocean-600 mt-2">Scanned entries will appear here in real time</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {entries.map((entry) => {
            const remaining = formatRemaining(entry.expiryTime);
            const isExpired = remaining.expired;
            const isWarning = remaining.warning && !isExpired;

            return (
              <div
                key={entry._id}
                className={`relative rounded-2xl border p-5 transition-all ${
                  isExpired
                    ? "border-red-500 bg-red-500/15 ring-2 ring-red-500/40"
                    : isWarning
                    ? "border-amber-400 bg-amber-400/10 ring-1 ring-amber-400/30"
                    : "border-ocean-700 bg-ocean-900"
                }`}
              >
                {/* Expired overlay pulse indicator */}
                {isExpired && (
                  <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 animate-bounce">
                    <span className="text-[9px] font-black text-white">!</span>
                  </div>
                )}

                <p className="truncate text-lg font-bold">{entry.customer?.name}</p>
                <p className="mb-3 text-sm text-ocean-300">{entry.package?.name}</p>

                <div className={`flex items-center gap-2 text-2xl font-bold ${
                  isExpired ? "text-red-400" : isWarning ? "text-amber-400" : "text-teal-300"
                }`}>
                  {isExpired || isWarning ? (
                    <AlertTriangle size={22} className={isExpired ? "text-red-400 animate-pulse" : "text-amber-400"} />
                  ) : (
                    <Clock size={22} className="text-teal-400" />
                  )}
                  <span>{remaining.text}</span>
                </div>

                {isExpired && (
                  <p className="mt-2 rounded-lg bg-red-500/20 px-3 py-1.5 text-center text-xs font-bold uppercase tracking-wide text-red-300">
                    Session Expired — Please Exit
                  </p>
                )}
                {isWarning && !isExpired && (
                  <p className="mt-2 text-xs font-semibold text-amber-400">
                    ⚡ Session ending soon
                  </p>
                )}

                <p className="mt-2 text-xs uppercase tracking-wide text-ocean-400">
                  Entered {new Date(entry.entryTime).toLocaleTimeString("en-IN")}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* DOCK EXPIRY POPUP DIALOG */}
      {unacknowledgedExpirations.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-ocean-950 p-6 text-center shadow-[0_10px_50px_rgba(239,68,68,0.25)] animate-scaleIn">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500 ring-4 ring-red-500/20">
              <ShieldAlert size={36} className="animate-pulse" />
            </div>
            
            <h2 className="text-2xl font-display font-black text-white">
              ⚠️ Session expired!
            </h2>
            <p className="mt-2 text-sm text-ocean-300">
              The following customer session(s) have run out of time. Please guide them to the exit gate:
            </p>

            <div className="my-4 max-h-48 overflow-y-auto space-y-2 rounded-2xl bg-ocean-900/60 p-3 text-left">
              {unacknowledgedExpirations.map((e) => (
                <div key={e._id} className="flex items-center justify-between border-b border-ocean-800 pb-2 last:border-b-0 last:pb-0">
                  <div>
                    <p className="font-bold text-white text-sm">{e.customer?.name}</p>
                    <p className="text-xs text-ocean-400">{e.package?.name}</p>
                  </div>
                  <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
                    Expired
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleAcknowledgeAll}
              className="mt-2 w-full rounded-2xl bg-red-500 px-6 py-3 font-bold text-white shadow-lg transition hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400/50"
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
