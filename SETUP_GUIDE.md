# Setup Guide - AI Course Platform

This guide will help you set up and run the complete AI Course Platform with all three services: Frontend, Backend, and AI.

## Architecture Overview

The platform consists of three main services:

1. **Frontend** - React/TypeScript application (runs on port 5173 by default via Vite)
2. **Backend** - Node.js/Express API with PocketBase database (runs on port 5001)
3. **AI Service** - Python FastAPI service for course generation (runs on port 8000)

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- OpenAI API Key (for AI course generation)

## Installation - One-Time Setup

Before running the platform, install all dependencies:

### 1. Install Python Dependencies (AI Service)

```bash
cd AI
pip install -r Requirements.txt
```

**Required packages:**
- fastapi
- uvicorn
- openai
- pydantic
- pymongo
- pydantic-settings

### 2. Install Backend + Frontend Dependencies (Monorepo)

```bash
cd Backend
npm install --legacy-peer-deps
```

This installs **both** Backend and Frontend dependencies:
- Backend: Express, PocketBase SDK, authentication, etc.
- Frontend: React, Vite, TanStack Query, UI components

**Note:** The project uses a monorepo structure where Frontend is served by the Backend's Vite server.

---

## Setup Instructions

### 1. AI Service Setup

```bash
cd AI

# Install Python dependencies
pip install -r Requirements.txt

# Configure environment variables
# Edit AI/.env and add your OpenAI API key
# The file has been created with placeholder values
nano .env  # or use your preferred editor
# Update: OPENAI_API_KEY=sk-your-actual-api-key-here

# Start the AI service
uvicorn api.app:app --host 0.0.0.0 --port 8000 --reload
```

The AI service will be available at: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

### 2. Backend Setup

```bash
cd Backend

# Install Node dependencies (if not already installed)
npm install

# Environment variables are already configured in .env:
# - POCKETBASE_URL=http://127.0.0.1:8090
# - AI_API_BASE_URL=http://localhost:8000
# - PORT=5001

# Start PocketBase (database)
cd pocketbase
./pocketbase serve --http=127.0.0.1:8090
# Keep this terminal open, or run in background

# In a new terminal, start the Backend server
cd Backend
npm run dev
```

The Backend will be available at: http://localhost:5001
- API Documentation: http://localhost:5001/api/docs (Swagger)
- Health Check: http://localhost:5001/api/health

PocketBase Admin UI: http://127.0.0.1:8090/_/
- Default admin credentials are in Backend/.env

### 3. Frontend Setup

```bash
cd FrontEnd/client

# Install dependencies (if not already installed)
npm install

# Start the development server
npm run dev
```

The Frontend will be available at: http://localhost:5173

## Quick Start (All Services)

**Prerequisites:** Make sure you've completed the one-time installation steps above!

**Recommended Method**: Use the automated launcher script:

```bash
# From the project root
./run_full.sh
```

This script will:
- ✅ Check all prerequisites (Python, Node.js, npm, curl, uvicorn)
- ✅ Verify environment files exist
- ✅ Start services in the correct order: PocketBase → AI → Backend → Frontend
- ✅ Perform health checks on each service
- ✅ Monitor all services continuously (every 10 seconds)
- ✅ Provide colored output and clear status messages
- ✅ Clean up all processes on exit (Ctrl+C)
- ✅ Save all logs to /tmp/ directory

**Manual Method**: Or start services individually in separate terminals:

**Terminal 1 - PocketBase:**
```bash
cd Backend/pocketbase
./pocketbase serve --http=127.0.0.1:8090
```

**Terminal 2 - Backend API:**
```bash
cd Backend
npm run dev
```

