const STORAGE_KEY = "jobAutofillProfile";
const CUSTOM_FIELDS_STORAGE_KEY = "customFields";
const STATS_KEY = "jaaStats";
const OPEN_EDITOR_KEY = "jaaOpenEditor";
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
const DEFAULT_STATS = {
  applicationsCount: 0,
  timeSavedMinutes: 0
};
const PROFILE_FIELDS = [
  ["Name", "fullName"],
  ["Email", "email"],
  ["Phone", "phone"],
  ["City", "city"],
  ["Company", "currentCompany"],
  ["Role", "currentRole"]
];

const status = document.getElementById("status");
const statsBlock = document.getElementById("statsBlock");
const statsAppliedCount = document.getElementById("statsAppliedCount");
const statsTimeSaved = document.getElementById("statsTimeSaved");
const editProfileButton = document.getElementById("editProfileButton");
const heroEditButton = document.getElementById("heroEditButton");
const profileSummary = document.getElementById("profileSummary");
const autofillNowButton = document.getElementById("autofillNowButton");
const autofillSpinner = document.getElementById("autofillSpinner");

document.addEventListener("DOMContentLoaded", initializePopup);
editProfileButton.addEventListener("click", openEditProfile);
heroEditButton.addEventListener("click", openEditProfile);
autofillNowButton.addEventListener("click", handlePopupAutofill);

async function initializePopup() {
  const state = await loadPopupState();
  renderStats(state.stats);
  renderProfile(state.profile);
}

async function loadPopupState() {
  const stored = await chrome.storage.local.get([
    STORAGE_KEY,
    STATS_KEY
  ]);

  return {
    profile: {
      ...DEFAULT_PROFILE,
      ...(stored[STORAGE_KEY] || {})
    },
    stats: {
      ...DEFAULT_STATS,
      ...(stored[STATS_KEY] || {})
    }
  };
}

function renderStats(stats) {
  const applicationsCount = Number(stats.applicationsCount || 0);
  const timeSavedMinutes = Number(stats.timeSavedMinutes || 0);
  const timeSavedHours = (timeSavedMinutes / 60).toFixed(1);

  statsBlock.hidden = false;
  statsAppliedCount.textContent = applicationsCount.toLocaleString();
  statsTimeSaved.textContent = `${timeSavedHours}h`;
}

function renderProfile(profile) {
  const hasProfile = hasSavedProfile(profile);
  const items = PROFILE_FIELDS
    .map(([label, key]) => {
      const value = String(profile[key] || "").trim();
      if (!value) {
        return "";
      }

      return `
        <div class="jaa-profile-item">
          <span>${label}</span>
          <strong>${escapeHtml(value)}</strong>
        </div>
      `;
    })
    .filter(Boolean)
    .join("");

  profileSummary.innerHTML = hasProfile
    ? items
    : `
      <div class="jaa-empty-state">
        <strong>No profile saved yet</strong>
        <span>Open edit profile and save your details once.</span>
      </div>
    `;
}

async function openEditProfile() {
  await chrome.storage.local.set({ [OPEN_EDITOR_KEY]: true });
  await chrome.runtime.openOptionsPage();
}

async function handlePopupAutofill() {
  const state = await loadPopupState();
  if (!hasSavedProfile(state.profile)) {
    showStatus("Save your profile before starting autofill.", true);
    await openEditProfile();
    return;
  }

  setAutofillLoading(true);

  try {
    await syncCustomFieldsToActiveTab();
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

    await recordAutofillSuccess(state.stats);
    showStatus(response.message || "Form data filled successfully.");
    const freshState = await loadPopupState();
    renderStats(freshState.stats);
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

async function syncCustomFieldsToActiveTab() {
  try {
    const stored = await chrome.storage.local.get([CUSTOM_FIELDS_STORAGE_KEY]);
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      return;
    }

    await chrome.tabs.sendMessage(tab.id, {
      type: "JAA_SYNC_CUSTOM_FIELDS",
      customFields: sanitizeCustomFields(stored[CUSTOM_FIELDS_STORAGE_KEY] || {})
    });
  } catch (error) {
    // Ignore cases where the active tab has no content script yet.
  }
}

async function recordAutofillSuccess(stats) {
  const nextStats = {
    applicationsCount: Number(stats.applicationsCount || 0) + 1,
    timeSavedMinutes: Number(stats.timeSavedMinutes || 0) + 6
  };

  await chrome.storage.local.set({
    [STATS_KEY]: nextStats
  });
}

function setAutofillLoading(isLoading) {
  autofillNowButton.disabled = isLoading;
  autofillSpinner.hidden = !isLoading;
  autofillNowButton.querySelector(".jaa-button-text").textContent = isLoading
    ? "Filling Current Page..."
    : "Autofill Current Page";
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

function sanitizeCustomFields(customFields) {
  if (!customFields || typeof customFields !== "object") {
    return {};
  }

  return Object.entries(customFields).reduce((accumulator, [fieldKey, config]) => {
    const normalizedKey = normalizeCustomFieldKey(fieldKey);
    if (!normalizedKey || !config || typeof config !== "object") {
      return accumulator;
    }

    accumulator[normalizedKey] = {
      keywords: Array.isArray(config.keywords)
        ? config.keywords.map((keyword) => String(keyword || "").trim()).filter(Boolean)
        : [],
      value: String(config.value || "").trim()
    };
    return accumulator;
  }, {});
}

function normalizeCustomFieldKey(key) {
  return String(key || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function showStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("is-error", isError);
  status.classList.toggle("is-success", !isError && Boolean(message));
  window.clearTimeout(showStatus.timeoutId);
  showStatus.timeoutId = window.setTimeout(() => {
    status.textContent = "";
    status.classList.remove("is-error", "is-success");
  }, 2600);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
