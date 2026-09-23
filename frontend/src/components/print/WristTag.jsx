import React from "react";
import logoImg from "../../assets/logo.jpeg";
import { formatDuration } from "../../utils/format";

const personColors = {
  adult: { bg: "#f0fdfa", border: "#0d9488", text: "#0f766e" },
  child: { bg: "#e0f2fe", border: "#0284c7", text: "#0369a1" },
  below5: { bg: "#fef3c7", border: "#f59e0b", text: "#b45309" },
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
}) => {
  const durationLabel = formatDuration({ durationMinutes, durationUnit });
  const personLabel =
    personType === "below5" ? "Below 5 Yrs" : personType === "child" ? "Child" : "Adult";
  const colors = personColors[personType] || personColors.adult;
  const primaryQr = indoorQrCodeDataUrl || qrCodeDataUrl || outdoorQrCodeDataUrl;
  const fmtDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="wrist-band">
      <div className="wrist-band-inner">
        {/* QR AREA — 20×20 mm */}
        <div className="wrist-qr">
          <img src={primaryQr} alt={`QR ${tagId}`} />
        </div>

        {/* BRAND + TAG ID */}
        <div className="wrist-brand">
          <div className="wrist-brand-row">
            <img src={logoImg} alt="BlueWhale" className="wrist-logo" />
            <div>
              <p className="wrist-brand-name">BLUEWHALE</p>
              <p className="wrist-brand-sub">WRIST BAND</p>
            </div>
          </div>
          <p className="wrist-tagid">ID: {tagId}</p>
        </div>

        {/* CUSTOMER + PACKAGE */}
        <div className="wrist-info">
          <p className="wrist-cust">
            {customerName}
            {customerMobile && <span className="wrist-mobile">&nbsp;{customerMobile}</span>}
          </p>
          <p className="wrist-pkg">Pkg: {packageName} · {durationLabel}</p>
          <p className="wrist-zone">Indoor / Outdoor Entry</p>
        </div>

        {/* BILL / DATE / PERSON */}
        <div className="wrist-right">
          <p className="wrist-bill">Bill {billNumber}</p>
          <p className="wrist-date">{fmtDate}</p>
          <span
            className="wrist-chip"
            style={{ background: colors.bg, border: `0.3mm solid ${colors.border}`, color: colors.text }}
          >
            {personLabel}
          </span>
          <p className="wrist-admit">Admit One</p>
        </div>
      </div>
    </div>
  );
};

export default WristTag;