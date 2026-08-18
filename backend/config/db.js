const mongoose = require("mongoose");
const dns = require("dns");

const probeSrv = (uri) =>
  new Promise((resolve) => {
    const m = /^mongodb\+srv:\/\/[^/]*@?([^/?#]+)/.exec(uri);
    if (!m) return resolve(true);
    dns.resolveSrv(`_mongodb._tcp.${m[1]}`, (err) => resolve(!err));
  });

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bluewhale";
    const srvOk = await probeSrv(uri);
    if (!srvOk) dns.setServers(["8.8.8.8", "1.1.1.1"]);
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
