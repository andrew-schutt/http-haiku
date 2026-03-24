# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

HTTP Haiku is a monorepo with a Rails 8 JSON API backend and a React + TypeScript frontend. Users browse HTTP status codes, submit haikus for each code, and upvote favorites. Voting is session-based (no authentication).

## Commands

### Backend (`cd backend`)

```bash
bundle exec rspec                          # run all tests
bundle exec rspec spec/models/haiku_spec.rb  # run a single spec file
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

**Routes**: All API routes are namespaced under `/api/v1`. The `http_codes` resource uses `only: [:index, :show]` with `param: :code` so the route param is the HTTP status integer (e.g. `/api/v1/http_codes/404`), not the record id. The `haikus` resource uses `only: [:create]` with a `post :vote` member route.

**CORS**: Configured in `config/initializers/cors.rb` to allow `localhost:5173` with `credentials: true` (required for session cookies to work cross-origin).

### Frontend

React + TypeScript with Vite. `src/lib/api.ts` is the single Axios client — all API calls go through it. React Query (TanStack Query) manages server state with a 5-minute stale time.

**CSS**: All global styles live in `src/App.css`, which is imported in `src/App.tsx`. `src/index.css` contains only base resets. When adding or editing CSS, always verify the stylesheet is imported in the component tree — Vite only bundles CSS files that are explicitly imported.

`axios.isAxiosError(error)` is used in `onError` callbacks to safely narrow error types — never use `any` for caught errors.

TypeScript is configured with `verbatimModuleSyntax`, so all type-only imports must use `import type { ... }`.

### Testing

- Request specs test all 4 endpoints; models specs cover validations and associations
- `ActiveRecord::RecordNotFound` is caught by Rails middleware in request specs — test with `have_http_status(:not_found)`, not `raise_error`
- To simulate a new browser session in a request spec: `cookies.delete("_http_haiku_session")`
- Factories use `sequence(:code)` starting at 201 for `http_code` to avoid uniqueness collisions

## Key constraints

- `NEVER modify the Gemfile, Rails configuration or initializers, nor RSpec configuration or test support files.`
- Use `text` for all string columns in migrations, never `string` or `varchar`
- Use `datetime` instead of `timestamp` in migrations
- Use `params.expect(...)` for strong parameters, not `params.require(...).permit(...)`
