const STORAGE_KEY = "jobAutofillProfile";
const BUTTON_ID = "jaa-fill-button";
const WIDGET_ID = "jaa-fill-widget";
const CLOSE_ID = "jaa-fill-close";
const FEEDBACK_ID = "jaa-fill-feedback";
const WIDGET_PREFS_KEY = "jaaFloatingWidgetPrefs";
const DEFAULT_COUNTRY_CODE = "+91";
const OBSERVER_CONFIG = {
  childList: true,
  subtree: true
};
const DEFAULT_WIDGET_PREFS = {
  left: null,
  top: null
};
const widgetRuntimeState = {
  initializing: false,
  dismissedForPage: false,
  lastUrl: window.location.href
};

const mapping = {
  firstName: ["first name", "given name"],
  middleName: ["middle name", "middle initial"],
  lastName: ["last name", "surname", "family name"],
  name: ["name", "full name"],
  email: ["email", "e-mail"],
  password: ["password", "create password", "set password"],
  phone: ["phone", "mobile", "contact", "contact number", "telephone"],
  whatsapp: ["whatsapp"],
  city: ["city", "current city", "present city", "location"],
  currentCompany: ["current company", "company", "employer", "organization"],
  currentRole: ["current role", "designation", "job title", "title", "position"],
  joiningDate: ["date of joining", "joining date", "start date", "employment start date"],
  relievingDate: ["date of relieving", "relieving date", "end date", "employment end date", "last working day"],
  currentlyWorking: ["currently working here", "currently employed", "current employer", "present employer"],
  linkedin: ["linkedin", "linkedin profile"],
  portfolio: ["portfolio", "website", "personal website", "github", "github profile"],
  about: ["about", "bio", "yourself", "summary", "about me", "profile summary"],
  experience: ["experience", "work history", "years of experience", "total experience"],
  motivation: ["why do you want this job", "why are you interested", "motivation", "cover letter", "why this role"],
  currentSalary: ["current ctc", "current salary", "current compensation", "current pay", "present ctc"],
  expectedSalary: ["expected ctc", "expected salary", "expected compensation", "salary expectations", "compensation expectations", "desired salary", "salary expectation", "lpa"],
  notice: ["notice period", "availability", "joining", "available to start"],
  relocate: ["relocate", "willing to relocate", "open to relocate", "ready to relocate"],
  noticeStatus: ["currently on notice", "serving notice", "on notice period"]
};

initializeFloatingButton();
watchForBodyAvailability();
registerRuntimeListener();

function registerRuntimeListener() {
  if (!isExtensionContextAvailable()) {
    return;
  }

  try {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!message || message.type !== "JAA_AUTOFILL_NOW") {
        return false;
      }

      handleAutofillClick()
        .then((result) => {
          sendResponse(result);
        })
        .catch(() => {
          sendResponse({
            ok: false,
            message: getExtensionRefreshMessage()
          });
        });

      return true;
    });
  } catch (error) {
    // Ignore stale content scripts left on pages after an extension reload.
  }
}

async function initializeFloatingButton() {
  if (!document.body || document.getElementById(WIDGET_ID) || widgetRuntimeState.initializing) {
    return;
  }

  widgetRuntimeState.initializing = true;
  const widgetPrefs = await getWidgetPrefs();
  if (document.getElementById(WIDGET_ID) || !document.body) {
    widgetRuntimeState.initializing = false;
    return;
  }

  const widget = document.createElement("div");
  widget.id = WIDGET_ID;

  const button = document.createElement("button");
  button.id = BUTTON_ID;
  button.type = "button";
  button.textContent = "\u26A1 Autofill Job Application";
  button.setAttribute("aria-label", "Autofill job application");
  button.addEventListener("click", async (event) => {
    if (widget.dataset.dragging === "true") {
      event.preventDefault();
      return;
    }
    await handleAutofillClick();
  });

  const closeButton = document.createElement("button");
  closeButton.id = CLOSE_ID;
  closeButton.type = "button";
  closeButton.textContent = "\u00D7";
  closeButton.setAttribute("aria-label", "Hide autofill widget on this page");
  closeButton.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    widgetRuntimeState.dismissedForPage = true;
    widget.hidden = true;
    await saveWidgetPrefs({
      ...widgetPrefs,
      ...readWidgetPosition(widget)
    });
  });

  widget.appendChild(button);
  widget.appendChild(closeButton);
  applyWidgetPosition(widget, widgetPrefs);
  enableWidgetDragging(widget);
  document.body.appendChild(widget);
  refreshFloatingWidgetVisibility();
  widgetRuntimeState.initializing = false;
}

