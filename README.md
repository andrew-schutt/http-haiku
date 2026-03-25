# HTTP Haiku

A web application where users can submit and vote on haikus written for specific HTTP status codes. Built with Rails 8 API and React + TypeScript.

## Features

- 📝 Submit haikus for any HTTP status code (must be exactly 3 lines)
- ❤️ Vote on your favorite haikus (once per session)
- 🎯 View top 20 haikus for each status code
- 🔍 Browse all HTTP codes grouped by category
- 🎨 Clean, modern UI with responsive design

## Technology Stack

### Backend
- **Rails 8** (API mode)
- **PostgreSQL** database
- **RSpec** for testing
- Session-based voting (no authentication required)

### Frontend
- **React 18** with TypeScript
- **Vite** build tool
- **React Router** for navigation
- **React Query** for API state management
- **Axios** for HTTP requests

### Deployment
- **Docker** multi-stage builds
- **Fly.io** hosting

## Project Structure

```
http-haiku/
├── backend/           # Rails 8 API
│   ├── app/
│   │   ├── controllers/api/v1/
│   │   └── models/
│   ├── config/
│   ├── db/
│   └── spec/
├── frontend/          # React + TypeScript
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── lib/
│   └── public/
├── scripts/
│   └── setup-fly.sh
├── fly.toml
├── Dockerfile
└── docker-compose.yml
```

## Getting Started

### Prerequisites

- **Ruby 3.3+**
- **Node.js 20+**
- **PostgreSQL 16+**
- **Docker** (optional, for containerized development)

### Local Development (Without Docker)

#### 1. Start PostgreSQL
Make sure PostgreSQL is running on your machine:
```bash
# macOS with Homebrew
brew services start postgresql@16

# Or check if it's already running
psql --version
```

#### 2. Setup Backend
```bash
cd backend

# Install dependencies
bundle install

# Setup database
bin/rails db:create db:migrate db:seed

# Start Rails server (runs on http://localhost:3000)
bin/rails server
```

#### 3. Setup Frontend (in a new terminal)
```bash
cd frontend

# Install dependencies
npm install

# Start dev server (runs on http://localhost:5173)
npm run dev
```

#### 4. Open Application
Navigate to http://localhost:5173 in your browser.

### Local Development (With Docker)

```bash
# Start all services
docker-compose up

# The application will be available at:
# - Frontend: http://localhost:5173
# - Backend API: http://localhost:3000
```

## API Endpoints

```
GET    /api/v1/http_codes           # All codes with top haiku each
GET    /api/v1/http_codes/:code     # Specific code with top 20 haikus
POST   /api/v1/haikus               # Submit new haiku
POST   /api/v1/haikus/:id/vote      # Upvote a haiku
```

### Example API Request

**Submit a haiku:**
```bash
curl -X POST http://localhost:3000/api/v1/haikus \
  -H "Content-Type: application/json" \
  -d '{
    "haiku": {
      "http_code": 404,
      "content": "Page not found here\nSearching through empty folders\nSilence greets your call",
      "author_name": "Code Poet"
    }
  }'
```

**Vote on a haiku:**
```bash
curl -X POST http://localhost:3000/api/v1/haikus/1/vote \
  -H "Cookie: _http_haiku_session=YOUR_SESSION"
```

## Database Schema

### http_codes
- `code` (integer, unique) - HTTP status code
- `description` (text) - Status description
- `category` (string) - Category (informational, success, redirection, client_error, server_error)

### haikus
- `http_code_id` (foreign key)
- `content` (text, max 200 chars) - Must be exactly 3 lines
- `author_name` (string, optional) - Display name or "Anonymous"
- `vote_count` (integer, default 0) - Cached vote total

### votes
- `haiku_id` (foreign key)
- `session_id` (string) - Rails session ID for duplicate prevention
- `ip_address` (inet) - Additional spam prevention
- Unique constraint on (haiku_id, session_id)

## Testing

### Backend Tests
```bash
cd backend
bundle exec rspec
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## Deployment

### Deploy to Fly.io

#### First-time setup

Run the setup script from the repo root:

```bash
./scripts/setup-fly.sh
```

The script will:
- Install the Fly CLI (if needed)
- Authenticate with Fly.io
- Create the app and provision a Postgres cluster
- Attach Postgres and set `DATABASE_URL`
- Set `SECRET_KEY_BASE`
- Deploy and seed the database

Your app will be available at `https://http-haiku.fly.dev`.

#### Subsequent deploys

```bash
fly deploy
```

#### Useful commands

```bash
fly status       # check app health
fly logs         # stream logs
fly ssh console  # open a shell on the running instance
```

## Environment Variables

### Backend (Rails)
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY_BASE` - Rails secret key
- `RAILS_ENV` - Environment (development/production)

### Frontend (React)
- `VITE_API_BASE_URL` - Backend API URL
  - Development: `http://localhost:3000`
  - Production: Your deployed backend URL

## Key Design Decisions

1. **Anonymous voting**: No user accounts required (MVP approach)
2. **Session-based tracking**: Prevents duplicate votes without authentication
3. **Seeded HTTP codes**: All standard codes (100-599) pre-populated
4. **3-line validation**: Enforced on both frontend and backend
5. **Counter cache**: Optimized vote counting with `counter_cache`
6. **Monorepo structure**: Single repository for easier development

## Future Enhancements

- [ ] User accounts with authentication
- [ ] Edit/delete own haikus
- [ ] Admin moderation interface
- [ ] Search/filter functionality
- [ ] Haiku of the day feature
- [ ] Social media sharing
- [ ] Dark mode theme
- [ ] API rate limiting
- [ ] Haiku collections/favorites

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Enjoy writing haikus for your favorite HTTP status codes!** 🎋
