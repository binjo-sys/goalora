# Goalora

**Plan. Focus. Achieve.**

Goalora is a personal life-planning and goal-tracking Progressive Web App (PWA). It helps you organize goals, categories, checklists, notes, deadlines, progress, reminders, and life plans in one place.

## Included in the first release

- Dashboard with live goal statistics
- Custom categories and nested subcategories
- Goals with progress, priority, deadlines, budgets, notes, and checklists
- Quick-add goal flow
- Search and status filtering
- Notes workspace
- Reminders and upcoming goals
- Local offline-first storage using `localStorage`
- Installable PWA on supported browsers and devices
- Responsive desktop/tablet/mobile interface
- Dark mode
- Import/export backup in JSON format

## Run locally

Because Goalora is a static web app, you can serve the project with any static server. A modern browser is recommended.

For local PWA testing, use HTTPS or localhost so the service worker can be registered.

## Install

Open the deployed Goalora site in a supported browser and choose **Install Goalora** / **Add to Home Screen**. The app is designed to work offline after its initial load.

## Project structure

```text
/
├── index.html
├── styles.css
├── app.js
├── manifest.webmanifest
├── sw.js
├── icon.svg
└── README.md
```

## Roadmap

The foundation is intentionally backend-independent so cloud authentication, synced storage, notifications, analytics, and native packaging can be added without rebuilding the user interface from scratch.
