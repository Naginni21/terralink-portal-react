# Local Development Setup

## Requirements
- Python 3.12+
- Node.js 18+
- No Docker needed!

## Quick Start

### 1. Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment (first time only)
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your local settings
```

### 2. Frontend Setup
```bash
# In project root
npm install

# Create .env.local
cp .env.example .env.local
# Edit with your settings
```

### 3. Run Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Access Points
- Frontend: http://localhost:6001
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Database
- **Local**: SQLite (auto-created as `backend/terralink.db`)
- **No PostgreSQL needed locally!**
- Database viewer: [DB Browser for SQLite](https://sqlitebrowser.org/)

## Environment Variables

### Backend (.env)
```env
DEBUG=true
DATABASE_URL=sqlite+aiosqlite:///./terralink.db
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
ALLOWED_ORIGINS=["http://localhost:6001"]
COOKIE_SECURE=false  # Important for localhost
SECRET_KEY=dev-secret-key
JWT_SECRET=dev-jwt-secret
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-client-id
```

## Common Tasks

### Reset Database
```bash
cd backend
rm terralink.db
python -c "from app.db.base import init_db; import asyncio; asyncio.run(init_db())"
```

### Run Database Migrations
```bash
cd backend
alembic upgrade head
```

### Install New Package
```bash
# Backend
cd backend && source venv/bin/activate
pip install package-name
pip freeze > requirements.txt

# Frontend
npm install package-name
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Kill process on port 6001
lsof -ti:6001 | xargs kill -9
```

### Python Version Issues
Use pyenv or asdf to manage Python versions:
```bash
pyenv install 3.12.0
pyenv local 3.12.0
```

### Virtual Environment Issues
```bash
# Recreate virtual environment
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## VS Code Setup

### Recommended Extensions
- Python
- Pylance
- Black Formatter
- ESLint
- Prettier

### Settings (.vscode/settings.json)
```json
{
  "python.defaultInterpreterPath": "./backend/venv/bin/python",
  "python.formatting.provider": "black",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": false,
  "python.linting.flake8Enabled": true
}
```

## No Docker Needed! 🎉
This setup is simpler, faster, and easier to debug than Docker for local development.