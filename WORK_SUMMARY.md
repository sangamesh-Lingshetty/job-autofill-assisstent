# Work Summary

## Project Overview

Job Autofill Assistant Pro is a Manifest V3 Chrome Extension designed to help users save one reusable job-application profile and autofill job forms across different ATS systems and careers portals.

## Implemented Functionality

- Built a popup-based extension flow using `popup.html`, `popup.js`, and `popup.css`
- Reworked the popup into a single-file inline HTML + CSS design while keeping the autofill engine separate
- Simplified the popup into a compact SaaS-style control panel focused on:
  - quick autofill
  - progress stats
  - profile access
- Added a hidden free-plan daily-usage counter in popup state so usage can be limited without exposing the counter in the main UI
- Added a popup Pro-upgrade gate that appears after the free daily autofill limit is reached
- Added a popup upgrade CTA that opens the external landing page in a new browser tab
- Moved usage counting to the shared successful-autofill path so stats update whether the user starts autofill from the popup or from the floating page widget
- Added popup-triggered autofill for the active tab using the content-script engine
- Added content-widget fallback that opens the profile editor automatically when autofill is triggered without saved profile details
- Added a direct popup-to-options-page edit flow so full profile management happens in the dedicated editor page
- Removed the old popup free-plan block and heavy in-popup profile/custom-field editing UI
- Built a dedicated options-page profile editor opened from the popup in a new tab
- Added auto-save behavior in the options page so profile changes are saved while the user types or changes fields
- Added options-page custom-field management with add and delete support
- Stored all profile data in `chrome.storage.local` with no backend dependency
- Added a floating `Autofill Job Application` button through `content.js`
- Added draggable floating-button behavior with persisted position across pages
- Added page-aware widget visibility so the floating button appears only when likely autofill targets exist
- Added Workday-aware widget visibility fallback so the button can appear on Workday-style pages that use custom controls
- Added page-level dismiss behavior so users can hide the floating widget on a page when it is distracting
- Implemented smart field detection using:
  - `name`
  - `id`
  - `placeholder`
  - `aria-label`
  - label text
  - nearby prompt text
  - limited parent/container text
- Added a dedicated rule-based `FIELD_MAPPINGS` engine for deterministic field matching with no AI dependency
- Added `getFieldLabel`, `normalize`, `matchField`, and intent-detection helpers to keep field detection modular and easier to extend safely
- Split autofill execution into `handleInputs`, `handleSelects`, and `handleRadios` for cleaner architecture and easier extension
- Added MutationObserver-driven re-fill support so newly mounted React / SPA fields can be autofilled after the user starts a fill session
- Added autofill debug logs for detected labels, matched field keys, sources, and filled values in the browser console
- Added `localStorage`-backed custom field definitions with runtime add / update / delete helpers for per-site or user-defined mappings
- Added stronger ATS compatibility for Workday / Indeed / Glassdoor style forms
- Added a dedicated Workday enhancement layer on top of the generic autofill engine

## Current Profile Fields

- Full name
- Email
- Phone
- Password
- Current city / location
- Preferred location
- Current company
- Current role
- Date of joining
- Date of relieving
- Currently working here
- LinkedIn URL
- Portfolio URL
- GitHub URL
- Education
- Degree / specialization
- University / college
- Graduation year
- Professional summary / about
- Experience
- Skills
- Motivation / why this role
- Expected salary
- Current salary
- Notice period / availability
- Open to relocate
- Currently on notice period

## Autofill Logic Added So Far

- Full-name autofill for standard `Name` and `Full Name` fields
- Name-part splitting for:
  - first name
  - middle name
  - last name
- Email autofill
- Phone autofill with `+91` default prefix when missing
- WhatsApp field support by reusing the saved phone number
- Password autofill for account-creation fields on supported portals
- City and current-location autofill
- Preferred-location autofill
- Current company and current role autofill
- LinkedIn, portfolio, and GitHub URL autofill
- About / bio / summary / tell-us-about-yourself autofill
- Experience autofill
- Skills autofill
- Motivation / cover-letter-style / why-this-role autofill
- Education, degree, university, and graduation-year autofill
- Current salary / expected salary / compensation / CTC mapping
- Notice period and availability mapping
- Relocation yes/no handling
- Notice-status yes/no handling
- Native `select` dropdown autofill with closest-option matching
- Radio-group autofill with grouped option matching and selection logging
- Checkbox autofill for boolean-style fields
- Custom-field autofill priority so user-defined values can override built-in mappings
- Workday support for:
  - Workday page detection using URL, hostname, body-text, and automation-attribute signals
  - custom combobox dropdown selection with delayed option-picking retries
  - custom radiogroup handling for yes/no and similar choices
  - visible-section filling for Work Experience and Education blocks
  - step-button detection for `Next` and `Save and Continue` without auto-clicking
  - resume-upload detection logs without attempting file upload
  - observer-triggered Workday re-processing with duplicate-click safeguards
