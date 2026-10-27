const QRCode = require("qrcode");

const generateQRDataUrl = async (payload) => {
  return QRCode.toDataURL(String(payload), {
    errorCorrectionLevel: "L",
    margin: 1,
    width: 600,
  });
};

module.exports = { generateQRDataUrl };
