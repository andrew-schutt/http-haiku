# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Parallel feature development

**Always use a git worktree for each feature when working in parallel.** Never run two Claude Code sessions in the same working directory simultaneously — edits will silently overwrite each other.

```bash
# Start a new feature
git worktree add ../http-haiku-<feature-name> -b <feature-name>
# Open that directory in the second Claude Code session

# Clean up after merging
git worktree remove ../http-haiku-<feature-name>
git branch -d <feature-name>

# List active worktrees
git worktree list
```

## What this project is

HTTP Haiku is a monorepo with a Rails 8 JSON API backend and a React + TypeScript frontend. Users sign up, browse HTTP status codes, submit haikus for each code, and upvote favorites. Submitting haikus requires authentication; voting uses a session-based `voter_token` (so anonymous users can vote without an account).

## Commands

### Backend (`cd backend`)

```bash
bundle exec rspec                          # run all tests
bundle exec rspec spec/models/haiku_spec.rb  # run a single spec file
bundle exec rspec spec/services/haiku_check_spec.rb  # run a single spec file
bin/rails db:create db:migrate db:seed    # first-time setup
bin/rails db:migrate                      # run pending migrations
bin/rails server                          # start API on http://localhost:3000
bin/rails console
```

### Frontend (`cd frontend`)

```bash
npm run dev      # start dev server on http://localhost:5173
npm run build    # type-check + production build
npm run lint     # ESLint
npm run format   # Prettier auto-format all src files
npm run test     # Vitest with coverage
```

### Start Postgres (macOS)

```bash
brew services start postgresql@16
```

## Architecture

### Backend

Rails 8 in `api_only` mode. Session and cookie middleware are manually added in `config/application.rb` (not included by default in API mode):

```ruby
config.middleware.use ActionDispatch::Cookies
config.middleware.use ActionDispatch::Session::CookieStore, key: "_http_haiku_session"
```

**Vote tracking** uses a `voter_token` stored in the session (`session[:voter_token] ||= SecureRandom.uuid`) rather than `session.id`, because the session ID isn't reliably set until the session is written to. The token is stored in the `votes.session_id` column.

**Counter cache**: `Vote belongs_to :haiku, counter_cache: :vote_count` keeps `haikus.vote_count` in sync automatically — never set `vote_count` directly.

**Authentication**: Users register via `POST /api/v1/users` and log in via `POST /api/v1/session`. The session stores `session[:user_id]`. `GET /api/v1/users/me` returns the current user. Submitting a haiku (`POST /api/v1/haikus`) requires authentication; the `author_name` is always set from `current_user.username`.

**Routes**: All API routes are namespaced under `/api/v1`. The `http_codes` resource uses `only: [:index, :show]` with `param: :code` so the route param is the HTTP status integer (e.g. `/api/v1/http_codes/404`), not the record id. The `haikus` resource uses `only: [:create, :update, :destroy]` with a `get :daily` collection route and a `post :vote` member route. The frontend route for a code detail page is `/code/:code` (singular, no trailing 's').

**Admin**: Admin routes live under `/api/v1/admin` and are protected by a `require_admin` before_action that checks `current_user.is_admin?`. The `is_admin` boolean column on `users` defaults to false and must be set manually in the Rails console. Admin controllers live in `app/controllers/api/v1/admin/`. The frontend `AdminPage` (`src/pages/AdminPage.tsx`) is accessible at `/admin` and is only rendered for authenticated admin users.

**CORS**: Configured in `config/initializers/cors.rb` to allow `localhost:5173` with `credentials: true` (required for session cookies to work cross-origin).

**Services**: `app/services/haiku_check.rb` validates 5-7-5 syllable structure. Called from the `must_follow_syllable_structure` validation on `Haiku`. Interface: `HaikuCheck.new(content).valid?` / `.error_message`.

### Frontend

React + TypeScript with Vite. `src/lib/api.ts` is the single Axios client — all API calls go through it. React Query (TanStack Query) manages server state with a 5-minute stale time.

**CSS**: All global styles live in `src/App.css`, which is imported in `src/App.tsx`. `src/index.css` contains only base resets. When adding or editing CSS, always verify the stylesheet is imported in the component tree — Vite only bundles CSS files that are explicitly imported.

`axios.isAxiosError(error)` is used in `onError` callbacks to safely narrow error types — never use `any` for caught errors.

TypeScript is configured with `verbatimModuleSyntax`, so all type-only imports must use `import type { ... }`.

### Testing

- Request specs cover: http_codes (index/show), haikus (create/update/destroy/vote/daily), users (create/me), sessions (create/destroy), admin haikus (index/destroy), admin users (index/destroy)
- Model specs cover: Haiku, HttpCode, Vote, User validations and associations
- Services spec covers HaikuCheck syllable validation
- `ActiveRecord::RecordNotFound` is caught by Rails middleware in request specs — test with `have_http_status(:not_found)`, not `raise_error`
- To simulate a new browser session in a request spec: `cookies.delete("_http_haiku_session")`
- Factories use `sequence(:code) { |n| 200 + n }` for `http_code` — the sequence counter starts at 1, so the first generated code is 201, avoiding collision with codes created directly in tests

## Rails conventions

- Follow the Rails convention of "fat model, skinny controller" — business logic belongs in models or service objects, not controllers
- Use Rails' built-in ActiveRecord query interface; never write raw SQL unless absolutely necessary (use `.where`, `.find_by`, `.exists?`, etc.)
- Prefer declarative validations in models (`validates :field, presence: true`) over manual checks in controllers
- Use `before_action` callbacks for shared setup (e.g., `set_haiku`) and `rescue_from` in ApplicationController for shared error handling
- Prefer symbols for HTTP status codes in `render` calls (`:ok`, `:created`, `:unprocessable_entity`) — never use raw integers
- Use `respond_to` blocks only when needed; for API-only controllers, `render json:` is fine directly
- Scope ActiveRecord queries with named scopes on the model rather than inline `.where` chains in controllers
- Avoid `update_attribute` (skips validations); use `update` or `update!` instead
- Use `find` (raises) vs `find_by` (returns nil) intentionally — prefer `find` when the record must exist
- Keep callbacks (`before_save`, `after_create`, etc.) minimal and side-effect-free; prefer explicit service calls for complex logic

## After making changes

Always run formatters and the relevant test suite before committing:

- Backend changes: `bundle exec rubocop -a && bundle exec rspec` (from `backend/`)
- Frontend changes: `npm run format && npm run test` (from `frontend/`)

## Key constraints

- `NEVER modify the Gemfile, Rails configuration or initializers, nor RSpec configuration or test support files.`
- Use `text` for all string columns in migrations, never `string` or `varchar`
- Use `datetime` instead of `timestamp` in migrations
- Use `params.expect(...)` for strong parameters, not `params.require(...).permit(...)`
