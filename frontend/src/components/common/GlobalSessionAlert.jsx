import React, { useEffect, useRef, useState } from "react";
import { ShieldAlert, Users, Clock, AlertTriangle, Volume2 } from "lucide-react";
import api from "../../api/axios";

// Plays repeated alert beep sound using Web Audio API
const playBeepPattern = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
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
    // Web Audio blocked or not supported
  }
};

const GlobalSessionAlert = () => {
  const [activeEntries, setActiveEntries] = useState([]);
  const [acknowledgedIds, setAcknowledgedIds] = useState(() => new Set());
  const audioIntervalRef = useRef(null);

  // Poll active entries periodically
  useEffect(() => {
    let isMounted = true;
    const checkActiveSessions = async () => {
      try {
        const { data } = await api.get("/entry/active");
        if (isMounted && data?.data) {
          setActiveEntries(data.data);
        }
      } catch {
        // Quietly handle connection or auth issues during navigation
      }
    };

    checkActiveSessions();
    const interval = setInterval(checkActiveSessions, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Filter for tags that are expired
  const now = new Date();
  const expiredTags = activeEntries.filter((tag) => {
    if (!tag.expiryTime) return false;
    return new Date(tag.expiryTime) <= now;
  });

  // Find expired tags that have NOT been acknowledged by clicking OK
  const unacknowledgedExpired = expiredTags.filter((tag) => !acknowledgedIds.has(tag._id));

  // Loop alert audio when there are unacknowledged expired tags
  useEffect(() => {
    if (unacknowledgedExpired.length > 0) {
      playBeepPattern();
      if (!audioIntervalRef.current) {
        audioIntervalRef.current = setInterval(() => {
          playBeepPattern();
        }, 3000);
      }
    } else {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
    }

    return () => {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
    };
  }, [unacknowledgedExpired.length]);

  const handleAcknowledge = () => {
    // Stop sound immediately
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    // Add all current expired tags to acknowledged set
    setAcknowledgedIds((prev) => {
      const next = new Set(prev);
      unacknowledgedExpired.forEach((t) => next.add(t._id));
      return next;
    });
  };

  if (unacknowledgedExpired.length === 0) return null;

  // Group expired tags by customer to show clear counts & details
  const customerMap = {};
  unacknowledgedExpired.forEach((tag) => {
    const custId = tag.customer?._id || tag.customer?.name || "unknown";
    if (!customerMap[custId]) {
      customerMap[custId] = {
        name: tag.customer?.name || "Guest",
        mobile: tag.customer?.mobile || "N/A",
        package: tag.package?.name || "Standard",
        tags: [],
        adults: 0,
        children: 0,
        below5: 0,
      };
    }
    customerMap[custId].tags.push(tag);
    if (tag.personType === "adult") customerMap[custId].adults += 1;
    else if (tag.personType === "child") customerMap[custId].children += 1;
    else if (tag.personType === "below5") customerMap[custId].below5 += 1;
    else customerMap[custId].adults += 1;
  });

  const groupedCustomers = Object.values(customerMap);
  const totalExpiredPersons = unacknowledgedExpired.length;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl border-2 border-red-500 bg-ocean-950 p-6 text-center text-white shadow-[0_15px_60px_rgba(239,68,68,0.4)] animate-scaleIn">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-red-400 ring-4 ring-red-500/30">
          <ShieldAlert size={36} className="animate-bounce" />
        </div>

        <div className="flex items-center justify-center gap-2 text-red-400">
          <Volume2 size={18} className="animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest">Alarm Active</span>
        </div>

        <h2 className="mt-1 font-display text-2xl font-black text-white">
          ⚠️ Session Time Expired!
        </h2>
        <p className="mt-1 text-sm text-ocean-300">
          {totalExpiredPersons} person(s) have reached their session limit. Please guide them to exit or extend time:
        </p>

        {/* Customer & Persons details list */}
        <div className="my-5 max-h-60 space-y-3 overflow-y-auto rounded-2xl bg-ocean-900/80 p-3 text-left border border-ocean-800">
          {groupedCustomers.map((cust, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-red-500/30 bg-red-500/10 p-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-white text-base">{cust.name}</p>
                  <p className="text-xs text-ocean-300">📱 {cust.mobile} · {cust.package}</p>
                </div>
                <span className="rounded-full bg-red-500/30 px-2.5 py-0.5 text-xs font-extrabold uppercase text-red-300">
                  {cust.tags.length} Person{cust.tags.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-2 text-xs text-ocean-200">
                {cust.adults > 0 && <span className="bg-ocean-800/80 px-2 py-0.5 rounded">Adults: {cust.adults}</span>}
                {cust.children > 0 && <span className="bg-ocean-800/80 px-2 py-0.5 rounded">Children: {cust.children}</span>}
                {cust.below5 > 0 && <span className="bg-ocean-800/80 px-2 py-0.5 rounded">Below 5: {cust.below5}</span>}
              </div>

              <div className="mt-2 text-[11px] text-ocean-400 flex flex-wrap gap-1">
                <span>Tag IDs:</span>
                {cust.tags.map((t) => (
                  <span key={t._id} className="font-mono bg-ocean-950/60 px-1.5 py-0.5 rounded text-ocean-300">
                    {t.tagId}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAcknowledge}
          className="w-full rounded-2xl bg-gradient-to-r from-red-500 to-red-600 px-6 py-3.5 text-base font-extrabold text-white shadow-lg transition hover:from-red-600 hover:to-red-700 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-red-400/40"
        >
          OK, Close Alert
        </button>
      </div>
    </div>
  );
};

export default GlobalSessionAlert;
