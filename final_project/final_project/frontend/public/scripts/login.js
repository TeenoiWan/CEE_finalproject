import { login, register } from "./api.js";

// If already logged in, go to dashboard.
try {
  const token = localStorage.getItem("token");
  if (token) window.location.replace("index.html");
} catch (_err) {
  // Ignore and keep showing login.
}

// ===============================
// ELEMENTS
// ===============================
const form = document.getElementById("loginForm");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const errorEmail = document.getElementById("errorEmail");
const errorPassword = document.getElementById("errorPassword");

const alertError = document.getElementById("alertError");
const alertMsg = document.getElementById("alertMsg");

const btnLogin = document.getElementById("btnLogin");
const btnLabel = document.getElementById("btnLabel");
const btnSpinner = document.getElementById("btnSpinner");

const togglePw = document.getElementById("togglePw");
const eyeIcon = document.getElementById("eyeIcon");

// ==============================
// Register elements
// ==============================
const registerCard = document.getElementById("registerCard");
const registerForm = document.getElementById("registerForm");
const regNameInput = document.getElementById("regName");
const regEmailInput = document.getElementById("regEmail");
const regPasswordInput = document.getElementById("regPassword");
const errorRegName = document.getElementById("errorRegName");
const errorRegEmail = document.getElementById("errorRegEmail");
const errorRegPassword = document.getElementById("errorRegPassword");
const alertRegError = document.getElementById("alertRegError");
const alertRegMsg = document.getElementById("alertRegMsg");
const btnRegister = document.getElementById("btnRegister");
const btnRegisterSpinner = document.getElementById("btnRegisterSpinner");
const linkToRegister = document.getElementById("linkToRegister");
const linkBackToLogin = document.getElementById("linkBackToLogin");

// ===============================
// TOGGLE PASSWORD
// ===============================
togglePw.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";

  passwordInput.type = isPassword ? "text" : "password";
  eyeIcon.textContent = isPassword ? "🙈" : "👁";
});

// ===============================
// VALIDATION
// ===============================
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function clearErrors() {
  errorEmail.textContent = "";
  errorPassword.textContent = "";
  alertError.style.display = "none";
}

function showError(message) {
  alertMsg.textContent = message;
  alertError.style.display = "flex";
}

function showRegError(message) {
  alertRegMsg.textContent = message;
  alertRegError.style.display = "flex";
}

function clearRegErrors() {
  errorRegName.textContent = "";
  errorRegEmail.textContent = "";
  errorRegPassword.textContent = "";
  alertRegError.style.display = "none";
}

// ===============================
// LOADING STATE
// ===============================
function setLoading(isLoading) {
  if (isLoading) {
    btnLabel.style.display = "none";
    btnSpinner.style.display = "inline-block";
    btnLogin.disabled = true;
  } else {
    btnLabel.style.display = "inline";
    btnSpinner.style.display = "none";
    btnLogin.disabled = false;
  }
}

function setRegisterLoading(isLoading) {
  if (isLoading) {
    btnRegister.disabled = true;
    const label = document.getElementById("btnRegisterLabel");
    if (label) label.style.display = "none";
    if (btnRegisterSpinner) btnRegisterSpinner.style.display = "inline-block";
  } else {
    btnRegister.disabled = false;
    const label = document.getElementById("btnRegisterLabel");
    if (label) label.style.display = "inline";
    if (btnRegisterSpinner) btnRegisterSpinner.style.display = "none";
  }
}

// ===============================
// FORM SUBMIT
// ===============================
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  let isValid = true;

  // validate email
  if (!email) {
    errorEmail.textContent = "Email is required";
    isValid = false;
  } else if (!validateEmail(email)) {
    errorEmail.textContent = "Invalid email format";
    isValid = false;
  }

  // validate password
  if (!password) {
    errorPassword.textContent = "Password is required";
    isValid = false;
  } else if (password.length < 8) {
    errorPassword.textContent = "Password must be at least 8 characters";
    isValid = false;
  }

  if (!isValid) return;

  try {
    setLoading(true);

    const res = await login(email, password);

    // save token
    localStorage.setItem("token", res.token);
    localStorage.setItem("user", JSON.stringify(res.user));

    // redirect
    window.location.href = "index.html";

  } catch (err) {
    showError(err?.message || "Invalid email or password");
  } finally {
    setLoading(false);
  }
});

// ===============================
// Register toggle
// ===============================
if (linkToRegister && registerCard) {
  linkToRegister.addEventListener("click", (e) => {
    e.preventDefault();
    form.closest(".login-card").style.display = "none";
    registerCard.style.display = "block";
    clearRegErrors();
  });
}

if (linkBackToLogin && registerCard) {
  linkBackToLogin.addEventListener("click", (e) => {
    e.preventDefault();
    registerCard.style.display = "none";
    form.closest(".login-card").style.display = "block";
    clearErrors();
  });
}

// ===============================
// Register submit
// ===============================
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearRegErrors();

    const name = regNameInput.value.trim();
    const email = regEmailInput.value.trim();
    const password = regPasswordInput.value.trim();

    let isValid = true;

    if (!name) {
      errorRegName.textContent = "Name is required";
      isValid = false;
    }

    if (!email) {
      errorRegEmail.textContent = "Email is required";
      isValid = false;
    } else if (!validateEmail(email)) {
      errorRegEmail.textContent = "Invalid email format";
      isValid = false;
    }

    if (!password) {
      errorRegPassword.textContent = "Password is required";
      isValid = false;
    } else if (password.length < 8) {
      errorRegPassword.textContent = "Password must be at least 8 characters";
      isValid = false;
    } else if (!/[A-Z]/.test(password)) {
      errorRegPassword.textContent = "Must include at least one uppercase letter";
      isValid = false;
    } else if (!/[0-9]/.test(password)) {
      errorRegPassword.textContent = "Must include at least one number";
      isValid = false;
    } else if (!/[^A-Za-z0-9]/.test(password)) {
      errorRegPassword.textContent = "Must include at least one special character (!@#$%…)";
      isValid = false;
    }

    if (!isValid) return;

    try {
      setRegisterLoading(true);
      const res = await register(name, email, password);

      // After successful register, move back to login with only the email prefilled.
      // Never prefill the password — that would expose it in the input field.
      if (res?.message) showError(res.message);
      emailInput.value = email;
      passwordInput.value = "";
      registerCard.style.display = "none";
      form.closest(".login-card").style.display = "block";
      clearRegErrors();
    } catch (err) {
      showRegError(err?.message || "Registration failed");
    } finally {
      setRegisterLoading(false);
    }
  });
}