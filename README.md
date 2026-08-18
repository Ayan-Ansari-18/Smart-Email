<div align="center">
  
# 📧 SmartMail

**An Intelligent AI Email Assistant that Automates Your Life**

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-darkblue.svg)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Powered_by-Gemini_AI-orange.svg)](https://deepmind.google/technologies/gemini/)

</div>

<br/>

SmartMail is an AI-powered email assistant that declutters your inbox. Using Google's Gemini AI, it automatically scans your emails in the background to extract tasks, upcoming events, and bills into a beautiful, unified dashboard. Stop digging through long threads and let AI organize your life!

## ✨ Features

- **🧠 AI Task Extraction:** Automatically pulls action items, deadlines, and assignments from long email threads.
- **📅 Calendar Event Sync:** Detects meetings, flights, and appointments and structures them for easy tracking.
- **💳 Bill Tracking:** Identifies invoices, receipts, and subscriptions so you never miss a payment.
- **✉️ Auto-Replies:** Drafts smart, context-aware replies to your emails that you can review and send with one click.
- **👥 Multi-Account Support:** Connect multiple Google accounts and seamlessly switch between them using the intuitive dashboard.
- **⚡ Background Processing:** Built with BullMQ for high-performance background sync, processing up to 100,000 emails smoothly without slowing down your experience.

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Framer Motion, React Router, React Query
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL, Prisma ORM
- **Queue System:** BullMQ (Redis)
- **AI Integration:** Google Gemini API
- **Authentication:** Passport.js (Google OAuth 2.0)

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/)
- [Redis](https://redis.io/) (Required for background queues)

### 1. Clone the repository
```bash
git clone https://github.com/Ayan-Ansari-18/Smart-Email.git
cd Smart-Email
```

### 2. Install Dependencies
You need to install dependencies for both the frontend and backend.
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Variables
In the `backend` directory, create a `.env` file based on `.env.example`:
```bash
cd backend
cp .env.example .env
```
Fill in the `.env` file with your actual credentials:
- `DATABASE_URL`: Your PostgreSQL connection string.
- `REDIS_URL`: Your Redis connection string (e.g., `redis://localhost:6379`).
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Get these from the Google Cloud Console.
- `GOOGLE_REDIRECT_URI`: Set to `http://localhost:5000/api/auth/google/callback`.
- `GEMINI_API_KEY`: Get this from Google AI Studio.
- `JWT_SECRET`: A secure random string.

### 4. Database Setup
Run the Prisma migrations to set up your PostgreSQL database:
```bash
cd backend
npx prisma migrate dev --name init
```

### 5. Run the Application
You can run the full stack simultaneously from the root directory if you set up a concurrent script, or run them in separate terminals:

**Backend (Terminal 1):**
```bash
cd backend
npm run dev
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173`.

## 🔒 Security
Your data is processed securely via OAuth 2.0. The application only extracts strictly necessary information for dashboard organization. All sensitive `.env` files and API keys are ignored from version control to prevent leaks.

## 📄 License
This project is licensed under the MIT License.
