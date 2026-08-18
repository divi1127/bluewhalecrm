import React, { useEffect, useRef, useState } from "react";
import { Camera, Upload, X, CheckCircle2, AlertTriangle } from "lucide-react";

// Face photo capture for attendance enforcement.
// • Camera mode: live video → captures a still as a JPEG data-URL.
// • Upload mode: pick an existing photo file (base64 data-URL).
const FaceCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const [mode, setMode] = useState("camera");
  const [live, setLive] = useState(false);
  const [err, setErr] = useState(null);

  const stopStream = () => {
    streamRef.current?.getTracks?.().forEach((t) => t.stop());
    streamRef.current = null;
    setLive(false);
  };

  const startCamera = async () => {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setLive(true);
    } catch {
      setErr("Camera unavailable or permission denied. You can upload a photo instead.");
    }
  };

  useEffect(() => {
    if (mode === "camera") startCamera();
    else stopStream();
    return stopStream;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const snapPhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 360;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    onCapture(canvas.toDataURL("image/jpeg", 0.8));
    stopStream();
  };

  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onCapture(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-900/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-ocean-900">
            <Camera size={18} className="text-teal-500" /> Face Verification Photo
          </h3>
          <button onClick={onClose} className="text-ocean-400 hover:text-ocean-700">
            <X size={20} />
          </button>
        </div>

        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("camera")}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition ${
              mode === "camera" ? "bg-ocean-700 text-white" : "bg-ocean-50 text-ocean-600 hover:bg-ocean-100"
            }`}
          >
            <Camera size={14} className="mr-1 inline" /> Camera
          </button>
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition ${
              mode === "upload" ? "bg-teal-500 text-white" : "bg-ocean-50 text-ocean-600 hover:bg-ocean-100"
            }`}
          >
            <Upload size={14} className="mr-1 inline" /> Upload Photo
          </button>
        </div>

        {mode === "camera" && (
          <div>
            <div className="relative overflow-hidden rounded-xl bg-black">
              <video ref={videoRef} muted playsInline className="w-full" style={{ minHeight: "240px" }} />
              {!live && !err && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-white/70">
                  Starting camera…
                </div>
              )}
            </div>
            <button type="button" onClick={snapPhoto} disabled={!live} className="btn-accent mt-3 w-full">
              Capture Photo
            </button>
          </div>
        )}

        {mode === "upload" && (
          <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-ocean-200 bg-sand-50 p-6">
            <Upload size={32} className="text-ocean-300" />
            <p className="text-center text-xs text-ocean-500">Upload a clear, well-lit photo of your face.</p>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <button type="button" onClick={() => fileInputRef.current && fileInputRef.current.click()} className="btn-accent">
              Choose Photo
            </button>
          </div>
        )}

        {err && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        <p className="mt-3 text-center text-xs text-ocean-400">
          <CheckCircle2 size={13} className="mr-1 inline text-teal-500" />
          Photo is stored with your attendance record for audit.
        </p>
      </div>
    </div>
  );
};

export default FaceCapture;
