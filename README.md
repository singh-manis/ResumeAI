<![CDATA[<div align="center">

# 🎯 ResumeAI — AI-Powered Resume Analyzer & Job Matching Platform

**An intelligent full-stack platform that leverages Google Gemini AI to analyze resumes, match candidates with jobs, and accelerate the hiring process.**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Visit_Site-brightgreen?style=for-the-badge)](https://resume-analyzer-frontend.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Screenshots](#-screenshots)
- [Author](#-author)
- [License](#-license)

---

## 🔍 Overview

ResumeAI is a comprehensive career platform that bridges the gap between job seekers and recruiters using artificial intelligence. Candidates can upload their resumes for instant AI-powered analysis, receive ATS compatibility scores, get matched with relevant job opportunities, and practice for interviews with an AI mock interviewer. Recruiters can post jobs, discover top candidates through intelligent matching, schedule interviews, and communicate in real-time.

---

## ✨ Key Features

### 👤 For Candidates
| Feature | Description |
|---------|-------------|
| 📄 **Resume Upload & AI Analysis** | Upload PDF/DOCX resumes and receive detailed AI-powered feedback on content, structure, and improvements |
| 🎯 **ATS Score Calculator** | Get an Applicant Tracking System compatibility score with a detailed breakdown and actionable suggestions |
| 🏗️ **Resume Builder** | Build professional resumes from scratch with a drag-and-drop section editor |
| 🤖 **AI Job Matching** | Automatically match your resume against available jobs using AI skill/experience analysis |
| 💬 **AI Career Advisor Chat** | Get real-time career guidance, resume tips, and interview prep from an AI-powered chatbot |
| 🎤 **Mock Interview Practice** | Practice interviews with an AI interviewer that adapts questions based on your resume and target role |
| 🧠 **Skill Quiz Generator** | Generate AI-powered quizzes to test and improve your technical knowledge |
| 📊 **Application Tracker** | Monitor application statuses (Pending → Reviewed → Shortlisted → Interview → Offered) |
| 💾 **Saved Jobs** | Bookmark interesting job listings with personal notes for later review |
| 🔔 **Real-Time Notifications** | Receive instant notifications for new matches, application updates, and messages |
| 📈 **Gamification (XP & Levels)** | Earn XP for platform activities to track your engagement and progress |

### 🏢 For Recruiters
| Feature | Description |
|---------|-------------|
| 📝 **Job Posting & Management** | Create, edit, and manage job listings with detailed requirements and salary ranges |
| 👥 **AI Candidate Discovery** | Find best-fit candidates for your jobs using AI-powered resume-to-job matching |
| 📅 **Interview Scheduling** | Schedule phone, video, onsite, technical, or HR interviews with calendar integration |
| 💬 **Real-Time Messaging** | Communicate directly with candidates via Socket.IO-powered real-time chat |
| 📊 **Recruiter Analytics** | Track hiring funnel metrics, application volumes, and time-to-hire statistics |

### 🛡️ For Admins
| Feature | Description |
|---------|-------------|
| 👤 **User Management** | View, search, and manage all platform users with role-based controls |
| 📊 **Platform Analytics** | Monitor platform-wide KPIs including user growth, job postings, and engagement |
| ⚙️ **System Configuration** | Configure platform-wide settings and preferences |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** + **Vite 7** | UI framework with blazing-fast HMR |
| **React Router 7** | Client-side routing with protected routes |
| **Framer Motion** | Smooth page transitions and micro-animations |
| **Lucide React** | Premium, consistent iconography |
| **Recharts** | Interactive analytics charts and dashboards |
| **Socket.IO Client** | Real-time bidirectional communication |
| **Axios** | HTTP client with interceptors for auth token refresh |
| **CSS Variables + Glassmorphism** | Dark-themed design system with custom properties |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js** + **Express 5** | RESTful API server |
| **Prisma ORM** | Type-safe database access with migrations |
| **PostgreSQL** | Relational database for structured data |
| **Google Gemini AI** (`@google/genai`) | Resume analysis, job matching, career chat, mock interviews, quiz generation |
| **JWT** + **Refresh Tokens** | Stateless authentication with secure cookie-based refresh |
| **Passport.js** | Google OAuth 2.0 social login |
| **Multer** (Memory Storage) | File upload handling |
| **Cloudinary** | Cloud-based file storage for resumes and avatars |
| **Socket.IO** | Real-time messaging infrastructure |
| **Nodemailer** | Transactional email notifications |
| **Helmet** + **CORS** + **Rate Limiting** | Security hardening |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| **Render** | Cloud hosting (Web Service + Static Site + PostgreSQL) |
| **Cloudinary** | CDN-backed file storage |
| **GitHub** | Source control and CI/CD trigger |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│  React 19 + Vite  │  Framer Motion  │  Socket.IO Client         │
└────────────┬────────────────────────────────┬───────────────────┘
             │ HTTPS (REST API)               │ WSS (WebSocket)
             ▼                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js + Express)                 │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │  Auth    │  │  Resume  │  │  Match   │  │  Real-Time     │  │
│  │  Routes  │  │  Routes  │  │  Routes  │  │  Chat (WS)     │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────────────┘  │
│       │              │              │                            │
│  ┌────▼──────────────▼──────────────▼──────────────────────┐    │
│  │              Middleware Layer                            │    │
│  │  JWT Auth │ RBAC │ Rate Limit │ Helmet │ Error Handler  │    │
│  └─────────────────────┬───────────────────────────────────┘    │
│                        │                                        │
│  ┌─────────────────────▼───────────────────────────────────┐    │
│  │              Service Layer                              │    │
│  │  AI Service (Gemini) │ Resume Parser │ Email Service    │    │
│  └─────────────────────┬───────────────────────────────────┘    │
└────────────────────────┼────────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   ┌────────────┐ ┌────────────┐ ┌────────────┐
   │ PostgreSQL │ │ Cloudinary │ │ Google     │
   │ (Prisma)   │ │ (Files)    │ │ Gemini AI  │
   └────────────┘ └────────────┘ └────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20.x or higher
- **PostgreSQL** 15.x or higher
- **Google Gemini API Key** — [Get one here](https://aistudio.google.com/apikey)
- **Cloudinary Account** — [Sign up here](https://cloudinary.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/singh-manis/ResumeAI.git
   cd ResumeAI
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure backend environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database URL, API keys, and secrets. See [Environment Variables](#-environment-variables) for details.

4. **Setup the database**
   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed    # Optional: seed sample data
   ```

5. **Start the backend server**
   ```bash
   npm run dev        # Runs on http://localhost:3002
   ```

6. **Install frontend dependencies** (open a new terminal)
   ```bash
   cd frontend
   npm install
   ```

7. **Start the frontend dev server**
   ```bash
   npm run dev        # Runs on http://localhost:5173
   ```

8. **Open the application**
   - 🖥️ Frontend: [http://localhost:5173](http://localhost:5173)
   - ⚙️ Backend API: [http://localhost:3002/api](http://localhost:3002/api)
   - 🗄️ Database Studio: Run `npx prisma studio` in the backend directory

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_SECRET` | Secret key for access tokens (min 32 chars) | ✅ |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens (min 32 chars) | ✅ |
| `GEMINI_API_KEY` | Google Gemini AI API key | ✅ |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | ✅ |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ✅ |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ✅ |
| `FRONTEND_URL` | Frontend URL for CORS (`http://localhost:5173` for dev) | ✅ |
| `NODE_ENV` | `development` or `production` | ✅ |
| `PORT` | Server port (default: `3002`) | ❌ |
| `SMTP_HOST` | Email server host | ❌ |
| `SMTP_PORT` | Email server port | ❌ |
| `SMTP_USER` | Email account username | ❌ |
| `SMTP_PASS` | Email account password/app password | ❌ |
| `SMTP_FROM` | Sender email address | ❌ |

### Frontend (`frontend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL (`http://localhost:3002/api` for dev) | ✅ |

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/register` | Register a new user | ❌ |
| `POST` | `/api/auth/login` | Login with email/password | ❌ |
| `POST` | `/api/auth/logout` | Logout and clear refresh token | ✅ |
| `GET` | `/api/auth/me` | Get current authenticated user | ✅ |
| `POST` | `/api/auth/refresh` | Refresh access token via cookie | ❌ |

### OAuth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/oauth/google` | Initiate Google OAuth flow | ❌ |
| `GET` | `/api/oauth/google/callback` | Google OAuth callback | ❌ |

### Resumes (Candidate only)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/resumes/upload` | Upload and analyze a resume (PDF/DOCX) | ✅ |
| `GET` | `/api/resumes` | List all resumes for current user | ✅ |
| `GET` | `/api/resumes/:id` | Get resume details with skills & education | ✅ |
| `GET` | `/api/resumes/:id/analysis` | Get AI analysis and ATS score | ✅ |
| `DELETE` | `/api/resumes/:id` | Delete a resume | ✅ |

### Jobs
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/jobs` | List/search jobs with filters | ✅ |
| `POST` | `/api/jobs` | Create a new job posting (Recruiter) | ✅ |
| `GET` | `/api/jobs/:id` | Get job details | ✅ |
| `PUT` | `/api/jobs/:id` | Update a job posting | ✅ |
| `DELETE` | `/api/jobs/:id` | Delete a job posting | ✅ |
| `GET` | `/api/jobs/my-jobs` | Get recruiter's own job postings | ✅ |
| `POST` | `/api/jobs/:id/apply` | Apply for a job | ✅ |
| `GET` | `/api/jobs/my-applications` | Get candidate's applications | ✅ |
| `POST` | `/api/jobs/:id/toggle-active` | Toggle job active status | ✅ |

### AI Matching
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/match/resume/:resumeId` | Match a resume against all active jobs | ✅ |
| `POST` | `/api/match/job/:jobId` | Find matching candidates for a job | ✅ |
| `GET` | `/api/match/results/:resumeId` | Get match results for a resume | ✅ |
| `GET` | `/api/match/candidates/:jobId` | Get matched candidates for a job | ✅ |
| `GET` | `/api/match/detail/:matchId` | Get detailed match analysis | ✅ |

### Interviews
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/interviews` | List interviews | ✅ |
| `POST` | `/api/interviews` | Schedule an interview | ✅ |
| `PATCH` | `/api/interviews/:id` | Update interview details | ✅ |
| `DELETE` | `/api/interviews/:id` | Cancel an interview | ✅ |
| `GET` | `/api/interviews/stats/upcoming` | Get upcoming interviews | ✅ |

### AI Features
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/ai/enhance` | AI text enhancement | ✅ |
| `POST` | `/api/quiz/generate` | Generate AI skill quizzes | ✅ |
| `POST` | `/api/quiz/submit` | Submit quiz answers for grading | ✅ |
| `POST` | `/api/interviews/start` | Start an AI mock interview session | ✅ |
| `POST` | `/api/interviews/chat` | Continue an AI mock interview | ✅ |

### Messaging
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/messages/conversations` | Get all conversations | ✅ |
| `POST` | `/api/messages/start` | Start a new conversation | ✅ |
| `GET` | `/api/messages/:id/messages` | Get messages in a conversation | ✅ |
| `POST` | `/api/messages/:id/messages` | Send a message | ✅ |

### Other Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `PUT` | `/api/users/me` | Update user profile | ✅ |
| `POST` | `/api/users/me/avatar` | Upload avatar image | ✅ |
| `PUT` | `/api/users/me/password` | Change password | ✅ |
| `GET` | `/api/analytics/candidate` | Candidate analytics | ✅ |
| `GET` | `/api/analytics/recruiter` | Recruiter analytics | ✅ |
| `GET` | `/api/analytics/admin` | Admin analytics | ✅ |
| `GET` | `/api/gamification/stats` | Get XP, level, and streak | ✅ |
| `GET` | `/api/notifications` | Get notifications | ✅ |
| `GET` | `/api/saved-jobs` | Get saved jobs | ✅ |
| `GET` | `/api/health` | Health check | ❌ |

---

## 📁 Project Structure

```
ResumeAI/
├── backend/
│   ├── src/
│   │   ├── config/            # Passport OAuth & Cloudinary configuration
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Auth, RBAC, file upload, error handling
│   │   ├── routes/            # Express route definitions (16 modules)
│   │   ├── services/          # AI service, resume parser, email service
│   │   ├── sockets/           # Socket.IO event handlers
│   │   ├── templates/         # Email HTML templates
│   │   ├── utils/             # Helper utilities
│   │   └── index.js           # Application entry point
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema (15+ models)
│   │   └── seed.js            # Database seeder
│   ├── testing_scripts/       # Standalone test scripts & logs
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── common/        # Buttons, inputs, modals
│   │   │   ├── dashboard/     # Dashboard widgets
│   │   │   └── layout/        # Navbar, sidebar, page layouts
│   │   ├── contexts/          # React Context providers (Auth)
│   │   ├── pages/
│   │   │   ├── LandingPage    # Public landing page with animations
│   │   │   ├── auth/          # Login & registration
│   │   │   ├── candidate/     # 12 candidate pages
│   │   │   ├── recruiter/     # 5 recruiter pages
│   │   │   └── admin/         # 3 admin pages
│   │   ├── services/          # Axios API client with interceptors
│   │   └── styles/            # Global CSS with design tokens
│   ├── public/                # Static assets & images
│   └── package.json
│
├── docs/
│   └── DEPLOYMENT_RENDER.md   # Step-by-step Render deployment guide
├── .env.production.example    # Production env template
├── .gitignore
└── README.md
```

---

## 🚢 Deployment

This project is deployed on **[Render](https://render.com)** using three services:

| Service | Type | Root Directory |
|---------|------|---------------|
| **PostgreSQL** | Managed Database | — |
| **Backend API** | Web Service | `backend` |
| **Frontend** | Static Site | `frontend` |

### Quick Deploy Steps

1. Push your code to GitHub.
2. On Render, create a **PostgreSQL** database and copy the Internal Database URL.
3. Create a **Web Service** for the backend:
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `npm start`
   - Add all environment variables (see [Environment Variables](#-environment-variables))
4. Create a **Static Site** for the frontend:
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Set `VITE_API_URL` to your backend URL + `/api`
   - Add a Rewrite Rule: `/*` → `/index.html` (for React Router)
5. Update the backend's `FRONTEND_URL` with the live frontend URL and redeploy.

> 📖 For detailed instructions, see [`docs/DEPLOYMENT_RENDER.md`](docs/DEPLOYMENT_RENDER.md)

---

## 📸 Screenshots

> _Screenshots can be added here to showcase the UI._

| Page | Description |
|------|-------------|
| Landing Page | Animated hero section with feature carousel |
| Candidate Dashboard | Overview with ATS scores, matches, and activity |
| Resume Analysis | Detailed AI analysis with improvement suggestions |
| Job Matching | AI-powered job recommendations with match scores |
| Recruiter Dashboard | Hiring pipeline with candidate discovery |
| Real-Time Chat | Instant messaging between candidates and recruiters |

---

## 👨‍💻 Author

**Manish Singh**

- GitHub: [@singh-manis](https://github.com/singh-manis)

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ using React, Node.js, and Google Gemini AI**

</div>
]]>
