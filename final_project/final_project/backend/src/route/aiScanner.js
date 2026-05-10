const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-flash-latest";



function buildPrompt(content) {
  return [
    "You are a document privacy and security scanner.",
    "Analyze the document and detect personal/sensitive data or technical vulnerabilities.",
    "Specifically look for: Emails, Phone Numbers, IP Addresses (IPv4/IPv6), Credit Cards, and National IDs.",
    "Return JSON with this exact shape:",
    '{ "safe": boolean, "riskScore": number, "findings": [{ "type": string, "value": string, "reason": string }], "summary": string }',
    "riskScore must be 0-100. Be more aggressive with scores (e.g., 70+) if multiple IP addresses or technical credentials are found.",
    "Keep findings concise and focus on real sensitive data.",
    "Document:",
    content,
  ].join("\n");
}

function safeParseModelJson(rawText) {
  try {
    // Attempt to extract JSON if model wraps it in markdown blocks
    const jsonMatch = rawText.match(/```json\n([\s\S]*?)\n```/) || rawText.match(/{[\s\S]*}/);
    const toParse = jsonMatch ? jsonMatch[1] || jsonMatch[0] : rawText;
    return JSON.parse(toParse);
  } catch (_error) {
    return null;
  }
}

async function analyzeWithAI(content) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY missing");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
    {
      parts: [{ text: buildPrompt(content) }],
    },
  ],
  generationConfig: {
    temperature: 0.1,
    responseMimeType: "application/json",
  },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI scan failed: ${errorText}`);
  }

  const payload = await response.json();
  const rawText = payload?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const parsed = safeParseModelJson(rawText);
  if (!parsed) {
    throw new Error("AI returned non-JSON output");
  }

  return {
    safe: Boolean(parsed.safe),
    riskScore: Number(parsed.riskScore || 0),
    findings: Array.isArray(parsed.findings) ? parsed.findings : [],
    summary: String(parsed.summary || ""),
    mode: "ai",
  };
}

module.exports = { analyzeWithAI };
