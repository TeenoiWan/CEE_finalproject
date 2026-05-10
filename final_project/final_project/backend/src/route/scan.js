const express = require("express");
const multer = require("multer");
const { authMiddleware } = require("../middleware/authMiddleware");
const { scanDocument, getScanHistory, deleteScan, deleteAllScans } = require("../controllers/scanController");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set. Refusing to start.");
}

router.post("/scan", authMiddleware(JWT_SECRET), upload.single("document"), scanDocument);
router.get("/scans/history", authMiddleware(JWT_SECRET), getScanHistory);
// NOTE: /scans/all must be before /scans/:id so Express doesn't treat "all" as an id
router.delete("/scans/all", authMiddleware(JWT_SECRET), deleteAllScans);
router.delete("/scans/:id", authMiddleware(JWT_SECRET), deleteScan);

module.exports = router;