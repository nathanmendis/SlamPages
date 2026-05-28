# Running the Slam Project

A quick‑start guide that covers everything you need to launch the **backend**, **frontend**, and **Celery worker** on a development machine.

---

## Prerequisites

| Tool | Version (tested) |
|------|-------------------|
| **Python** | 3.11+ |
| **Node.js** | 20.x (npm 10.x) |
| **Redis** | 7.x (for Celery) |
| **Git** | any recent version |
| **Virtualenv** (optional but recommended) | `python -m venv` |
| **Docker / Docker‑Compose** (optional) | 24.x |

> The project also ships a `docker-compose.yml` you can use instead of installing each component manually.

---

## 1. Backend (Django)

```bash
# Clone the repo (if you haven't already)
git clone <repo‑url>
cd Slam

# Create a virtual environment
python -m venv .venv
source .venv/Scripts/activate   # Windows PowerShell
# .venv/bin/activate           # macOS / Linux

# Install Python dependencies
pip install -r requirements.txt

# Create a .env file (copy from .env.example if it exists)
# At minimum set:
#   SECRET_KEY=your-secret
#   DEBUG=True
#   ALLOWED_HOSTS=localhost 127.0.0.1
#   DATABASE_URL=sqlite:///db.sqlite3   # or your Postgres URL
#   REDIS_URL=redis://localhost:6379/0

# Apply migrations and create an admin user
python manage.py migrate
python manage.py createsuperuser   # follow the prompts

# Run the development server
python manage.py runserver
# The API will be available at http://localhost:8000/api/
```

### Useful Manage.py Commands

| Command | What it does |
|---------|--------------|
| `python manage.py makemigrations` | Create migration files after model changes |
| `python manage.py migrate` | Apply migrations to the DB |
| `python manage.py test` | Run the test suite |
| `python manage.py shell` | Open a Django shell |
| `python manage.py collectstatic` | Gather static files (needed for production) |

---

## 2. Frontend (React / Vite)

```bash
# From the project root
cd Frontend

# Install JS dependencies
npm install

# Start the dev server (default http://localhost:5173)
npm run dev
```

- The frontend proxies API calls to the Django backend (see `vite.config.js` for the proxy configuration).
- If you prefer Yarn: `yarn install` then `yarn dev`.

---

## 3. Celery Worker (Background Tasks)

Slam uses Celery (with Redis as the broker) for PDF generation and other async jobs.

```bash
# Make sure Redis is running (default on port 6379)
# On Windows you can use Docker:
docker run -d -p 6379:6379 redis:7-alpine

# Start the Celery worker
celery -A slam worker -l info

# (Optional) Start Celery Beat for periodic tasks
celery -A slam beat -l info
```

> **Tip:** Keep the worker in a separate terminal window so you can see task logs as they run.

---

## 4. Docker‑Compose (All‑in‑One)

If you have Docker installed, you can bring up the entire stack with a single command:

```bash
docker-compose up --build
```

This will spin up:
- **db** – PostgreSQL (or SQLite if configured)
- **redis** – broker for Celery
- **backend** – Django server (exposed on `http://localhost:8000`)
- **frontend** – Vite dev server (exposed on `http://localhost:5173`)

To stop the stack:

```bash
docker-compose down
```

---

## 5. Common Gotchas

- **Environment variables**: Ensure the `.env` file is present in `Backend/` and contains the correct `REDIS_URL`.
- **CORS**: The backend allows requests from `http://localhost:5173`. Adjust `CORS_ALLOWED_ORIGINS` if you change the frontend port.
- **File uploads**: Uploaded cover images and entry pictures are stored in `media/`. Make sure the `MEDIA_ROOT` directory exists and is writable.
- **Slug collisions**: The `SlamBook.save()` method auto‑generates a slug using the book title **and** the owner's username, guaranteeing uniqueness even when titles match.

---

## 6. TL;DR Cheat Sheet

```bash
# Backend
python -m venv .venv && source .venv/Scripts/activate
pip install -r requirements.txt
python manage.py migrate && python manage.py createsuperuser
python manage.py runserver

# Frontend
cd Frontend && npm install && npm run dev

# Celery
celery -A slam worker -l info   # (in another terminal)
```
