# 🎯 AI-Powered Resume Analyzer & Job Matching Platform

A full-stack web application that uses AI to analyze resumes, match candidates with jobs, and provide career guidance.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-20.x-green.svg)
![React](https://img.shields.io/badge/react-18.x-blue.svg)

## ✨ Features

### For Candidates
- 📄 **Resume Upload & AI Analysis** - Get instant feedback on your resume
- 🎯 **ATS Score** - Check your resume's compatibility with Applicant Tracking Systems
- 🤖 **AI Job Matching** - Find jobs that match your skills and experience
- 💬 **AI Career Advisor** - Get personalized career guidance via chat
- 📊 **Application Tracking** - Monitor your job applications
- 🔔 **Notifications** - Stay updated on new matches and application status

### For Recruiters
- 📝 **Job Posting** - Create and manage job listings
- 👥 **Candidate Matching** - Find best-fit candidates using AI
- 📅 **Interview Scheduling** - Schedule and manage interviews
- 📈 **Analytics Dashboard** - Track hiring metrics

### For Admins
- 👤 **User Management** - Manage all platform users
- 📊 **Platform Analytics** - Monitor platform-wide statistics
- ⚙️ **System Settings** - Configure platform settings

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Framer Motion** for animations
- **Lucide React** for icons
- **CSS Variables** for theming

### Backend
- **Node.js** with Express
- **Prisma ORM** with PostgreSQL
- **JWT** for authentication
- **Multer** for file uploads
- **Google Gemini AI** for AI features

### Infrastructure
- **Docker** for containerization
- **Nginx** for frontend serving
- **PostgreSQL** database

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL 15.x or higher
- Google Gemini API key

### Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/resume-analyzer.git
cd resume-analyzer
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your database and API credentials
```

4. **Setup database**
```bash
npx prisma generate
npx prisma db push
npm run db:seed  # Optional: seed with sample data
```

5. **Start backend**
```bash
npm run dev
```

6. **Install frontend dependencies** (new terminal)
```bash
cd frontend
npm install
```

7. **Start frontend**
```bash
npm run dev
```

8. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3002

### 🐳 Docker Deployment

1. **Configure production environment**
```bash
cp .env.production.example .env
# Edit .env with production values
```

2. **Build and run with Docker Compose**
```bash
docker-compose up -d --build
```

3. **Run database migrations**
```bash
docker-compose exec backend npx prisma migrate deploy
```

4. **Access the application**
- Application: http://localhost
- API: http://localhost:3002

### Docker Commands
```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# Rebuild specific service
docker-compose up -d --build backend
```

## 📁 Project Structure

```
resume-analyzer/
├── backend/
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, RBAC, error handling
│   │   ├── services/       # Business logic
│   │   └── index.js        # App entry point
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.js         # Seed data
│   └── uploads/            # Uploaded files
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   └── styles/         # CSS files
│   └── public/             # Static assets
├── docker-compose.yml      # Docker orchestration
└── README.md
```

## 🔗 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### Resumes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resumes/upload` | Upload resume |
| GET | `/api/resumes` | Get user's resumes |
| GET | `/api/resumes/:id` | Get resume details |
| DELETE | `/api/resumes/:id` | Delete resume |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | List/search jobs |
| POST | `/api/jobs` | Create job (recruiter) |
| GET | `/api/jobs/:id` | Get job details |
| PUT | `/api/jobs/:id` | Update job |

### Matching
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/match` | Get job matches |
| POST | `/api/match/:resumeId/:jobId` | Calculate match |

## 🔒 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret
GEMINI_API_KEY=your_api_key
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3002
```

## 👨‍💻 Author

**Manish Singh**

## 📄 License

This project is licensed under the MIT License.
