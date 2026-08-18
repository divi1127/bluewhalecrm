const express = require("express");
const { registerUser, loginUser, getMe, faceLogin } = require("../controllers/authController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.post("/login", loginUser);
// Face login at the register - no password needed, matches registered staff faces
router.post("/face-login", faceLogin);
// Only a super_admin can create new staff logins
router.post("/register", protect, authorize("super_admin"), registerUser);
router.get("/me", protect, getMe);

module.exports = router;
