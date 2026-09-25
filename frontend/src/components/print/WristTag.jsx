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
  const indoorQr = indoorQrCodeDataUrl || qrCodeDataUrl;
  const outdoorQr = outdoorQrCodeDataUrl || qrCodeDataUrl;
  const indoorId = `${tagId}-IND`;
  const outdoorId = `${tagId}-OUT`;
  const fmtDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="wrist-band">
      <div className="wrist-band-inner" style={{ justifyContent: 'center', gap: '5mm', padding: '2.5mm' }}>
        
        {/* Indoor QR */}
        <div className="wrist-qr wrist-qr--indoor">
          <img src={indoorQr} alt={`Indoor QR ${indoorId}`} />
          <span className="wrist-qr-label">IND</span>
          <span className="wrist-qr-id">{indoorId}</span>
        </div>

        {/* Center: Brand + Package Info */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1mm' }}>
          <div className="wrist-brand" style={{ width: '100%', maxWidth: '60mm', padding: '1mm 4mm' }}>
            <div className="wrist-brand-row" style={{ justifyContent: 'center' }}>
              <img src={logoImg} alt="BlueWhale" className="wrist-logo" />
              <div>
                <p className="wrist-brand-name">BLUEWHALE</p>
                <p className="wrist-brand-sub">WRIST BAND</p>
              </div>
            </div>
            <p className="wrist-tagid" style={{ textAlign: 'center' }}>ID: {tagId}</p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <p className="wrist-pkg">Pkg: {packageName} · {durationLabel}</p>
            <p className="wrist-zone">Scan Each Zone Once</p>
          </div>
        </div>

        {/* Outdoor QR */}
        <div className="wrist-qr wrist-qr--outdoor">
          <img src={outdoorQr} alt={`Outdoor QR ${outdoorId}`} />
          <span className="wrist-qr-label">OUT</span>
          <span className="wrist-qr-id">{outdoorId}</span>
        </div>

        {/* Bill No & Date (next to outdoor QR) */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
          <p style={{ fontFamily: 'monospace', fontSize: '3mm', fontWeight: 800, color: '#0b2431' }}>Bill {billNumber}</p>
          <p style={{ fontSize: '2.5mm', fontWeight: 600, color: '#475569' }}>{fmtDate}</p>
        </div>

      </div>
    </div>
  );
};

export default WristTag;