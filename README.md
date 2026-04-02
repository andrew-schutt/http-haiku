# HTTP Haiku

[![CI](https://github.com/andrew-schutt/http-haiku/actions/workflows/ci.yml/badge.svg)](https://github.com/andrew-schutt/http-haiku/actions/workflows/ci.yml)

A web application where users can submit and vote on haikus written for specific HTTP status codes. Built with Rails 8 API and React + TypeScript.

## Features

- 📝 Submit haikus for any HTTP status code (requires account; must follow 5-7-5 syllable structure)
- ✏️ Edit or delete your own haikus
- ❤️ Vote on your favorite haikus (once per session, no account required)
- 🎯 View top 20 haikus for each status code
- ✨ Daily haiku feature — a different haiku is highlighted each day
- 🔍 Browse all HTTP codes grouped by category
- 🔗 Share haikus via copy-link
- 🎨 Clean, modern UI with responsive design
- 🛡️ Admin moderation interface for managing haikus and users

## Technology Stack

### Backend
- **Rails 8** (API mode)
- **PostgreSQL** database
- **RSpec** for testing
- Session-based voting (no account required to vote)
- User accounts required to submit haikus

### Frontend
- **React 19** with TypeScript
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
│   │   ├── models/
│   │   └── services/
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
│   ├── setup-dev.sh
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

#### 2. Run dev setup
```bash
./scripts/setup-dev.sh
```
This installs backend and frontend dependencies, sets up the database, and activates the pre-commit hook (which runs RuboCop + RSpec for backend changes and ESLint + Vitest for frontend changes).

#### 3. Start the servers (two terminals)
```bash
cd backend && bin/rails server   # http://localhost:3000
cd frontend && npm run dev       # http://localhost:5173
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
POST   /api/v1/haikus               # Submit new haiku (auth required)
PATCH  /api/v1/haikus/:id           # Edit own haiku (auth required)
DELETE /api/v1/haikus/:id           # Delete own haiku (auth required)
GET    /api/v1/haikus/daily         # Haiku of the day
POST   /api/v1/haikus/:id/vote      # Upvote a haiku (session-based)
POST   /api/v1/users                # Sign up
POST   /api/v1/session              # Log in
DELETE /api/v1/session              # Log out
GET    /api/v1/users/me             # Current user (auth required)

# Admin (requires is_admin: true on the current user)
GET    /api/v1/admin/haikus         # All haikus (admin only)
DELETE /api/v1/admin/haikus/:id     # Delete any haiku (admin only)
GET    /api/v1/admin/users          # All users (admin only)
DELETE /api/v1/admin/users/:id      # Delete any user (admin only)
```

### Example API Request

**Submit a haiku (requires a logged-in session cookie):**
```bash
curl -X POST http://localhost:3000/api/v1/haikus \
  -H "Content-Type: application/json" \
  -H "Cookie: _http_haiku_session=YOUR_SESSION" \
  -d '{
    "haiku": {
      "http_code": 404,
      "content": "Page not found here\nSearching through empty folders\nSilence greets your call"
    }
  }'
```

**Vote on a haiku:**
```bash
curl -X POST http://localhost:3000/api/v1/haikus/1/vote \
  -H "Cookie: _http_haiku_session=YOUR_SESSION"
```

## Database Schema

### users
- `email` (text, unique, normalized to lowercase) - User email
- `username` (text, unique, 2–30 chars) - Display name
- `password_digest` (text) - bcrypt password hash
- `is_admin` (boolean, default false) - Admin flag

### http_codes
- `code` (integer, unique) - HTTP status code
- `description` (text) - Status description
- `category` (text) - Category (informational, success, redirection, client_error, server_error)

### haikus
- `http_code_id` (foreign key)
- `user_id` (foreign key) - Author (required)
- `content` (text, max 200 chars) - Must be exactly 3 lines in 5-7-5 syllable structure
- `author_name` (text) - Copied from `user.username` on save
- `vote_count` (integer, default 0) - Cached vote total

### votes
- `haiku_id` (foreign key)
- `session_id` (text) - Voter token (UUID) for duplicate prevention
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

1. **User accounts**: Required to submit haikus; `author_name` is always the submitter's username
2. **Session-based vote tracking**: Voting uses a `voter_token` UUID in the session cookie — prevents duplicate votes without requiring an account
3. **Seeded HTTP codes**: All standard codes (100-599) pre-populated
4. **5-7-5 syllable validation**: Enforced on both frontend and backend
5. **Counter cache**: Optimized vote counting with `counter_cache`
6. **Monorepo structure**: Single repository for easier development

## Planned Features

### Persistent Vote State
Currently, the "voted" state on haiku cards is stored in React component state and resets on page refresh. The fix is to store voted haiku IDs in `localStorage` keyed by the `voter_token` UUID (already available in the session cookie). Returning users would see their votes preserved across sessions without requiring an account.

### Shareable Haiku Cards (Open Graph)
Each haiku needs a proper OG image so that sharing a `/code/:code` URL in Slack, Twitter, or iMessage renders a rich preview card — haiku text, HTTP code, and the site name — rather than a bare link. A server-side image generation route (e.g. using a headless canvas or a service like `@vercel/og`) would auto-generate a card per haiku. This is the single highest-leverage virality feature: every "Copy link" click becomes a shareable moment.

### User Profiles
A public profile page at `/user/:username` showing:
- All haikus the poet has submitted, sorted by votes
- Total votes received across all their haikus
- Submission count and member-since date

Authors would have a reason to share their profile link; readers would have a way to follow a voice they enjoy.

### Leaderboards
A `/leaderboard` page with multiple tabs:
- **Top haikus** — highest vote counts, filterable by time period (this week / all time)
- **Top poets** — users ranked by total votes received
- **Most active codes** — HTTP codes with the most submissions

A leaderboard is inherently linkable ("look at the 418 wall of fame") and gives competitive submitters a reason to return and check standings.

### Random Code Button
A "Surprise me" button on the homepage that navigates to a random HTTP code's detail page. Discovery through randomness is an underrated mechanic — stumbling onto a great haiku for a code you'd never thought about is a delightful experience the current grid doesn't create.

### Poet Streaks
Track consecutive days a user has submitted at least one haiku. Display the current streak and longest streak on the user's profile. Loss aversion is a proven retention driver — a visible streak gives poets a daily reason to return and write before midnight.

## Future Enhancements

- [x] Edit/delete own haikus
- [x] Admin moderation interface
- [x] Social media sharing (copy link)
- [x] API rate limiting
- [x] Automated quality checks (CI pipeline: linting, tests, type-checking across backend and frontend)
- [ ] Persistent vote state across page loads
- [ ] Shareable haiku cards with Open Graph images
- [ ] User profile pages
- [ ] Leaderboards (top haikus, top poets, most active codes)
- [ ] Random code discovery button
- [ ] Poet streaks and submission tracking
- [x] Search/filter HTTP codes
- [ ] Dark mode theme

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
