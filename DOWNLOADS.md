# Goalora installation

Goalora is built as an installable Progressive Web App.

## Phone

Open the published Goalora website in a supported mobile browser. Use the browser's **Install app** or **Add to Home Screen** action.

## Desktop

Open Goalora in a supported Chromium-based browser and use the browser's **Install Goalora** action when it appears.

## Offline use

After the first successful load, the service worker caches the app shell so Goalora can continue working offline. Your goals and notes are stored on the device in browser storage.

## Moving to a new device

Use **Settings → Export backup** on the old device and **Settings → Import backup** on the new device.

## Native packages

The project is deliberately kept as a PWA first. Android APK, Windows installer, macOS package, and store distribution can be packaged from this same codebase later without changing the Goalora data model.