async function handleAutofillClick() {
  if (!isExtensionContextAvailable()) {
    return {
      ok: false,
      message: getExtensionRefreshMessage()
    };
  }

  let stored;
  try {
    stored = await chrome.storage.local.get(STORAGE_KEY);
  } catch (error) {
    return {
      ok: false,
      message: getExtensionRefreshMessage()
    };
  }

  const profile = stored[STORAGE_KEY];

  if (!profile) {
    showFeedback("Save your profile in the extension popup first.", true);
    return {
      ok: false,
      message: "Save your profile in the extension popup first."
    };
  }

  const fields = detectFillableFields();
  const radioGroups = detectRadioGroups();
  let filledCount = 0;

  for (const field of fields) {
    const matchKey = detectFieldIntent(field);
    const value = getProfileValue(profile, matchKey, field);

    if (!value) {
      continue;
    }

    if (fillField(field, value)) {
      filledCount += 1;
    }
  }

  for (const group of radioGroups) {
    const matchKey = detectRadioIntent(group);
    const value = getProfileValue(profile, matchKey, group.inputs[0]);

    if (!value) {
      continue;
    }

    if (fillRadioGroup(group, value)) {
      filledCount += 1;
    }
  }

  if (!filledCount) {
    showFeedback("No supported job application fields were found on this page.", true);
    return {
      ok: false,
      message: "No supported job application fields were found on this page."
    };
  }

  showFeedback(`Filled ${filledCount} field${filledCount === 1 ? "" : "s"}.`);
  return {
    ok: true,
    message: `Form data filled successfully. ${filledCount} field${filledCount === 1 ? "" : "s"} updated.`
  };
}

function isExtensionContextAvailable() {
  try {
    return Boolean(chrome && chrome.runtime && chrome.runtime.id);
  } catch (error) {
    return false;
  }
}

function getExtensionRefreshMessage() {
  return "The extension was updated. Refresh this page and try again.";
}

async function getWidgetPrefs() {
  if (!isExtensionContextAvailable()) {
    return { ...DEFAULT_WIDGET_PREFS };
  }

  try {
    const stored = await chrome.storage.local.get(WIDGET_PREFS_KEY);
    return {
      ...DEFAULT_WIDGET_PREFS,
      ...(stored[WIDGET_PREFS_KEY] || {})
    };
  } catch (error) {
    return { ...DEFAULT_WIDGET_PREFS };
  }
}

async function saveWidgetPrefs(prefs) {
  if (!isExtensionContextAvailable()) {
    return;
  }

  try {
    await chrome.storage.local.set({
      [WIDGET_PREFS_KEY]: {
        ...DEFAULT_WIDGET_PREFS,
        ...prefs
      }
    });
  } catch (error) {
    // Ignore storage failures in page context.
  }
}

function applyWidgetPosition(widget, prefs) {
  const left = Number.isFinite(prefs.left) ? prefs.left : window.innerWidth - 260;
  const top = Number.isFinite(prefs.top) ? prefs.top : 16;
  widget.style.left = `${Math.max(8, left)}px`;
  widget.style.top = `${Math.max(8, top)}px`;
}

function readWidgetPosition(widget) {
  return {
    left: parseFloat(widget.style.left) || 16,
    top: parseFloat(widget.style.top) || 16
  };
}

function enableWidgetDragging(widget) {
  const dragTargets = [widget.querySelector(`#${BUTTON_ID}`)];

  for (const target of dragTargets) {
    if (!target) {
      continue;
    }

    target.addEventListener("pointerdown", (event) => startWidgetDrag(event, widget));
  }
}

