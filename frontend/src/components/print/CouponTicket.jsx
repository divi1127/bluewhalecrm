import { Waves, Percent, IndianRupee, CalendarDays, ScanLine, Sparkles } from "lucide-react";

// Vivid color themes that cycle per coupon so prints are colorful
const THEMES = [
  {
    bg: "linear-gradient(135deg, #0b2431 0%, #0f4c75 45%, #14b8a6 100%)",
    accent: "#14b8a6",
    accentLight: "rgba(20,184,166,0.18)",
    discountBg: "linear-gradient(135deg, #0d9488, #0f766e)",
    stub: "linear-gradient(90deg, #0f766e, #14b8a6)",
    textDim: "rgba(255,255,255,0.65)",
  },
  {
    bg: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #818cf8 100%)",
    accent: "#818cf8",
    accentLight: "rgba(129,140,248,0.18)",
    discountBg: "linear-gradient(135deg, #4338ca, #6366f1)",
    stub: "linear-gradient(90deg, #4338ca, #818cf8)",
    textDim: "rgba(255,255,255,0.65)",
  },
  {
    bg: "linear-gradient(135deg, #7c2d12 0%, #dc2626 50%, #f97316 100%)",
    accent: "#f97316",
    accentLight: "rgba(249,115,22,0.18)",
    discountBg: "linear-gradient(135deg, #dc2626, #f97316)",
    stub: "linear-gradient(90deg, #b91c1c, #f97316)",
    textDim: "rgba(255,255,255,0.65)",
  },
  {
    bg: "linear-gradient(135deg, #064e3b 0%, #059669 50%, #34d399 100%)",
    accent: "#34d399",
    accentLight: "rgba(52,211,153,0.18)",
    discountBg: "linear-gradient(135deg, #059669, #34d399)",
    stub: "linear-gradient(90deg, #047857, #34d399)",
    textDim: "rgba(255,255,255,0.65)",
  },
  {
    bg: "linear-gradient(135deg, #4a044e 0%, #a21caf 50%, #e879f9 100%)",
    accent: "#e879f9",
    accentLight: "rgba(232,121,249,0.18)",
    discountBg: "linear-gradient(135deg, #a21caf, #c026d3)",
    stub: "linear-gradient(90deg, #86198f, #e879f9)",
    textDim: "rgba(255,255,255,0.65)",
  },
];