- Smart widget visibility using:
  - minimum field-count checks
  - important job-form keyword scoring
  - URL signal boosts for job / career / apply / hiring pages
  - Workday-specific custom-control detection
  - MutationObserver re-evaluation for SPA navigation

## Input Types Supported

- Text inputs
- Email inputs
- Tel inputs
- Password inputs
- Number-like inputs
- Date inputs
- Textareas
- Native `select` dropdowns
- Radio groups
- Checkboxes
- Common `role="combobox"` elements
- `role="radiogroup"` containers through grouped radio handling
- Some `contenteditable` controls

## UI / Product Changes Made Recently

- Reworked the popup into a lighter SaaS-style layout
- Rebuilt the popup UI as a dark SaaS panel with:
  - branded header
  - strong headline/subtext block
  - two KPI stat cards
  - compact profile card
  - gradient autofill CTA
  - bottom trust line
- Added an inline Pro feature card that appears only when the free daily limit is reached
- Replaced the old large popup hero copy with a compact branded header
- Added quick profile-edit access from the popup
- Kept the popup focused on:
  - autofill
  - profile summary
  - progress stats
- Moved detailed profile management out of the popup and into the options page
- Added helper copy in the options page so fields are easier to align with real ATS prompts
- Added a custom-fields button/section in the options page instead of managing them inside the popup
- Removed the popup footer trust / `Get Pro` block after the later UI revision

## Reliability Improvements Made

- Removed the earlier usage-limit / paywall logic from the active popup flow
- Reintroduced a safer popup-only daily usage cap with per-day reset logic and Pro upgrade routing
- Extended daily-limit enforcement and stats tracking to the floating page widget so both extension entry points behave consistently
- Fixed popup errors caused by comma-formatted numbers like `40,000`
- Added loading and success feedback around popup-initiated autofill
- Added graceful handling for stale content scripts after extension reloads or updates
- Added popup-side content-script recovery using `chrome.scripting` so the active tab can be reinjected automatically after an extension reload instead of requiring a manual page refresh in many cases
- Fixed the popup daily-limit reset to use the browser's local calendar day rather than UTC boundaries
- Improved the floating page widget styling and strengthened the close-button hide behavior so the dismiss action works more predictably
- Reduced incorrect matches caused by overly broad container text
- Added stricter intent-based matching to avoid cross-filling unrelated fields
- Prioritized company-name mapping before generic person-name mapping
- Added strongest-keyword-first matching to reduce false positives from generic labels like `name`
- Improved label detection using closest labels, short parent text, nearby sibling text, and limited parent text
- Added source-aware debug logs that show whether a match came from default mappings or custom fields
- Kept sample `userData` schema separate from live saved-profile autofill so production fills never inject mock values into real forms
- Preserved safer non-destructive fill behavior so already completed fields, hidden fields, and disabled fields are skipped
- Re-enabled password filling after identifying that a later field-safety gate had blocked password inputs entirely
- Softened Workday dropdown prefill behavior after it became too aggressive for some custom controls
- Added hostname-aware and structure-aware ATS compatibility hooks so Workday-like portals receive extra commit / validation events after autofill
- Added Workday widget-visibility fallback so the floating button still appears on pages that use custom combobox/radiogroup layouts instead of standard inputs

## Known Limitations

- Some highly custom dropdown widgets still need stronger click-based option selection support
- Some ATS-specific composite controls may still need special-case handlers
- Workday layouts can still vary by tenant, so some portals may need further selector tuning for custom labels, option containers, or multi-step validation behavior
- Resume upload is not automated
- Final form submission is not automated
- Rich editors and fully custom shadow-DOM components may still require manual input
- Skills/tag-input style fields may still need smarter multi-token entry handling on some portals
- Custom fields are stored in page `localStorage`, so different sites can end up with different custom-field sets unless the same definitions are added on each domain
- The current summary reflects code changes and syntax checks, but live testing is still needed on more real ATS pages, especially Workday variants

## Suggested Next Steps

- Continue testing one ATS layout at a time, especially multi-step Workday flows with required custom dropdowns and validation-driven `Next` buttons
- Add smarter click-selection for highly custom dropdown menus
- Add support for multi-entry skills fields and tag inputs
- Add date-format adaptation based on field type and placeholder pattern
- Add optional inline debug mode to show which profile key matched each field
- Expand custom-field management with editing, ordering, and validation polish inside the options page
- Add a standalone `PRIVACY_POLICY.md` for Chrome Web Store submission
- If needed, add per-ATS tuning only in compatibility layers without destabilizing the generic rule engine

## Current Documentation Goal

This file should be updated after each meaningful implementation step so the project always has an end-to-end record of:

- what changed
- which features were added
- what problems were fixed
- what limitations still exist
- what should be built next
