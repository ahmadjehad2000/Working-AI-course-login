# run_full.sh - Complete Platform Launcher

## Overview

The `run_full.sh` script is a streamlined launcher that starts and monitors all services required for the AI Course Platform with health checks.

**Important:** Dependencies must be installed manually before running this script. See SETUP_GUIDE.md for installation instructions.

## Features

### 🔍 Pre-Flight Checks
- **Prerequisites Verification**: Checks for Python, Node.js, npm, curl, and uvicorn
- **Environment Validation**: Ensures `.env` files exist for AI and Backend
- **OpenAI API Key Warning**: Detects placeholder API keys and warns the user

### 🚀 Smart Service Management
- **Sequential Startup**: Starts services in correct dependency order (PocketBase → AI → Backend → Frontend)
- **Health Checks**: Waits for each service to be healthy before proceeding
- **Colored Output**: Clear, color-coded status messages
- **Fixed Ports**: Uses standard ports (8090, 8000, 5001, 5173) - configurable via environment variables

### 💚 Health Monitoring
- **Continuous Monitoring**: Checks all services every 10 seconds
- **Real-time Status**: Shows timestamp of last successful health check
- **Failure Detection**: Immediately alerts if any service becomes unhealthy

### 🧹 Clean Shutdown
- **Graceful Cleanup**: Properly terminates all processes on exit
- **Ctrl+C Handling**: Safely stops all services when interrupted
- **Log Preservation**: Saves all service logs to `/tmp/` directory

## Usage

### Basic Usage

```bash
# From project root
./run_full.sh
```

That's it! The script handles everything automatically.

### Expected Output

```
[INFO] === AI Course Platform - Full Stack Launcher ===

[INFO] Checking prerequisites...
[SUCCESS] All prerequisites found
[INFO] Checking environment files...
[SUCCESS] Environment files present
[INFO] Checking and installing dependencies...
[INFO] Configuring ports...
[INFO] PocketBase will use port: 8090
[INFO] AI API will use port: 8000
[INFO] Backend will use port: 5001
[INFO] Frontend will use port: 5173

[INFO] === Starting Services ===

[INFO] Starting PocketBase database...
[INFO] Waiting for PocketBase to be healthy at http://127.0.0.1:8090/api/health...
[SUCCESS] PocketBase is healthy!
[SUCCESS] PocketBase started successfully (PID: 12345)
[INFO] Admin UI: http://127.0.0.1:8090/_/

[INFO] Starting AI Service (FastAPI)...
[INFO] Waiting for AI Service to be healthy at http://127.0.0.1:8000/health...
[SUCCESS] AI Service is healthy!
[SUCCESS] AI Service started successfully (PID: 12346)
[INFO] API Docs: http://127.0.0.1:8000/docs

[INFO] Starting Backend (Express + PocketBase)...
[INFO] Waiting for Backend to be healthy at http://127.0.0.1:5001/api/health...
[SUCCESS] Backend is healthy!
[SUCCESS] Backend started successfully (PID: 12347)
[INFO] API Swagger: http://127.0.0.1:5001/api/docs

[INFO] Starting Frontend (React + Vite)...
[INFO] Waiting for Frontend to be healthy at http://127.0.0.1:5173...
[SUCCESS] Frontend is healthy!
[SUCCESS] Frontend started successfully (PID: 12348)
[INFO] Application: http://127.0.0.1:5173

[SUCCESS] === All Services Started Successfully ===

[INFO] Service URLs:
[INFO]   🎨 Frontend:    http://127.0.0.1:5173
[INFO]   🔧 Backend:     http://127.0.0.1:5001/api/health
[INFO]   🤖 AI Service:  http://127.0.0.1:8000/docs
[INFO]   💾 PocketBase:  http://127.0.0.1:8090/_/

[INFO] Quick Test:
[INFO]   1. Open http://127.0.0.1:5173 in your browser
[INFO]   2. Register a new account with 'instructor' role
[INFO]   3. Create a course using AI generation

[INFO] Starting service health monitoring...
[INFO] Press Ctrl+C to stop all services

[SUCCESS] All services healthy [14:23:45]
[SUCCESS] All services healthy [14:23:55]
...
```

### Stopping Services

Press `Ctrl+C` to stop all services gracefully:

```
^C
[INFO] Stopping all services...
[INFO] Stopping Frontend (PID: 12348)...
[INFO] Stopping Backend (PID: 12347)...
[INFO] Stopping AI Service (PID: 12346)...
[INFO] Stopping PocketBase (PID: 12345)...
[SUCCESS] All services stopped
[INFO] Logs are available in /tmp/ directory:
[INFO]   - /tmp/pocketbase.log
[INFO]   - /tmp/ai-service.log
[INFO]   - /tmp/backend.log
[INFO]   - /tmp/frontend.log
```

## Environment Variables

### Custom Port Configuration

You can override default ports using environment variables:

```bash
# Use custom ports
POCKETBASE_PORT=9090 \
AI_API_PORT=9000 \
PORT=6001 \
FRONTEND_PORT=6173 \
./run_full.sh
```

### Python Binary

If you have multiple Python installations:

```bash
# Use specific Python binary
PYTHON_BIN=python3.11 ./run_full.sh
```

## Troubleshooting

### Issue: "Python not found"

**Solution**: Install Python 3.11 or later
```bash
# Ubuntu/Debian
sudo apt-get install python3.11

# macOS
brew install python@3.11
```

### Issue: "AI/.env not found"

