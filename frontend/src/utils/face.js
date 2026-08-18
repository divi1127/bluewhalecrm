const MODEL_URL = "/face-models";

let faceapi = null;
let modelsReady = false;

// Lazy-load the face library only when a face feature is used (keeps the main bundle lean)
export const loadFaceApi = async () => {
  if (!faceapi) {
    faceapi = await import("@vladmandic/face-api");
  }
  if (!modelsReady) {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsReady = true;
  }
  return faceapi;
};

export const startCamera = async (video) => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
    audio: false,
  });
  video.srcObject = stream;
  await video.play().catch(() => {});
  return stream;
};

export const stopCamera = (stream, video) => {
  if (stream) stream.getTracks().forEach((t) => t.stop());
  if (video && video.srcObject) {
    video.srcObject.getTracks().forEach((t) => t.stop());
    video.srcObject = null;
  }
};

// Detect one face in the video frame and return its 128-dim descriptor, or null if none
export const captureDescriptor = async (video, fa) => {
  const lib = fa || (await loadFaceApi());
  const options = new lib.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
  const det = await lib.detectSingleFace(video, options).withFaceLandmarks().withFaceDescriptor();
  if (!det || !det.descriptor) return null;
  return Array.from(det.descriptor);
};