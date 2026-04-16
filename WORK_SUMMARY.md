# Work Summary

## Project Overview

Job Autofill Assistant Pro is a Manifest V3 Chrome Extension designed to help users save a reusable job-application profile and autofill job forms across different ATS systems and careers portals.

## Implemented Functionality

- Built a popup-based profile editor using `popup.html`, `popup.js`, and `styles.css`
- Added a welcome-style SaaS landing view inside the popup
- Added a saved-profile dashboard view with autofill and edit actions
- Added popup-triggered autofill for the active tab using the existing content-script logic
- Added visible support contact details in the popup footer
- Stored all user profile data in `chrome.storage.local` with no backend dependency
- Added a floating `Autofill Job Application` button through `content.js`
- Added draggable floating-button behavior with persisted position across pages
- Added page-aware widget visibility so the button appears only when form fields are detected
- Added page-level dismiss behavior so users can hide the floating widget on a page when it is distracting
- Implemented smart field detection using:
  - `name`
  - `id`
  - `placeholder`
  - `aria-label`
  - label text
  - nearby prompt text
  - limited parent/container text
- Triggered `input`, `change`, and `blur` events to support React-style and dynamic forms

## Current Profile Fields

- Full name
- Email
- Phone
- Password
- Current city
- Current company
- Current role
- Date of joining
- Date of relieving
- Currently working here
- LinkedIn URL
- Portfolio URL
- About me
- Experience
- Motivation / why this job
- Expected salary
- Current salary
- Notice period
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
- City and location autofill
- Current company and current role autofill
- LinkedIn and portfolio URL autofill
- About / bio / summary autofill
- Experience autofill
- Motivation / cover-letter-style field autofill
- Current salary / expected salary / compensation / CTC mapping
- Notice period and availability mapping
- Relocation yes/no handling
- Notice-status yes/no handling
- Experience-section support for:
  - company name
  - job title
  - date of joining
  - date of relieving
  - currently working here
  - location

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
- Some `contenteditable` controls

## Reliability Improvements Made

- Removed the earlier usage limit / paywall logic
- Fixed popup errors caused by comma-formatted numbers like `40,000`
- Reduced incorrect matches caused by overly broad container text
- Added stricter intent-based matching to avoid cross-filling unrelated fields
- Prioritized company-name mapping before generic person-name mapping
- Added loading and success feedback around popup-initiated autofill
- Added graceful handling for stale content scripts after extension reloads or updates
- Added broader salary-intent recognition for phrases like:
  - salary expectations
  - compensation
  - desired salary
- Added broader relocation-intent recognition for yes/no questions and dropdowns

## Known Limitations

- Some highly custom dropdown widgets still need click-based option selection support
- Some ATS-specific composite controls may need special-case handlers
- Resume upload is not automated
- Final form submission is not automated
- Rich editors and fully custom shadow-DOM components may still require manual input

## Suggested Next Steps

- Add smarter click-selection for custom dropdown menus
- Add support for multi-entry skills fields and tag inputs
- Add education-section autofill support
- Add date-format adaptation based on field type and placeholder pattern
- Add optional inline debug mode to show which profile key matched each field
- Add a standalone `PRIVACY_POLICY.md` for Chrome Web Store submission
- Continue testing one ATS layout at a time and refine mappings incrementally

## Current Documentation Goal

This file should be updated after each meaningful implementation step so the project always has an end-to-end record of:

- what changed
- which features were added
- what problems were fixed
- what limitations still exist
- what should be built next
