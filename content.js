const STORAGE_KEY = "jobAutofillProfile";
const BUTTON_ID = "jaa-fill-button";
const WIDGET_ID = "jaa-fill-widget";
const CLOSE_ID = "jaa-fill-close";
const FEEDBACK_ID = "jaa-fill-feedback";
const WIDGET_PREFS_KEY = "jaaFloatingWidgetPrefs";
const CUSTOM_FIELDS_STORAGE_KEY = "customFields";
const AI_CONFIG_KEY = "jaaAiConfig";
const DEFAULT_COUNTRY_CODE = "+91";
const IMPORTANT_KEYWORDS = [
  "name", "email", "phone", "resume", "cv",
  "salary", "experience", "linkedin", "portfolio",
  "notice", "company", "education"
];
const ATS_HOST_SIGNALS = {
  workday: ["workday", "myworkdayjobs", "workdayjobs"],
  indeed: ["indeed"],
  glassdoor: ["glassdoor"]
};
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
  lastUrl: window.location.href,
  activeProfile: null,
  customFieldsCache: {},
  observerAutofillTimer: 0,
  autofillInProgress: false
};

const FIELD_MAPPINGS = {
  full_name: [
    "full name", "name", "your name", "candidate name", "applicant name"
  ],
  first_name: [
    "first name", "given name"
  ],
  middle_name: [
    "middle name", "middle initial"
  ],
  last_name: [
    "last name", "surname", "family name"
  ],
  email: [
    "email", "email address", "your email", "contact email", "e mail"
  ],
  phone: [
    "phone", "mobile", "contact number", "phone number", "mobile number", "telephone"
  ],
  whatsapp: [
    "whatsapp", "whatsapp number"
  ],
  password: [
    "password", "create password", "set password"
  ],
  current_salary: [
    "current ctc", "current salary", "current compensation",
    "present salary", "current package", "current income",
    "annual salary", "your current pay", "current earnings",
    "current pay", "present ctc"
  ],
  expected_salary: [
    "expected salary", "expected ctc", "desired salary",
    "salary expectation", "expected compensation",
    "desired compensation", "expected income",
    "salary expectations", "compensation expectations"
  ],
  notice_period: [
    "notice period", "joining time", "availability",
    "when can you join", "how soon can you start",
    "available to start", "joining availability"
  ],
  current_company: [
    "current company", "present company", "organization",
    "current employer", "where do you work", "company", "employer",
    "company name", "employer name", "organization name"
  ],
  previous_company: [
    "previous company", "last company", "past employer", "previous employer", "last employer"
  ],
  current_role: [
    "current role", "designation", "job title", "title", "position", "current designation"
  ],
  years_of_experience: [
    "years of experience", "total experience",
    "work experience", "experience in years",
    "professional experience", "experience"
  ],
  current_location: [
    "current location", "where are you based", "location", "current city", "city"
  ],
  preferred_location: [
    "preferred location", "desired location", "work location"
  ],
  joining_date: [
    "date of joining", "joining date", "start date", "employment start date"
  ],
  relieving_date: [
    "date of relieving", "relieving date", "end date", "employment end date", "last working day"
  ],
  currently_working: [
    "currently working here", "currently employed", "current employer", "present employer"
  ],
  relocate: [
    "relocate", "willing to relocate", "open to relocate", "ready to relocate"
  ],
  notice_status: [
    "currently on notice", "serving notice", "on notice period"
  ],
  linkedin: [
    "linkedin", "linkedin profile"
  ],
  github: [
    "github", "github profile"
  ],
  portfolio: [
    "portfolio", "personal website", "website"
  ],
  education: [
    "education", "qualification", "academic background"
  ],
  degree: [
    "degree", "qualification", "highest qualification"
  ],
  university: [
    "university", "college", "institute", "college name", "university name", "institute name"
  ],
  graduation_year: [
    "graduation year", "year of passing"
  ],
  skills: [
    "skills", "technical skills", "key skills"
  ],
  about_me: [
    "about you", "tell us about yourself",
    "introduction", "summary", "profile summary",
    "about me", "bio"
  ],
  motivation: [
    "why do you want this job", "why are you interested", "motivation", "cover letter", "why this role"
  ]
};

const RULE_KEY_TO_PROFILE_KEY = {
  full_name: "fullName",
  first_name: "firstName",
  middle_name: "middleName",
  last_name: "lastName",
  email: "email",
  phone: "phone",
  whatsapp: "phone",
  password: "password",
  current_salary: "currentSalary",
  expected_salary: "expectedSalary",
  notice_period: "notice",
  current_company: "currentCompany",
  previous_company: "previousCompany",
  current_role: "currentRole",
  years_of_experience: "experience",
  current_location: "city",
  preferred_location: "preferredLocation",
  joining_date: "joiningDate",
  relieving_date: "relievingDate",
  currently_working: "currentlyWorking",
  relocate: "relocate",
  notice_status: "noticeStatus",
  linkedin: "linkedin",
  github: "github",
  portfolio: "portfolio",
  education: "education",
  degree: "degree",
  university: "university",
  graduation_year: "graduationYear",
  skills: "skills",
  about_me: "about",
  motivation: "motivation"
};

const mapping = {
  firstName: FIELD_MAPPINGS.first_name,
  middleName: FIELD_MAPPINGS.middle_name,
  lastName: FIELD_MAPPINGS.last_name,
  name: FIELD_MAPPINGS.full_name,
  email: FIELD_MAPPINGS.email,
  password: FIELD_MAPPINGS.password,
  phone: FIELD_MAPPINGS.phone,
  whatsapp: FIELD_MAPPINGS.whatsapp,
  city: FIELD_MAPPINGS.current_location,
  currentCompany: FIELD_MAPPINGS.current_company,
  currentRole: FIELD_MAPPINGS.current_role,
  joiningDate: FIELD_MAPPINGS.joining_date,
  relievingDate: FIELD_MAPPINGS.relieving_date,
  currentlyWorking: FIELD_MAPPINGS.currently_working,
  linkedin: FIELD_MAPPINGS.linkedin,
  portfolio: [...FIELD_MAPPINGS.portfolio, ...FIELD_MAPPINGS.github],
  about: FIELD_MAPPINGS.about_me,
  experience: FIELD_MAPPINGS.years_of_experience,
  motivation: FIELD_MAPPINGS.motivation,
  currentSalary: FIELD_MAPPINGS.current_salary,
  expectedSalary: FIELD_MAPPINGS.expected_salary,
  notice: FIELD_MAPPINGS.notice_period,
  relocate: FIELD_MAPPINGS.relocate,
  noticeStatus: FIELD_MAPPINGS.notice_status
};

