#!/bin/bash

# ============================================
# LeepSQL-AI Docker Hub Push Script
# ============================================
# This script builds and pushes all Docker images to Docker Hub
# Usage: ./docker-push.sh <dockerhub-username>
# Example: ./docker-push.sh myusername

set -e

# Configuration
DOCKERHUB_USERNAME=${1:-"your-dockerhub-username"}
PROJECT_NAME="leepsql-ai"
VERSION=${2:-"latest"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  LeepSQL-AI Docker Hub Push Script${NC}"
echo -e "${GREEN}============================================${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if username is provided
if [ "$DOCKERHUB_USERNAME" == "your-dockerhub-username" ]; then
    echo -e "${RED}Error: Please provide your Docker Hub username${NC}"
    echo -e "${YELLOW}Usage: ./docker-push.sh <dockerhub-username> [version]${NC}"
    echo -e "${YELLOW}Example: ./docker-push.sh myusername v1.0.0${NC}"
    exit 1
fi

echo -e "${YELLOW}Docker Hub Username: ${DOCKERHUB_USERNAME}${NC}"
echo -e "${YELLOW}Version Tag: ${VERSION}${NC}"
echo ""

# Login to Docker Hub
echo -e "${GREEN}Step 1: Logging into Docker Hub...${NC}"
docker login

# Build and push Frontend
echo -e "${GREEN}Step 2: Building Frontend image...${NC}"
docker build -t ${DOCKERHUB_USERNAME}/${PROJECT_NAME}-frontend:${VERSION} ./frontend
docker tag ${DOCKERHUB_USERNAME}/${PROJECT_NAME}-frontend:${VERSION} ${DOCKERHUB_USERNAME}/${PROJECT_NAME}-frontend:latest

echo -e "${GREEN}Pushing Frontend image...${NC}"
docker push ${DOCKERHUB_USERNAME}/${PROJECT_NAME}-frontend:${VERSION}
docker push ${DOCKERHUB_USERNAME}/${PROJECT_NAME}-frontend:latest

# Build and push Backend
echo -e "${GREEN}Step 3: Building Backend image...${NC}"
docker build -t ${DOCKERHUB_USERNAME}/${PROJECT_NAME}-backend:${VERSION} ./backend
docker tag ${DOCKERHUB_USERNAME}/${PROJECT_NAME}-backend:${VERSION} ${DOCKERHUB_USERNAME}/${PROJECT_NAME}-backend:latest

echo -e "${GREEN}Pushing Backend image...${NC}"
docker push ${DOCKERHUB_USERNAME}/${PROJECT_NAME}-backend:${VERSION}
docker push ${DOCKERHUB_USERNAME}/${PROJECT_NAME}-backend:latest

# Build and push Agents
echo -e "${GREEN}Step 4: Building Agents image...${NC}"
docker build -t ${DOCKERHUB_USERNAME}/${PROJECT_NAME}-agents:${VERSION} ./agents
docker tag ${DOCKERHUB_USERNAME}/${PROJECT_NAME}-agents:${VERSION} ${DOCKERHUB_USERNAME}/${PROJECT_NAME}-agents:latest

echo -e "${GREEN}Pushing Agents image...${NC}"
docker push ${DOCKERHUB_USERNAME}/${PROJECT_NAME}-agents:${VERSION}
docker push ${DOCKERHUB_USERNAME}/${PROJECT_NAME}-agents:latest

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  All images pushed successfully! 🎉${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${YELLOW}Your images are now available at:${NC}"
echo -e "  - ${DOCKERHUB_USERNAME}/${PROJECT_NAME}-frontend:${VERSION}"
echo -e "  - ${DOCKERHUB_USERNAME}/${PROJECT_NAME}-backend:${VERSION}"
echo -e "  - ${DOCKERHUB_USERNAME}/${PROJECT_NAME}-agents:${VERSION}"
echo ""
echo -e "${YELLOW}To pull and run on another machine:${NC}"
echo -e "  docker pull ${DOCKERHUB_USERNAME}/${PROJECT_NAME}-frontend"
echo -e "  docker pull ${DOCKERHUB_USERNAME}/${PROJECT_NAME}-backend"
echo -e "  docker pull ${DOCKERHUB_USERNAME}/${PROJECT_NAME}-agents"
