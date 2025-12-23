<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# BFit
A modern workout tracking app with guided logging, progress analytics, and an AI-powered coach.

## Overview
BFit helps you plan and log workouts, track progress over time, and stay consistent with reminders. It includes curated training programs, detailed session logging, and a performance coach powered by Gemini.

## Features
- Workout logging with sets, reps, weight, duration, and notes
- Program templates (Upper/Lower, PPL, Arnold, Jeff Nippard, CBUM) and freestyle sessions
- Dashboard summary with recent activity and quick actions
- Progress analytics and weekly reports
- AI Coach for training guidance and feedback
- Daily workout reminders and local notifications
- Shareable workout history views
- Firebase authentication and cloud-synced history

## Tech Stack
- React + TypeScript + Vite
- Firebase Auth + Firestore
- Google Gemini API for AI coaching
- Tailwind-style utility classes in CSS

## Getting Started
**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. (Optional) Create a `.env.local` file and add your keys (see below).
3. Start the dev server:
   `npm run dev`

## Environment Variables
Create `.env.local` in the project root if you want to override defaults or enable AI features:

```
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

Notes:
- AI Coach requires `VITE_GEMINI_API_KEY`.
- Firebase variables are optional for local testing because defaults are included, but you should set your own for production.

## Scripts
- `npm run dev` - Start the development server
- `npm run build` - Create a production build
- `npm run preview` - Preview the production build locally

## Project Structure
- `App.tsx` - Main application layout and view routing
- `components/` - UI views and feature modules
- `services/` - Firebase, storage, AI coach, and notification logic
- `public/` - Static assets

## Deployment
Build with `npm run build` and deploy the `dist/` folder to your hosting provider. If you use Firebase Hosting, update `firebase.json` as needed and deploy with the Firebase CLI.
