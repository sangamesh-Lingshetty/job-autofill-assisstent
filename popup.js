const STORAGE_KEY = "jobAutofillProfile";
const CUSTOM_FIELDS_STORAGE_KEY = "customFields";
const STATS_KEY = "jaaStats";
const DAILY_USAGE_KEY = "jaaDailyUsage";
const OPEN_EDITOR_KEY = "jaaOpenEditor";
const PRO_UPGRADE_URL = "https://www.deeplock.tech/auto-fill-job";
const FREE_DAILY_LIMIT = 10;
const ESTIMATED_MINUTES_PER_AUTOFILL = 6;
const DEFAULT_PROFILE = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  city: "",
  preferredLocation: "",
  currentCompany: "",
  currentRole: "",
  joiningDate: "",
  relievingDate: "",
  currentlyWorking: "no",
  linkedin: "",
  portfolio: "",
  github: "",
  education: "",
  degree: "",
  university: "",
  graduationYear: "",
  about: "",
  experience: "",
  skills: "",
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
const DEFAULT_DAILY_USAGE = {
  date: "",
  count: 0
};
const status = document.getElementById("status");
const statsBlock = document.getElementById("statsBlock");
const statsAppliedCount = document.getElementById("statsAppliedCount");
const statsTimeSaved = document.getElementById("statsTimeSaved");
const editProfileButton = document.getElementById("editProfileButton");
const profileAvatar = document.getElementById("profileAvatar");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const autofillNowButton = document.getElementById("autofillNowButton");
const autofillSpinner = document.getElementById("autofillSpinner");
const upgradeCard = document.getElementById("upgradeCard");
const upgradeTitle = document.getElementById("upgradeTitle");
const upgradeMessage = document.getElementById("upgradeMessage");
const upgradeButton = document.getElementById("upgradeButton");

document.addEventListener("DOMContentLoaded", initializePopup);
editProfileButton.addEventListener("click", openEditProfile);
autofillNowButton.addEventListener("click", handlePopupAutofill);
upgradeButton.addEventListener("click", openUpgradePage);

async function initializePopup() {
  const state = await loadPopupState();
  renderStats(state.stats);
  renderProfile(state.profile);
  renderUpgradeState(state.dailyUsage);
}

async function loadPopupState() {
  const stored = await chrome.storage.local.get([
    STORAGE_KEY,
    STATS_KEY,
    DAILY_USAGE_KEY
  ]);

  return {
    profile: {
      ...DEFAULT_PROFILE,
      ...(stored[STORAGE_KEY] || {})
    },
    stats: {
      ...DEFAULT_STATS,
      ...(stored[STATS_KEY] || {})
    },
    dailyUsage: getNormalizedDailyUsage(stored[DAILY_USAGE_KEY])
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
  const fullName = String(profile.fullName || "").trim();
  const email = String(profile.email || "").trim();

  profileName.textContent = hasProfile
    ? fullName || "Saved profile"
    : "No profile saved yet";
  profileEmail.textContent = hasProfile
    ? email || "Add your email in the profile editor"
    : "Open Edit and save your details once.";
  profileAvatar.textContent = getInitials(fullName || email || "SL");
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

  if (hasReachedDailyLimit(state.dailyUsage)) {
    renderUpgradeState(state.dailyUsage);
    showStatus("Today's free autofill limit has been reached.", true);
    return;
  }

  setAutofillLoading(true);

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      showStatus("Unable to find the active tab.", true);
      return;
    }

    if (!isSupportedAutofillPage(tab.url)) {
      showStatus("Open a regular job application page, then try again.", true);
      return;
    }

    await ensureTabReadyForAutofill(tab);
    await syncCustomFieldsToActiveTab(tab.id);
    const response = await chrome.tabs.sendMessage(tab.id, { type: "JAA_AUTOFILL_NOW" });
    if (!response || !response.ok) {
      showStatus(response && response.message ? response.message : "Autofill could not run on this page.", true);
      return;
    }

    showStatus(response.message || "Form data filled successfully.");
    const freshState = await loadPopupState();
    renderStats(freshState.stats);
    renderUpgradeState(freshState.dailyUsage);
  } catch (error) {
    const errorMessage = String((error && error.message) || "");
    const message = errorMessage.includes("Cannot access")
      ? "Chrome blocked autofill on this page. Open the actual application form and try again."
      : errorMessage.includes("Receiving end does not exist")
        ? "Autofill could not attach to this page yet. Try once more or reload the tab."
      : "Open a job application page first, then try again.";
    showStatus(message, true);
  } finally {
    setAutofillLoading(false);
    const latestState = await loadPopupState();
    renderUpgradeState(latestState.dailyUsage);
  }
}