const CouponTicket = ({
  partnerName,
  campaignName,
  discountType,
  discountValue,
  minBillAmount = 0,
  validFrom,
  validTo,
  code,
  qrCodeDataUrl,
  compact = false,
  themeIndex = 0,
}) => {
  const isPercent = discountType === "percent";
  const theme = THEMES[themeIndex % THEMES.length];
  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const now = new Date();
  const active = now >= new Date(validFrom) && now <= new Date(validTo);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: compact ? "168mm" : "auto",
        borderRadius: "14px",
        background: theme.bg,
        boxShadow: compact ? "none" : "0 8px 32px rgba(0,0,0,0.22)",
      }}
    >
      {/* Decorative circles */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          top: -60,
          right: -60,
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
          bottom: -40,
          left: -30,
        }}
      />

      {/* TOP ROW: Brand + Status */}
      <div className="relative flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2 text-white">
          <Waves size={compact ? 15 : 18} style={{ color: theme.accent }} />
          <div>
            <p
              className="font-display font-extrabold leading-tight tracking-wide"
              style={{ fontSize: compact ? 13 : 15, color: "#fff" }}
            >
              BLUEWHALE
            </p>
            <p
              className="font-semibold uppercase"
              style={{ fontSize: 8, letterSpacing: "0.25em", color: theme.accent, opacity: 0.9 }}
            >
              Partner Coupon
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles size={13} style={{ color: theme.accent }} />
          <span
            className="rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{
              background: active ? "rgba(255,255,255,0.18)" : "rgba(255,80,80,0.25)",
              color: active ? "#fff" : "#fca5a5",
              border: `1px solid ${active ? "rgba(255,255,255,0.3)" : "rgba(255,100,100,0.4)"}`,
            }}
          >
            {active ? "✓ Active" : "Expired"}
          </span>
        </div>
      </div>

      {/* PARTNER NAME */}
      <div className="px-5 pb-3">
        <p style={{ fontSize: 10, color: theme.accent, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          Partner
        </p>
        <p className="font-bold text-white truncate" style={{ fontSize: compact ? 13 : 14 }}>
          {partnerName}
        </p>
      </div>

      {/* NOTCH DIVIDER */}
      <div className="relative flex items-center px-0">
        <div
          className="absolute left-0 h-7 w-5 rounded-r-full"
          style={{ background: "rgba(0,0,0,0.25)" }}
        />
        <div
          className="mx-5 flex-1 border-t border-dashed"
          style={{ borderColor: "rgba(255,255,255,0.2)" }}
        />
        <div
          className="absolute right-0 h-7 w-5 rounded-l-full"
          style={{ background: "rgba(0,0,0,0.25)" }}
        />
      </div>

      {/* MAIN BODY: Discount + QR */}
      <div className="flex items-stretch gap-4 px-5 py-4">
        {/* Discount Info */}
        <div className="flex-1 min-w-0">
          {/* Big discount badge */}
          <div
            className="mb-3 inline-flex items-center gap-2 rounded-xl px-4 py-2"
            style={{ background: theme.discountBg, boxShadow: "0 2px 12px rgba(0,0,0,0.25)" }}
          >
            <span style={{ color: "#fff", opacity: 0.8 }}>
              {isPercent ? <Percent size={22} /> : <IndianRupee size={22} />}
            </span>
            <span
              className="font-display font-black leading-none text-white"
              style={{ fontSize: compact ? 30 : 36 }}
            >
              {isPercent ? `${discountValue}%` : `₹${discountValue}`}
            </span>
            <span
              className="rounded-full font-bold uppercase text-white"
              style={{ fontSize: 9, letterSpacing: "0.15em", opacity: 0.85 }}
            >
              {isPercent ? "Off" : "Flat Off"}
            </span>
          </div>

          <p className="font-bold text-white mb-2" style={{ fontSize: compact ? 13 : 14 }}>
            {campaignName}
          </p>

          <ul className="space-y-1.5" style={{ fontSize: 10, color: "rgba(255,255,255,0.75)" }}>
            <li className="flex items-center gap-1.5">
              <span style={{ color: theme.accent, fontSize: 12 }}>●</span>
              {minBillAmount > 0
                ? `Min. bill amount: ₹${minBillAmount}`
                : "Valid on any bill amount"}
            </li>
            <li className="flex items-center gap-1.5">
              <CalendarDays size={11} style={{ color: theme.accent, flexShrink: 0 }} />
              {fmtDate(validFrom)} — {fmtDate(validTo)}
            </li>
            <li className="flex items-center gap-1.5">
              <ScanLine size={11} style={{ color: theme.accent, flexShrink: 0 }} />
              One-time use · Non-transferable
            </li>
          </ul>
        </div>

        {/* QR Code */}
        <div
          className="flex shrink-0 flex-col items-center justify-center rounded-xl border border-l-2 border-dashed pl-4"
          style={{ borderColor: "rgba(255,255,255,0.2)" }}
        >
          <div
            className="rounded-xl p-1.5"
            style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}
          >
            <img
              src={qrCodeDataUrl}
              alt={`Coupon ${code}`}
              style={{ width: compact ? 76 : 88, height: compact ? 76 : 88, display: "block" }}
            />
          </div>
          <p
            className="mt-1.5 font-mono font-bold tracking-widest text-white"
            style={{ fontSize: compact ? 10 : 11 }}
          >
            {code}
          </p>
          <p style={{ fontSize: 8, color: theme.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em" }}>
            Scan at counter
          </p>
        </div>
      </div>

      {/* FOOTER STUB */}
      <div
        className="flex items-center justify-between px-5 py-2"
        style={{ background: "rgba(0,0,0,0.25)" }}
      >
        <p style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em" }}>
          Present at billing counter
        </p>
        <p style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em" }}>
          Not valid with other offers
        </p>
      </div>
    </div>
  );
};

export default CouponTicket;
