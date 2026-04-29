const AI_CONFIG_KEY = "jaaAiConfig";
const AI_USAGE_KEY = "jaaAiUsage";
const DEFAULT_AI_CONFIG = {
  enabled: true,
  endpoint: "",
  authToken: "",
  dailyLimit: 20,
  minIntervalMs: 2500,
  requestTimeoutMs: 20000
};

let aiRequestQueue = Promise.resolve();
let lastAiRequestAt = 0;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "JAA_GENERATE_AI_ANSWER") {
    return false;
  }

  aiRequestQueue = aiRequestQueue
    .then(() => handleAiGenerationRequest(message))
    .then((result) => {
      sendResponse(result);
    })
    .catch((error) => {
      sendResponse({
        ok: false,
        message: String(error && error.message ? error.message : "AI request failed.")
      });
    });

  return true;
});

async function handleAiGenerationRequest(message) {
  const config = await getAiConfig();
  validateAiConfig(config);
  await enforceDailyLimit(config);
  await enforceRateLimit(config);

  const response = await fetchWithTimeout(config.endpoint, {
    method: "POST",
    headers: buildAiRequestHeaders(config),
    body: JSON.stringify({
      prompt: String(message.prompt || ""),
      metadata: message.metadata || {}
    })
  }, config.requestTimeoutMs);

  if (!response.ok) {
    throw new Error(`AI backend returned ${response.status}.`);
  }

  const payload = await response.json();
  const answer = String(payload && payload.answer ? payload.answer : "").trim();
  if (!answer) {
    throw new Error("AI backend returned an empty answer.");
  }

  await incrementDailyUsage();

  return {
    ok: true,
    answer
  };
}

async function getAiConfig() {
  const stored = await chrome.storage.local.get(AI_CONFIG_KEY);
  return {
    ...DEFAULT_AI_CONFIG,
    ...(stored[AI_CONFIG_KEY] || {})
  };
}

function validateAiConfig(config) {
  if (!config.enabled) {
    throw new Error("AI answer generation is disabled.");
  }

  if (!config.endpoint || !/^https?:\/\//i.test(config.endpoint)) {
    throw new Error("Set a valid AI backend endpoint in the extension settings.");
  }
}

async function enforceDailyLimit(config) {
  const usage = await getDailyUsage();
  if (usage.count >= Number(config.dailyLimit || DEFAULT_AI_CONFIG.dailyLimit)) {
    throw new Error("Daily AI answer limit reached.");
  }
}

async function enforceRateLimit(config) {
  const minIntervalMs = Math.max(0, Number(config.minIntervalMs || DEFAULT_AI_CONFIG.minIntervalMs));
  const waitMs = lastAiRequestAt + minIntervalMs - Date.now();
  if (waitMs > 0) {
    await delay(waitMs);
  }

  lastAiRequestAt = Date.now();
}

async function getDailyUsage() {
  const stored = await chrome.storage.local.get(AI_USAGE_KEY);
  const todayKey = getTodayKey();
  const usage = stored[AI_USAGE_KEY] || {};

  if (usage.date !== todayKey) {
    return {
      date: todayKey,
      count: 0
    };
  }

  return {
    date: todayKey,
    count: Number(usage.count || 0)
  };
}

async function incrementDailyUsage() {
  const usage = await getDailyUsage();
  await chrome.storage.local.set({
    [AI_USAGE_KEY]: {
      date: usage.date,
      count: usage.count + 1
    }
  });
}

function buildAiRequestHeaders(config) {
  const headers = {
    "Content-Type": "application/json"
  };

  if (config.authToken) {
    headers.Authorization = `Bearer ${config.authToken}`;
  }

  return headers;
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timerId);
  }
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