const userData = Object.freeze({
  full_name: "Sangamesh",
  first_name: "Sangamesh",
  middle_name: "",
  last_name: "Patil",
  email: "you@email.com",
  phone: "9999999999",
  whatsapp: "9999999999",
  password: "StrongPassword@123",
  current_salary: "6 LPA",
  expected_salary: "12 LPA",
  notice_period: "30 days",
  current_company: "ABC Pvt Ltd",
  previous_company: "XYZ Pvt Ltd",
  current_role: "Software Engineer",
  years_of_experience: "1 year",
  current_location: "Bangalore",
  preferred_location: "Remote",
  joining_date: "2023-06-01",
  relieving_date: "2024-12-31",
  currently_working: "yes",
  relocate: "yes",
  notice_status: "no",
  linkedin: "https://linkedin.com/in/yourprofile",
  github: "https://github.com/yourprofile",
  portfolio: "https://yourportfolio.com",
  education: "B.Tech",
  degree: "Computer Science",
  university: "VTU",
  graduation_year: "2024",
  skills: "JavaScript, Node.js, React",
  about_me: "Passionate developer with experience in building scalable systems.",
  motivation: "I enjoy solving product problems and building reliable user experiences."
});

const EMPTY_USER_DATA_TEMPLATE = Object.freeze(
  Object.keys(userData).reduce((accumulator, key) => {
    accumulator[key] = "";
    return accumulator;
  }, {})
);

const DEFAULT_MATCH_METADATA = Object.freeze({
  fieldKey: "",
  source: "default"
});
const LONG_ANSWER_KEYWORDS = [
  "why",
  "describe",
  "tell us",
  "explain",
  "motivation",
  "fit",
  "reason"
];
const fieldAiAnswerCache = new WeakMap();
const fieldAiPendingMap = new WeakMap();

initializeFloatingButton();
watchForBodyAvailability();
registerRuntimeListener();
exposeCustomFieldApi();

