/* ========================================
   AUTH SCRIPT - Unified Login & Registration
   ======================================== */

const apiBase = "http://localhost:5000";

// DOM Elements
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const themeSelect = document.getElementById("themeSelect");
const toggleLinks = document.querySelectorAll(".toggle-form-link");

const successModal = document.getElementById("successModal");
const errorModal = document.getElementById("errorModal");
const successMessage = document.getElementById("successMessage");
const errorMessage = document.getElementById("errorMessage");

// Theme Management
const savedTheme = localStorage.getItem("theme") || "dark";
document.body.setAttribute("data-theme", savedTheme);
if (themeSelect) themeSelect.value = savedTheme;

if (themeSelect) {
    themeSelect.addEventListener("change", (e) => {
        const theme = e.target.value;
        localStorage.setItem("theme", theme);
        document.body.setAttribute("data-theme", theme);
    });
}

// Form Toggle
toggleLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetForm = e.target.dataset.form;
        const loginSection = document.querySelector(".login-section");
        const registerSection = document.querySelector(".register-section");

        if (targetForm === "register") {
            loginSection.classList.remove("active");
            registerSection.classList.add("active");
        } else {
            registerSection.classList.remove("active");
            loginSection.classList.add("active");
        }
    });
});

// Show Modal
function showSuccessModal(message) {
    if (!successMessage || !successModal) return;
    successMessage.textContent = message;
    successModal.classList.add("show");
    setTimeout(() => successModal.classList.remove("show"), 3000);
}

function showErrorModal(message) {
    if (!errorMessage || !errorModal) return;
    errorMessage.textContent = message;
    errorModal.classList.add("show");
    setTimeout(() => errorModal.classList.remove("show"), 3000);
}

// Close modals on click
document.querySelectorAll(".modal-overlay").forEach((modal) => {
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.remove("show");
        }
    });
});

// REGISTER
if (registerForm) {
    registerForm.addEventListener("submit", async(e) => {
        e.preventDefault();

        const username = document.getElementById("regUsername").value.trim();
        const email = document.getElementById("regEmail").value.trim();
        const password = document.getElementById("regPassword").value;

        if (!username || !email || !password) {
            showErrorModal("Please fill in all fields");
            return;
        }

        if (password.length < 6) {
            showErrorModal("Password must be at least 6 characters");
            return;
        }

        try {
            const res = await fetch(`${apiBase}/api/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                showSuccessModal("✓ Account created! Switch to login to continue.");
                registerForm.reset();
                setTimeout(() => {
                    document.querySelector(".register-section").classList.remove("active");
                    document.querySelector(".login-section").classList.add("active");
                }, 2000);
            } else {
                showErrorModal(data.message || "Registration failed");
            }
        } catch (err) {
            showErrorModal("Connection error. Please check your server.");
        }
    });
}

// LOGIN
if (loginForm) {
    loginForm.addEventListener("submit", async(e) => {
        e.preventDefault();

        const username = document.getElementById("loginUsername").value.trim();
        const password = document.getElementById("loginPassword").value;

        if (!username || !password) {
            showErrorModal("Please enter username and password");
            return;
        }

        try {
            const res = await fetch(`${apiBase}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem("username", data.username);
                showSuccessModal("✓ Welcome! Redirecting to dashboard...");
                setTimeout(() => {
                    window.location.href = "/pages/dashboard.html";
                }, 1500);
            } else {
                showErrorModal(data.message || "Invalid credentials");
            }
        } catch (err) {
            showErrorModal("Connection error. Please check your server.");
        }
    });
}

/* ============================
   IMAGE-GRID BEHAVIOR (scoped)
   - uses elements inside .brand-features only
   - supports: hover / focus / keyboard / touch
   ============================ */

(function initImageGrid() {
    const cards = Array.from(document.querySelectorAll('.brand-features .img-card'));
    if (!cards.length) return;

    // populate overlay text from data attributes
    cards.forEach(card => {
        const name = card.dataset.name || '';
        const id = card.dataset.id || '';
        const titleEl = card.querySelector('.title');
        const idEl = card.querySelector('.id');
        if (titleEl) titleEl.textContent = name;
        if (idEl) idEl.textContent = id;
    });

    let active = null;

    function setActive(card) {
        // clear others
        cards.forEach(c => {
            c.classList.remove('is-active');
            c.classList.remove('blurred');
        });
        if (card) {
            card.classList.add('is-active');
            cards.forEach(c => { if (c !== card) c.classList.add('blurred'); });
            active = card;
        } else {
            active = null;
        }
    }

    function clearActive() {
        cards.forEach(c => { c.classList.remove('is-active'); c.classList.remove('blurred'); });
        active = null;
    }

    // attach events
    cards.forEach(card => {
        // mouse enter -> activate
        card.addEventListener('mouseenter', () => setActive(card));
        card.addEventListener('mouseleave', () => {
            // if focus is inside card keep it, else clear
            if (document.activeElement !== card) clearActive();
        });

        // focus for keyboard users
        card.addEventListener('focus', () => setActive(card));
        card.addEventListener('blur', () => clearActive());

        // keyboard activation (Enter / Space): toggle active state
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (card === active) {
                    clearActive();
                } else {
                    setActive(card);
                }
            }
        });

        // touch / click: toggle active on tap
        card.addEventListener('click', (e) => {
            if (card === active) {
                clearActive();
            } else {
                setActive(card);
            }
        });
    });

    // clicking anywhere else on document clears active
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.brand-features')) {
            clearActive();
        }
    });

    // handle escape to clear
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') clearActive();
    });

})();
