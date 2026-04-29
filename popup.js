const STORAGE_KEY = "jobAutofillProfile";
const CUSTOM_FIELDS_STORAGE_KEY = "customFields";
const STATS_KEY = "jaaStats";
const USAGE_KEY = "jaaUsage";
const OPEN_EDITOR_KEY = "jaaOpenEditor";
const DAILY_AUTOFILL_LIMIT = 10;
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
  ["Role", "currentRole"],
  ["Expected Salary", "expectedSalary"],
  ["Notice Period", "notice"]
];

const status = document.getElementById("status");
const statsBlock = document.getElementById("statsBlock");
const statsAppliedCount = document.getElementById("statsAppliedCount");
const statsTimeSaved = document.getElementById("statsTimeSaved");
const usageLimitText = document.getElementById("usageLimitText");
const profileToggleButton = document.getElementById("profileToggleButton");
const profileToggleIcon = document.getElementById("profileToggleIcon");
const profilePanel = document.getElementById("profilePanel");
const profileSummary = document.getElementById("profileSummary");
const editProfileButton = document.getElementById("editProfileButton");
const autofillNowButton = document.getElementById("autofillNowButton");
const autofillSpinner = document.getElementById("autofillSpinner");
const generateAnswerButton = document.getElementById("generateAnswerButton");
const customFieldForm = document.getElementById("customFieldForm");
const customFieldsList = document.getElementById("customFieldsList");

document.addEventListener("DOMContentLoaded", initializePopup);
profileToggleButton.addEventListener("click", toggleProfile);
editProfileButton.addEventListener("click", openEditProfile);
autofillNowButton.addEventListener("click", handlePopupAutofill);
generateAnswerButton.addEventListener("click", handleGenerateAnswer);
customFieldForm.addEventListener("submit", handleCustomFieldSubmit);

async function initializePopup() {
  const state = await loadPopupState();
  renderStats(state.stats);
  renderUsageLimit(state.usage);
  renderProfile(state.profile);
  renderCustomFields(state.customFields);
}

async function loadPopupState() {
  const stored = await chrome.storage.local.get([
    STORAGE_KEY,
    CUSTOM_FIELDS_STORAGE_KEY,
    STATS_KEY,
    USAGE_KEY
  ]);

  return {
    profile: {
      ...DEFAULT_PROFILE,
      ...(stored[STORAGE_KEY] || {})
    },
    customFields: sanitizeCustomFields(stored[CUSTOM_FIELDS_STORAGE_KEY] || {}),
    stats: {
      ...DEFAULT_STATS,
      ...(stored[STATS_KEY] || {})
    },
    usage: normalizeUsage(stored[USAGE_KEY] || {})
  };
}

function renderStats(stats) {
  const applicationsCount = Number(stats.applicationsCount || 0);
  const timeSavedMinutes = Number(stats.timeSavedMinutes || 0);
  const timeSavedHours = (timeSavedMinutes / 60).toFixed(1);

  statsBlock.hidden = applicationsCount <= 0;
  statsAppliedCount.textContent = applicationsCount.toLocaleString();
  statsTimeSaved.textContent = `${timeSavedHours}h`;
}

