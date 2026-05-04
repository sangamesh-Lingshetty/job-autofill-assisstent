const PRO_UPGRADE_URL = "https://deeplockproversion.lemonsqueezy.com/checkout/buy/5c4c90ee-4785-4f14-937c-6dcaaee63335";
const LEMON_LICENSE_ACTIVATE_URL = "https://api.lemonsqueezy.com/v1/licenses/activate";
const LEMON_LICENSE_VALIDATE_URL = "https://api.lemonsqueezy.com/v1/licenses/validate";
const PRO_VALIDATION_TTL_MS = 24 * 60 * 60 * 1000;
const JOBFILL_PRODUCT_ID = "1019207";
const JOBFILL_VARIANT_ID = "1599080";

chrome.runtime.onInstalled.addListener(() => {
  void ensureProStatus({ force: false });
});

chrome.runtime.onStartup.addListener(() => {
  void ensureProStatus({ force: false });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) {
    return false;
  }

  if (message.type === "JAA_OPEN_OPTIONS_PAGE") {
    chrome.runtime.openOptionsPage()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        sendResponse({
          ok: false,
          message: String((error && error.message) || "Unable to open profile editor.")
        });
      });

    return true;
  }

  if (message.type === "JAA_OPEN_UPGRADE_PAGE") {
    chrome.tabs.create({ url: PRO_UPGRADE_URL })
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        sendResponse({
          ok: false,
          message: String((error && error.message) || "Unable to open upgrade page.")
        });
      });

    return true;
  }

  if (message.type === "JAA_VERIFY_LICENSE") {
    activateLicense(message.licenseKey)
      .then((result) => sendResponse(result))
      .catch((error) => {
        sendResponse({
          ok: false,
          valid: false,
          isPro: false,
          message: String((error && error.message) || "License validation failed.")
        });
      });

    return true;
  }

  if (message.type === "JAA_ENSURE_PRO_STATUS") {
    ensureProStatus({ force: Boolean(message.force) })
      .then((result) => sendResponse(result))
      .catch((error) => {
        sendResponse({
          ok: false,
          valid: false,
          isPro: false,
          message: String((error && error.message) || "Unable to check Pro status.")
        });
      });

    return true;
  }

  return false;
});

async function activateLicense(licenseKey) {
  const normalizedKey = normalizeLicenseKey(licenseKey);
  if (!normalizedKey) {
    return {
      ok: false,
      valid: false,
      isPro: false,
      message: "Enter your license key."
    };
  }

  const result = await activateLicenseKeyWithLemon(normalizedKey);
  if (!result.valid) {
    await clearProState();
    return {
      ok: false,
      valid: false,
      isPro: false,
      message: result.message || "This license key is invalid."
    };
  }

  await chrome.storage.local.set({
    isPro: true,
    licenseKey: normalizedKey,
    licenseInstanceId: result.instanceId || "",
    lastValidatedAt: Date.now()
  });

  return {
    ok: true,
    valid: true,
    isPro: true,
    licenseKey: normalizedKey
  };
}

async function ensureProStatus({ force = false } = {}) {
  const stored = await chrome.storage.local.get([
    "isPro",
    "licenseKey",
    "licenseInstanceId",
    "lastValidatedAt"
  ]);
  const normalizedKey = normalizeLicenseKey(stored.licenseKey);
  const instanceId = normalizeLicenseInstanceId(stored.licenseInstanceId);
  const lastValidatedAt = Number(stored.lastValidatedAt || 0);
  const cacheFresh = Boolean(stored.isPro)
    && Boolean(normalizedKey)
    && lastValidatedAt > 0
    && Date.now() - lastValidatedAt < PRO_VALIDATION_TTL_MS;

  if (!force && cacheFresh) {
    return {
      ok: true,
      valid: true,
      isPro: true,
      cached: true,
      licenseKey: normalizedKey,
      licenseInstanceId: instanceId
    };
  }

  if (!normalizedKey) {
    await clearProState();
    return {
      ok: true,
      valid: false,
      isPro: false,
      cached: false
    };
  }

  const result = await validateLicense(normalizedKey, instanceId);
  if (!result.valid) {
    await clearProState();
    return {
      ok: true,
      valid: false,
      isPro: false,
      cached: false
    };
  }

  await chrome.storage.local.set({
    isPro: true,
    licenseKey: normalizedKey,
    licenseInstanceId: result.instanceId || instanceId || "",
    lastValidatedAt: Date.now()
  });

  return {
    ok: true,
      valid: true,
      isPro: true,
      cached: false,
      licenseKey: normalizedKey,
      licenseInstanceId: result.instanceId || instanceId || ""
    };
}

