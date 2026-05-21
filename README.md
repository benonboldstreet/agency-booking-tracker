# Agency Booking & Shift Cover Tracker

A professional, full-stack management dashboard designed to track, schedule, and alert on agency shift cover bookings. This application lets staff coordinators log shift cover details, review active cover assignments, audit revisions, and instantly dispatch cover details via Outlook or transactional email alerts.

## 🌟 Key Features

* **Booking Management**: Record cover requests with details including Staff Name, Work Location (Service/House), Booking Date, Shift Windows (Start/End times), Shift Type (Day, Night, Half-Day), Team Leader supervisions, and reasons for cover.
* **Instant Outlook Integration**: Every booking panel contains an **Outlook Email** feature. Clicking it instantly launches your local Outlook email application with formatted shift details pre-populated, while simultaneously copying a clean-text cover sheet to your clipboard.
* **Smart Reference Generators**: Automatically builds structured internal tracking references (e.g., `BK-YMD-X`) for quick, reliable organization.
* **Live Status Progression**: Update shift cover entries through multiple stages: `Pending`, `Confirmed`, `Active`, `Complete`, or `Cancelled`.
* **Database & Fallback Sandbox**: Seamlessly connects to a Supabase database for persistent shared access, with a fully functional standalone **Local Safe Sandbox** fallback that runs offline using client-side local storage.
* **Notification System Alerts**: Optional transactional email notification integration via the Resend API to send live cover logs to supervisors.
* **Responsive Control Panel**: Access diagnostic toggles, adjust styling size for readability, and toggle modern Dyslexia-friendly typography with a single click.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### 2. Install Dependencies
Run the following command at the root directory to install required dependencies:
```bash
npm install
```

### 3. Setup Local Environment Variables
Create a `.env` file at the root of the project using the template in `.env.example`:
```env
# Resend Configuration (to send automatic shift cover alerts to supervisors)
RESEND_API_KEY="your-resend-api-key"
RESEND_TO_EMAIL="alerts@optionsempowers.org.uk"

# Supabase DB Configuration (Optional: fallback stores safely to your local web browser)
VITE_SUPABASE_URL="your-supabase-url"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### 4. Run the Development Server
Launch the full Express and Vite dev environment on port 3000:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000` to start using the system.

### 5. Build for Production
To bundle and compile both the Express backend and the React single-page frontend:
```bash
npm run build
npm start
```
Converts the code into a unified, high-performance CJS server package at `dist/server.cjs` and resources inside `dist/`.

---

## 🛠️ Tech Stack & Structure

* **Frontend**: React, TypeScript, Tailwind CSS, Lucide Icons, and Motion transitions.
* **Backend**: Node.js Express Server, TSX runtime compiler, and modern esbuild bundlers.
* **Integrations**: Standard mailto links for local desktop Outlook clients, Resend API for custom transactional email templates, and Supabase client bindings for persistent storage.