function renderUsageLimit(usage) {
  usageLimitText.textContent = `Today: ${usage.todayCount} / ${DAILY_AUTOFILL_LIMIT} autofills used`;
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
        <span>Open the profile editor and save your details once.</span>
      </div>
    `;
}

function renderCustomFields(customFields) {
  const entries = Object.entries(customFields);
  if (!entries.length) {
    customFieldsList.innerHTML = `
      <div class="jaa-empty-state">
        <strong>No custom fields yet</strong>
        <span>Add one when a site uses uncommon labels.</span>
      </div>
    `;
    return;
  }

  customFieldsList.innerHTML = entries
    .map(([fieldKey, config]) => `
      <article class="jaa-custom-field-item">
        <div>
          <strong>${escapeHtml(fieldKey)}</strong>
          <p>${escapeHtml((config.keywords || []).join(", "))}</p>
          <span>${escapeHtml(config.value || "")}</span>
        </div>
        <button type="button" class="jaa-button jaa-button--ghost jaa-button--compact" data-delete-custom-field="${escapeHtml(fieldKey)}">Delete</button>
      </article>
    `)
    .join("");

  for (const button of customFieldsList.querySelectorAll("[data-delete-custom-field]")) {
    button.addEventListener("click", handleDeleteCustomField);
  }
}

function toggleProfile() {
  const isExpanded = profileToggleButton.getAttribute("aria-expanded") === "true";
  profileToggleButton.setAttribute("aria-expanded", String(!isExpanded));
  profileToggleIcon.textContent = isExpanded ? "▾" : "▴";
  profilePanel.hidden = isExpanded;
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

  const usage = normalizeUsage(state.usage);
  if (usage.todayCount >= DAILY_AUTOFILL_LIMIT) {
    showStatus("You reached today’s free autofill limit.", true);
    return;
  }

  setAutofillLoading(true);

  try {
    await syncCustomFieldsToActiveTab(state.customFields);
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

    await recordAutofillSuccess(state.stats, usage);
    showStatus(response.message || "Form data filled successfully.");
    const freshState = await loadPopupState();
    renderStats(freshState.stats);
    renderUsageLimit(freshState.usage);
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

function handleGenerateAnswer() {
  triggerGenerateAnswerShortcut().catch((error) => {
    showStatus(String(error && error.message ? error.message : "Unable to open AI answer generation."), true);
  });
}

async function triggerGenerateAnswerShortcut() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) {
    throw new Error("Open a job application page first.");
  }

  const response = await chrome.tabs.sendMessage(tab.id, {
    type: "JAA_TRIGGER_AI_FIELD"
  });

  if (!response || !response.ok) {
    throw new Error("No AI-ready long-answer field was found on this page.");
  }

  showStatus("Generating an answer for the first detected long-answer field.");
}

async function handleCustomFieldSubmit(event) {
  event.preventDefault();

  const formData = new FormData(customFieldForm);
  const fieldKey = normalizeCustomFieldKey(formData.get("customFieldKey"));
  const keywords = String(formData.get("customFieldKeywords") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const value = String(formData.get("customFieldValue") || "").trim();

  if (!fieldKey || !keywords.length || !value) {
    showStatus("Add a field key, at least one keyword, and a value.", true);
    return;
  }

  const state = await loadPopupState();
  const customFields = {
    ...state.customFields,
    [fieldKey]: {
      keywords,
      value
    }
  };

  await chrome.storage.local.set({ [CUSTOM_FIELDS_STORAGE_KEY]: customFields });
  await syncCustomFieldsToActiveTab(customFields);
  customFieldForm.reset();
  renderCustomFields(customFields);
  showStatus("Custom field saved.");
}

async function handleDeleteCustomField(event) {
  const fieldKey = event.currentTarget.getAttribute("data-delete-custom-field");
  if (!fieldKey) {
    return;
  }

  const state = await loadPopupState();
  const customFields = { ...state.customFields };
  delete customFields[fieldKey];
  await chrome.storage.local.set({ [CUSTOM_FIELDS_STORAGE_KEY]: customFields });
  await syncCustomFieldsToActiveTab(customFields);
  renderCustomFields(customFields);
  showStatus("Custom field deleted.");
}

async function syncCustomFieldsToActiveTab(customFields) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      return;
    }

    await chrome.tabs.sendMessage(tab.id, {
      type: "JAA_SYNC_CUSTOM_FIELDS",
      customFields
    });
  } catch (error) {
    // Ignore cases where the active tab has no content script yet.
  }
}

async function recordAutofillSuccess(stats, usage) {
  const nextStats = {
    applicationsCount: Number(stats.applicationsCount || 0) + 1,
    timeSavedMinutes: Number(stats.timeSavedMinutes || 0) + 6
  };
  const nextUsage = {
    date: getTodayKey(),
    todayCount: Number(usage.todayCount || 0) + 1
  };

  await chrome.storage.local.set({
    [STATS_KEY]: nextStats,
    [USAGE_KEY]: nextUsage
  });
}

function setAutofillLoading(isLoading) {
  autofillNowButton.disabled = isLoading;
  autofillSpinner.hidden = !isLoading;
  autofillNowButton.querySelector(".jaa-button-text").textContent = isLoading
    ? "Filling Current Page..."
    : "⚡ Autofill Current Page";
}

function normalizeUsage(usage) {
  const todayKey = getTodayKey();
  if (usage.date !== todayKey) {
    return {
      date: todayKey,
      todayCount: 0
    };
  }

  return {
    date: todayKey,
    todayCount: Number(usage.todayCount || 0)
  };
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