function registerRuntimeListener() {
  if (!isExtensionContextAvailable()) {
    return;
  }

  try {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!message || !message.type) {
        return false;
      }

      if (message.type === "JAA_SYNC_CUSTOM_FIELDS") {
        widgetRuntimeState.customFieldsCache = sanitizeCustomFields(message.customFields || {});

        try {
          window.localStorage.setItem(
            CUSTOM_FIELDS_STORAGE_KEY,
            JSON.stringify(widgetRuntimeState.customFieldsCache)
          );
        } catch (error) {
          // Ignore page storage errors.
        }

        sendResponse({ ok: true });
        return false;
      }

      if (message.type === "JAA_TRIGGER_AI_FIELD") {
        const triggered = triggerFirstVisibleAiButton();
        sendResponse({ ok: triggered });
        return false;
      }

      if (message.type !== "JAA_AUTOFILL_NOW") {
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

function exposeCustomFieldApi() {
  globalThis.JAACustomFields = {
    addCustomField,
    updateCustomField,
    deleteCustomField,
    getCustomFields
  };
}

function triggerFirstVisibleAiButton() {
  const button = Array.from(document.querySelectorAll(".jaa-ai-answer-button")).find((element) => {
    return element instanceof HTMLButtonElement && !element.disabled && isUsableField(element);
  });

  if (!button) {
    return false;
  }

  button.click();
  return true;
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
  widgetRuntimeState.customFieldsCache = await loadCustomFieldsFromExtensionStorage();
  widgetRuntimeState.activeProfile = profile || null;

  if (!profile) {
    showFeedback("Save your profile in the extension popup first.", true);
    return {
      ok: false,
      message: "Save your profile in the extension popup first."
    };
  }

  const filledCount = autofillDetectedFields(profile, {
    reason: "manual",
    showLogs: true
  });

  if (!filledCount) {
    showFeedback("No supported job application fields were found on this page.", true);
    return {
      ok: false,
      message: "No supported job application fields were found on this page."
    };
  }

  schedulePlatformCompatibilityPass();

  showFeedback(`Filled ${filledCount} field${filledCount === 1 ? "" : "s"}.`);
  return {
    ok: true,
    message: `Form data filled successfully. ${filledCount} field${filledCount === 1 ? "" : "s"} updated.`
  };
}

async function loadCustomFieldsFromExtensionStorage() {
  if (!isExtensionContextAvailable()) {
    return {};
  }

  try {
    const stored = await chrome.storage.local.get(CUSTOM_FIELDS_STORAGE_KEY);
    return sanitizeCustomFields(stored[CUSTOM_FIELDS_STORAGE_KEY] || {});
  } catch (error) {
    return {};
  }
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

function getCurrentHostname() {
  return normalizeText(window.location.hostname || "");
}

function isKnownAtsPage() {
  const hostname = getCurrentHostname();
  return Object.values(ATS_HOST_SIGNALS).some((signals) => {
    return signals.some((signal) => hostname.includes(signal));
  });
}

function isWorkdayPage() {
  const hostname = getCurrentHostname();
  return ATS_HOST_SIGNALS.workday.some((signal) => hostname.includes(signal));
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
  const top = Number.isFinite(prefs.top) ? prefs.top : window.innerHeight - 72;
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

function detectFieldIntent(field, mergedMappings = mergeMappings()) {
  const context = getFieldContext(field);
  const ruleBasedIntent = detectRuleBasedIntent(field, context, mergedMappings);

  if (field instanceof HTMLSelectElement) {
    return detectSelectIntent(field, context) || ruleBasedIntent;
  }

  if (field instanceof HTMLTextAreaElement) {
    return detectTextareaIntent(context) || ruleBasedIntent;
  }

  if (isCustomCombobox(field)) {
    return detectComboboxIntent(field, context) || ruleBasedIntent;
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
    return detectCheckboxIntent(context) || ruleBasedIntent;
  }

  if (inputType === "date") {
    return detectDateIntent(context) || ruleBasedIntent;
  }

  if (isNumericIntentField(field, context)) {
    return detectNumericIntent(context) || ruleBasedIntent;
  }

  if (inputType === "url") {
    return detectUrlIntent(context) || ruleBasedIntent;
  }

  if (inputType !== "text" && inputType !== "search" && inputType !== "url") {
    return ruleBasedIntent;
  }

  return detectTextIntent(context) || ruleBasedIntent;
}

function detectRadioIntent(group, mergedMappings = mergeMappings()) {
  const context = normalizeText(group.contextText);
  return detectChoiceIntent({ directText: context }, ["currentlyWorking", "noticeStatus", "relocate"])
    || detectRuleBasedIntent(group.inputs[0], { directText: context, extendedText: context }, mergedMappings);
}

function detectFillableFields() {
  const selector = [
    "input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset']):not([type='radio']):not([type='file'])",
    "textarea",
    "select",
    "[role='combobox']",
    "[contenteditable='true']"
  ].join(", ");

  return Array.from(document.querySelectorAll(selector)).filter((field) => isFillableInputTarget(field));
}

function detectRadioGroups() {
  const radios = Array.from(document.querySelectorAll("input[type='radio']")).filter((input) => {
    return isFillableInputTarget(input);
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

function isLongAnswerField(input) {
  if (!(input instanceof HTMLTextAreaElement) && !(input instanceof HTMLInputElement && input.type === "text")) {
    return false;
  }

  if (!isFillableInputTarget(input)) {
    return false;
  }

  const label = getFieldLabel(input);
  const placeholder = String(input.placeholder || "");
  const normalizedPlaceholder = normalize(placeholder);
  const labelLongEnough = normalize(label).length > 20;
  const hasPromptKeyword = LONG_ANSWER_KEYWORDS.some((keyword) => normalizedPlaceholder.includes(normalize(keyword)));
  const isLargeTextarea = input instanceof HTMLTextAreaElement && Number(input.rows || 0) >= 3;

  return labelLongEnough || hasPromptKeyword || isLargeTextarea;
}

function scanLongAnswerFields() {
  const candidates = Array.from(document.querySelectorAll("textarea, input[type='text']")).filter((field) => {
    return isLongAnswerField(field);
  });

  for (const field of candidates) {
    console.log("[JAA] Detected long-answer field:", getFieldLabel(field));
    injectAIButton(field);
  }
}

function getJobApplicationFields() {
  const selector = [
    "input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset'])",
    "textarea",
    "select"
  ].join(", ");

  return Array.from(document.querySelectorAll(selector)).filter((field) => {
    if (!(field instanceof HTMLElement)) {
      return false;
    }

    if (field.disabled) {
      return false;
    }

    return isUsableField(field);
  });
}

function getJobPageKeywordScore(fields) {
  let score = 0;

  for (const field of fields) {
    const normalizedLabel = normalize(getFieldLabel(field));
    if (!normalizedLabel) {
      continue;
    }

    if (IMPORTANT_KEYWORDS.some((keyword) => normalizedLabel.includes(normalize(keyword)))) {
      score += 1;
    }
  }

  return score;
}

function getUrlSignalScore() {
  const normalizedUrl = normalize(window.location.href);
  const urlKeywords = ["job", "career", "apply", "hiring"];
  return urlKeywords.some((keyword) => normalizedUrl.includes(keyword)) ? 1 : 0;
}

function isJobApplicationPage() {
  const fields = getJobApplicationFields();
  if (fields.length < 3) {
    return false;
  }

  const score = getJobPageKeywordScore(fields) + getUrlSignalScore();
  return score >= 2;
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

function getCustomFields() {
  const cachedFields = sanitizeCustomFields(widgetRuntimeState.customFieldsCache || {});

  try {
    const rawValue = window.localStorage.getItem(CUSTOM_FIELDS_STORAGE_KEY);
    if (!rawValue) {
      return cachedFields;
    }

    const parsed = JSON.parse(rawValue);
    return {
      ...cachedFields,
      ...sanitizeCustomFields(parsed)
    };
  } catch (error) {
    console.warn("[JAA] Failed to read custom fields from localStorage.", error);
    return cachedFields;
  }
}

function mergeMappings(customFields = getCustomFields()) {
  const merged = {};

  for (const [fieldKey, keywords] of Object.entries(FIELD_MAPPINGS)) {
    merged[fieldKey] = Array.isArray(keywords) ? [...keywords] : [];
  }

  for (const [fieldKey, config] of Object.entries(customFields)) {
    merged[fieldKey] = Array.isArray(config.keywords) ? [...config.keywords] : [];
  }

  return merged;
}

function saveCustomFields(customFields) {
  try {
    window.localStorage.setItem(
      CUSTOM_FIELDS_STORAGE_KEY,
      JSON.stringify(sanitizeCustomFields(customFields))
    );
    return true;
  } catch (error) {
    console.warn("[JAA] Failed to save custom fields to localStorage.", error);
    return false;
  }
}

function addCustomField(key, keywordsArray, value) {
  const normalizedKey = normalizeCustomFieldKey(key);
  if (!normalizedKey) {
    return false;
  }

  const customFields = getCustomFields();
  customFields[normalizedKey] = {
    keywords: sanitizeKeywords(keywordsArray),
    value: String(value || "").trim()
  };
  return saveCustomFields(customFields);
}

function updateCustomField(key, newData) {
  const normalizedKey = normalizeCustomFieldKey(key);
  if (!normalizedKey) {
    return false;
  }

  const customFields = getCustomFields();
  if (!customFields[normalizedKey]) {
    return false;
  }

  customFields[normalizedKey] = {
    keywords: newData && "keywords" in newData
      ? sanitizeKeywords(newData.keywords)
      : customFields[normalizedKey].keywords,
    value: newData && "value" in newData
      ? String(newData.value || "").trim()
      : customFields[normalizedKey].value
  };

  return saveCustomFields(customFields);
}

function deleteCustomField(key) {
  const normalizedKey = normalizeCustomFieldKey(key);
  if (!normalizedKey) {
    return false;
  }

  const customFields = getCustomFields();
  if (!customFields[normalizedKey]) {
    return false;
  }

  delete customFields[normalizedKey];
  return saveCustomFields(customFields);
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
      keywords: sanitizeKeywords(config.keywords),
      value: String(config.value || "").trim()
    };
    return accumulator;
  }, {});
}

function sanitizeKeywords(keywordsArray) {
  if (!Array.isArray(keywordsArray)) {
    return [];
  }

  return keywordsArray
    .map((keyword) => String(keyword || "").trim())
    .filter(Boolean);
}

function normalizeCustomFieldKey(key) {
  return String(key || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getFieldContext(field) {
  const labelText = normalizeText(getFieldLabel(field));
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

function getFieldLabel(input) {
  const closestLabelText = getClosestLabelText(input);
  const shortParentText = getShortParentText(input);
  const previousSiblingText = extractSiblingPrompt(input.previousElementSibling);

  return [
    input.placeholder,
    input.name,
    input.getAttribute("aria-label"),
    input.labels && input.labels[0] ? input.labels[0].innerText || input.labels[0].textContent || "" : "",
    getLabelText(input),
    closestLabelText,
    shortParentText,
    getLimitedParentText(input, 140),
    previousSiblingText,
    input.id,
    getNearbyPromptText(input)
  ]
    .filter(Boolean)
    .join(" ");
}

function injectAIButton(field) {
  if (!(field instanceof HTMLElement) || field.dataset.jaaAiButtonInjected === "true") {
    return;
  }

  const wrapper = getAiFieldWrapper(field);
  if (!wrapper) {
    return;
  }

  ensureRelativePosition(wrapper);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "jaa-ai-answer-button";
  button.textContent = "\u2728 Auto-fill";
  button.setAttribute("aria-label", "Generate AI answer for this question");
  button.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    await handleAiButtonClick(field, button);
  });

  wrapper.appendChild(button);
  field.dataset.jaaAiButtonInjected = "true";
}

function getAiFieldWrapper(field) {
  return field.closest("label, .form-group, .field, .question, .input, .form-field, .form-control")
    || field.parentElement;
}

function ensureRelativePosition(element) {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  const computedStyle = window.getComputedStyle(element);
  if (computedStyle.position === "static") {
    element.dataset.jaaPositionPatched = "true";
    element.style.position = "relative";
  }
}

function getClosestLabelText(field) {
  const container = field.closest("label, .form-group, .field, .question, .input, .form-field, .form-control, [data-field]");
  if (!container) {
    return "";
  }

  if (container.tagName === "LABEL") {
    return container.innerText || container.textContent || "";
  }

  const nestedLabel = container.querySelector("label");
  return nestedLabel ? nestedLabel.innerText || nestedLabel.textContent || "" : "";
}

function getShortParentText(field) {
  const parentText = field.parentElement
    ? (field.parentElement.innerText || field.parentElement.textContent || "")
    : "";
  const normalizedParent = parentText.replace(/\s+/g, " ").trim();
  return normalizedParent.length <= 120 ? normalizedParent : normalizedParent.slice(0, 120);
}

function getLimitedParentText(field, maxLength = 160) {
  const rawText = getParentText(field);
  const normalizedParent = String(rawText || "").replace(/\s+/g, " ").trim();
  return normalizedParent.length <= maxLength ? normalizedParent : normalizedParent.slice(0, maxLength);
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
  return normalize(text);
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9\s+]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getJobDescription() {
  const selectors = [
    "[class*='job']",
    "[class*='description']",
    "[id*='job']",
    "article",
    "main"
  ];

  let bestMatch = "";

  for (const selector of selectors) {
    const nodes = Array.from(document.querySelectorAll(selector));
    for (const node of nodes) {
      if (!(node instanceof HTMLElement) || !isUsableField(node)) {
        continue;
      }

      const visibleText = String(node.innerText || node.textContent || "").replace(/\s+/g, " ").trim();
      if (visibleText.length > 300 && visibleText.length > bestMatch.length) {
        bestMatch = visibleText;
      }
    }

    if (bestMatch) {
      break;
    }
  }

  const description = bestMatch || String(document.body.innerText || "").slice(0, 3000);
  console.log("[JAA] Extracted job description length:", description.length);
  return description;
}

function buildPrompt(profile, jobDescription, question) {
  const autofillData = buildAutofillUserData(profile || {});
  const prompt = `You are an expert job applicant.

Candidate Profile:
Name: ${profile && profile.fullName ? profile.fullName : ""}
Experience: ${autofillData.years_of_experience || ""}
Skills: ${autofillData.skills || ""}
Current Role: ${profile && profile.currentRole ? profile.currentRole : ""}
Current Company: ${profile && profile.currentCompany ? profile.currentCompany : ""}
About: ${profile && profile.about ? profile.about : ""}

Job Description:
${jobDescription}

Question:
${question}

Write a concise, professional, human-sounding answer tailored to this role.
Keep it under 120 words.`;

  console.log("[JAA] AI prompt created.");
  return prompt;
}

async function generateAnswer(prompt, metadata = {}) {
  if (!isExtensionContextAvailable()) {
    throw new Error("Extension context unavailable.");
  }

  const response = await chrome.runtime.sendMessage({
    type: "JAA_GENERATE_AI_ANSWER",
    prompt,
    metadata
  });

  if (!response || !response.ok || !response.answer) {
    throw new Error(response && response.message ? response.message : "AI answer generation failed.");
  }

  console.log("[JAA] Answer generated.");
  return String(response.answer || "").trim();
}

function setInputValue(input, value) {
  primeFieldForFrameworks(input);
  applyValueToField(input, value);
  dispatchFieldEvents(input, value);
}

async function loadProfileForAi() {
  if (!isExtensionContextAvailable()) {
    return {};
  }

  try {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    return stored[STORAGE_KEY] || {};
  } catch (error) {
    return {};
  }
}

async function handleAiButtonClick(field, button) {
  const cachedAnswer = fieldAiAnswerCache.get(field);
  if (cachedAnswer) {
    setInputValue(field, cachedAnswer);
    return;
  }

  const pendingRequest = fieldAiPendingMap.get(field);
  if (pendingRequest) {
    return pendingRequest;
  }

  const run = (async () => {
    setAiButtonLoading(button, true);

    try {
      const profile = await loadProfileForAi();
      const question = getFieldLabel(field) || field.placeholder || "Job application question";
      const jobDescription = getJobDescription();
      const prompt = buildPrompt(profile, jobDescription, question);
      const answer = await generateAnswer(prompt, {
        url: window.location.href,
        hostname: window.location.hostname,
        question
      });

      fieldAiAnswerCache.set(field, answer);
      setInputValue(field, answer);
    } catch (error) {
      console.error("[JAA] AI answer generation failed:", error);
      showFeedback(String(error && error.message ? error.message : "Unable to generate AI answer right now."), true);
    } finally {
      fieldAiPendingMap.delete(field);
      setAiButtonLoading(button, false);
    }
  })();

  fieldAiPendingMap.set(field, run);
  return run;
}

function setAiButtonLoading(button, isLoading) {
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  button.disabled = isLoading;
  button.textContent = isLoading ? "Generating..." : "\u2728 Auto-fill";
}

function matchField(labelText, mergedMappings = mergeMappings()) {
  return getFieldMatchDetails(labelText, mergedMappings).fieldKey || null;
}

function getFieldMatchDetails(labelText, mergedMappings = mergeMappings()) {
  const normalizedLabel = normalize(labelText);
  let bestMatch = null;
  let bestScore = 0;
  let source = "default";
  const customFields = getCustomFields();

  for (const [fieldKey, keywords] of Object.entries(mergedMappings)) {
    for (const keyword of keywords) {
      const normalizedKeyword = normalize(keyword);
      if (!normalizedKeyword || !normalizedLabel.includes(normalizedKeyword)) {
        continue;
      }

      if (normalizedKeyword === "name" && /\b(company|employer|organization|college|university|institute)\b/.test(normalizedLabel)) {
        continue;
      }

      const score = normalizedLabel === normalizedKeyword
        ? 100 + normalizedKeyword.length
        : normalizedKeyword.split(" ").length * 10 + normalizedKeyword.length;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = fieldKey;
        source = customFields[fieldKey] ? "custom" : "default";
      }
    }
  }

  return bestMatch
    ? { fieldKey: bestMatch, source }
    : { ...DEFAULT_MATCH_METADATA };
}

function detectRuleBasedIntent(field, context, mergedMappings = mergeMappings()) {
  const labelText = [
    getFieldLabel(field),
    context ? context.directText : "",
    context ? context.extendedText : ""
  ]
    .filter(Boolean)
    .join(" ");
  const ruleKey = matchField(labelText, mergedMappings);
  return ruleKey ? mapRuleKeyToIntent(ruleKey) : null;
}

function mapRuleKeyToIntent(ruleKey) {
  const intentMap = {
    full_name: "name",
    first_name: "firstName",
    middle_name: "middleName",
    last_name: "lastName",
    email: "email",
    phone: "phone",
    whatsapp: "phone",
    password: "password",
    current_salary: "currentSalary",
    expected_salary: "expectedSalary",
    notice_period: "notice",
    current_company: "currentCompany",
    previous_company: null,
    current_role: "currentRole",
    years_of_experience: "experience",
    current_location: "city",
    preferred_location: null,
    joining_date: "joiningDate",
    relieving_date: "relievingDate",
    currently_working: "currentlyWorking",
    relocate: "relocate",
    notice_status: "noticeStatus",
    linkedin: "linkedin",
    github: null,
    portfolio: "portfolio",
    education: null,
    degree: null,
    university: null,
    graduation_year: null,
    skills: null,
    about_me: "about",
    motivation: "motivation"
  };

  return intentMap[ruleKey] || null;
}

function buildAutofillUserData(profile) {
  const nameParts = getNameParts(profile && profile.fullName ? profile.fullName : "");
  return {
    ...EMPTY_USER_DATA_TEMPLATE,
    full_name: profile && profile.fullName ? profile.fullName : "",
    first_name: nameParts.firstName,
    middle_name: nameParts.middleName,
    last_name: nameParts.lastName,
    email: profile && profile.email ? profile.email : "",
    phone: formatPhoneNumber(profile && profile.phone ? profile.phone : ""),
    whatsapp: formatPhoneNumber(profile && profile.phone ? profile.phone : ""),
    password: profile && profile.password ? profile.password : "",
    current_salary: normalizeNumericValue(profile && profile.currentSalary ? profile.currentSalary : ""),
    expected_salary: normalizeNumericValue(profile && profile.expectedSalary ? profile.expectedSalary : ""),
    notice_period: profile && profile.notice ? String(profile.notice).trim() : "",
    current_company: profile && profile.currentCompany ? profile.currentCompany : "",
    previous_company: profile && profile.previousCompany ? profile.previousCompany : "",
    current_role: profile && profile.currentRole ? profile.currentRole : "",
    years_of_experience: profile && profile.experience ? String(profile.experience).trim() : "",
    current_location: profile && profile.city ? profile.city : "",
    preferred_location: profile && profile.preferredLocation ? profile.preferredLocation : "",
    joining_date: profile && profile.joiningDate ? profile.joiningDate : "",
    relieving_date: profile && profile.relievingDate ? profile.relievingDate : "",
    currently_working: normalizeBooleanValue(profile && profile.currentlyWorking ? profile.currentlyWorking : ""),
    relocate: normalizeBooleanValue(profile && profile.relocate ? profile.relocate : ""),
    notice_status: normalizeBooleanValue(profile && profile.noticeStatus ? profile.noticeStatus : ""),
    linkedin: profile && profile.linkedin ? profile.linkedin : "",
    github: profile && profile.github ? profile.github : "",
    portfolio: profile && profile.portfolio ? profile.portfolio : "",
    education: profile && profile.education ? profile.education : "",
    degree: profile && profile.degree ? profile.degree : "",
    university: profile && profile.university ? profile.university : "",
    graduation_year: profile && profile.graduationYear ? profile.graduationYear : "",
    skills: profile && profile.skills ? profile.skills : "",
    about_me: profile && profile.about ? profile.about : "",
    motivation: profile && profile.motivation ? profile.motivation : ""
  };
}

function autofillDetectedFields(profile, options = {}) {
  const customFields = getCustomFields();
  const mergedMappings = mergeMappings(customFields);
  const autofillData = buildAutofillValueMap(profile, customFields);
  let filledCount = 0;

  filledCount += handleInputs(profile, autofillData, mergedMappings, options);
  filledCount += handleSelects(profile, autofillData, mergedMappings, options);
  filledCount += handleRadios(profile, autofillData, mergedMappings, options);

  return filledCount;
}

function buildAutofillValueMap(profile, customFields = getCustomFields()) {
  const baseData = buildAutofillUserData(profile);
  const customValues = Object.entries(customFields).reduce((accumulator, [fieldKey, config]) => {
    accumulator[fieldKey] = String(config && config.value ? config.value : "").trim();
    return accumulator;
  }, {});

  return {
    ...baseData,
    ...customValues
  };
}

function handleInputs(profile, autofillData, mergedMappings, options = {}) {
  const selector = [
    "input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset']):not([type='radio']):not([type='file'])",
    "textarea",
    "[role='combobox']",
    "[contenteditable='true']"
  ].join(", ");
  const fields = Array.from(document.querySelectorAll(selector)).filter((field) => isFillableInputTarget(field));
  let filledCount = 0;

  for (const field of fields) {
    const result = fillDetectedField(field, profile, autofillData, mergedMappings, options);
    if (result.filled) {
      filledCount += 1;
    }
  }

  return filledCount;
}

function handleSelects(profile, autofillData, mergedMappings, options = {}) {
  const selects = Array.from(document.querySelectorAll("select")).filter((field) => isFillableInputTarget(field));
  let filledCount = 0;

  for (const field of selects) {
    const result = fillDetectedField(field, profile, autofillData, mergedMappings, options);
    if (result.filled) {
      filledCount += 1;
    }
  }

  return filledCount;
}

function handleRadios(profile, autofillData, mergedMappings, options = {}) {
  const radioGroups = detectRadioGroups();
  let filledCount = 0;

  for (const group of radioGroups) {
    const result = fillDetectedRadioGroup(group, profile, autofillData, mergedMappings, options);
    if (result.filled) {
      filledCount += 1;
    }
  }

  return filledCount;
}

function fillDetectedField(field, profile, autofillData, mergedMappings, options = {}) {
  const label = getFieldLabel(field);
  const matchDetails = getFieldMatchDetails(label, mergedMappings);
  const intentKey = detectFieldIntent(field, mergedMappings);
  const fieldValue = getFieldValueForAutofill({
    field,
    profile,
    autofillData,
    ruleKey: matchDetails.fieldKey,
    intentKey
  });
  const valueSource = getAutofillSource({
    ruleKey: matchDetails.fieldKey,
    intentKey,
    autofillData
  });

  logAutofillDecision({
    field,
    label,
    matchedField: matchDetails.fieldKey || intentKey || null,
    filledValue: fieldValue,
    source: matchDetails.fieldKey ? matchDetails.source : valueSource,
    reason: options.reason
  });

  if (!fieldValue) {
    return { filled: false };
  }

  if (field instanceof HTMLSelectElement) {
    const selectedOption = fillSelectField(field, fieldValue);
    if (selectedOption) {
      logSelectionResult("dropdown", selectedOption, matchDetails.fieldKey || intentKey || "", matchDetails.fieldKey ? matchDetails.source : valueSource);
      return { filled: true };
    }
    return { filled: false };
  }

  return {
    filled: fillField(field, fieldValue)
  };
}

function fillDetectedRadioGroup(group, profile, autofillData, mergedMappings, options = {}) {
  const label = getRadioGroupLabel(group);
  const matchDetails = getFieldMatchDetails(label, mergedMappings);
  const intentKey = detectRadioIntent(group, mergedMappings) || (matchDetails.fieldKey ? mapRuleKeyToIntent(matchDetails.fieldKey) : null);
  const fieldValue = getFieldValueForAutofill({
    field: group.inputs[0],
    profile,
    autofillData,
    ruleKey: matchDetails.fieldKey,
    intentKey
  });
  const valueSource = getAutofillSource({
    ruleKey: matchDetails.fieldKey,
    intentKey,
    autofillData
  });

  logAutofillDecision({
    field: group.inputs[0],
    label,
    matchedField: matchDetails.fieldKey || intentKey || null,
    filledValue: fieldValue,
    source: matchDetails.fieldKey ? matchDetails.source : valueSource,
    reason: options.reason
  });

  if (!fieldValue) {
    return { filled: false };
  }

  const selectedRadio = fillRadioGroup(group, fieldValue);
  if (selectedRadio) {
    logSelectionResult("radio", getRadioOptionLabel(selectedRadio), matchDetails.fieldKey || intentKey || "", matchDetails.fieldKey ? matchDetails.source : valueSource);
    return { filled: true };
  }

  return { filled: false };
}

function getFieldValueForAutofill({ field, profile, autofillData, ruleKey, intentKey }) {
  if (ruleKey && autofillData[ruleKey]) {
    return autofillData[ruleKey];
  }

  if (ruleKey) {
    const profileKey = RULE_KEY_TO_PROFILE_KEY[ruleKey];
    if (profileKey && profile && profile[profileKey]) {
      return profile[profileKey];
    }
  }

  return getProfileValue(profile, intentKey, field);
}

function getAutofillSource({ ruleKey, intentKey, autofillData }) {
  if (ruleKey && Object.prototype.hasOwnProperty.call(autofillData, ruleKey)) {
    return FIELD_MAPPINGS[ruleKey] ? "default" : "custom";
  }

  if (intentKey) {
    return "default";
  }

  return "unknown";
}

function logAutofillDecision({ field, label, matchedField, filledValue, source, reason }) {
  const nodeName = field && field.tagName ? field.tagName.toLowerCase() : "field";
  console.log(`[JAA] Detected Label (${reason || "autofill"}):`, label || "(empty)");
  console.log(`[JAA] Matched Field (${nodeName}):`, matchedField || "none");
  console.log(`[JAA] Source (${nodeName}):`, source || "unknown");
  console.log(
    `[JAA] Filled Value (${nodeName}):`,
    matchedField === "password" ? "[REDACTED]" : (filledValue || "(empty)")
  );
}

function logSelectionResult(kind, selectedOption, matchedField, source) {
  console.log(`[JAA] Selected ${kind}:`, selectedOption || "(none)");
  console.log(`[JAA] Selection Source (${kind}):`, source || "unknown");
  console.log(`[JAA] Selection Field (${kind}):`, matchedField || "none");
}

function fillField(field, value) {
  if (!isFillableInputTarget(field)) {
    return false;
  }

  if (isMeaningfullyFilledField(field)) {
    return false;
  }

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

  primeFieldForFrameworks(field);
  applyValueToField(field, normalizedValue);
  dispatchFieldEvents(field, normalizedValue);
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

function primeFieldForFrameworks(field) {
  if (!(field instanceof HTMLElement)) {
    return;
  }

  try {
    field.focus({ preventScroll: true });
  } catch (error) {
    field.focus();
  }

  if ((field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) && typeof field.setSelectionRange === "function") {
    const length = String(field.value || "").length;
    try {
      field.setSelectionRange(length, length);
    } catch (error) {
      // Ignore unsupported input types.
    }
  }
}

function fillSelectField(field, value) {
  if (!isFillableInputTarget(field) || isMeaningfullyFilledField(field)) {
    return null;
  }

  const targetValue = normalizeText(value);
  const options = Array.from(field.options || []);
  let bestMatch = null;
  let bestScore = 0;

  for (const option of options) {
    if (option.disabled) {
      continue;
    }

    const optionText = normalizeText(option.textContent || option.label || "");
    const optionValue = normalizeText(option.value || "");
    const score = getOptionMatchScore(targetValue, optionText, optionValue);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = option;
    }
  }

  if (!bestMatch) {
    return null;
  }

  const descriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
  if (descriptor && descriptor.set) {
    descriptor.set.call(field, bestMatch.value);
  } else {
    field.value = bestMatch.value;
  }

  dispatchSelectEvents(field);
  return bestMatch.textContent || bestMatch.label || bestMatch.value || "";
}

function fillRadioGroup(group, value) {
  if (!group || !Array.isArray(group.inputs) || !group.inputs.length) {
    return null;
  }

  if (group.inputs.some((input) => input.checked)) {
    return null;
  }

  const targetValue = normalizeText(value);
  let bestMatch = null;
  let bestScore = 0;

  for (const input of group.inputs) {
    if (!isFillableInputTarget(input)) {
      continue;
    }

    const optionText = normalizeText(getRadioOptionLabel(input));
    const optionValue = normalizeText(input.value || "");
    const score = getOptionMatchScore(targetValue, optionText, optionValue);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = input;
    }
  }

  if (!bestMatch) {
    return null;
  }

  bestMatch.click();
  bestMatch.dispatchEvent(new Event("change", { bubbles: true }));
  return bestMatch;
}

function getOptionMatchScore(targetValue, optionText, optionValue) {
  if (!targetValue || isPlaceholderOption(optionText, optionValue)) {
    return 0;
  }

  if (optionText === targetValue || optionValue === targetValue) {
    return 100;
  }

  if (optionText.includes(targetValue) || optionValue.includes(targetValue)) {
    return 80;
  }

  if (targetValue.includes(optionText) || targetValue.includes(optionValue)) {
    return 70;
  }

  const normalizedBooleanTarget = normalizeBooleanValue(targetValue);
  if (normalizedBooleanTarget && (optionText.includes(normalizedBooleanTarget) || optionValue.includes(normalizedBooleanTarget))) {
    return 90;
  }

  return 0;
}

function getRadioOptionLabel(input) {
  return [
    input.value,
    input.getAttribute("aria-label"),
    getLabelText(input),
    input.parentElement ? input.parentElement.innerText || input.parentElement.textContent || "" : ""
  ]
    .filter(Boolean)
    .join(" ");
}

function getRadioGroupLabel(group) {
  const firstInput = group && group.inputs && group.inputs[0] ? group.inputs[0] : null;
  return [
    group && group.contextText ? group.contextText : "",
    firstInput ? getFieldLabel(firstInput) : "",
    firstInput ? getShortParentText(firstInput) : ""
  ]
    .filter(Boolean)
    .join(" ");
}

function scheduleComboboxOptionSelection(field, value) {
  if (!field || !value) {
    return;
  }

  const attempts = [40, 120, 240];
  for (const delay of attempts) {
    window.setTimeout(() => {
      trySelectComboboxOption(field, value);
    }, delay);
  }
}

function trySelectComboboxOption(field, value) {
  if (!isCustomCombobox(field) || !value) {
    return false;
  }

  const option = findBestComboboxOption(field, value);
  if (!option) {
    return false;
  }

  clickElement(option);
  return true;
}

function findBestComboboxOption(field, value) {
  const targetValue = normalizeText(value);
  const candidates = getComboboxOptions(field);
  let bestMatch = null;
  let bestScore = 0;

  for (const option of candidates) {
    if (!isVisibleOption(option)) {
      continue;
    }

    const optionText = normalizeText(option.textContent || option.getAttribute("aria-label") || "");
    const optionValue = normalizeText(option.getAttribute("data-value") || option.getAttribute("value") || "");
    const score = getOptionMatchScore(targetValue, optionText, optionValue);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = option;
    }
  }

  return bestMatch;
}

function getComboboxOptions(field) {
  const options = [];
  const controlledId = field.getAttribute("aria-controls") || field.getAttribute("aria-owns");
  if (controlledId) {
    const controlledNode = document.getElementById(controlledId);
    if (controlledNode) {
      options.push(...controlledNode.querySelectorAll("[role='option'], li"));
    }
  }

  const listbox = field.closest("[role='listbox']") || document.querySelector("[role='listbox'][aria-expanded='true'], [role='listbox']");
  if (listbox) {
    options.push(...listbox.querySelectorAll("[role='option'], li"));
  }

  options.push(
    ...document.querySelectorAll(
      "[role='option'], [data-automation-id='promptOption'], [data-automation-id='menuItem'], li[role='option']"
    )
  );

  return Array.from(new Set(options));
}

function isVisibleOption(option) {
  if (!(option instanceof HTMLElement)) {
    return false;
  }

  const style = window.getComputedStyle(option);
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }

  const rect = option.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function clickElement(element) {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  if (typeof PointerEvent === "function") {
    element.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  }
  element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  element.click();
  element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
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

    primeFieldForFrameworks(field);
    applyValueToField(field, textValue);
    dispatchFieldEvents(field, textValue);
    scheduleComboboxOptionSelection(field, textValue);
    return true;
  }

  if (field.isContentEditable) {
    if (normalizeText(field.textContent) === normalizeText(textValue)) {
      return false;
    }

    primeFieldForFrameworks(field);
    field.textContent = textValue;
    dispatchFieldEvents(field, textValue);
    scheduleComboboxOptionSelection(field, textValue);
    return true;
  }

  if ("value" in field) {
    const currentValue = String(field.value || "").trim();
    if (currentValue === textValue) {
      return false;
    }
    primeFieldForFrameworks(field);
    field.value = textValue;
    dispatchFieldEvents(field, textValue);
    scheduleComboboxOptionSelection(field, textValue);
    return true;
  }

  return false;
}

function fillCheckboxField(field, value) {
  const shouldCheck = normalizeBooleanValue(value) === "yes";
  if (field.checked === shouldCheck) {
    return false;
  }

  primeFieldForFrameworks(field);
  field.checked = shouldCheck;
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
  field.dispatchEvent(new Event("blur", { bubbles: true }));
  return true;
}

function dispatchFieldEvents(field, value = "") {
  dispatchKeyboardEvents(field, value);
  dispatchBeforeInputEvent(field, value);
  dispatchInputEvent(field, value);
  field.dispatchEvent(new Event("change", { bubbles: true }));
  field.dispatchEvent(new Event("blur", { bubbles: true }));
  field.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
}

function dispatchSelectEvents(field) {
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
  field.dispatchEvent(new Event("blur", { bubbles: true }));
  field.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
}

function dispatchBeforeInputEvent(field, value) {
  if (typeof InputEvent !== "function") {
    return;
  }

  try {
    field.dispatchEvent(new InputEvent("beforeinput", {
      bubbles: true,
      cancelable: true,
      data: String(value || ""),
      inputType: "insertText"
    }));
  } catch (error) {
    // Ignore browsers that reject synthetic InputEvent options.
  }
}

function dispatchInputEvent(field, value) {
  if (typeof InputEvent === "function") {
    try {
      field.dispatchEvent(new InputEvent("input", {
        bubbles: true,
        data: String(value || ""),
        inputType: "insertText"
      }));
      return;
    } catch (error) {
      // Fall back to a basic event below.
    }
  }

  field.dispatchEvent(new Event("input", { bubbles: true }));
}

function dispatchKeyboardEvents(field, value) {
  const text = String(value || "");
  const key = text ? text.slice(-1) : "Tab";

  try {
    field.dispatchEvent(new KeyboardEvent("keydown", {
      bubbles: true,
      key
    }));
    field.dispatchEvent(new KeyboardEvent("keyup", {
      bubbles: true,
      key
    }));
  } catch (error) {
    // Ignore synthetic keyboard event issues.
  }
}

function schedulePlatformCompatibilityPass() {
  if (!isKnownAtsPage()) {
    return;
  }

  const delays = isWorkdayPage() ? [80, 220, 420] : [120, 300];
  for (const delay of delays) {
    window.setTimeout(() => {
      runPlatformCompatibilityPass();
    }, delay);
  }
}

function runPlatformCompatibilityPass() {
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement && activeElement !== document.body) {
    activeElement.dispatchEvent(new Event("blur", { bubbles: true }));
    activeElement.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
  }

  const candidateFields = detectFillableFields().filter((field) => {
    return isMeaningfullyFilledField(field) || field.getAttribute("aria-invalid") === "true";
  });

  for (const field of candidateFields) {
    if (field instanceof HTMLSelectElement) {
      dispatchSelectEvents(field);
      continue;
    }

    const currentValue = field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement
      ? field.value
      : field.textContent || "";
    dispatchFieldEvents(field, currentValue);

    if (isCustomCombobox(field) && currentValue) {
      scheduleComboboxOptionSelection(field, currentValue);
    }
  }

  const nearestForm = candidateFields[0] ? candidateFields[0].closest("form") : null;
  if (nearestForm) {
    nearestForm.dispatchEvent(new Event("input", { bubbles: true }));
    nearestForm.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

function isFillableInputTarget(field) {
  if (!field || field.disabled || field.readOnly || !isUsableField(field)) {
    return false;
  }

  if (field.id === BUTTON_ID || field.id === FEEDBACK_ID) {
    return false;
  }

  if (field instanceof HTMLInputElement && field.type === "password") {
    return false;
  }

  return true;
}

function isMeaningfullyFilledField(field) {
  if (!field) {
    return false;
  }

  if (field instanceof HTMLInputElement) {
    if (field.type === "checkbox" || field.type === "radio") {
      return field.checked;
    }

    return String(field.value || "").trim() !== "";
  }

  if (field instanceof HTMLTextAreaElement) {
    return String(field.value || "").trim() !== "";
  }

  if (field instanceof HTMLSelectElement) {
    const selectedOption = field.options && field.selectedIndex >= 0 ? field.options[field.selectedIndex] : null;
    if (!selectedOption) {
      return false;
    }

    const optionText = normalizeText(selectedOption.textContent || selectedOption.label || "");
    const optionValue = normalizeText(selectedOption.value || "");
    return !isPlaceholderOption(optionText, optionValue);
  }

  if (isCustomCombobox(field)) {
    return String(field.value || field.textContent || "").trim() !== "";
  }

  if (field.isContentEditable) {
    return String(field.textContent || "").trim() !== "";
  }

  return false;
}

function isPlaceholderOption(optionText, optionValue) {
  const text = normalizeText(optionText);
  const value = normalizeText(optionValue);
  if (!text && !value) {
    return true;
  }

  return /\b(select|choose|pick|please select|please choose)\b/.test(text)
    || /\bselect\b/.test(value);
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
    scheduleLongAnswerFieldScan();
    return;
  }

  document.addEventListener("DOMContentLoaded", () => {
    initializeFloatingButton();
    observeDynamicPages();
    scheduleLongAnswerFieldScan();
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
    scheduleObserverAutofill();
    scheduleLongAnswerFieldScan();
  });

  observer.observe(document.body, OBSERVER_CONFIG);
  observeDynamicPages.started = true;
}

function handlePageNavigationState() {
  if (widgetRuntimeState.lastUrl !== window.location.href) {
    widgetRuntimeState.lastUrl = window.location.href;
    widgetRuntimeState.dismissedForPage = false;
    window.clearTimeout(widgetRuntimeState.observerAutofillTimer);
    window.clearTimeout(scheduleLongAnswerFieldScan.timeoutId);
  }
}

function scheduleObserverAutofill() {
  if (!widgetRuntimeState.activeProfile || widgetRuntimeState.autofillInProgress) {
    return;
  }

  window.clearTimeout(widgetRuntimeState.observerAutofillTimer);
  widgetRuntimeState.observerAutofillTimer = window.setTimeout(() => {
    widgetRuntimeState.autofillInProgress = true;

    try {
      autofillDetectedFields(widgetRuntimeState.activeProfile, {
        reason: "observer",
        showLogs: true
      });
    } finally {
      widgetRuntimeState.autofillInProgress = false;
    }
  }, 150);
}

function scheduleLongAnswerFieldScan() {
  window.clearTimeout(scheduleLongAnswerFieldScan.timeoutId);
  scheduleLongAnswerFieldScan.timeoutId = window.setTimeout(() => {
    scanLongAnswerFields();
  }, 180);
}

function refreshFloatingWidgetVisibility() {
  const widget = document.getElementById(WIDGET_ID);
  if (!widget) {
    return;
  }

  const shouldShow = !widgetRuntimeState.dismissedForPage && pageHasAutofillTargets();
  widget.classList.toggle("is-visible", shouldShow);
  widget.classList.toggle("is-hidden", !shouldShow);

  if (shouldShow) {
    widget.hidden = false;
    return;
  }

  window.clearTimeout(refreshFloatingWidgetVisibility.hideTimeoutId);
  refreshFloatingWidgetVisibility.hideTimeoutId = window.setTimeout(() => {
    if (widget && !widget.classList.contains("is-visible")) {
      widget.hidden = true;
    }
  }, 180);
}

function pageHasAutofillTargets() {
  return isJobApplicationPage();
}