async function syncCustomFieldsToActiveTab(tabId) {
  try {
    const stored = await chrome.storage.local.get([CUSTOM_FIELDS_STORAGE_KEY]);
    if (!tabId) {
      return;
    }

    await chrome.tabs.sendMessage(tabId, {
      type: "JAA_SYNC_CUSTOM_FIELDS",
      customFields: sanitizeCustomFields(stored[CUSTOM_FIELDS_STORAGE_KEY] || {})
    });
  } catch (error) {
    // Ignore cases where the active tab has no content script yet.
  }
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

function renderUpgradeState(dailyUsage) {
  const normalizedDailyUsage = getNormalizedDailyUsage(dailyUsage);
  const dailyCount = normalizedDailyUsage.count;
  const hasLimit = hasReachedDailyLimit(normalizedDailyUsage);
  const savedHours = ((dailyCount * ESTIMATED_MINUTES_PER_AUTOFILL) / 60).toFixed(1);

  upgradeCard.hidden = !hasLimit;
  autofillNowButton.disabled = hasLimit;
  autofillNowButton.querySelector(".jaa-button-text").textContent = hasLimit
    ? "Daily Limit Reached"
    : "Autofill Current Page";
  autofillSpinner.hidden = true;

  if (!hasLimit) {
    return;
  }

  upgradeTitle.textContent = "Today's free autofill goal is complete.";
  upgradeMessage.textContent = `You finished ${dailyCount} job applications today and saved about ${savedHours}h. Unlock Pro for unlimited autofill and keep the momentum going.`;
}

function hasReachedDailyLimit(dailyUsage) {
  return Number(dailyUsage && dailyUsage.count) >= FREE_DAILY_LIMIT;
}

function getNormalizedDailyUsage(dailyUsage) {
  const today = getTodayStamp();
  const storedDate = String(dailyUsage && dailyUsage.date ? dailyUsage.date : "");
  const storedCount = Number(dailyUsage && dailyUsage.count ? dailyUsage.count : 0);

  if (storedDate !== today) {
    return {
      ...DEFAULT_DAILY_USAGE,
      date: today
    };
  }

  return {
    date: today,
    count: Number.isFinite(storedCount) && storedCount >= 0 ? storedCount : 0
  };
}

function getTodayStamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function openUpgradePage() {
  await chrome.tabs.create({ url: PRO_UPGRADE_URL });
}

async function ensureTabReadyForAutofill(tab) {
  if (!tab || !tab.id) {
    throw new Error("Missing active tab");
  }

  try {
    await chrome.tabs.sendMessage(tab.id, { type: "JAA_SYNC_CUSTOM_FIELDS", customFields: {} });
    return;
  } catch (error) {
    const message = String((error && error.message) || "");
    if (!message.includes("Receiving end does not exist")) {
      throw error;
    }
  }

  await chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    files: ["styles.css"]
  });

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });
}

function isSupportedAutofillPage(url) {
  const normalizedUrl = String(url || "").trim().toLowerCase();
  return normalizedUrl.startsWith("http://")
    || normalizedUrl.startsWith("https://");
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

function getInitials(value) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return "SL";
  }

  const parts = normalized
    .split(/[\s@._-]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) {
    return "SL";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}
