const STORAGE_KEY = "jobAutofillProfile";
const CUSTOM_FIELDS_STORAGE_KEY = "customFields";
const OPEN_EDITOR_KEY = "jaaOpenEditor";
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

const form = document.getElementById("profileForm");
const status = document.getElementById("status");
const toggleCustomFieldsButton = document.getElementById("toggleCustomFieldsButton");
const customFieldsSection = document.getElementById("customFieldsSection");
const customFieldForm = document.getElementById("customFieldForm");
const customFieldsList = document.getElementById("customFieldsList");
const editingCustomFieldKeyInput = document.getElementById("editingCustomFieldKey");
const customFieldSubmitButton = document.getElementById("customFieldSubmitButton");
const cancelCustomFieldEditButton = document.getElementById("cancelCustomFieldEditButton");

document.addEventListener("DOMContentLoaded", initializeOptionsPage);
form.addEventListener("submit", handleSave);
form.addEventListener("input", handleAutoSaveInput);
form.addEventListener("change", handleAutoSaveChange);
toggleCustomFieldsButton.addEventListener("click", toggleCustomFieldsSection);
customFieldForm.addEventListener("submit", handleCustomFieldSubmit);
cancelCustomFieldEditButton.addEventListener("click", resetCustomFieldEditor);

async function initializeOptionsPage() {
  const [profile, customFields] = await Promise.all([
    getStoredProfile(),
    getStoredCustomFields()
  ]);

  hydrateForm(profile);
  renderCustomFields(customFields);
  await chrome.storage.local.remove(OPEN_EDITOR_KEY);
}

function handleAutoSaveInput() {
  window.clearTimeout(handleAutoSaveInput.timeoutId);
  handleAutoSaveInput.timeoutId = window.setTimeout(() => {
    saveProfile("Saved automatically.");
  }, 250);
}

function handleAutoSaveChange() {
  window.clearTimeout(handleAutoSaveInput.timeoutId);
  saveProfile("Saved automatically.");
}

async function handleSave(event) {
  event.preventDefault();
  await saveProfile("Profile saved successfully.");
}

async function saveProfile(successMessage) {
  const profile = collectProfileFromForm();
  await chrome.storage.local.set({ [STORAGE_KEY]: profile });
  showStatus(successMessage);
}

function collectProfileFromForm() {
  return {
    fullName: form.fullName.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    password: form.password.value,
    city: form.city.value.trim(),
    preferredLocation: form.preferredLocation.value.trim(),
    currentCompany: form.currentCompany.value.trim(),
    currentRole: form.currentRole.value.trim(),
    joiningDate: form.joiningDate.value.trim(),
    relievingDate: form.relievingDate.value.trim(),
    currentlyWorking: normalizeBooleanChoice(form.currentlyWorking.value, "no"),
    linkedin: form.linkedin.value.trim(),
    portfolio: form.portfolio.value.trim(),
    github: form.github.value.trim(),
    education: form.education.value.trim(),
    degree: form.degree.value.trim(),
    university: form.university.value.trim(),
    graduationYear: normalizeNumber(form.graduationYear.value),
    about: form.about.value.trim(),
    experience: form.experience.value.trim(),
    skills: form.skills.value.trim(),
    motivation: form.motivation.value.trim(),
    expectedSalary: normalizeNumber(form.expectedSalary.value),
    currentSalary: normalizeNumber(form.currentSalary.value),
    notice: normalizeNumber(form.notice.value),
    relocate: normalizeBooleanChoice(form.relocate.value, "yes"),
    noticeStatus: normalizeBooleanChoice(form.noticeStatus.value, "no")
  };
}

async function getStoredProfile() {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return {
    ...DEFAULT_PROFILE,
    ...(stored[STORAGE_KEY] || {})
  };
}

async function getStoredCustomFields() {
  const stored = await chrome.storage.local.get(CUSTOM_FIELDS_STORAGE_KEY);
  return sanitizeCustomFields(stored[CUSTOM_FIELDS_STORAGE_KEY] || {});
}

function hydrateForm(profile) {
  for (const [key, value] of Object.entries(profile)) {
    const field = form.elements.namedItem(key);
    if (field) {
      field.value = isNumericProfileKey(key) ? normalizeNumber(value) : value;
    }
  }
}

