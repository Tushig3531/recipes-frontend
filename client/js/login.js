const api_uri = 'http://localhost:8080';

function getCookie(name) {
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${name}=`));
  return cookie ? cookie.split('=')[1] : null;
}

function deleteCookie(name) {
  document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 UTC; Path=/; SameSite=None; Secure`;
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const regErrorDiv = document.querySelector('.reg-error');
    regErrorDiv.innerText = "";
    regErrorDiv.classList.remove("text-success");
    regErrorDiv.classList.remove("has-text-danger");

    // Basic validations
    if (!username || !email || !password) {
      regErrorDiv.innerText = "All fields are required.";
      regErrorDiv.classList.add("has-text-danger");
      return;
    }
    try {
      const response = await fetch(`${api_uri}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        regErrorDiv.innerText = "Registration Successful!";
        regErrorDiv.classList.add("text-success");
        setTimeout(() => {
          regErrorDiv.innerText = "";
          window.location.href = 'index.html';
        }, 1500);
      } else {
        regErrorDiv.innerText = data.error || "Error during registration.";
        regErrorDiv.classList.add("has-text-danger");
      }
    } catch (error) {
      console.error("Registration error:", error);
      regErrorDiv.innerText = "An error occurred. Please try again.";
      regErrorDiv.classList.add("has-text-danger");
    }
  });
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const login_error = document.querySelector('.login-error');
    login_error.innerText = "";
    login_error.classList.remove("text-success");
    login_error.classList.remove("has-text-danger");

    try {
      const response = await fetch(`${api_uri}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include' 
      });
      const data = await response.json();
      if (response.ok) {
        login_error.innerText = "Login Successful!";
        login_error.classList.add("text-success");
        setTimeout(() => {
          login_error.innerText = "";
          window.location.href = 'recipes.html';
        }, 1500);
      } else {
        login_error.innerText = data.error || "Invalid credentials";
        login_error.classList.add("has-text-danger");
      }
    } catch (error) {
      console.error("Error during login:", error);
      login_error.innerText = "Oops! Something went wrong.";
      login_error.classList.add("has-text-danger");
    }
  });
}

const logoutButton = document.getElementById('logout-button');
if (logoutButton) {
  logoutButton.addEventListener('click', logout);
}

async function logout() {
  try {
    const response = await fetch(`${api_uri}/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    if (response.ok) {
      alert('You have been logged out successfully.');
      window.location.href = 'index.html';
    } else {
      alert('Error during logout.');
    }
  } catch (error) {
    console.error("Logout error:", error);
    alert('An unexpected error occurred during logout.');
  }
}


if (window.location.pathname.endsWith('protected.html')) {
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const response = await fetch(`${api_uri}/protected`, {
        method: 'GET',
        credentials: 'include' 
      });
      if (!response.ok) {
        throw new Error('Not authenticated');
      }
      const data = await response.json();
      document.getElementById('user-details').textContent = `Welcome, ${escapeHtml(data.user.username)}`;
    } catch (error) {
      console.error('Error accessing protected route:', error);
      alert('You must be logged in to access this page.');
      window.location.href = 'index.html';
    }
  });
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', logout);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(text) {
  if (!text) return '';
  return text.replace(/'/g, "\\'");
}
