const QRCode = require("qrcode");

const generateQRDataUrl = async (payload) => {
  return QRCode.toDataURL(String(payload), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 300,
  });
};

module.exports = { generateQRDataUrl };
