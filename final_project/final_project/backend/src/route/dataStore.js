const fs = require("fs");
const path = require("path");

const dataFile = path.join(__dirname, "..", "data", "db.json");

function ensureDataFile() {
  const dirPath = path.dirname(dataFile);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({ users: [], scans: [] }, null, 2), "utf-8");
  }
}

function readData() {
  try {
    ensureDataFile();
    const raw = fs.readFileSync(dataFile, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.users)) {
      parsed.users = [];
    }
    if (!Array.isArray(parsed.scans)) {
      parsed.scans = [];
    }
    return parsed;
  } catch (_error) {
    return { users: [], scans: [] };
  }
}

function writeData(data) {
  ensureDataFile();
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), "utf-8");
}

module.exports = { readData, writeData };
