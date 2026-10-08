# Educaro — Germany Journey Frontend

A React + Vite frontend recreated from the supplied Educaro dashboard reference image.

## Run locally

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Included interactions

- Sidebar navigation active state
- Globe View / Map View toggle
- Upload Document button opens a real file picker
- Chat quick prompts and Enter-to-send
- Responsive layout for smaller desktop widths
- No backend required

## Backend integration points

Replace the upload alert in `src/main.jsx` with your API call, and connect the chat `send()` function to your AI endpoint. The visual components are intentionally separated so API/data wiring can be added without rebuilding the UI.
