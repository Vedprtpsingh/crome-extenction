// ============================================
// Secure File Transfer - JavaScript
// ============================================

// Configuration
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzxwKbwtyXn6EYXu2qcD9NSaAn3PPqpNMMXIuXPxOP3t5wplzni-UJyMvZvxEMXm0p2/exec";

// DOM Elements
const form = document.getElementById("fileTransferForm");
const fileInput = document.getElementById("file");
const fileNameDisplay = document.getElementById("fileName");
const dropZone = document.getElementById("dropZone");
const submitBtn = document.getElementById("submitBtn");
const statusMessage = document.getElementById("statusMessage");

// ============================================
// File Upload Handling
// ============================================

fileInput.addEventListener("change", function () {

    if (this.files && this.files[0]) {

        const file = this.files[0];
        const fileSize = formatFileSize(file.size);

        fileNameDisplay.textContent = `${file.name} (${fileSize})`;
        fileNameDisplay.style.color = "#28a745";

    } else {

        fileNameDisplay.textContent = "No file selected";
        fileNameDisplay.style.color = "#764ba2";

    }

});

// Drag & Drop
dropZone.addEventListener("dragover", function (e) {
    e.preventDefault();
    this.classList.add("dragover");
});

dropZone.addEventListener("dragleave", function (e) {
    e.preventDefault();
    this.classList.remove("dragover");
});

dropZone.addEventListener("drop", function (e) {

    e.preventDefault();
    this.classList.remove("dragover");

    const files = e.dataTransfer.files;

    if (files.length > 0) {

        fileInput.files = files;

        const file = files[0];
        const fileSize = formatFileSize(file.size);

        fileNameDisplay.textContent = `${file.name} (${fileSize})`;
        fileNameDisplay.style.color = "#28a745";

    }

});

// ============================================
// Format File Size
// ============================================

function formatFileSize(bytes) {

    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];

}

// ============================================
// Form Submit
// ============================================

form.addEventListener("submit", async function (e) {

    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message").value.trim();
    const file = fileInput.files[0];

    if (!name || !email) {

        showStatus("Please fill in all required fields.", "error");
        return;

    }

    if (!file) {

        showStatus("Please select a file.", "error");
        return;

    }

    // 10MB Limit
    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {

        showStatus("File exceeds 10MB limit.", "error");
        return;

    }

    setLoading(true);
    hideStatus();

    try {

        const base64File = await fileToBase64(file);

        const formData = {

            name: name,
            email: email,
            message: message,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            fileData: base64File

        };

        const response = await sendToGoogleAppsScript(formData);

        if (response.success) {

            showStatus("File uploaded successfully!", "success");

            form.reset();

            fileNameDisplay.textContent = "No file selected";
            fileNameDisplay.style.color = "#764ba2";

        } else {

            showStatus(response.message || "Upload failed.", "error");

        }

    } catch (error) {

        console.error(error);
        showStatus("Error sending data. Check console.", "error");

    }

    setLoading(false);

});

// ============================================
// Convert File to Base64
// ============================================

function fileToBase64(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.readAsDataURL(file);

        reader.onload = () => {

            const base64 = reader.result.split(",")[1];
            resolve(base64);

        };

        reader.onerror = error => reject(error);

    });

}

// ============================================
// Send Data to Google Apps Script
// ============================================

async function sendToGoogleAppsScript(data) {

    const response = await fetch(APPS_SCRIPT_URL, {

        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)

    });

    const result = await response.json();

    return result;

}

// ============================================
// UI Helpers
// ============================================

function setLoading(isLoading) {

    if (isLoading) {

        submitBtn.classList.add("loading");
        submitBtn.disabled = true;

    } else {

        submitBtn.classList.remove("loading");
        submitBtn.disabled = false;

    }

}

function showStatus(message, type) {

    statusMessage.textContent = message;
    statusMessage.className = "status-message " + type;

}

function hideStatus() {

    statusMessage.className = "status-message";

}

// ============================================
// Email Validation
// ============================================

function isValidEmail(email) {

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);

}

document.getElementById("email").addEventListener("blur", function () {

    const email = this.value.trim();

    if (email && !isValidEmail(email)) {

        this.style.borderColor = "#dc3545";

    } else {

        this.style.borderColor = "#e0e0e0";

    }

});

console.log("Secure File Transfer JS Loaded");