**Terminal 3 - AI Service:**
```bash
cd AI
uvicorn api.app:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 4 - Frontend:**
```bash
cd FrontEnd/client
npm run dev
```

## Testing the Complete Flow

### 1. User Registration & Authentication

1. Open http://localhost:5173 in your browser
2. Click "Register" tab
3. Fill in the registration form:
   - First Name: Test
   - Last Name: User
   - Email: test@example.com
   - Password: Test123456!
   - Password Confirm: Test123456!
   - Role: Instructor (to create courses)
4. Click "Create Account"
5. You should be automatically logged in and redirected to the dashboard

### 2. AI Course Generation

1. Navigate to "Create Course" (available for instructors/admins)
2. In the "Generate with AI" section:
   - Enter a course topic (e.g., "Python Programming for Beginners")
   - Select difficulty level (e.g., "beginner")
3. Click "Generate with AI"
4. Wait for the AI service to generate the course outline (10-15 seconds)
5. Review the AI-generated content:
   - Quality scores
   - Module previews
   - Pre-filled form fields

### 3. Course Creation & Publishing

1. Review and edit the auto-filled course details:
   - Title
   - Overview
   - Learning Objectives
   - Duration
   - Tags
2. Toggle "Publish Course" if you want it visible immediately
3. Click "Create Course"
4. You'll be redirected to the course detail page

### 4. Viewing Courses

1. Navigate to "All Courses" from the navbar
2. You should see your created course (if published)
3. Use filters to search by:
   - Course name
   - Difficulty level
4. Click on a course to view details

## Environment Variables Reference

### AI Service (.env)
```
OPENAI_API_KEY=sk-your-api-key-here  # Required: Get from OpenAI
OPENAI_MODEL=gpt-4o                   # AI model to use
OPENAI_TIMEOUT=60                     # API timeout in seconds
MAX_TOKENS=4000                       # Max tokens per request
MONGODB_URI=mongodb://localhost:27017 # Optional: MongoDB connection
CACHE_ENABLED=true                    # Enable response caching
```

### Backend (.env)
```
POCKETBASE_URL=http://127.0.0.1:8090           # PocketBase database URL
POCKETBASE_ADMIN_EMAIL=admin@admin.com         # PocketBase admin email
POCKETBASE_ADMIN_PASSWORD=Admin123456!         # PocketBase admin password
JWT_SECRET=test_secret_key...                  # JWT signing secret
NODE_ENV=development                           # Environment
PORT=5001                                      # Backend server port
AI_API_BASE_URL=http://localhost:8000          # AI service URL
AI_API_TIMEOUT_MS=30000                        # AI service timeout
```

## Troubleshooting

### Issue: AI Service fails to start
**Solution:** Make sure you've set a valid OpenAI API key in `AI/.env`

### Issue: Backend can't connect to PocketBase
**Solution:** Ensure PocketBase is running on port 8090:
```bash
ps aux | grep pocketbase
curl http://127.0.0.1:8090/api/health
```

### Issue: Backend can't connect to AI Service
**Solution:** Check if AI service is running on port 8000:
```bash
curl http://localhost:8000/health
```

### Issue: Frontend can't authenticate
**Solution:**
1. Check Backend is running on port 5001
2. Clear browser localStorage and cookies
3. Restart the Backend service

### Issue: CORS errors in browser
**Solution:** Backend CORS is configured to allow all origins in development. If issues persist, check browser console for specific errors.

## Database Access

PocketBase provides a web UI for database management:
- URL: http://127.0.0.1:8090/_/
- Login with credentials from Backend/.env
- You can view/edit:
  - Users (app_users collection)
  - Courses
  - Modules
  - Enrollments
  - Certificates
  - Activity logs

## API Documentation

### Backend API
- Swagger UI: http://localhost:5001/api/docs
- Available endpoints:
  - `POST /api/auth/register` - User registration
  - `POST /api/auth/login` - User login
  - `GET /api/users/profile` - Get current user
  - `GET /api/courses` - List courses
  - `POST /api/courses` - Create course
  - `POST /api/ai/generate` - Generate course with AI

### AI Service API
- Interactive Docs: http://localhost:8000/docs
- Available endpoints:
  - `POST /generate` - Generate course
  - `GET /courses/{id}` - Get course by ID
  - `GET /courses` - List courses
  - `GET /health` - Health check

## Development Tips

1. **Hot Reload**: All services support hot reload in development mode
2. **Logs**: Check terminal outputs for detailed error messages
3. **Database Reset**: To reset PocketBase database, delete `Backend/pocketbase/pb_data/data.db`
4. **Cache Clear**: AI service caches responses - use `DELETE /cache` to clear

## Production Deployment Checklist

- [ ] Change JWT_SECRET to a secure random string
- [ ] Change PocketBase admin password
- [ ] Set OPENAI_API_KEY to production key
- [ ] Configure CORS with specific allowed origins
- [ ] Set up proper MongoDB instance (instead of file storage)
- [ ] Enable HTTPS for all services
- [ ] Set NODE_ENV=production
- [ ] Configure proper logging and monitoring
- [ ] Set up backup strategy for PocketBase database

## Support

For issues or questions:
1. Check the logs in each service terminal
2. Verify all environment variables are set correctly
3. Ensure all services are running on correct ports
4. Review the technical documentation in `technical_docs.js`
