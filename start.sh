#!/bin/bash

# EazyStay Startup Script

echo "Starting EazyStay..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "Please edit .env file with your configuration"
fi

# Start database
echo "Starting PostgreSQL database..."
docker-compose up -d

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Initialize database
echo "Initializing database..."
cd backend
python -m app.scripts.init_db
cd ..

echo ""
echo "Setup complete!"
echo ""
echo "To run the application:"
echo "  Backend:  cd backend && uvicorn app.main:app --reload --port 8000"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "Default admin login (first user from USERS in .env):"
echo "  Username: (check .env file)"
echo "  Password: (check ADMIN_PASSWORD in .env file)"