function startWidgetDrag(event, widget) {
  if (event.button !== 0) {
    return;
  }

  const target = event.target;
  if (target && target.id === CLOSE_ID) {
    return;
  }

  const rect = widget.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  const offsetY = event.clientY - rect.top;
  let moved = false;

  const onMove = (moveEvent) => {
    moved = true;
    widget.dataset.dragging = "true";
    const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
    const maxTop = Math.max(8, window.innerHeight - rect.height - 8);
    const nextLeft = clamp(moveEvent.clientX - offsetX, 8, maxLeft);
    const nextTop = clamp(moveEvent.clientY - offsetY, 8, maxTop);
    widget.style.left = `${nextLeft}px`;
    widget.style.top = `${nextTop}px`;
  };

  const onUp = async () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.setTimeout(() => {
      widget.dataset.dragging = "false";
    }, 0);

    if (moved) {
      const prefs = await getWidgetPrefs();
      await saveWidgetPrefs({
        ...prefs,
        ...readWidgetPosition(widget)
      });
    }
  };

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function detectFieldIntent(field) {
  const context = getFieldContext(field);

  if (field instanceof HTMLSelectElement) {
    return detectSelectIntent(field, context);
  }

  if (field instanceof HTMLTextAreaElement) {
    return detectTextareaIntent(context);
  }

  if (isCustomCombobox(field)) {
    return detectComboboxIntent(field, context);
  }

  if (!(field instanceof HTMLInputElement)) {
    return null;
  }

  const inputType = normalizeText(field.type || "text");

  if (inputType === "email" || context.autocomplete.includes("email")) {
    return "email";
  }

  if (inputType === "password" || context.autocomplete.includes("password")) {
    return "password";
  }

  if (inputType === "tel" || context.autocomplete.includes("tel") || hasAnyKeyword(context.directText, mapping.phone)) {
    return hasAnyKeyword(context.directText, mapping.whatsapp) ? "phone" : "phone";
  }

  if (inputType === "checkbox") {
    return detectCheckboxIntent(context);
  }

  if (inputType === "date") {
    return detectDateIntent(context);
  }

  if (isNumericIntentField(field, context)) {
    return detectNumericIntent(context);
  }

  if (inputType === "url") {
    return detectUrlIntent(context);
  }

  if (inputType !== "text" && inputType !== "search" && inputType !== "url") {
    return null;
  }

  return detectTextIntent(context);
}

function detectRadioIntent(group) {
  const context = normalizeText(group.contextText);
  return detectChoiceIntent({ directText: context }, ["currentlyWorking", "noticeStatus", "relocate"]);
}

function detectFillableFields() {
  const selector = [
    "input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset']):not([type='radio']):not([type='file'])",
    "textarea",
    "select",
    "[role='combobox']",
    "[contenteditable='true']"
  ].join(", ");

  return Array.from(document.querySelectorAll(selector)).filter((field) => {
    if (field.disabled || field.readOnly) {
      return false;
    }

    if (field.id === BUTTON_ID || field.id === FEEDBACK_ID) {
      return false;
    }

    return isUsableField(field);
  });
}

