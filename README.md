## Docker Compose Deployment

### Prerequisites
- Docker
- Docker Compose

### Quick Start
```bash
# Clone repository
git clone <repo-url>
cd SCDProject25

# Start services
docker-compose up -d

# Access the application
# Option 1: CLI Interface
docker-compose exec backend node main.js

# Option 2: Web Interface
# Open browser: http://localhost:3000

# View logs
docker-compose logs -f

# Stop services
docker-compose down
