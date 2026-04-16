# 🚀 Job Autofill Assistant Pro

Job Autofill Assistant Pro is a Chrome Extension that helps users autofill job application forms instantly using a locally stored profile.

It removes repetitive typing and speeds up job applications across multiple websites.

---

## ✨ Features

* ⚡ One-click autofill for job applications
* 🧠 Smart field detection (name, email, salary, notice period, etc.)
* 📝 Save your profile once and reuse everywhere
* 🌐 Works across multiple job portals and ATS platforms
* 🎯 Supports text inputs, dropdowns, radio buttons, and more
* 🔒 100% local storage (no backend, no servers)

---

## 🧠 How It Works

1. Install the extension
2. Complete the profile setup
3. Open any job application page
4. Click **⚡ Autofill Job Application**
5. Fields are automatically filled

---

## 📦 Supported Autofill Fields

* **Identity** → Name, Email, Phone
* **Profile** → City, Company, Role, Experience
* **Compensation** → Salary, Expected CTC, Notice Period
* **Preferences** → Relocation, Notice Status
* **Links** → LinkedIn, Portfolio
* **Experience Section** → Company, Job Title, Dates

---

## 🏗️ Project Structure

```
├── manifest.json        # Extension configuration
├── popup.html           # Popup UI
├── popup.js             # Popup logic & state management
├── content.js           # Autofill engine & field detection
├── styles.css           # UI styles
├── WORK_SUMMARY.md      # Development notes
```

---

## 🔐 Security

* All user data is stored locally using `chrome.storage.local`
* No external servers or APIs are used
* No analytics, tracking scripts, or third-party SDKs
* No remote code execution
* Autofill runs only on user action

---

## 🛡️ Privacy

* User data stays entirely on the user's device
* No personal data is collected or transmitted externally
* No tracking of browsing history or activity
* Form data is read only for local autofill matching
* Users can edit or delete their data anytime

---

## 🔑 Permissions

* `storage` → Store user profile locally
* `activeTab` → Access current tab for autofill
* `<all_urls>` → Enable autofill across websites

Permissions are used strictly for autofill functionality.

---

## 🚫 What This Extension Does NOT Do

* ❌ Does NOT collect or sell user data
* ❌ Does NOT track user activity
* ❌ Does NOT send data to external servers
* ❌ Does NOT auto-submit job applications
* ❌ Does NOT bypass authentication

---

## 📌 Notes

* Works best with standard form fields
* Some custom forms may need manual input
* Unknown fields are skipped safely

---

## 🧪 Chrome Web Store Compliance

* Single-purpose: Autofill job application forms
* No remote code usage
* Fully user-triggered functionality
* Transparent data handling

---

## 📧 Support

For feedback or support:

📩 [sangameshlingshetty@gmail.com](mailto:sangameshlingshetty@gmail.com)

---

## 🚀 Summary

Job Autofill Assistant Pro is a lightweight, privacy-focused productivity tool that helps users apply to jobs faster by eliminating repetitive form filling.

Simple. Fast. Secure.
