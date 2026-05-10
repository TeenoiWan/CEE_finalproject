const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    fileName: { type: String, required: true },
    riskScore: { type: Number, required: true },
    findingsCount: { type: Number, required: true },
    categories: [{ type: String }],
  },
  { timestamps: true }
);

const Scan = mongoose.model("Scan", scanSchema);
module.exports = Scan;
