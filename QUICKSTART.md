# Quick Start Guide

## Prerequisites Check

Before starting, ensure you have either:
- **Option A**: PostgreSQL installed locally, OR
- **Option B**: Docker installed and running

## Option A: Local PostgreSQL

### 1. Install PostgreSQL (if not installed)
```bash
# macOS
brew install postgresql@16
brew services start postgresql@16

# Ubuntu/Debian
sudo apt-get install postgresql-16
sudo systemctl start postgresql
```

### 2. Start Backend
```bash
cd backend

# Create and setup database
bin/rails db:create db:migrate db:seed

# Start Rails server
bin/rails server
# Server runs on http://localhost:3000
```

### 3. Start Frontend (new terminal)
```bash
cd frontend

# Start Vite dev server
npm run dev
# Server runs on http://localhost:5173
```

### 4. Open Browser
Navigate to http://localhost:5173

## Option B: Docker

### 1. Start Docker Desktop
Make sure Docker Desktop is running.

### 2. Start All Services
```bash
# From project root
docker-compose up

# Or run in background
docker-compose up -d
```

### 3. Open Browser
Navigate to http://localhost:5173

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Stop Services
```bash
docker-compose down

# Remove volumes (reset database)
docker-compose down -v
```

## Testing the Application

### 1. View HTTP Codes
- Homepage shows all HTTP status codes grouped by category
- Each card shows the top-voted haiku for that code

### 2. Submit a Haiku
- Click any HTTP code card
- Scroll to "Submit Your Haiku" form
- Enter 3 lines of text (e.g.):
  ```
  Status code speaks
  Silent errors in the night
  Response comes at dawn
  ```
- Optionally add your name
- Click "Submit Haiku"

### 3. Vote on Haikus
- Click the ❤️ button on any haiku
- Vote count increases
- You can only vote once per haiku per session

### 4. Browse Categories
- 1xx Informational
- 2xx Success
- 3xx Redirection
- 4xx Client Error
- 5xx Server Error

## Troubleshooting

### "Connection refused" errors
- Make sure backend is running on port 3000
- Check: `curl http://localhost:3000/up` should return "ok"

### "No haikus yet"
- Database might not be seeded
- Run: `cd backend && bin/rails db:seed`

### Frontend can't connect to backend
- Check `.env.development` has correct API URL
- Verify CORS is configured (already done in backend/config/initializers/cors.rb)

### Port already in use
```bash
# Kill process on port 3000 (backend)
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

## Default Credentials

No authentication is required! The app uses session-based voting:
- Anonymous haiku submission
- Session-tracked voting (one vote per haiku)

## Next Steps

1. Test submitting haikus for different HTTP codes
2. Try voting on multiple haikus
3. Check that you can't vote twice on the same haiku
4. Verify the top haiku shows on the homepage

Enjoy! 🎋
