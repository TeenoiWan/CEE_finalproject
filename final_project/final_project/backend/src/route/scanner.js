const SENSITIVE_PATTERNS = [
  {
    label: "Email Address",
    weight: 10,
    regex: /\b[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}\b/gi,
    reason: "Contains a personal email address",
  },
  {
    label: "Phone Number",
    weight: 15,
    // รองรับเบอร์ไทย: 08x-xxx-xxxx, +668xxxxxxxx และเบอร์สากล
    regex: /(?:\+66|0)[\s\-]?[1-9]\d[\s\-]?\d{3,4}[\s\-]?\d{4}\b|(?:\+\d{1,3}[\s\-]?)?\(?\d{2,4}\)?[\s\-]\d{3,4}[\s\-]\d{4}\b/g,
    reason: "Contains a phone number",
  },
  {
    label: "Credit Card",
    weight: 40,
    // กลุ่ม 4-4-4-4 ต้องมี separator ไม่ติด ID บัตร
    regex: /\b(?:\d{4}[ \-]){3}\d{4}\b|\b3[47]\d{2}[ \-]\d{6}[ \-]\d{5}\b/g,
    reason: "Possible credit card number detected",
  },
  {
    label: "IP Address",
    weight: 10,
    // เช็ค octet ไม่เกิน 255
    regex: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
    reason: "Contains an IP address",
  },
  {
    label: "Thai National ID",
    weight: 35,
    // บัตรประชาชนไทย 13 หลัก
    regex: /\b\d[\-\s]?\d{4}[\-\s]?\d{5}[\-\s]?\d{2}[\-\s]?\d\b/g,
    reason: "Possible Thai national ID number",
  },
  {
    label: "Passport Number",
    weight: 25,
    // อักษร 1-2 ตัว + ตัวเลข 6-9 ตัว
    regex: /\b[A-Z]{1,2}\d{6,9}\b/g,
    reason: "Possible passport number",
  },
  {
    label: "Bank Account",
    weight: 30,
    // เลขบัญชีธนาคารไทย xxx-x-xxxxx-x
    regex: /\b\d{3}[\-]\d{1}[\-]\d{5}[\-]\d{1}\b/g,
    reason: "Possible bank account number",
  },
];

const WEIGHTS = {
  "Email Address": 10,
  "Phone Number": 15,
  "Credit Card": 40,
  "Thai National ID": 35,
  "Passport Number": 25,
  "Bank Account": 30,
  "IP Address": 10,
};

function collectMatches(content) {
  const findings = [];
  const seenValues = new Set();

  for (const item of SENSITIVE_PATTERNS) {
    item.regex.lastIndex = 0;
    const matches = content.match(item.regex) || [];

    for (const match of matches.slice(0, 5)) {
      const normalized = match.replace(/[\s\-]/g, "");
      if (seenValues.has(normalized)) continue;
      seenValues.add(normalized);

      findings.push({
        type: item.label,
        value: match.trim(),
        reason: item.reason,
      });
    }
  }

  return findings;
}

async function detectSensitiveContent(content) {
  const findings = collectMatches(content);

  const riskScore = Math.min(
    100,
    findings.reduce((sum, f) => sum + (WEIGHTS[f.type] ?? 10), 0)
  );

  return {
    safe: findings.length === 0,
    riskScore,
    findings,
    summary: findings.length === 0
      ? "No sensitive data detected."
      : `Found ${findings.length} sensitive item(s): ${[...new Set(findings.map((f) => f.type))].join(", ")}.`,
    mode: "regex",
  };
}

module.exports = { detectSensitiveContent };