**Solution**: Create the environment file
```bash
cp AI/.env.example AI/.env
# Edit AI/.env and add your OpenAI API key
nano AI/.env
```

### Issue: "PocketBase binary not found"

**Solution**: Ensure PocketBase is installed
```bash
# The binary should exist at:
ls -lh Backend/pocketbase/pocketbase

# If missing, download from:
# https://pocketbase.io/docs/
```

### Issue: "Port already in use"

The script automatically finds available ports. If you see this issue, it means all fallback ports (30+ attempts) are busy. Try:

```bash
# Check what's using the port
lsof -i:8090
lsof -i:8000
lsof -i:5001
lsof -i:5173

# Kill the process or specify different ports
POCKETBASE_PORT=8091 ./run_full.sh
```

### Issue: Service fails health check

**Solution**: Check the service logs
```bash
# View logs
tail -f /tmp/pocketbase.log
tail -f /tmp/ai-service.log
tail -f /tmp/backend.log
tail -f /tmp/frontend.log

# Common causes:
# 1. Missing OpenAI API key in AI/.env
# 2. Missing dependencies (run npm install / pip install)
# 3. Port conflicts
# 4. Database corruption (try deleting Backend/pocketbase/pb_data/data.db)
```

### Issue: OpenAI API key warning

If you see:
```
[WARNING] AI/.env contains placeholder OpenAI API key. AI service may fail.
```

**Solution**: Update your API key
```bash
nano AI/.env
# Change: OPENAI_API_KEY=sk-your-actual-api-key-here
```

## Logs

All service logs are saved to `/tmp/`:

- **PocketBase**: `/tmp/pocketbase.log`
- **AI Service**: `/tmp/ai-service.log`
- **Backend**: `/tmp/backend.log`
- **Frontend**: `/tmp/frontend.log`

View real-time logs:
```bash
tail -f /tmp/pocketbase.log
tail -f /tmp/ai-service.log
tail -f /tmp/backend.log
tail -f /tmp/frontend.log
```

## Service Startup Order

The script starts services in the correct dependency order:

1. **PocketBase** (Database) - Port 8090
   - Required by: Backend
   - Health check: `/api/health`

2. **AI Service** (FastAPI) - Port 8000
   - Required by: Backend
   - Health check: `/health`

3. **Backend** (Express) - Port 5001
   - Required by: Frontend
   - Health check: `/api/health`

4. **Frontend** (Vite) - Port 5173
   - Depends on: Backend
   - Health check: `/` (main page)

## Advanced Usage

### Running in Background

To run in background (not recommended for development):

```bash
nohup ./run_full.sh > /tmp/platform.log 2>&1 &
```

### Debug Mode

For more verbose output, modify the script temporarily or check individual service logs.

### Custom Health Check Timeouts

Edit the script to change health check behavior:

```bash
# At the top of run_full.sh
HEALTH_CHECK_TIMEOUT=30  # Increase if services are slow to start
HEALTH_CHECK_INTERVAL=2  # How often to check (seconds)
```

## What the Script Does

1. **Validates Environment**
   - Checks for required binaries (python, node, npm, curl)
   - Verifies .env files exist
   - Warns about placeholder API keys

2. **Installs Dependencies**
   - AI: `pip install -r AI/Requirements.txt`
   - Backend: `npm install` in Backend/
   - Frontend: `npm install` in FrontEnd/client/

3. **Configures Ports**
   - Finds available ports for all services
   - Sets environment variables accordingly

4. **Starts Services**
   - PocketBase: `./pocketbase serve --http 127.0.0.1:8090`
   - AI Service: `uvicorn api.app:app --host 0.0.0.0 --port 8000`
   - Backend: `npm run dev` (Vite + Express)
   - Frontend: `npm run dev` (Vite development server)

5. **Monitors Health**
   - Checks each service endpoint every 10 seconds
   - Reports status with timestamps
   - Alerts on failures

6. **Handles Shutdown**
   - Catches Ctrl+C and exit signals
   - Terminates all child processes
   - Cleans up gracefully

## Comparison with Manual Start

| Aspect | run_full.sh | Manual |
|--------|-------------|--------|
| **Setup Time** | 30-60 seconds | 5-10 minutes |
| **Terminals Required** | 1 | 4 |
| **Health Checks** | Automatic | Manual |
| **Port Conflicts** | Auto-resolved | Manual fix |
| **Dependencies** | Auto-installed | Manual install |
| **Cleanup** | Automatic | Kill each process |
| **Monitoring** | Continuous | None |
| **Logs** | Centralized in /tmp | Scattered across terminals |

## Best Practices

1. **Always check logs first** when troubleshooting
2. **Set a real OpenAI API key** before starting
3. **Use Ctrl+C to stop** instead of killing processes manually
4. **Keep the script running** in a dedicated terminal during development
5. **Monitor the health checks** to catch issues early

## Production Notes

⚠️ This script is designed for **development** use. For production:

- Use proper process managers (PM2, systemd, Docker)
- Set up reverse proxies (nginx, Apache)
- Configure proper logging (logrotate, centralized logging)
- Use environment-specific .env files
- Enable HTTPS
- Set up monitoring and alerting
- Use production-grade databases

## Support

If you encounter issues:

1. Check the service logs in `/tmp/`
2. Verify all environment variables in `.env` files
3. Ensure all ports are available
4. Review the `SETUP_GUIDE.md` for detailed setup instructions
5. Check the `FIXES_SUMMARY.md` for known issues and solutions
