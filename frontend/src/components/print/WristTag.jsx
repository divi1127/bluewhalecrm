import React from "react";
import { Waves, Ticket, Clock, ShieldCheck } from "lucide-react";
import { formatDuration } from "../../utils/format";

const statusMeta = {
  unused: { label: "1-TIME USE", cls: "bg-teal-100 text-teal-700 border-teal-200" },
  active: { label: "INSIDE", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  expired: { label: "EXPIRED", cls: "bg-coral-100 text-coral-600 border-coral-200" },
  exited: { label: "USED / EXITED", cls: "bg-gray-100 text-gray-600 border-gray-200" },
};

const WristTag = ({
  tagId,
  qrCodeDataUrl,
  indoorQrCodeDataUrl,
  outdoorQrCodeDataUrl,
  customerName,
  customerMobile,
  packageName,
  personType = "adult",
  durationMinutes,
  durationUnit,
  billNumber,
  status = "unused",
  indoorStatus = "unused",
  outdoorStatus = "unused",
}) => {
  const durationLabel = formatDuration({ durationMinutes, durationUnit });
  const personLabel =
    personType === "below5" ? "Below 5 Yrs" : personType === "child" ? "Child" : "Adult";
  const fmtDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const indoorMeta = statusMeta[indoorStatus] || statusMeta[status] || statusMeta.unused;
  const outdoorMeta = statusMeta[outdoorStatus] || statusMeta[status] || statusMeta.unused;

  // Person type badge colors
  const personColors =
    personType === "below5"
      ? { bg: "#fef3c7", border: "#f59e0b", text: "#b45309" }
      : personType === "child"
      ? { bg: "#e0f2fe", border: "#0284c7", text: "#0369a1" }
      : { bg: "#f0fdfa", border: "#0d9488", text: "#0f766e" };

  const indoorQr = indoorQrCodeDataUrl || qrCodeDataUrl;
  const outdoorQr = outdoorQrCodeDataUrl || qrCodeDataUrl;

  return (
    <div
      className="relative mx-auto overflow-hidden bg-white shadow-lg print:shadow-none"
      style={{
        width: "760px",
        borderRadius: "12px",
        border: "1.5px solid #cbd5e1",
      }}
    >
      {/* ── TOP HEADER STRIPE ── */}
      <div
        className="flex items-center justify-between px-4 py-1.5 text-white"
        style={{ background: "linear-gradient(90deg, #0b2431 0%, #0f4c75 60%, #14b8a6 100%)" }}
      >
        <div className="flex items-center gap-2">
          <Waves size={15} className="text-teal-300" />
          <span className="font-display text-sm font-black tracking-widest">BLUEWHALE</span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-teal-200 opacity-80">
            Wrist Band
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{
              background: personColors.bg,
              color: personColors.text,
              border: `1px solid ${personColors.border}`,
            }}
          >
            {personLabel}
          </span>
          {billNumber && (
            <span className="font-mono text-[10px] font-medium text-teal-200">Bill: {billNumber}</span>
          )}
        </div>
      </div>

      {/* ── CUSTOMER & PACKAGE BAR ── */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-4 py-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Ticket size={14} className="shrink-0 text-teal-600" />
          <span className="font-bold text-gray-900 truncate">{customerName}</span>
          {customerMobile && <span className="text-gray-500 font-mono text-[11px]">({customerMobile})</span>}
        </div>
        <div className="flex items-center gap-3 shrink-0 text-gray-600 font-medium text-[11px]">
          <span>Pkg: <strong className="text-gray-900">{packageName}</strong></span>
          <span className="flex items-center gap-1"><Clock size={11} className="text-teal-600" /> {durationLabel}</span>
        </div>
      </div>

      {/* ── DUAL SCAN AREA (INDOOR QR & OUTDOOR QR) ── */}
      <div className="grid grid-cols-2 gap-3 p-3 bg-white">
        {/* INDOOR QR BOX */}
        <div className="flex items-center gap-3 rounded-xl border border-teal-100 bg-teal-50/40 p-2.5">
          <div className="relative shrink-0 rounded-lg bg-white p-1 shadow-sm ring-1 ring-teal-300/40 flex flex-col items-center">
            <img src={indoorQr} alt="Indoor QR" className="h-16 w-16 object-contain" />
            <span className="text-[8px] font-mono font-bold mt-1 text-teal-800">{tagId}-IND</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-teal-800">
              <ShieldCheck size={12} className="text-teal-600" /> Indoor Zone
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">Scan 1 Time at Entry</p>
            <span
              className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${indoorMeta.cls}`}
            >
              {indoorMeta.label}
            </span>
          </div>
        </div>

        {/* OUTDOOR QR BOX */}
        <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/40 p-2.5">
          <div className="relative shrink-0 rounded-lg bg-white p-1 shadow-sm ring-1 ring-blue-300/40 flex flex-col items-center">
            <img src={outdoorQr} alt="Outdoor QR" className="h-16 w-16 object-contain" />
            <span className="text-[8px] font-mono font-bold mt-1 text-blue-800">{tagId}-OUT</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-blue-900">
              <ShieldCheck size={12} className="text-blue-600" /> Outdoor Zone
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">Scan 1 Time at Entry</p>
            <span
              className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${outdoorMeta.cls}`}
            >
              {outdoorMeta.label}
            </span>
          </div>
        </div>
      </div>

      {/* ── FOOTER TAG ID STRIP ── */}
      <div className="flex items-center justify-between bg-gray-900 px-4 py-1 text-white text-[11px]">
        <span className="font-mono font-bold tracking-widest text-teal-300">Base ID: {tagId}</span>
        <span className="text-[9px] uppercase tracking-wider text-gray-400">Single Use Scan Per Zone</span>
      </div>

      {/* ── TEAR STRIP ── */}
      <div className="flex items-center gap-2 px-4 pt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">
        <div className="h-px flex-1 border-t border-dashed border-gray-300" />
        Tear Here
        <div className="h-px flex-1 border-t border-dashed border-gray-300" />
      </div>
      <div
        className="flex items-center justify-between px-5 py-1.5 text-white"
        style={{
          background:
            personType === "below5"
              ? "linear-gradient(90deg, #b45309, #d97706)"
              : personType === "child"
              ? "linear-gradient(90deg, #0369a1, #0284c7)"
              : "linear-gradient(90deg, #0f766e, #14b8a6)",
        }}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest">
          Admit One · {personLabel} · Wrist Band
        </span>
        <span className="text-[10px] font-semibold">{fmtDate}</span>
      </div>
    </div>
  );
};

export default WristTag;