async function activateLicenseKeyWithLemon(licenseKey) {
  const normalizedKey = normalizeLicenseKey(licenseKey);
  if (!normalizedKey) {
    return {
      valid: false,
      message: "Enter your license key."
    };
  }

  try {
    const response = await fetch(LEMON_LICENSE_ACTIVATE_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        license_key: normalizedKey,
        instance_name: buildInstanceName()
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        valid: false,
        message: payload && payload.error ? payload.error : "License validation failed."
      };
    }

    return {
      valid: payload && payload.activated === true && isExpectedLemonProduct(payload),
      instanceId: payload && payload.instance && payload.instance.id ? String(payload.instance.id) : "",
      message: getLicenseFailureMessage(payload)
    };
  } catch (error) {
    return {
      valid: false,
      message: "License validation failed. Check your internet and try again."
    };
  }
}

async function validateLicense(licenseKey, instanceId = "") {
  const normalizedKey = normalizeLicenseKey(licenseKey);
  if (!normalizedKey) {
    return {
      valid: false,
      message: "Enter your license key."
    };
  }

  try {
    const body = new URLSearchParams({
      license_key: normalizedKey
    });
    const normalizedInstanceId = normalizeLicenseInstanceId(instanceId);
    if (normalizedInstanceId) {
      body.set("instance_id", normalizedInstanceId);
    }

    const response = await fetch(LEMON_LICENSE_VALIDATE_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        valid: false,
        message: payload && payload.error ? payload.error : "License validation failed."
      };
    }

    return {
      valid: payload && payload.valid === true && isExpectedLemonProduct(payload),
      instanceId: normalizedInstanceId,
      message: getLicenseFailureMessage(payload)
    };
  } catch (error) {
    return {
      valid: false,
      message: "License validation failed. Check your internet and try again."
    };
  }
}

async function clearProState() {
  await chrome.storage.local.set({
    isPro: false,
    licenseKey: "",
    licenseInstanceId: "",
    lastValidatedAt: 0
  });
}

function normalizeLicenseKey(value) {
  return String(value || "").trim();
}

function normalizeLicenseInstanceId(value) {
  return String(value || "").trim();
}

function buildInstanceName() {
  return `jobfill-${chrome.runtime.id.slice(0, 8)}-${Date.now()}`;
}

function isExpectedLemonProduct(payload) {
  const productId = String(payload && payload.meta && payload.meta.product_id ? payload.meta.product_id : "").trim();
  const variantId = String(payload && payload.meta && payload.meta.variant_id ? payload.meta.variant_id : "").trim();

  if (JOBFILL_PRODUCT_ID && productId !== String(JOBFILL_PRODUCT_ID).trim()) {
    return false;
  }

  if (JOBFILL_VARIANT_ID && variantId !== String(JOBFILL_VARIANT_ID).trim()) {
    return false;
  }

  return true;
}

function getLicenseFailureMessage(payload) {
  if (payload && payload.error) {
    return String(payload.error);
  }

  const productId = String(payload && payload.meta && payload.meta.product_id ? payload.meta.product_id : "").trim();
  const variantId = String(payload && payload.meta && payload.meta.variant_id ? payload.meta.variant_id : "").trim();

  if (JOBFILL_PRODUCT_ID && productId && productId !== String(JOBFILL_PRODUCT_ID).trim()) {
    return "This license belongs to a different product.";
  }

  if (JOBFILL_VARIANT_ID && variantId && variantId !== String(JOBFILL_VARIANT_ID).trim()) {
    return "This license belongs to a different plan or variant.";
  }

  return "";
}
