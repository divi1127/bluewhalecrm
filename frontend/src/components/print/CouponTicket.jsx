import { Percent, IndianRupee, CalendarDays, ScanLine, Sparkles } from "lucide-react";
import logoImg from "../../assets/logo.jpeg";

// Default blue color theme for all coupons
const THEME = {
  bg: "linear-gradient(135deg, #0c1d36 0%, #1a3a6b 45%, #4a90d9 100%)",
  accent: "#60a5fa",
  accentLight: "rgba(96,165,250,0.18)",
  discountBg: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  stub: "linear-gradient(90deg, #1e40af, #60a5fa)",
  textDim: "rgba(255,255,255,0.65)",
};

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
}) => {
  const isPercent = discountType === "percent";
  const theme = THEME;
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
        <div className="flex items-center gap-2.5 text-white">
          <img src={logoImg} alt="BlueWhale" className="rounded object-cover" style={{ width: compact ? 40 : 48, height: compact ? 40 : 48 }} />
          <div>
            <p
              className="font-display font-extrabold leading-tight tracking-wide"
              style={{ fontSize: compact ? 14 : 16, color: "#fff" }}
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
