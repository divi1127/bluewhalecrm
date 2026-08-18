import React, { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  ScanLine, Upload, Camera, X,
  AlertTriangle, CheckCircle2, RefreshCw, FlipHorizontal,
} from "lucide-react";

// QR scanner used in the billing form to read printed coupon codes.
// • Camera mode: always tries the REAR camera first; flip button toggles front↔rear.
// • Upload mode: user picks an image file; library decodes it client-side.
//
// Html5Qrcode requires a DOM element ID string — NOT a ref — as its first arg.
const CAMERA_DIV_ID = "qr-scanner-camera-view";
const FILE_DIV_ID   = "qr-scanner-file-reader";

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * Enumerate MediaDevices and return camera IDs sorted so the rear (environment)
 * camera comes first.  Falls back to { facingMode:"environment" } if the API
 * is unavailable or returns no results.
 */
async function getCamerasSorted() {
  try {
    const devices = await Html5Qrcode.getCameras();
    if (!devices || devices.length === 0) return null;

    // Put cameras whose label contains "back" / "rear" / "environment" first
    const rearKeywords = /back|rear|environment/i;
    const sorted = [...devices].sort((a, b) => {
      const aRear = rearKeywords.test(a.label ?? "");
      const bRear = rearKeywords.test(b.label ?? "");
      if (aRear === bRear) return 0;
      return aRear ? -1 : 1;
    });
    return sorted;
  } catch {
    return null;
  }
}

// ── component ─────────────────────────────────────────────────────────────────

