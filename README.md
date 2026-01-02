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

<img width="1710" height="973" alt="Screenshot 2026-01-02 at 1 10 44 PM" src="https://github.com/user-attachments/assets/a081304c-c7ec-4a12-b340-7fa453f00750" />
<img width="1701" height="967" alt="Screenshot 2026-01-02 at 1 10 59 PM" src="https://github.com/user-attachments/assets/4e782c8e-0194-47ab-a7e0-ba2ff28313c9" />


