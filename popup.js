const STORAGE_KEY = "jobAutofillProfile";

const form = document.getElementById("profileForm");
const status = document.getElementById("status");
const welcomeView = document.getElementById("welcomeView");
const dashboardView = document.getElementById("dashboardView");
const editorView = document.getElementById("editorView");
const startSetupButton = document.getElementById("startSetupButton");
const editProfileButton = document.getElementById("editProfileButton");
const backToDashboardButton = document.getElementById("backToDashboardButton");
const autofillNowButton = document.getElementById("autofillNowButton");
const autofillSpinner = document.getElementById("autofillSpinner");
const profileSnapshot = document.getElementById("profileSnapshot");
const DEFAULT_PROFILE = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  city: "",
  currentCompany: "",
  currentRole: "",
  joiningDate: "",
  relievingDate: "",
  currentlyWorking: "no",
  linkedin: "",
  portfolio: "",
  about: "",
  experience: "",
  motivation: "",
  expectedSalary: "",
  currentSalary: "",
  notice: "",
  relocate: "yes",
  noticeStatus: "no"
};
const SNAPSHOT_FIELDS = [
  ["Name", "fullName"],
  ["Email", "email"],
  ["Phone", "phone"],
  ["City", "city"],
  ["Company", "currentCompany"],
  ["Role", "currentRole"],
  ["Expected Salary", "expectedSalary"],
  ["Notice Period", "notice"]
];

document.addEventListener("DOMContentLoaded", initializePopup);
form.addEventListener("submit", handleSave);
startSetupButton.addEventListener("click", () => {
  setView("editor");
});
editProfileButton.addEventListener("click", () => {
  setView("editor");
});
backToDashboardButton.addEventListener("click", () => {
  setView("dashboard");
});
autofillNowButton.addEventListener("click", handlePopupAutofill);

async function initializePopup() {
  const profile = await getStoredProfile();
  hydrateForm(profile);
  renderSnapshot(profile);
  setView(hasSavedProfile(profile) ? "dashboard" : "welcome");
}

async function handleSave(event) {
  event.preventDefault();

  const profile = {
    fullName: form.fullName.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    password: form.password.value,
    city: form.city.value.trim(),
    currentCompany: form.currentCompany.value.trim(),
    currentRole: form.currentRole.value.trim(),
    joiningDate: form.joiningDate.value.trim(),
    relievingDate: form.relievingDate.value.trim(),
    currentlyWorking: normalizeBooleanChoice(form.currentlyWorking.value, "no"),
    linkedin: form.linkedin.value.trim(),
    portfolio: form.portfolio.value.trim(),
    about: form.about.value.trim(),
    experience: form.experience.value.trim(),
    motivation: form.motivation.value.trim(),
    expectedSalary: normalizeNumber(form.expectedSalary.value),
    currentSalary: normalizeNumber(form.currentSalary.value),
    notice: normalizeNumber(form.notice.value),
    relocate: normalizeBooleanChoice(form.relocate.value, "yes"),
    noticeStatus: normalizeBooleanChoice(form.noticeStatus.value, "no")
  };

  await chrome.storage.local.set({ [STORAGE_KEY]: profile });
  renderSnapshot(profile);
  setView("dashboard");
  showStatus("Profile saved successfully.");
}

async function handlePopupAutofill() {
  const profile = await getStoredProfile();

  if (!hasSavedProfile(profile)) {
    setView("editor");
    showStatus("Save your profile before starting autofill.", true);
    return;
  }

  setAutofillLoading(true);

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      showStatus("Unable to find the active tab.", true);
      return;
    }

    const response = await chrome.tabs.sendMessage(tab.id, { type: "JAA_AUTOFILL_NOW" });
    if (!response || !response.ok) {
      showStatus(response && response.message ? response.message : "Autofill could not run on this page.", true);
      return;
    }

    showStatus(response.message || "Form data filled successfully.");
    setView("dashboard");
  } catch (error) {
    const errorMessage = String((error && error.message) || "");
    const message = errorMessage.includes("Receiving end does not exist")
      ? "Refresh the current page once after reloading the extension, then try again."
      : "Open a job application page first, then try again.";
    showStatus(message, true);
  } finally {
    setAutofillLoading(false);
  }
}

async function getStoredProfile() {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return {
    ...DEFAULT_PROFILE,
    ...(stored[STORAGE_KEY] || {})
  };
}

function hydrateForm(profile) {
  for (const [key, value] of Object.entries(profile)) {
    const field = form.elements.namedItem(key);
    if (field) {
      field.value = isNumericProfileKey(key) ? normalizeNumber(value) : value;
    }
  }
}

function renderSnapshot(profile) {
  const items = SNAPSHOT_FIELDS
    .map(([label, key]) => {
      const value = String(profile[key] || "").trim();
      if (!value) {
        return "";
      }

      return `
        <div class="jaa-snapshot__item">
          <span>${label}</span>
          <strong>${escapeHtml(value)}</strong>
        </div>
      `;
    })
    .filter(Boolean)
    .join("");

  profileSnapshot.innerHTML = items || `
    <div class="jaa-empty-state">
      <strong>No profile saved yet</strong>
      <span>Start setup to save your details.</span>
    </div>
  `;
}

function setView(view) {
  welcomeView.hidden = view !== "welcome";
  dashboardView.hidden = view !== "dashboard";
  editorView.hidden = view !== "editor";
  backToDashboardButton.hidden = view !== "editor" || !profileSnapshot.innerHTML || profileSnapshot.textContent.includes("No profile saved yet");
}

function hasSavedProfile(profile) {
  return Boolean(
    profile.fullName
    || profile.email
    || profile.phone
    || profile.currentCompany
    || profile.currentRole
  );
}

function setAutofillLoading(isLoading) {
  autofillNowButton.disabled = isLoading;
  autofillSpinner.hidden = !isLoading;
  autofillNowButton.querySelector(".jaa-button-text").textContent = isLoading
    ? "Filling Current Page..."
    : "Autofill Current Page";
}

function normalizeNumber(value) {
  const sanitized = String(value || "")
    .replace(/,/g, "")
    .replace(/[^\d.]/g, "")
    .trim();

  if (sanitized === "") {
    return "";
  }

  const parsed = Number(sanitized);
  return Number.isFinite(parsed) && parsed >= 0 ? String(parsed) : "";
}

function normalizeBooleanChoice(value, fallback) {
  return value === "no" ? "no" : value === "yes" ? "yes" : fallback;
}

function isNumericProfileKey(key) {
  return ["expectedSalary", "currentSalary", "notice"].includes(key);
}

function showStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("is-error", isError);
  status.classList.toggle("is-success", !isError && Boolean(message));
  window.clearTimeout(showStatus.timeoutId);
  showStatus.timeoutId = window.setTimeout(() => {
    status.textContent = "";
    status.classList.remove("is-error", "is-success");
  }, 2200);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