const QrScanner = ({ onScan, onClose }) => {
  const fileInputRef  = useRef(null);
  const scannerRef    = useRef(null);

  const [mode,        setMode]        = useState("camera");
  const [cameras,     setCameras]     = useState(null);   // [] of {id, label}
  const [camIdx,      setCamIdx]      = useState(0);      // index into cameras[]
  const [scanning,    setScanning]    = useState(false);  // camera feed is live
  const [scanningFile,setScanningFile]= useState(false);
  const [status,      setStatus]      = useState(null);   // {type,text}

  // ── start / stop camera ────────────────────────────────────────────────────

  const stopCamera = useCallback(async () => {
    const s = scannerRef.current;
    if (!s) return;
    try { await s.stop(); } catch {}
    try { s.clear(); }     catch {}
    scannerRef.current = null;
    setScanning(false);
  }, []);

  const startCamera = useCallback(async (cameraConstraint) => {
    await stopCamera();
    setStatus(null);

    try {
      const s = new Html5Qrcode(CAMERA_DIV_ID, { verbose: false });
      scannerRef.current = s;

      await s.start(
        cameraConstraint,
        {
          fps: 15,
          // Wider box → easier to aim at a physical printed QR
          qrbox: { width: 260, height: 200 },
          aspectRatio: 1.333,
        },
        (decodedText) => {
          if (decodedText) onScan(String(decodedText).trim());
        },
        () => { /* ignore per-frame no-QR-found errors */ }
      );
      setScanning(true);
    } catch (err) {
      setScanning(false);
      setStatus({
        type: "error",
        text: "Camera unavailable or permission denied. You can still upload the QR image.",
      });
    }
  }, [onScan, stopCamera]);

  // ── mount / camera-index change ────────────────────────────────────────────

  useEffect(() => {
    if (mode !== "camera") return;

    let alive = true;

    (async () => {
      // First call: enumerate cameras and store them
      let cams = cameras;
      if (!cams) {
        cams = await getCamerasSorted();
        if (!alive) return;
        setCameras(cams);
      }

      // Pick camera constraint
      const constraint = cams && cams.length > 0
        ? { deviceId: { exact: cams[camIdx]?.id ?? cams[0].id } }
        : { facingMode: "environment" }; // graceful fallback

      await startCamera(constraint);
    })();

    return () => {
      alive = false;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, camIdx]);

  // ── flip camera button ────────────────────────────────────────────────────

  const flipCamera = () => {
    if (!cameras || cameras.length < 2) return;
    setCamIdx((i) => (i + 1) % cameras.length);
  };

  // ── switch Camera ↔ Upload ─────────────────────────────────────────────────

  const switchMode = async (next) => {
    if (next === "camera") {
      setMode("camera");          // useEffect above re-starts camera
    } else {
      await stopCamera();
      setMode("upload");
    }
    setStatus(null);
  };

  // ── file upload ───────────────────────────────────────────────────────────

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setScanningFile(true);
    setStatus(null);
    let s = null;
    try {
      s = new Html5Qrcode(FILE_DIV_ID, { verbose: false });
      const decoded = await s.scanFile(file, /* showImage= */ false);
      if (decoded) {
        setStatus({ type: "success", text: `QR read: ${String(decoded).trim()}` });
        onScan(String(decoded).trim());
      } else {
        setStatus({ type: "error", text: "No QR code found. Try a clearer, well-lit picture." });
      }
    } catch {
      setStatus({ type: "error", text: "Could not read QR from this image. Try a clearer, well-lit picture." });
    } finally {
      setScanningFile(false);
      try { if (s) s.clear(); } catch {}
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── JSX ───────────────────────────────────────────────────────────────────

  const canFlip = cameras && cameras.length > 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-900/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-ocean-900">
            <ScanLine size={18} className="text-teal-500" /> Scan Coupon QR
          </h3>
          <button onClick={onClose} className="text-ocean-400 hover:text-ocean-700">
            <X size={20} />
          </button>
        </div>

        {/* ── Tab buttons ── */}
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => switchMode("camera")}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition ${
              mode === "camera"
                ? "bg-ocean-700 text-white"
                : "bg-ocean-50 text-ocean-600 hover:bg-ocean-100"
            }`}
          >
            <Camera size={14} className="mr-1 inline" /> Camera
          </button>
          <button
            type="button"
            onClick={() => switchMode("upload")}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition ${
              mode === "upload"
                ? "bg-teal-500 text-white"
                : "bg-ocean-50 text-ocean-600 hover:bg-ocean-100"
            }`}
          >
            <Upload size={14} className="mr-1 inline" /> Upload Image
          </button>
        </div>

        {/* ── Camera view ── */}
        <div className={mode === "camera" ? "relative" : "hidden"}>
          {/* html5-qrcode renders the video inside this div */}
          <div
            id={CAMERA_DIV_ID}
            className="overflow-hidden rounded-xl bg-black"
            style={{ minHeight: "270px" }}
          />

          {/* Animated scanning bar overlaid on top */}
          {scanning && (
            <div
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"
              aria-hidden
            >
              <div
                className="absolute left-0 right-0 h-0.5 bg-teal-400/80 shadow-[0_0_8px_2px_rgba(45,212,191,0.7)]"
                style={{ animation: "scanBar 2s ease-in-out infinite" }}
              />
            </div>
          )}

          {/* Flip-camera button (shown only if >1 camera) */}
          {canFlip && (
            <button
              type="button"
              onClick={flipCamera}
              title="Flip camera"
              className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1.5 text-xs text-white backdrop-blur hover:bg-black/70"
            >
              <FlipHorizontal size={14} /> Flip
            </button>
          )}
        </div>

        {/* Scanning-line keyframe (injected once) */}
        <style>{`
          @keyframes scanBar {
            0%   { top: 15%; }
            50%  { top: 80%; }
            100% { top: 15%; }
          }
        `}</style>

        {/* Camera hint */}
        {mode === "camera" && (
          <p className="mt-2 text-center text-xs text-ocean-400">
            {scanning
              ? "📷 Point the REAR camera at the coupon's QR code — it will auto-fill."
              : "Starting camera…"}
          </p>
        )}

        {/* ── Upload view ── */}
        {mode === "upload" && (
          <div className="mt-1 flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-ocean-200 bg-sand-50 p-6">
            <Upload size={32} className="text-ocean-300" />
            <p className="text-center text-xs text-ocean-500">
              Upload a photo or screenshot of the QR code from the coupon.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className="btn-accent"
              disabled={scanningFile}
            >
              {scanningFile ? "Reading QR…" : "Choose QR Image"}
            </button>
          </div>
        )}

        {/* Hidden div for scanFile() — must always be in the DOM */}
        <div id={FILE_DIV_ID} className="hidden" />

        {/* ── Status banner ── */}
        {status && (
          <div
            className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${
              status.type === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-teal-200 bg-teal-50 text-teal-700"
            }`}
          >
            {status.type === "error" ? (
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
            )}
            <span>{status.text}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QrScanner;