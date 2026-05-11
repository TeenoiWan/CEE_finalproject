# 🔍 SecureDoc Scanner

An AI-powered web application that scans uploaded documents for sensitive information and calculates a privacy risk score.

## 📋 What It Does

Users upload a document (PDF, text, etc.) and the app uses the Google Gemini API to detect sensitive data such as personal IDs, credit card numbers, phone numbers, email addresses, and more. Each scan produces a risk score (0–100) with a detailed breakdown of findings. All scan history is saved per user account.

---

## ✨ Features

- **User Authentication** — Register, login, and logout with JWT-based auth
- **Document Scanning** — Upload a file and get AI-powered sensitive data detection
- **Risk Scoring** — Risk level calculated as Low / Medium / High based on findings
- **Scan History** — View all past scans, persisted in MongoDB per user
- **Delete Scans** — Remove individual scans or clear all history

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS, HTML, CSS |
| Backend | Node.js, Express |
| Database | MongoDB Atlas (Mongoose) |
| AI / API | Google Gemini API |
| Auth | JWT (jsonwebtoken), bcryptjs |
| File Upload | Multer |

---



## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/         # Database connection
│   │   ├── controllers/    # Route handlers (auth, scan)
│   │   ├── middleware/     # JWT auth middleware
│   │   ├── models/         # Mongoose models (User, Scan)
│   │   ├── route/          # Express routers
│   │   └── server.js       # Entry point
│   └── .env                # ← create this (not committed)
│
└── frontend/
    ├── public/
    │   ├── scripts/        # api.js, scanner.js, scans.js, etc.
    │   ├── index.html      # Main app page
    │   ├── login.html      # Login / register page
    │   └── style.css
    └── server.js           # Static file server
```

---


