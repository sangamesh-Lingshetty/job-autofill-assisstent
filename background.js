chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) {
    return false;
  }

  if (message.type === "JAA_OPEN_OPTIONS_PAGE") {
    chrome.runtime.openOptionsPage()
      .then(() => {
        sendResponse({ ok: true });
      })
      .catch((error) => {
        sendResponse({
          ok: false,
          message: String((error && error.message) || "Unable to open profile editor.")
        });
      });

    return true;
  }

  if (message.type === "JAA_OPEN_UPGRADE_PAGE") {
    chrome.tabs.create({ url: "https://www.deeplock.tech/auto-fill-job" })
      .then(() => {
        sendResponse({ ok: true });
      })
      .catch((error) => {
        sendResponse({
          ok: false,
          message: String((error && error.message) || "Unable to open upgrade page.")
        });
      });

    return true;
  }

  return false;
});
