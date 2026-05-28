# Slam Book Social Platform

![Slam Book Banner](https://raw.githubusercontent.com/your-repo/Slam/main/assets/banner.png)

A modern **social scrapbook** where users can create personalized Slam Books, share them via unique slugs, and collect memory entries from friends.

## ✨ Features
- **Unique URL slugs** generated from the book title *and* the owner's username to avoid collisions.
- Full **CRUD** for Slam Books, questions, entries, and reports via a Django REST API.
- **Anonymous submissions** with IP‑hash rate limiting and profanity filtering.
- **PDF generation** of a compiled Slam Book (asynchronous Celery task).
- Responsive **React** frontend with theme previews and image uploads.
- Docker‑Compose setup for quick local development.

## 🔧 Tech Stack
| Layer | Technology |
|-------|------------|
| Backend | Django 5.x, Django REST Framework, Celery, Redis |
| Database | SQLite (default) or PostgreSQL |
| Frontend | React 18, Vite, Tailwind‑style utility CSS |
| DevOps | Docker, Docker‑Compose |

## 📦 Getting Started
Detailed instructions are provided in the documentation:
- **Run Guide**: [`Documentation/run.md`](Documentation/run.md) – step‑by‑step commands for the backend, frontend, Celery worker, and Docker.
- **Backend Docs**: [`Documentation/backend.md`](Documentation/backend.md)
- **Frontend Docs**: [`Documentation/frontend.md`](Documentation/frontend.md)
- **API & Model Diagrams** are included in the docs (Mermaid).

### Quick Start (TL;DR)
```bash
# Backend
python -m venv .venv && source .venv/Scripts/activate
pip install -r requirements.txt
python manage.py migrate && python manage.py createsuperuser
python manage.py runserver

# Frontend
cd Frontend && npm install && npm run dev

# Celery worker (in another terminal)
celery -A slam worker -l info
```

## 🚀 Running with Docker
```bash
docker-compose up --build   # brings up DB, Redis, backend, and frontend
```
Stop with `docker-compose down`.

## 🤝 Contributing
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/awesome-feature`).
3. Ensure code follows existing style (Black for Python, Prettier for JS).
4. Run tests (`python manage.py test`).
5. Submit a pull request.

## 📄 License
This project is licensed under the **MIT License** – see the `LICENSE` file for details.

---