function detectRadioGroups() {
  const radios = Array.from(document.querySelectorAll("input[type='radio']")).filter((input) => {
    return !input.disabled && isUsableField(input);
  });
  const groups = new Map();

  for (const radio of radios) {
    const key = getRadioGroupKey(radio);
    if (!key) {
      continue;
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(radio);
  }

  return Array.from(groups.values())
    .filter((inputs) => inputs.length >= 2)
    .map((inputs) => ({
      inputs,
      contextText: collectRadioGroupText(inputs)
    }));
}

function getRadioGroupKey(radio) {
  if (radio.name) {
    return `name:${radio.name}`;
  }

  const fieldset = radio.closest("fieldset");
  if (fieldset) {
    return `fieldset:${buildNodePath(fieldset)}`;
  }

  const container = radio.closest("[role='radiogroup'], .radio-group, .form-group, .field, .question");
  return container ? `container:${buildNodePath(container)}` : "";
}

function buildNodePath(node) {
  if (!node) {
    return "";
  }

  const idPart = node.id ? `#${node.id}` : "";
  const classPart = node.className && typeof node.className === "string"
    ? `.${node.className.trim().replace(/\s+/g, ".")}`
    : "";
  return `${node.tagName}${idPart}${classPart}`;
}

function findBestMatchForText(text, field) {
  const haystack = normalizeText(text);
  if (!haystack) {
    return null;
  }

  const candidates = getCandidateKeysForField(field);
  let bestKey = null;
  let bestScore = 0;

  for (const profileKey of candidates) {
    const score = getMatchScore(profileKey, haystack, field);
    if (score > bestScore) {
      bestScore = score;
      bestKey = profileKey;
    }
  }

  return bestScore >= 3 ? bestKey : null;
}

function collectFieldText(field) {
  const parts = [
    field.name,
    field.id,
    field.placeholder,
    field.getAttribute("aria-label"),
    field.getAttribute("autocomplete"),
    field.getAttribute("data-testid"),
    field.getAttribute("role"),
    field.getAttribute("data-qa"),
    field.getAttribute("data-field"),
    field.getAttribute("data-name"),
    getLabelText(field),
    getParentText(field)
  ];

  return parts.filter(Boolean).join(" ");
}

function getFieldContext(field) {
  const labelText = normalizeText(getLabelText(field));
  const nearbyText = normalizeText(getNearbyPromptText(field));
  const parentText = normalizeText(getParentText(field));
  const nameText = normalizeText(field.name);
  const idText = normalizeText(field.id);
  const placeholderText = normalizeText(field.placeholder);
  const ariaText = normalizeText(field.getAttribute("aria-label"));
  const autocomplete = normalizeText(field.getAttribute("autocomplete"));
  const directText = normalizeText([
    labelText,
    nameText,
    idText,
    placeholderText,
    ariaText,
    nearbyText
  ].join(" "));
  const extendedText = normalizeText([directText, parentText].join(" "));

  return {
    labelText,
    nearbyText,
    parentText,
    nameText,
    idText,
    placeholderText,
    ariaText,
    autocomplete,
    directText,
    extendedText
  };
}

function getLabelText(field) {
  const texts = [];

  if (field.labels && field.labels.length) {
    texts.push(...Array.from(field.labels, (label) => label.innerText || label.textContent || ""));
  }

  if (field.id) {
    const explicitLabel = document.querySelector(`label[for="${CSS.escape(field.id)}"]`);
    if (explicitLabel) {
      texts.push(explicitLabel.innerText || explicitLabel.textContent || "");
    }
  }

  const wrappingLabel = field.closest("label");
  if (wrappingLabel) {
    texts.push(wrappingLabel.innerText || wrappingLabel.textContent || "");
  }

  const previousSiblingText = extractSiblingPrompt(field.previousElementSibling);
  const parentPreviousSiblingText = field.parentElement
    ? extractSiblingPrompt(field.parentElement.previousElementSibling)
    : "";

  if (previousSiblingText) {
    texts.push(previousSiblingText);
  }

  if (parentPreviousSiblingText) {
    texts.push(parentPreviousSiblingText);
  }

  return texts.join(" ");
}

function collectRadioGroupText(inputs) {
  const texts = [];
  const firstInput = inputs[0];
  const fieldset = firstInput.closest("fieldset");
  const groupContainer = firstInput.closest("[role='radiogroup'], .radio-group, .form-group, .field, .question");

  if (fieldset) {
    const legend = fieldset.querySelector("legend");
    if (legend) {
      texts.push(legend.innerText || legend.textContent || "");
    }
    texts.push(fieldset.innerText || fieldset.textContent || "");
  }

  if (groupContainer) {
    texts.push(groupContainer.innerText || groupContainer.textContent || "");
  }

  for (const input of inputs) {
    texts.push(collectFieldText(input));
  }

  return texts.join(" ");
}

function extractSiblingPrompt(element) {
  if (!element) {
    return "";
  }

  return element.innerText || element.textContent || "";
}

function getParentText(field) {
  let current = field.parentElement;
  const snippets = [];
  let depth = 0;

  while (current && depth < 1) {
    const text = extractOwnText(current);
    if (text) {
      snippets.push(text);
    }
    current = current.parentElement;
    depth += 1;
  }

  return snippets.join(" ");
}

function getNearbyPromptText(field) {
  const snippets = [];
  const wrapper = field.closest(".form-group, .field, .question, .input, .form-field");

  if (wrapper) {
    snippets.push(extractOwnText(wrapper));
  }

  snippets.push(extractOwnText(field.previousElementSibling));
  snippets.push(extractOwnText(field.parentElement ? field.parentElement.previousElementSibling : null));
  return snippets.filter(Boolean).join(" ");
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[_-]+/g, " ")
    .replace(/[^\w\s+]/g, " ")
    .trim();
}

function fillField(field, value) {
  if (isCustomCombobox(field)) {
    return fillCustomCombobox(field, value);
  }

  if (field instanceof HTMLInputElement && field.type === "checkbox") {
    return fillCheckboxField(field, value);
  }

  if (field.tagName === "SELECT") {
    return fillSelectField(field, value);
  }

  const normalizedValue = isNumericIntentField(field, getFieldContext(field))
    ? normalizeNumericValue(value)
    : field instanceof HTMLInputElement && field.type === "date"
      ? normalizeDateValue(value)
    : String(value).trim();
  if (!normalizedValue) {
    return false;
  }

  const currentValue = field.value ? field.value.trim() : "";
  if (currentValue === normalizedValue) {
    return false;
  }

  applyValueToField(field, normalizedValue);
  dispatchFieldEvents(field);
  return true;
}

