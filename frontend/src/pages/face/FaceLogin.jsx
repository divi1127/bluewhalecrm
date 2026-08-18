import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ScanFace, RefreshCw, ArrowLeft, Waves, MapPin, MapPinOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { loadFaceApi, startCamera, stopCamera, captureDescriptor } from "../../utils/face";

// Where each role lands after a successful face login.
const ROLE_HOME = {
  cashier: "/cashier-dashboard",
  billing_staff: "/staff-dashboard",
  entry_staff: "/staff-dashboard",
  hr_manager: "/staff-dashboard",
};

const FaceLogin = () => {
  const { faceLogin } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanningRef = useRef(false);

  const [state, setState] = useState("loading"); // loading | ready | scanning | error
  const [message, setMessage] = useState("Starting face recognition...");
  const [gps, setGps] = useState(null); // { lat, lng, accuracy }
  const [gpsState, setGpsState] = useState("fetching"); // fetching | ok | denied | error

  // Request GPS on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsState("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setGpsState("ok");
      },
      () => {
        setGpsState("denied");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const attempt = useCallback(async () => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    setState("scanning");
    setMessage("Scanning your face...");
    try {
      const fa = await loadFaceApi();
      const descriptor = await captureDescriptor(videoRef.current, fa);
      if (!descriptor) {
        setState("ready");
        setMessage("No face in view. Look straight at the camera and try again.");
        return;
      }
      const data = await faceLogin(descriptor, gps);
      navigate(ROLE_HOME[data.role] || "/dashboard", { replace: true });
    } catch (err) {
      setState("ready");
      setMessage(err.response?.data?.message || "Face not recognized. Please try again.");
    } finally {
      scanningRef.current = false;
    }
  }, [faceLogin, navigate, gps]);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        await loadFaceApi();
        if (cancelled) return;
        const stream = await startCamera(videoRef.current);
        streamRef.current = stream;
        setState("ready");
        setMessage("Look straight at the camera and tap Scan to log in");
      } catch {
        if (!cancelled) {
          setState("error");
          setMessage("Could not start the camera. Allow camera permission and reload.");
        }
      }
    };
    init();
    return () => {
      cancelled = true;
      stopCamera(streamRef.current, videoRef.current);
    };
  }, []);

  const gpsBlocked = gpsState === "denied";

  return (
    <div className="flex min-h-screen flex-col bg-ocean-950 text-sand-100">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500">
            <Waves size={18} className="text-white" />
          </div>
          <span className="font-display text-lg font-bold text-white">BlueWhale</span>
          <span className="ml-2 rounded-full bg-ocean-800 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-teal-400">
            Staff Register
          </span>
        </div>
        <Link to="/login" className="text-sm font-semibold text-ocean-300 hover:text-white">
          <ArrowLeft size={14} className="mr-1 inline" /> Back to password login
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md text-center">
          <h1 className="font-display text-2xl font-bold text-white">Face Login</h1>
          <p className="mt-1 text-sm text-ocean-300">
            Registered staff and cashiers log in with their face at the register.
          </p>

          {/* GPS Status Badge */}
          <div className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
            style={{
              background: gpsState === "ok" ? "rgba(20,184,166,0.15)" : gpsState === "fetching" ? "rgba(100,116,139,0.15)" : "rgba(239,68,68,0.15)",
              color: gpsState === "ok" ? "#14b8a6" : gpsState === "fetching" ? "#94a3b8" : "#ef4444",
              border: `1px solid ${gpsState === "ok" ? "rgba(20,184,166,0.3)" : gpsState === "fetching" ? "rgba(100,116,139,0.3)" : "rgba(239,68,68,0.3)"}`,
            }}
          >
            {gpsState === "ok" ? (
              <><MapPin size={13} /> Location verified — within park</>
            ) : gpsState === "fetching" ? (
              <><RefreshCw size={13} className="animate-spin" /> Fetching GPS location...</>
            ) : (
              <><MapPinOff size={13} /> Location denied — face login may be blocked</>
            )}
          </div>

          <div className="relative mx-auto mt-6 aspect-[4/3] w-full overflow-hidden rounded-3xl border-4 border-ocean-800 bg-ocean-900 shadow-glow">
            <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />

            {state === "scanning" && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-56 w-44 animate-pulse rounded-[2rem] border-2 border-teal-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
              </div>
            )}

            {state === "loading" && (
              <div className="absolute inset-0 flex items-center justify-center bg-ocean-900/90 text-sm text-ocean-200">
                <RefreshCw size={18} className="mr-2 animate-spin" /> Loading face models...
              </div>
            )}

            {state === "error" && (
              <div className="absolute inset-0 flex items-center justify-center bg-ocean-900/90 px-6 text-center text-sm text-coral-400">
                {message}
              </div>
            )}

            <div className="absolute inset-x-0 bottom-3 flex justify-center">
              <span className="rounded-full bg-black/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-teal-400">
                {state === "scanning" ? "Scanning..." : state === "loading" ? "Starting..." : "Camera live"}
              </span>
            </div>
          </div>

          <p className="mt-5 min-h-[1.5rem] text-sm text-ocean-200">{message}</p>

          {gpsBlocked && (
            <div className="mx-auto mb-3 max-w-xs rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
              ⚠ Location access is required. Please enable it in your browser settings and reload the page.
            </div>
          )}

          <button
            onClick={attempt}
            disabled={(state !== "ready" && state !== "scanning") || gpsState === "fetching"}
            className="btn-primary mx-auto mt-2 flex items-center gap-2 !px-8 !py-3 text-base"
          >
            <ScanFace size={20} />
            {state === "scanning" ? "Scanning..." : "Scan my face"}
          </button>

          <p className="mt-6 text-xs text-ocean-400">
            The scan is matched against registered staff faces. GPS location is verified to ensure you are inside the park.
          </p>
        </div>
      </main>
    </div>
  );
};

export default FaceLogin;