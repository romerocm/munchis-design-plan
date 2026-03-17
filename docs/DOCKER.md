# Docker Development Guide

## Prerequisites

- [Docker Desktop](https://docs.docker.com/desktop/) installed and running
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed (`brew install supabase/tap/supabase`)

## Quick Start

### 1. Start Supabase

```bash
supabase start
```

Note the `API URL`, `anon key`, and `service_role key` from the output.

### 2. Create your .env file

```bash
./scripts/setup.sh
```

This reads credentials from your running Supabase instance and generates `.env` with Docker-compatible URLs (`host.docker.internal` instead of `localhost`).

To do it manually instead: `cp .env.example .env` and fill in values from `supabase status`.

### 3. Start the dev server

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

The app is available at http://localhost:3000.

### 4. Verify the setup

```bash
curl http://localhost:3000/api/health
```

You should see `{"status":"healthy","checks":{"supabase":"ok"}}`.

## Common Commands

```bash
# Start dev server (foreground)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Start dev server (background)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

# View logs
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f web

# Open a shell inside the container
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec web sh

# Install a new npm package
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec web npm install <package>

# Run tests
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec web npm test

# Run linter
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec web npm run lint

# Stop everything
docker compose -f docker-compose.yml -f docker-compose.dev.yml down

# Stop and remove volumes (clean reset)
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
```

## Production Build

To build and run the production image locally:

```bash
docker compose up --build
```

This uses the multi-stage Dockerfile to create an optimized production image.

## Multi-Agent Collaboration (Conductor)

Multiple Conductor agents can work on the same running Docker containers simultaneously. Here's how it works:

### How It Works

```
Agent A ──edit──┐
Agent B ──edit──┼──▶ ./src (host filesystem) ──volume mount──▶ Container (Next.js dev)
Agent C ──edit──┘                                               │
                                                                ▼
                                                          hot-reload
                                                          picks up ALL
                                                          file changes
```

1. **One running container.** Start the dev container once. All agents share it.
2. **File edits are instant.** The project directory is volume-mounted into the container. When any agent saves a file, Next.js hot-reload picks it up immediately.
3. **Shared dev server.** All agents see the same app at http://localhost:3000.
4. **Shared database.** All agents connect to the same Supabase instance.

### Setup for Multiple Agents

1. Start the infrastructure once (from any agent or terminal):
   ```bash
   supabase start
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
   ```

2. Each agent can:
   - Edit source files directly (changes appear in the running app via hot-reload)
   - Run commands inside the container:
     ```bash
     docker compose -f docker-compose.yml -f docker-compose.dev.yml exec web npm test
     docker compose -f docker-compose.yml -f docker-compose.dev.yml exec web npm run lint
     ```
   - Check app health: `curl http://localhost:3000/api/health`

### Conflict Prevention

- **File conflicts:** If two agents edit the same file, the last save wins. Git handles merge conflicts when committing.
- **Database state:** Agents share the same database. Coordinate on destructive operations like `supabase db reset`.
- **Package installs:** Run `npm install` inside the container, not on the host:
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.dev.yml exec web npm install <package>
  ```
  This ensures Linux-compatible binaries in the container's node_modules.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     HOST MACHINE (macOS)                      │
│                                                              │
│  supabase start (CLI-managed containers)                     │
│  ├── PostgreSQL 17          :54322                           │
│  ├── PostgREST (API)        :54321                           │
│  ├── GoTrue (Auth)                                           │
│  ├── Realtime                                                │
│  ├── Storage                                                 │
│  ├── Studio                 :54323                           │
│  └── Inbucket (email)       :54324                           │
│                                                              │
│  docker compose (this project)                               │
│  └── munchis-web (Next.js)  :3000                            │
│      └── connects via host.docker.internal:54321             │
└──────────────────────────────────────────────────────────────┘
```

The Next.js container connects to Supabase services through `host.docker.internal`, which resolves to the host machine on Docker Desktop (macOS/Windows).

## Troubleshooting

### "Cannot connect to the Docker daemon"

Docker Desktop is not running. Start it from your Applications folder.

### "port is already allocated" on port 3000

Something else is using port 3000. Either stop it or change the port:

```bash
# Use a different port
PORT=3001 docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Or edit the `ports` mapping in `docker-compose.dev.yml`.

### App starts but API calls fail

Supabase is probably not running:

```bash
supabase status   # Check if services are up
supabase start    # Start if needed
```

Then verify from inside the container:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec web sh
wget -qO- http://host.docker.internal:54321/rest/v1/ || echo "Supabase unreachable"
```

### Hot-reload not working

On macOS, Docker Desktop uses VirtioFS for file sharing, which should support file watching. If hot-reload stalls:

1. Check that the volume mount is correct: `docker compose -f docker-compose.yml -f docker-compose.dev.yml exec web ls /app/src`
2. Restart the container: `docker compose -f docker-compose.yml -f docker-compose.dev.yml restart web`

### node_modules issues after switching branches

If you see module-not-found errors after switching branches, rebuild:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

The `-v` flag removes the node_modules volume, forcing a fresh install.
