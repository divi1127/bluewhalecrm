import React, { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, CheckCircle2, X } from "lucide-react";
import { loadFaceApi, startCamera, stopCamera, captureDescriptor } from "../../utils/face";

// Modal that opens the webcam, scans a face and hands a 128-dim descriptor to onCaptured().
// Used to register / update a staff member's face for face-login.
const FaceCaptureModal = ({ onCaptured, onClose }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [state, setState] = useState("loading"); // loading | ready | scanning | error
  const [message, setMessage] = useState("Starting camera...");
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        await loadFaceApi();
        if (cancelled) return;
        const stream = await startCamera(videoRef.current);
        streamRef.current = stream;
        setState("ready");
        setMessage("Face the camera in good light and tap Capture");
      } catch {
        if (!cancelled) {
          setState("error");
          setMessage("Could not access the camera. Allow camera permission and try again.");
        }
      }
    };
    init();
    return () => {
      cancelled = true;
      stopCamera(streamRef.current, videoRef.current);
    };
  }, []);

  const handleCapture = async () => {
    if (scanning) return;
    setScanning(true);
    setState("scanning");
    setMessage("Looking for a face...");
    try {
      const fa = await loadFaceApi();
      const descriptor = await captureDescriptor(videoRef.current, fa);
      if (!descriptor) {
        setState("ready");
        setMessage("No face detected. Look straight at the camera.");
        return;
      }
      setState("ready");
      setMessage("Face captured!");
      onCaptured(descriptor);
    } catch {
      setState("error");
      setMessage("Face detection failed. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold text-ocean-900">
            <Camera size={18} /> Register Face
          </h3>
          <button onClick={onClose} className="btn-accent">
            <X size={15} /> Close
          </button>
        </div>

        <div className="relative mx-auto aspect-[4/3] w-full overflow-hidden rounded-xl bg-ocean-950">
          <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
          {state === "scanning" && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-44 w-36 animate-pulse rounded-3xl border-2 border-teal-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
            </div>
          )}
          {state === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-ocean-200">
              <RefreshCw size={18} className="mr-2 animate-spin" /> Loading face models...
            </div>
          )}
          {state === "error" && (
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-coral-400">
              {message}
            </div>
          )}
        </div>

        <p className="mt-3 flex items-center gap-2 text-sm text-ocean-600">
          {state === "success" || message.includes("captured") ? (
            <CheckCircle2 size={16} className="shrink-0 text-teal-500" />
          ) : (
            <Camera size={16} className="shrink-0 text-ocean-400" />
          )}
          {message}
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleCapture} disabled={scanning || state === "loading"} className="btn-primary">
            <Camera size={15} />
            {scanning ? "Scanning..." : "Capture Face"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FaceCaptureModal;