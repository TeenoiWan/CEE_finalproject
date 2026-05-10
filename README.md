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

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- A MongoDB Atlas account (free tier works)
- A Google Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### 2. Set up the Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` folder:

```env
PORT=3222
CLIENT_URL=http://localhost:3221
JWT_SECRET=your_secret_key_here
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/scanner-db
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the backend:

```bash
npm start
```

### 3. Set up the Frontend

```bash
cd frontend
npm install
npm start
```

The frontend will be available at `http://localhost:3221`.

---

## 🌐 Deployment

When deploying to a public server (e.g. an EC2 instance at `YOUR_IP`):

1. Update `backend/.env`:
   ```env
   PORT=3222
   CLIENT_URL=http://YOUR_IP:3221
   ```

2. Update `frontend/public/scripts/api.js` line 34:
   ```js
   BASE_URL: window.APP_API_BASE_URL || "http://YOUR_IP:3222/api",
   ```

3. Make sure the backend binds to `0.0.0.0` in `server.js`:
   ```js
   app.listen(PORT, "0.0.0.0", () => { ... })
   ```

4. Open firewall ports `3221` and `3222`.

5. Use `pm2` or `tmux` to keep the servers running after you disconnect:
   ```bash
   # Using pm2
   npm install -g pm2
   pm2 start backend/src/server.js --name backend
   pm2 start frontend/server.js --name frontend
   ```

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

## ⚠️ Important

- **Never commit your `.env` file.** Make sure `.env` is listed in `.gitignore`.
- All API keys and secrets must stay in `.env` only.

---

## 👥 Team Members

-
-
-

---

## 🔗 Links

- **Live URL:** *(your deployed URL here)*
- **Video Demo:** *(your YouTube link here)*