function toggleCustomFieldsSection() {
  const isHidden = customFieldsSection.hidden;
  customFieldsSection.hidden = !isHidden;
  toggleCustomFieldsButton.textContent = isHidden ? "Hide Custom Fields" : "Custom Fields";
}

async function handleCustomFieldSubmit(event) {
  event.preventDefault();

  const formData = new FormData(customFieldForm);
  const editingKey = normalizeCustomFieldKey(formData.get("editingCustomFieldKey"));
  const fieldKey = normalizeCustomFieldKey(formData.get("customFieldKey"));
  const keywords = String(formData.get("customFieldKeywords") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const value = String(formData.get("customFieldValue") || "").trim();

  if (!fieldKey || !keywords.length || !value) {
    showStatus("Add a field key, at least one label, and a value.", true);
    return;
  }

  const customFields = await getStoredCustomFields();
  if (editingKey && editingKey !== fieldKey) {
    delete customFields[editingKey];
  }

  customFields[fieldKey] = {
    keywords,
    value
  };

  await chrome.storage.local.set({ [CUSTOM_FIELDS_STORAGE_KEY]: customFields });
  await syncCustomFieldsToActiveTab(customFields);
  resetCustomFieldEditor();
  renderCustomFields(customFields);
  customFieldsSection.hidden = false;
  toggleCustomFieldsButton.textContent = "Hide Custom Fields";
  showStatus(editingKey ? "Custom field updated." : "Custom field saved.");
}

function renderCustomFields(customFields) {
  const entries = Object.entries(customFields);
  if (!entries.length) {
    customFieldsList.innerHTML = `
      <div class="jaa-empty-state">
        <strong>No custom fields yet</strong>
        <span>Add one when an application uses unusual labels.</span>
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
        <div class="jaa-custom-field-item__actions">
          <button type="button" class="jaa-button jaa-button--ghost jaa-button--compact" data-edit-custom-field="${escapeHtml(fieldKey)}">Edit</button>
          <button type="button" class="jaa-button jaa-button--ghost jaa-button--compact" data-delete-custom-field="${escapeHtml(fieldKey)}">Delete</button>
        </div>
      </article>
    `)
    .join("");

  for (const button of customFieldsList.querySelectorAll("[data-edit-custom-field]")) {
    button.addEventListener("click", handleEditCustomField);
  }

  for (const button of customFieldsList.querySelectorAll("[data-delete-custom-field]")) {
    button.addEventListener("click", handleDeleteCustomField);
  }
}

async function handleEditCustomField(event) {
  const fieldKey = event.currentTarget.getAttribute("data-edit-custom-field");
  if (!fieldKey) {
    return;
  }

  const customFields = await getStoredCustomFields();
  const config = customFields[fieldKey];
  if (!config) {
    showStatus("That custom field could not be found.", true);
    return;
  }

  editingCustomFieldKeyInput.value = fieldKey;
  customFieldForm.customFieldKey.value = fieldKey;
  customFieldForm.customFieldKeywords.value = Array.isArray(config.keywords)
    ? config.keywords.join(", ")
    : "";
  customFieldForm.customFieldValue.value = String(config.value || "");
  customFieldSubmitButton.textContent = "Update Custom Field";
  cancelCustomFieldEditButton.hidden = false;
  customFieldsSection.hidden = false;
  toggleCustomFieldsButton.textContent = "Hide Custom Fields";
  customFieldForm.customFieldKey.focus();
  showStatus("Editing custom field.");
}

async function handleDeleteCustomField(event) {
  const fieldKey = event.currentTarget.getAttribute("data-delete-custom-field");
  if (!fieldKey) {
    return;
  }

  const customFields = await getStoredCustomFields();
  delete customFields[fieldKey];
  await chrome.storage.local.set({ [CUSTOM_FIELDS_STORAGE_KEY]: customFields });
  await syncCustomFieldsToActiveTab(customFields);
  if (normalizeCustomFieldKey(editingCustomFieldKeyInput.value) === fieldKey) {
    resetCustomFieldEditor();
  }
  renderCustomFields(customFields);
  showStatus("Custom field deleted.");
}

function resetCustomFieldEditor() {
  customFieldForm.reset();
  editingCustomFieldKeyInput.value = "";
  customFieldSubmitButton.textContent = "Add Custom Field";
  cancelCustomFieldEditButton.hidden = true;
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
    // Ignore pages where the content script is not active yet.
  }
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
  return ["graduationYear", "expectedSalary", "currentSalary", "notice"].includes(key);
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
