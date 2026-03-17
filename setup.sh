#!/bin/bash

# Chat App Setup Script
# This script automates the setup process for local development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}======================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}======================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed"
        return 1
    fi
    print_success "$1 is installed"
    return 0
}

# Main setup
main() {
    print_header "🚀 Chat App Setup"

    # Check prerequisites
    print_header "Checking Prerequisites"
    
    if check_command "node"; then
        NODE_VERSION=$(node -v)
        print_info "Node version: $NODE_VERSION"
    else
        print_error "Please install Node.js from https://nodejs.org"
        exit 1
    fi

    if check_command "npm"; then
        NPM_VERSION=$(npm -v)
        print_info "npm version: $NPM_VERSION"
    else
        print_error "npm should be installed with Node.js"
        exit 1
    fi

    # Optional checks
    if check_command "git"; then
        print_info "Git is available"
    fi

    if check_command "docker"; then
        print_info "Docker is available (optional)"
    fi

    if check_command "mongod"; then
        print_info "MongoDB is installed locally"
        MONGODB_LOCAL=true
    else
        print_warning "MongoDB is not installed locally (using MongoDB Atlas is recommended)"
        MONGODB_LOCAL=false
    fi

    # Setup backend
    print_header "Setting up Backend"

    if [ ! -d "server" ]; then
        print_error "server directory not found"
        exit 1
    fi

    print_info "Installing backend dependencies..."
    cd server

    if [ ! -f "package.json" ]; then
        print_error "package.json not found in server directory"
        exit 1
    fi

    npm install
    print_success "Backend dependencies installed"

    # Create .env file
    if [ ! -f ".env" ]; then
        print_info "Creating .env file..."
        cp .env.example .env

        # Update .env with development values
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' 's|MONGODB_URI=.*|MONGODB_URI=mongodb://localhost:27017/chat-app|' .env
        else
            # Linux
            sed -i 's|MONGODB_URI=.*|MONGODB_URI=mongodb://localhost:27017/chat-app|' .env
        fi

        print_success ".env file created"
        print_info "Please edit server/.env and update these values if needed:"
        echo "  - MONGODB_URI (if using remote MongoDB)"
        echo "  - JWT_SECRET (change to a random value)"
        echo "  - CLIENT_URL (if frontend is on different port)"
    else
        print_warning ".env file already exists, skipping creation"
    fi

    cd ..

    # Setup frontend
    print_header "Setting up Frontend"

    if [ ! -d "client" ]; then
        print_error "client directory not found"
        exit 1
    fi

    print_info "Installing frontend dependencies..."
    cd client

    if [ ! -f "package.json" ]; then
        print_error "package.json not found in client directory"
        exit 1
    fi

    npm install
    print_success "Frontend dependencies installed"

    cd ..

    # Database setup
    print_header "Database Setup"

    if [ "$MONGODB_LOCAL" = true ]; then
        print_info "MongoDB is installed locally"
        print_info "Make sure MongoDB is running: mongod"
    else
        print_warning "MongoDB is not installed locally"
        print_info "Options:"
        echo "  1. Install MongoDB locally from https://www.mongodb.com/docs/manual/installation/"
        echo "  2. Use MongoDB Atlas (free): https://www.mongodb.com/atlas"
        echo ""
        echo "If using MongoDB Atlas:"
        echo "  1. Create a free account at https://www.mongodb.com/atlas"
        echo "  2. Create a cluster"
        echo "  3. Get the connection string"
        echo "  4. Update MONGODB_URI in server/.env"
    fi

    # Setup complete
    print_header "✅ Setup Complete"

    echo -e "\n${GREEN}Next steps:${NC}\n"
    echo "1. ${YELLOW}Start MongoDB${NC} (if using local):"
    echo "   ${BLUE}mongod${NC}"
    echo ""
    echo "2. ${YELLOW}Start Backend${NC} (in another terminal):"
    echo "   ${BLUE}cd server && npm run dev${NC}"
    echo ""
    echo "3. ${YELLOW}Start Frontend${NC} (in another terminal):"
    echo "   ${BLUE}cd client && python -m http.server 3000${NC}"
    echo "   ${BLUE}# or: npx http-server public -p 3000${NC}"
    echo ""
    echo "4. ${YELLOW}Open in Browser${NC}:"
    echo "   ${BLUE}http://localhost:3000${NC}"
    echo ""
    echo -e "\n${YELLOW}Using Docker?${NC}\n"
    echo "Install Docker and Docker Compose, then run:"
    echo "   ${BLUE}docker-compose up${NC}"
    echo ""
    echo -e "\n${YELLOW}Useful Commands:${NC}\n"
    echo "Backend:"
    echo "  ${BLUE}cd server && npm run dev${NC}       - Start development server"
    echo "  ${BLUE}cd server && npm test${NC}         - Run tests"
    echo "  ${BLUE}cd server && npm run lint${NC}     - Run linter"
    echo ""
    echo "Frontend:"
    echo "  ${BLUE}cd client && python -m http.server 3000${NC}  - Start dev server"
    echo ""
    echo "Docker:"
    echo "  ${BLUE}docker-compose up${NC}          - Start all services"
    echo "  ${BLUE}docker-compose down${NC}        - Stop all services"
    echo "  ${BLUE}docker-compose logs${NC}        - View logs"
    echo ""
    echo -e "\n${YELLOW}Documentation:${NC}\n"
    echo "  ${BLUE}README.md${NC}           - Complete documentation"
    echo "  ${BLUE}QUICKSTART.md${NC}       - Quick setup guide"
    echo "  ${BLUE}DEPLOYMENT.md${NC}       - Deployment guide"
    echo "  ${BLUE}TESTING.md${NC}          - Testing guide"
    echo ""
    echo -e "${GREEN}Happy coding! 🚀${NC}\n"
}

# Run main function
main "$@"
