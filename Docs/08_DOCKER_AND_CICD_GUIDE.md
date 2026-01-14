# LeepSQL-AI Docker & CI/CD Guide

## Table of Contents
1. [Docker Overview](#docker-overview)
2. [Local Development with Docker](#local-development-with-docker)
3. [Building Docker Images](#building-docker-images)
4. [Pushing to Docker Hub](#pushing-to-docker-hub)
5. [Deploying from Docker Hub](#deploying-from-docker-hub)
6. [CI/CD Pipeline Setup](#cicd-pipeline-setup)
7. [Environment Variables](#environment-variables)
8. [Troubleshooting](#troubleshooting)

---

## Docker Overview

LeepSQL-AI uses a **2-service architecture**:

| Service | Description | Port | Technology |
|---------|-------------|------|------------|
| **frontend** | React/Vite web application served via Nginx | 80 | Node.js, Nginx |
| **agents** | AI pipeline with LangGraph for SQL generation | 8000 | Python, FastAPI |

### Project Structure
```
LeepSQL-AI/
├── docker-compose.yml        # Local development (builds from source)
├── docker-compose.hub.yml    # Production (pulls from Docker Hub)
├── docker-push.bat           # Script to push images to Docker Hub
├── .env.example              # Environment variables template
├── .dockerignore             # Files to exclude from Docker builds
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .dockerignore
└── agents/
    ├── Dockerfile
    ├── requirements.txt
    └── .dockerignore
```

---

## Local Development with Docker

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Git repository cloned locally

### Step 1: Setup Environment Variables
```bash
# Copy the example environment file
copy .env.example .env

# Edit .env and add your Google API key
GOOGLE_API_KEY=your_actual_api_key_here
```

### Step 2: Build and Run All Services
```bash
# Build and start all services
docker-compose up --build

# Run in detached mode (background)
docker-compose up --build -d
```

### Step 3: Access the Application
- **Frontend**: http://localhost:80
- **Agents API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Step 4: View Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f frontend
docker-compose logs -f agents
```

### Step 5: Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

## Building Docker Images

### Build Individual Images
```bash
# Build frontend image
docker build -t leepsql-ai-frontend ./frontend

# Build agents image
docker build -t leepsql-ai-agents ./agents
```

### Build with Custom Tags
```bash
# With version tag
docker build -t leepsql-ai-frontend:v1.0.0 ./frontend
docker build -t leepsql-ai-agents:v1.0.0 ./agents
```

### Build All Services via Compose
```bash
docker-compose build
```

---

## Pushing to Docker Hub

### Prerequisites
1. Create a [Docker Hub](https://hub.docker.com/) account
2. Login to Docker Hub locally

### Method 1: Using the Push Script (Recommended)
```bash
# Login to Docker Hub first
docker login

# Run the push script
# Usage: docker-push.bat <dockerhub-username> [version]
docker-push.bat yourusername v1.0.0

# Push with 'latest' tag
docker-push.bat yourusername
```

### Method 2: Manual Push
```bash
# Step 1: Login to Docker Hub
docker login

# Step 2: Tag your images
docker tag leepsql-ai-frontend:latest yourusername/leepsql-ai-frontend:latest
docker tag leepsql-ai-frontend:latest yourusername/leepsql-ai-frontend:v1.0.0
docker tag leepsql-ai-agents:latest yourusername/leepsql-ai-agents:latest
docker tag leepsql-ai-agents:latest yourusername/leepsql-ai-agents:v1.0.0

# Step 3: Push to Docker Hub
docker push yourusername/leepsql-ai-frontend:latest
docker push yourusername/leepsql-ai-frontend:v1.0.0
docker push yourusername/leepsql-ai-agents:latest
docker push yourusername/leepsql-ai-agents:v1.0.0
```

### Verify on Docker Hub
After pushing, your images will be available at:
- `https://hub.docker.com/r/yourusername/leepsql-ai-frontend`
- `https://hub.docker.com/r/yourusername/leepsql-ai-agents`

---

## Deploying from Docker Hub

### On Any Server with Docker
```bash
# Step 1: Create a .env file with your API key
echo "GOOGLE_API_KEY=your_api_key" > .env
echo "DOCKERHUB_USERNAME=yourusername" >> .env
echo "VERSION=latest" >> .env

# Step 2: Download the docker-compose.hub.yml file
# (or copy from repository)

# Step 3: Pull and run
docker-compose -f docker-compose.hub.yml pull
docker-compose -f docker-compose.hub.yml up -d
```

### Quick One-Liner Deploy
```bash
DOCKERHUB_USERNAME=yourusername GOOGLE_API_KEY=your_key docker-compose -f docker-compose.hub.yml up -d
```

---

## CI/CD Pipeline Setup

### GitHub Actions (Recommended)

Create `.github/workflows/docker-build.yml`:

```yaml
name: Build and Push Docker Images

on:
  push:
    branches: [main]
    tags:
      - 'v*'
  pull_request:
    branches: [main]

env:
  DOCKERHUB_USERNAME: ${{ secrets.DOCKERHUB_USERNAME }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        if: github.event_name != 'pull_request'
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Extract metadata for Frontend
        id: meta-frontend
        uses: docker/metadata-action@v5
        with:
          images: ${{ secrets.DOCKERHUB_USERNAME }}/leepsql-ai-frontend
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=sha,prefix=

      - name: Build and push Frontend
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta-frontend.outputs.tags }}
          labels: ${{ steps.meta-frontend.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Extract metadata for Agents
        id: meta-agents
        uses: docker/metadata-action@v5
        with:
          images: ${{ secrets.DOCKERHUB_USERNAME }}/leepsql-ai-agents
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=sha,prefix=

      - name: Build and push Agents
        uses: docker/build-push-action@v5
        with:
          context: ./agents
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta-agents.outputs.tags }}
          labels: ${{ steps.meta-agents.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to Production
        # Add your deployment steps here
        # Options: SSH to server, use Kubernetes, or cloud provider CLI
        run: echo "Deploy step - customize based on your hosting"
```

### Required GitHub Secrets
Go to **Repository Settings > Secrets and variables > Actions** and add:

| Secret Name | Description |
|-------------|-------------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token (create at hub.docker.com/settings/security) |
| `GOOGLE_API_KEY` | Google AI API key (for deployment) |

### How the CI/CD Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Git Push  │────▶│ GitHub      │────▶│ Build       │────▶│ Push to     │
│   to main   │     │ Actions     │     │ Docker      │     │ Docker Hub  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
                    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
                    │ Application │◀────│ Pull New    │◀────│ Deploy      │
                    │ Running     │     │ Images      │     │ Trigger     │
                    └─────────────┘     └─────────────┘     └─────────────┘
```

### Versioning Strategy

1. **Development**: Push to `main` branch → builds `main` tag
2. **Release**: Create git tag `v1.0.0` → builds `1.0.0` and `latest` tags

```bash
# Create a release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

---

## Environment Variables

### Required Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `GOOGLE_API_KEY` | agents | Google Generative AI API key |

### Optional Variables

| Variable | Service | Default | Description |
|----------|---------|---------|-------------|
| `NODE_ENV` | frontend | production | Node environment |
| `PYTHONUNBUFFERED` | agents | 1 | Python output buffering |

### Setting Environment Variables

**Local Development:**
```bash
# Create .env file in project root
GOOGLE_API_KEY=your_key_here
```

**Docker Compose:**
```yaml
# In docker-compose.yml
environment:
  - GOOGLE_API_KEY=${GOOGLE_API_KEY}
```

**Production Deployment:**
```bash
# Pass directly
docker run -e GOOGLE_API_KEY=your_key leepsql-ai-agents
```

---

## Troubleshooting

### Common Issues

#### 1. Docker Build Fails
```bash
# Clear Docker cache and rebuild
docker-compose build --no-cache
```

#### 2. Container Won't Start
```bash
# Check logs for errors
docker-compose logs agents
docker-compose logs frontend

# Check container status
docker ps -a
```

#### 3. Port Already in Use
```bash
# Find process using the port
netstat -ano | findstr :80
netstat -ano | findstr :8000

# Change ports in docker-compose.yml
ports:
  - "8081:80"  # Use 8081 instead of 80
```

#### 4. API Key Not Working
```bash
# Verify environment variable is passed
docker-compose exec agents env | grep GOOGLE

# Restart with updated .env
docker-compose down
docker-compose up -d
```

#### 5. Images Not Pushing to Docker Hub
```bash
# Re-login to Docker Hub
docker logout
docker login

# Verify image tags
docker images | grep leepsql
```

### Health Checks
```bash
# Check if services are healthy
docker-compose ps

# Test frontend
curl http://localhost:80

# Test agents API
curl http://localhost:8000/
curl http://localhost:8000/docs
```

### Clean Up Docker Resources
```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove all unused resources
docker system prune -a
```

---

## Quick Reference Commands

| Action | Command |
|--------|---------|
| Start services | `docker-compose up -d` |
| Stop services | `docker-compose down` |
| View logs | `docker-compose logs -f` |
| Rebuild | `docker-compose up --build` |
| Push to Hub | `docker-push.bat username v1.0.0` |
| Pull from Hub | `docker-compose -f docker-compose.hub.yml pull` |
| Deploy from Hub | `docker-compose -f docker-compose.hub.yml up -d` |

---

## Next Steps

1. **Set up Docker Hub account** and push your first images
2. **Configure GitHub Actions** for automated builds
3. **Choose a hosting provider** (AWS, Azure, DigitalOcean, etc.)
4. **Set up monitoring** with tools like Prometheus/Grafana
5. **Configure HTTPS** using Let's Encrypt or cloud SSL
