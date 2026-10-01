# CodeReview AI

An AI-assisted code review system that lets you upload code files, browse them, and get detailed AI-powered review comments — powered by a local LM Studio model.

---

## Features

- 📁 **Drag-and-drop upload** — drop a `.zip` archive or individual code files
- 🗂️ **File browser** — navigate your uploaded project's directory tree
- 🖥️ **Syntax-highlighted viewer** — view any file with full language-aware highlighting (25+ languages)
- 🤖 **AI code review** — get structured feedback on quality, bugs, performance, security, and style
- 🌙 **Dark theme** — clean, responsive UI

---

## Tech Stack

| Layer     | Technology              |
|-----------|-------------------------|
| Frontend  | React 19 + Vite         |
| Backend   | Python Flask            |
| AI        | LM Studio (local LLM)   |
| Container | Docker + Docker Compose |

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+ (for local dev)
- [Python](https://python.org/) 3.11+ (for local dev)
- [LM Studio](https://lmstudio.ai/) running locally on port `1234`
- [Docker](https://www.docker.com/) + Docker Compose (for containerized run)

---

## Quick Start — Local Development

### 1. Start LM Studio

Open LM Studio, load any model, and start the **Local Server** on port `1234` (default).

### 2. Backend

```bash
cd backend

# (Optional) create a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

# (Optional) copy and edit environment variables
copy .env.example .env

python app.py
```

The backend will be available at `http://localhost:5000`.

### 3. Frontend

```bash
cd frontend
npm install       # skip if already installed
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## Quick Start — Docker

> Make sure LM Studio is running on your machine before starting the containers.

```bash
# From the project root
docker-compose up --build
```

| Service  | URL                    |
|----------|------------------------|
| Frontend | http://localhost       |
| Backend  | http://localhost:5000  |

To stop:
```bash
docker-compose down
```

To stop and remove uploaded data:
```bash
docker-compose down -v
```

---

## Environment Variables

Create a `.env` file in `backend/` (copy from `.env.example`):

| Variable        | Default                    | Description                        |
|-----------------|----------------------------|------------------------------------|
| `LM_STUDIO_URL` | `http://127.0.0.1:1234`    | URL of the LM Studio local server  |
| `FLASK_ENV`     | `development`              | Flask environment mode             |
| `FLASK_PORT`    | `5000`                     | Port the backend listens on        |

When running via Docker Compose, `LM_STUDIO_URL` defaults to `http://host.docker.internal:1234` so the container can reach LM Studio on your host machine.

---

## API Reference

| Method   | Endpoint        | Description                               |
|----------|-----------------|-------------------------------------------|
| `POST`   | `/api/upload`   | Upload a `.zip` or code file              |
| `GET`    | `/api/files`    | List files in a session                   |
| `GET`    | `/api/file`     | Get file content + detected language      |
| `POST`   | `/api/review`   | Run AI review on a file                   |
| `DELETE` | `/api/session`  | Delete a session and its uploaded files   |

---

## Project Structure

```
code-review/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileTree.jsx       # Collapsible file browser
│   │   │   ├── CodeViewer.jsx     # Syntax-highlighted code view
│   │   │   └── ReviewPanel.jsx    # AI review display
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx    # Upload page
│   │   │   └── ReviewPage.jsx     # 3-panel review page
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── vite.config.js
├── backend/
│   ├── app.py                     # Flask API
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Usage

1. Open the app in your browser
2. Drag & drop a `.zip` of your project (or individual code files) onto the upload zone
3. Click **Upload & Review**
4. Use the **file browser** on the left to navigate your files
5. Click any file to view it with syntax highlighting
6. Click **Run AI Review** to get feedback from your local LM Studio model
7. Review comments appear in the right panel, organized by category

---

## Troubleshooting

**LM Studio not responding:**
- Make sure LM Studio's local server is running (green indicator in the app)
- Verify it's listening on port `1234`
- Check that at least one model is loaded

**Docker: can't reach LM Studio:**
- The compose file uses `host.docker.internal` to reach the host. This works on Docker Desktop (Windows/Mac). On Linux, ensure `extra_hosts: host.docker.internal:host-gateway` is supported by your Docker version (v20.10+).

**File not displaying:**
- Files over 1MB are not displayed (backend limit)
- Binary files (images, compiled artifacts) are not supported