function applyValueToField(field, value) {
  const prototype = field.tagName === "TEXTAREA"
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

  if (descriptor && descriptor.set) {
    descriptor.set.call(field, value);
  } else {
    field.value = value;
  }
}

function fillSelectField(field, value) {
  const targetValue = normalizeText(value);
  const options = Array.from(field.options || []);
  const match = options.find((option) => {
    const optionText = normalizeText(option.textContent || option.label || "");
    const optionValue = normalizeText(option.value || "");
    return optionText === targetValue || optionValue === targetValue || optionText.includes(targetValue);
  });

  if (!match) {
    return false;
  }

  if (field.value === match.value) {
    return false;
  }

  const descriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
  if (descriptor && descriptor.set) {
    descriptor.set.call(field, match.value);
  } else {
    field.value = match.value;
  }

  dispatchFieldEvents(field);
  return true;
}

function fillRadioGroup(group, value) {
  const target = normalizeBooleanValue(value);
  if (!target) {
    return false;
  }

  const radio = group.inputs.find((input) => {
    const optionText = normalizeText([
      input.value,
      input.getAttribute("aria-label"),
      getLabelText(input),
      input.parentElement ? input.parentElement.innerText || input.parentElement.textContent || "" : ""
    ].join(" "));
    return optionText.includes(target);
  });

  if (!radio) {
    return false;
  }

  if (radio.checked) {
    return false;
  }

  radio.click();
  radio.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function fillCustomCombobox(field, value) {
  const textValue = isBooleanLike(value) ? toTitleCase(normalizeBooleanValue(value)) : String(value).trim();
  if (!textValue) {
    return false;
  }

  if (field instanceof HTMLInputElement) {
    const currentValue = String(field.value || "").trim();
    if (currentValue === textValue) {
      return false;
    }

    applyValueToField(field, textValue);
    dispatchFieldEvents(field);
    return true;
  }

  if (field.isContentEditable) {
    if (normalizeText(field.textContent) === normalizeText(textValue)) {
      return false;
    }

    field.focus();
    field.textContent = textValue;
    dispatchFieldEvents(field);
    return true;
  }

  if ("value" in field) {
    const currentValue = String(field.value || "").trim();
    if (currentValue === textValue) {
      return false;
    }
    field.value = textValue;
    dispatchFieldEvents(field);
    return true;
  }

  return false;
}

function fillCheckboxField(field, value) {
  const shouldCheck = normalizeBooleanValue(value) === "yes";
  if (field.checked === shouldCheck) {
    return false;
  }

  field.checked = shouldCheck;
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function dispatchFieldEvents(field) {
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
  field.dispatchEvent(new Event("blur", { bubbles: true }));
}

function isUsableField(field) {
  if (!(field instanceof HTMLElement)) {
    return false;
  }

  const style = window.getComputedStyle(field);
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }

  const rect = field.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function isCustomCombobox(field) {
  return field instanceof HTMLElement
    && field.getAttribute("role") === "combobox"
    && !(field instanceof HTMLSelectElement);
}

function isNumberField(field) {
  if (!(field instanceof HTMLInputElement)) {
    return false;
  }

  const numericTypes = ["number", "range"];
  if (numericTypes.includes(field.type)) {
    return true;
  }

  return /\b(amount|salary|ctc|compensation|notice)\b/.test(normalizeText(collectFieldText(field)));
}

function getProfileValue(profile, matchKey, field) {
  if (!matchKey || !profile) {
    return "";
  }

  switch (matchKey) {
    case "name":
      return profile.fullName || "";
    case "firstName":
      return getNameParts(profile.fullName || "").firstName;
    case "middleName":
      return getNameParts(profile.fullName || "").middleName;
    case "lastName":
      return getNameParts(profile.fullName || "").lastName;
    case "email":
      return profile.email || "";
    case "password":
      return profile.password || "";
    case "phone":
      return formatPhoneNumber(profile.phone || "");
    case "city":
      return profile.city || "";
    case "currentCompany":
      return profile.currentCompany || "";
    case "currentRole":
      return profile.currentRole || "";
    case "joiningDate":
      return profile.joiningDate || "";
    case "relievingDate":
      return profile.relievingDate || "";
    case "currentlyWorking":
      return normalizeBooleanValue(profile.currentlyWorking || "");
    case "linkedin":
      return profile.linkedin || "";
    case "portfolio":
      return profile.portfolio || "";
    case "about":
      return profile.about || "";
    case "experience":
      return profile.experience || "";
    case "motivation":
      return profile.motivation || profile.about || "";
    case "currentSalary":
      return normalizeNumericValue(profile.currentSalary || "");
    case "expectedSalary":
      return normalizeNumericValue(profile.expectedSalary || "");
    case "notice":
      return normalizeNumericValue(profile.notice || "");
    case "relocate":
      return normalizeBooleanValue(profile.relocate || "");
    case "noticeStatus":
      return normalizeBooleanValue(profile.noticeStatus || "");
    default:
      return "";
  }
}

function formatPhoneNumber(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("+")) {
    return trimmed;
  }

  return `${DEFAULT_COUNTRY_CODE}${trimmed.replace(/^0+/, "")}`;
}

function normalizeNumericValue(value) {
  const numeric = Number(String(value || "").replace(/,/g, "").replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) && numeric >= 0 ? String(numeric) : "";
}

function normalizeDateValue(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return trimmed;
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeBooleanValue(value) {
  const normalized = normalizeText(value);
  if (normalized.includes("yes")) {
    return "yes";
  }
  if (normalized.includes("no")) {
    return "no";
  }
  return "";
}

function getSelectOptionText(field) {
  return Array.from(field.options || [])
    .map((option) => option.textContent || option.label || option.value || "")
    .join(" ");
}

function getCandidateKeysForField(field) {
  if (field instanceof HTMLSelectElement) {
    return ["relocate", "noticeStatus", "city"];
  }

  if (field instanceof HTMLTextAreaElement) {
    return ["about", "experience"];
  }

  if (field instanceof HTMLInputElement) {
    const inputType = normalizeText(field.type);

    if (inputType === "email") {
      return ["email"];
    }

    if (inputType === "tel") {
      return ["whatsapp", "phone"];
    }

    if (isNumberField(field)) {
      return ["currentSalary", "expectedSalary", "notice"];
    }
  }

  return [
    "whatsapp",
    "phone",
    "email",
    "currentSalary",
    "expectedSalary",
    "noticeStatus",
    "relocate",
    "city",
    "about",
    "experience",
    "name"
  ];
}

function getMatchScore(profileKey, haystack, field) {
  let score = 0;
  const keywords = mapping[profileKey] || [];

  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword);
    if (!normalizedKeyword) {
      continue;
    }

    if (haystack === normalizedKeyword) {
      score = Math.max(score, 10);
      continue;
    }

    if (haystack.includes(normalizedKeyword)) {
      score = Math.max(score, normalizedKeyword.includes(" ") ? 8 : 4);
    }
  }

  const labelText = normalizeText(getLabelText(field));
  const nameText = normalizeText(field.name);
  const idText = normalizeText(field.id);
  const placeholderText = normalizeText(field.placeholder);
  const ariaText = normalizeText(field.getAttribute("aria-label"));
  const autocompleteText = normalizeText(field.getAttribute("autocomplete"));

  if (profileKey === "email" && (field.type === "email" || autocompleteText.includes("email"))) {
    score += 8;
  }

  if ((profileKey === "phone" || profileKey === "whatsapp") && (field.type === "tel" || autocompleteText.includes("tel"))) {
    score += 6;
  }

  if (profileKey === "name" && autocompleteText.includes("name")) {
    score += 6;
  }

  if (["currentSalary", "expectedSalary", "notice"].includes(profileKey) && isNumberField(field)) {
    score += 4;
  }

  if (labelText.includes("whatsapp") && profileKey === "whatsapp") {
    score += 10;
  }

  if (labelText.includes("phone") && profileKey === "phone") {
    score += 8;
  }

  if ((nameText.includes("expected") || idText.includes("expected") || placeholderText.includes("expected")) && profileKey === "expectedSalary") {
    score += 10;
  }

  if ((nameText.includes("current") || idText.includes("current") || placeholderText.includes("current")) && profileKey === "currentSalary") {
    score += 10;
  }

  if ((labelText.includes("notice") || nameText.includes("notice") || idText.includes("notice")) && profileKey === "notice") {
    score += 10;
  }

  if ((labelText.includes("relocate") || ariaText.includes("relocate")) && profileKey === "relocate") {
    score += 10;
  }

  if ((labelText.includes("currently on notice") || labelText.includes("serving notice")) && profileKey === "noticeStatus") {
    score += 10;
  }

  if (profileKey === "city" && /\bcity\b/.test(labelText || haystack)) {
    score += 8;
  }

  if (profileKey === "about" && /(about|summary|bio|yourself)/.test(labelText || haystack)) {
    score += 8;
  }

  if (profileKey === "experience" && /(experience|work history)/.test(labelText || haystack)) {
    score += 8;
  }

  return score;
}

