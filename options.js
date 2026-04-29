const STORAGE_KEY = "jobAutofillProfile";
const OPEN_EDITOR_KEY = "jaaOpenEditor";
const AI_CONFIG_KEY = "jaaAiConfig";
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
const DEFAULT_AI_CONFIG = {
  enabled: true,
  endpoint: "",
  authToken: "",
  dailyLimit: 20,
  minIntervalMs: 2500,
  requestTimeoutMs: 20000
};

const form = document.getElementById("profileForm");
const aiConfigForm = document.getElementById("aiConfigForm");
const status = document.getElementById("status");

document.addEventListener("DOMContentLoaded", initializeOptionsPage);
form.addEventListener("submit", handleSave);
aiConfigForm.addEventListener("submit", handleAiConfigSave);

async function initializeOptionsPage() {
  const profile = await getStoredProfile();
  const aiConfig = await getStoredAiConfig();
  hydrateForm(profile);
  hydrateAiConfig(aiConfig);
  await chrome.storage.local.remove(OPEN_EDITOR_KEY);
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
  showStatus("Profile saved successfully.");
}

async function getStoredProfile() {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return {
    ...DEFAULT_PROFILE,
    ...(stored[STORAGE_KEY] || {})
  };
}

async function getStoredAiConfig() {
  const stored = await chrome.storage.local.get(AI_CONFIG_KEY);
  return {
    ...DEFAULT_AI_CONFIG,
    ...(stored[AI_CONFIG_KEY] || {})
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

function hydrateAiConfig(config) {
  for (const [key, value] of Object.entries(config)) {
    const field = aiConfigForm.elements.namedItem(key);
    if (field) {
      field.value = key === "enabled" ? (value ? "yes" : "no") : String(value);
    }
  }
}

async function handleAiConfigSave(event) {
  event.preventDefault();

  const config = {
    endpoint: aiConfigForm.endpoint.value.trim(),
    authToken: aiConfigForm.authToken.value.trim(),
    dailyLimit: normalizePositiveInteger(aiConfigForm.dailyLimit.value, DEFAULT_AI_CONFIG.dailyLimit),
    minIntervalMs: normalizePositiveInteger(aiConfigForm.minIntervalMs.value, DEFAULT_AI_CONFIG.minIntervalMs),
    requestTimeoutMs: normalizePositiveInteger(aiConfigForm.requestTimeoutMs.value, DEFAULT_AI_CONFIG.requestTimeoutMs),
    enabled: aiConfigForm.enabled.value === "yes"
  };

  await chrome.storage.local.set({
    [AI_CONFIG_KEY]: config
  });
  showStatus("AI backend settings saved successfully.");
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

function normalizePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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
