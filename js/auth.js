async function checkAuth() {
    try {
        const response = await fetch("http://localhost:8080/protected", {
            method: 'GET',
            credentials: 'include' // Send cookies
        });
        if (!response.ok) {
            throw new Error("Not authenticated");
        }
        // Optionally, handle user data
        const data = await response.json();
        console.log(`Authenticated as User ID: ${data.user.id}, Username: ${data.user.username}`);
    } catch (error) {
        alert('You must be logged in to access this page.');
        window.location.href = 'index.html';
    }
}

async function logout() {
    try {
        const response = await fetch("http://localhost:8080/logout", {
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

document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
});

export { checkAuth };