function extractOwnText(element) {
  if (!element) {
    return "";
  }

  return Array.from(element.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent || "")
    .join(" ")
    .trim();
}

function detectNumericIntent(context) {
  const text = context.directText || context.extendedText;

  if (hasAnyKeyword(text, mapping.currentSalary) || /\bcurrent\b/.test(text) && /\b(ctc|salary|compensation|lpa)\b/.test(text)) {
    return "currentSalary";
  }

  if (
    hasAnyKeyword(text, mapping.expectedSalary)
    || /\b(expected|desired|expectation|expectations)\b/.test(text) && /\b(ctc|salary|compensation|pay|lpa)\b/.test(text)
    || /\bcompensation\b/.test(text) && !/\bcurrent\b/.test(text)
  ) {
    return "expectedSalary";
  }

  if (hasAnyKeyword(text, mapping.notice) || /\bnotice\b/.test(text) || /\bavailability\b/.test(text)) {
    return "notice";
  }

  return null;
}

function detectChoiceIntent(context, allowedKeys) {
  const text = context.directText || context.extendedText || "";

  for (const key of allowedKeys) {
    if (hasAnyKeyword(text, mapping[key] || [])) {
      return key;
    }
  }

  return null;
}

function detectTextareaIntent(context) {
  const text = context.directText;

  if (hasAnyKeyword(text, mapping.motivation)) {
    return "motivation";
  }

  if (hasAnyKeyword(text, mapping.experience)) {
    return "experience";
  }

  if (hasAnyKeyword(text, mapping.about)) {
    return "about";
  }

  return null;
}

