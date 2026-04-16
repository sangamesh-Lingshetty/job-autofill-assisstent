# Job Autofill Assistant Pro

Job Autofill Assistant Pro is a Chrome Extension built with Manifest V3 that stores a candidate profile locally and autofills job application forms across different ATS and careers portals.

## Features

- Saves profile data in `chrome.storage.local` only
- Includes profile fields for full name, email, phone, password, city, current company, current role, joining date, relieving date, LinkedIn, portfolio, about, experience, motivation, salary, notice period, and yes/no preferences
- Shows a SaaS-style popup experience with a welcome screen, setup flow, saved-profile dashboard, and edit mode
- Lets the user trigger autofill directly from the popup on the current page
- Injects a floating `Autofill Job Application` button on every page as an additional on-page entry point
- Detects field intent using combined context from `name`, `id`, `placeholder`, `aria-label`, label text, and parent container text
- Handles text inputs, textareas, number inputs, date inputs, checkboxes, dropdowns, combobox-style controls, and yes/no radio groups
- Supports first name, middle name, last name, company name, job title, location, joining date, relieving date, and currently-working experience fields
- Maps broader hiring terminology such as `salary expectations`, `desired salary`, `compensation`, `notice period`, and relocation questions
- Reuses the saved phone number for WhatsApp-style form fields when needed
- Adds a default `+91` country code to phone-based fields when missing
- Triggers `input`, `change`, and `blur` events for modern dynamic forms
- Uses no backend, no login, no usage limit, and no paywall

## Files

- `manifest.json`: Extension metadata and content script registration
- `popup.html`: Popup welcome view, dashboard, editor, and support footer
- `popup.js`: Popup state management, storage, autofill trigger flow, and form hydration logic
- `content.js`: Smart detection engine, autofill logic, floating button, and feedback
- `styles.css`: Trusted SaaS-style popup design and injected UI styles
- `WORK_SUMMARY.md`: Ongoing implementation summary and feature log

## How To Load In Chrome

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select `d:\others\autoFillform`

## How To Use

1. Open the extension popup
2. Click `Start Setup`
3. Fill in your profile details and save the profile
4. Open any job application page
5. Click `Autofill Current Page` from the popup, or use the floating `Autofill Job Application` button on the page
6. Edit the saved profile anytime from the popup dashboard

## Supported Autofill Areas

- Identity fields such as full name, first name, middle name, last name, email, and phone
- Job profile fields such as current company, current role, city, experience, and motivation
- Compensation fields such as current salary, expected salary, compensation expectation, CTC, and notice period
- Experience-section fields such as company name, job title, joining date, relieving date, currently working here, and location
- Account-creation fields such as password on job portals that ask users to create an account during application
- Preference fields such as relocation and current notice-period status
- Link fields such as LinkedIn and portfolio URLs

## Security

- The extension stores data locally in `chrome.storage.local` and does not send profile data to any backend or external API
- The project does not include analytics, tracking scripts, remote code loading, or third-party SDKs
- Autofill runs only when the user explicitly clicks the popup autofill button or the floating autofill button
- Unknown fields are skipped to reduce accidental page modifications
- The extension requests only the permissions needed for local storage and content-script execution
- No payment flow, subscription system, or hidden background data collection is included

## Privacy

- User profile information remains on the user's device inside Chrome extension storage
- No resume, form content, credentials, or personal data is transmitted to a remote server by this codebase
- The extension reads page form metadata only for local field detection and autofill matching
- Password data, if saved by the user, is also stored locally in the browser and is not uploaded by this extension
- Users can update or clear saved profile information at any time by editing the popup fields or removing the extension storage

## Chrome Web Store Review Notes

- This extension is a local productivity tool for autofilling job application forms
- It does not scrape accounts, bypass authentication, or automate form submission
- It does not collect, sell, or transfer personal or sensitive user data to external services
- It does not use remote hosted code; all logic is bundled in the extension files in this repository
- It requires user interaction to perform autofill and does not run silent background submissions
- If published, the Web Store listing should clearly disclose that the extension reads form labels and input metadata on job-application pages in order to match and fill saved local profile data

## Policy Guidance For Publishing

- Provide a privacy policy that states profile data is stored locally and not transmitted to a backend
- Describe the purpose of the `<all_urls>` content-script match clearly in the listing, since the extension needs to detect job-application forms across many sites
- Explain that autofill is user-triggered and limited to form assistance, not automatic submission
- Disclose that optional password autofill exists only for user-saved account-creation fields on supported job portals
- Keep screenshots and store description aligned with the actual local-only behavior of the extension

## Notes

- Unknown fields are skipped so the page is not disturbed
- Matching is keyword-based and designed for real-world form variations, but highly custom widgets may still need manual input
- All data remains in the browser via local extension storage
- The popup includes a visible support contact: `sangameshlingshetty@gmail.com`
- If the extension was just reloaded or updated, refresh any already-open job page once before using autofill
