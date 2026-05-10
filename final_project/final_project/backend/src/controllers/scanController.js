const Scan = require("../models/Scan");
const { detectSensitiveContent } = require("../route/scanner");
const { analyzeWithAI } = require("../route/aiScanner");

const MAX_CONTENT_CHARS = 3000;

async function getUploadedText(file) {
  if (!file || !file.buffer) return "";

  const isPdf = file.mimetype === "application/pdf" ||
    file.originalname?.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    try {
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(file.buffer);
      return data.text || "";
    } catch (err) {
      console.warn("[scan] pdf-parse failed, falling back to utf-8:", err.message);
    }
  }

  return file.buffer.toString("utf-8");
}

async function scanDocument(req, res) {
  const textInput = String(req.body?.text || "");
  const uploadedText = await getUploadedText(req.file);
  const raw = textInput || uploadedText;
  const content = raw.slice(0, MAX_CONTENT_CHARS);

  if (!content.trim()) {
    return res.status(400).json({ error: "Provide text or upload a supported document." });
  }
  
  let result;
  if (process.env.GEMINI_API_KEY) {
    try {
      result = await analyzeWithAI(content);
    } catch (aiError) {
      result = await detectSensitiveContent(content);
    }
  } else {
    result = await detectSensitiveContent(content);
  }
  
  try {
    const saved = await Scan.create({
      userId: req.user.sub,
      fileName: req.file?.originalname || "manual-input",
      riskScore: Number(result.riskScore || 0),
      findingsCount: Array.isArray(result.findings) ? result.findings.length : 0,
      categories: Array.isArray(result.findings) ? result.findings.map((item) => item.type) : [],
    });
    // Return real DB id so the frontend can delete this scan later
    result.scanId = String(saved._id);
  } catch (dbError) {
    console.error("[scan] failed to save scan to database:", dbError.message);
  }

  return res.json(result);
}

async function getScanHistory(req, res) {
  try {
    const history = await Scan.find({ userId: req.user.sub })
      .sort({ createdAt: -1 });
    
    // The frontend expects the field name to be 'id' instead of '_id'
    const formattedHistory = history.map(scan => ({
      id: scan._id,
      userId: scan.userId,
      fileName: scan.fileName,
      riskScore: scan.riskScore,
      findingsCount: scan.findingsCount,
      categories: scan.categories,
      createdAt: scan.createdAt
    }));

    return res.json({ scans: formattedHistory });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch scan history." });
  }
}

async function deleteScan(req, res) {
  try {

    const scan = await Scan.findOne({ _id: req.params.id, userId: req.user.sub });
    if (!scan) {
      return res.status(404).json({ error: "Scan not found." });
    }
    
    await Scan.deleteOne({ _id: req.params.id });
    return res.json({ message: "Deleted." });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete scan." });
  }
}

async function deleteAllScans(req, res) {
  try {
    await Scan.deleteMany({ userId: req.user.sub });
    return res.json({ message: "All scans deleted." });
  } catch (error) {
    return res.status(500).json({ error: "Failed to clear scans." });
  }
}

module.exports = { scanDocument, getScanHistory, deleteScan, deleteAllScans };