function detectTextIntent(context) {
  const text = context.directText;

  if (hasAnyKeyword(text, mapping.email) || hasAnyKeyword(text, mapping.phone) || hasAnyKeyword(text, mapping.whatsapp)) {
    return null;
  }

  if (hasAnyKeyword(text, mapping.password)) {
    return "password";
  }

  if (hasAnyKeyword(text, mapping.currentCompany)) {
    return "currentCompany";
  }

  if (hasAnyKeyword(text, mapping.currentRole)) {
    return "currentRole";
  }

  if (hasAnyKeyword(text, mapping.firstName)) {
    return "firstName";
  }

  if (hasAnyKeyword(text, mapping.middleName)) {
    return "middleName";
  }

  if (hasAnyKeyword(text, mapping.lastName)) {
    return "lastName";
  }

  if (hasAnyKeyword(text, mapping.currentlyWorking)) {
    return "currentlyWorking";
  }

  if (hasAnyKeyword(text, mapping.name) || context.autocomplete.includes("name")) {
    return "name";
  }

  if (hasAnyKeyword(text, mapping.city) || /\bcity\b/.test(text)) {
    return "city";
  }

  if (hasAnyKeyword(text, mapping.linkedin)) {
    return "linkedin";
  }

  if (hasAnyKeyword(text, mapping.portfolio)) {
    return "portfolio";
  }

  if (hasAnyKeyword(text, mapping.motivation)) {
    return "motivation";
  }

  if (hasAnyKeyword(text, mapping.about)) {
    return "about";
  }

  if (hasAnyKeyword(text, mapping.experience)) {
    return "experience";
  }

  return null;
}

function isNumericIntentField(field, context) {
  if (!(field instanceof HTMLInputElement) && !isCustomCombobox(field)) {
    return false;
  }

  if (field instanceof HTMLInputElement && isNumberField(field)) {
    return true;
  }

  const text = context ? context.extendedText || context.directText : normalizeText(collectFieldText(field));
  return /\b(ctc|salary|compensation|lpa|pay|notice period|notice|availability)\b/.test(text);
}

function hasAnyKeyword(text, keywords) {
  const haystack = normalizeText(text);
  return keywords.some((keyword) => haystack.includes(normalizeText(keyword)));
}

function detectUrlIntent(context) {
  const text = context.directText;

  if (hasAnyKeyword(text, mapping.linkedin)) {
    return "linkedin";
  }

  if (hasAnyKeyword(text, mapping.portfolio)) {
    return "portfolio";
  }

  return null;
}

function detectSelectIntent(field, context) {
  const optionText = normalizeText(Array.from(field.options || []).map((option) => option.textContent || option.label || option.value || "").join(" "));
  const combinedContext = {
    directText: normalizeText([context.directText, optionText].join(" ")),
    extendedText: normalizeText([context.extendedText, optionText].join(" "))
  };

  if (isYesNoChoice(field)) {
    return detectChoiceIntent(combinedContext, ["currentlyWorking", "noticeStatus", "relocate"]);
  }

  if (hasAnyKeyword(combinedContext.directText, mapping.city)) {
    return "city";
  }

  if (hasAnyKeyword(combinedContext.directText, mapping.expectedSalary)) {
    return "expectedSalary";
  }

  return detectChoiceIntent(combinedContext, ["currentlyWorking", "relocate", "noticeStatus"]);
}

function detectComboboxIntent(field, context) {
  if (isYesNoChoice(field)) {
    return detectChoiceIntent(context, ["currentlyWorking", "noticeStatus", "relocate"]);
  }

  if (isNumericIntentField(field, context)) {
    return detectNumericIntent(context);
  }

  const dateIntent = detectDateIntent(context);
  if (dateIntent) {
    return dateIntent;
  }

  return detectTextIntent(context) || detectUrlIntent(context);
}

function isYesNoChoice(field) {
  const optionText = field instanceof HTMLSelectElement
    ? Array.from(field.options || []).map((option) => option.textContent || option.label || option.value || "").join(" ")
    : normalizeText([
        field.getAttribute("aria-label"),
        field.getAttribute("placeholder"),
        field.textContent
      ].join(" "));

  const normalizedOptions = normalizeText(optionText);
  return /\byes\b/.test(normalizedOptions) && /\bno\b/.test(normalizedOptions);
}

function isBooleanLike(value) {
  const normalized = normalizeBooleanValue(value);
  return normalized === "yes" || normalized === "no";
}

function toTitleCase(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "";
}

function detectDateIntent(context) {
  const text = context.directText || context.extendedText;

  if (hasAnyKeyword(text, mapping.joiningDate)) {
    return "joiningDate";
  }

  if (hasAnyKeyword(text, mapping.relievingDate)) {
    return "relievingDate";
  }

  return null;
}

function detectCheckboxIntent(context) {
  const text = context.directText || context.extendedText;

  if (hasAnyKeyword(text, mapping.currentlyWorking)) {
    return "currentlyWorking";
  }

  return null;
}

function getNameParts(fullName) {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return {
      firstName: "",
      middleName: "",
      lastName: ""
    };
  }

  if (parts.length === 1) {
    return {
      firstName: parts[0],
      middleName: "",
      lastName: ""
    };
  }

  return {
    firstName: parts[0],
    middleName: parts.length > 2 ? parts.slice(1, -1).join(" ") : "",
    lastName: parts[parts.length - 1]
  };
}

function showFeedback(message, isError = false) {
  if (!document.body) {
    return;
  }

  let feedback = document.getElementById(FEEDBACK_ID);
  if (!feedback) {
    feedback = document.createElement("div");
    feedback.id = FEEDBACK_ID;
    document.body.appendChild(feedback);
  }

  feedback.textContent = message;
  feedback.className = isError ? "jaa-fill-feedback is-error" : "jaa-fill-feedback";
  feedback.hidden = false;

  window.clearTimeout(showFeedback.timeoutId);
  showFeedback.timeoutId = window.setTimeout(() => {
    if (feedback) {
      feedback.hidden = true;
    }
  }, 2600);
}

function watchForBodyAvailability() {
  if (document.body) {
    initializeFloatingButton();
    observeDynamicPages();
    return;
  }

  document.addEventListener("DOMContentLoaded", () => {
    initializeFloatingButton();
    observeDynamicPages();
  }, { once: true });
}

function observeDynamicPages() {
  if (!document.body || observeDynamicPages.started) {
    return;
  }

  const observer = new MutationObserver(() => {
    if (!document.getElementById(WIDGET_ID)) {
      initializeFloatingButton();
    }

    handlePageNavigationState();
    refreshFloatingWidgetVisibility();
  });

  observer.observe(document.body, OBSERVER_CONFIG);
  observeDynamicPages.started = true;
}

function handlePageNavigationState() {
  if (widgetRuntimeState.lastUrl !== window.location.href) {
    widgetRuntimeState.lastUrl = window.location.href;
    widgetRuntimeState.dismissedForPage = false;
  }
}

function refreshFloatingWidgetVisibility() {
  const widget = document.getElementById(WIDGET_ID);
  if (!widget) {
    return;
  }

  const shouldShow = !widgetRuntimeState.dismissedForPage && pageHasAutofillTargets();
  widget.hidden = !shouldShow;
}

function pageHasAutofillTargets() {
  return detectFillableFields().length > 0 || detectRadioGroups().length > 0;
}
