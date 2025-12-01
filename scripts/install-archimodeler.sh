#!/usr/bin/env bash

# ArchiModeler Installation Script
# Inspired by Proxmox VE Helper-Scripts (https://community-scripts.github.io/ProxmoxVE/)
# This script automates the installation of ArchiModeler on a Debian/Ubuntu system

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script variables
SCRIPT_NAME="ArchiModeler Installer"
SCRIPT_VERSION="1.0.0"
PROJECT_DIR="/opt/archimodeler"
GIT_REPO_URL="https://github.com/gloret29/archimodeler.git"
BRANCH="main"

# Configuration variables (will be set interactively)
DB_HOST=""
DB_PORT="5432"
DB_NAME="archimodeler"
DB_USER=""
DB_PASSWORD=""
DB_LOCAL=false
API_PORT="3001"
WEB_PORT="3000"
DOMAIN_NAME=""
USE_SSL=false
JWT_SECRET=""

# Functions
header() {
    clear
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}                                                              ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}          ${GREEN}${SCRIPT_NAME} v${SCRIPT_VERSION}${NC}                    ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}                                                              ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

msg_info() {
    echo -e "${BLUE}ℹ${NC} ${1}"
}

msg_ok() {
    echo -e "${GREEN}✓${NC} ${1}"
}

msg_warn() {
    echo -e "${YELLOW}⚠${NC} ${1}"
}

msg_error() {
    echo -e "${RED}✗${NC} ${1}"
}

msg_step() {
    echo -e "\n${MAGENTA}▶${NC} ${1}\n"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        msg_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Check system requirements
check_system() {
    msg_step "Checking system requirements..."
    
    # Check OS
    if [[ ! -f /etc/os-release ]]; then
        msg_error "Cannot detect operating system"
        exit 1
    fi
    
    source /etc/os-release
    if [[ "$ID" != "debian" && "$ID" != "ubuntu" ]]; then
        msg_warn "This script is designed for Debian/Ubuntu. Proceeding anyway..."
    else
        msg_ok "OS detected: $PRETTY_NAME"
    fi
    
    # Check available disk space (at least 5GB)
    AVAILABLE_SPACE=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
    if [[ $AVAILABLE_SPACE -lt 5 ]]; then
        msg_error "Insufficient disk space. At least 5GB required, found ${AVAILABLE_SPACE}GB"
        exit 1
    fi
    msg_ok "Disk space: ${AVAILABLE_SPACE}GB available"
    
    # Check RAM (at least 2GB)
    TOTAL_RAM=$(free -g | awk '/^Mem:/{print $2}')
    if [[ $TOTAL_RAM -lt 2 ]]; then
        msg_warn "Low RAM detected: ${TOTAL_RAM}GB (2GB+ recommended)"
    else
        msg_ok "RAM: ${TOTAL_RAM}GB"
    fi
}

# Interactive configuration
interactive_config() {
    msg_step "Configuration"
    
    # PostgreSQL location
    echo ""
    echo -e "${CYAN}PostgreSQL Configuration:${NC}"
    echo "Where is PostgreSQL installed?"
    echo "  1) On this container/server (local)"
    echo "  2) On another container/server (remote)"
    read -p "Select option [1-2] (default: 1): " DB_LOCATION_CHOICE
    DB_LOCATION_CHOICE=${DB_LOCATION_CHOICE:-1}
    
    if [[ "$DB_LOCATION_CHOICE" == "2" ]]; then
        DB_LOCAL=false
        read -p "PostgreSQL host/IP: " DB_HOST
        while [[ -z "$DB_HOST" ]]; do
            msg_error "PostgreSQL host cannot be empty"
            read -p "PostgreSQL host/IP: " DB_HOST
        done
    else
        DB_LOCAL=true
        DB_HOST="localhost"
    fi
    
    read -p "PostgreSQL port [5432]: " DB_PORT
    DB_PORT=${DB_PORT:-5432}
    
    read -p "Database name [archimodeler]: " DB_NAME
    DB_NAME=${DB_NAME:-archimodeler}
    
    read -p "PostgreSQL user: " DB_USER
    while [[ -z "$DB_USER" ]]; do
        msg_error "PostgreSQL user cannot be empty"
        read -p "PostgreSQL user: " DB_USER
    done
    
    read -sp "PostgreSQL password: " DB_PASSWORD
    echo ""
    while [[ -z "$DB_PASSWORD" ]]; do
        msg_error "PostgreSQL password cannot be empty"
        read -sp "PostgreSQL password: " DB_PASSWORD
        echo ""
    done
    
    # Test database connection
    msg_info "Testing database connection..."
    if command -v psql &> /dev/null; then
        if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1;" &> /dev/null; then
            msg_ok "Database connection successful"
        else
            msg_warn "Cannot connect to database. Please ensure PostgreSQL is running and credentials are correct."
            read -p "Continue anyway? [y/N]: " CONTINUE
            if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    else
        msg_warn "psql not found. Skipping connection test."
    fi
    
    # API Configuration
    echo ""
    echo -e "${CYAN}API Configuration:${NC}"
    read -p "API port [3001]: " API_PORT
    API_PORT=${API_PORT:-3001}
    
    read -p "Web port [3000]: " WEB_PORT
    WEB_PORT=${WEB_PORT:-3000}
    
    # Domain/URL Configuration
    echo ""
    echo -e "${CYAN}Domain/URL Configuration:${NC}"
    read -p "Domain name or IP address (leave empty for IP only): " DOMAIN_NAME
    
    if [[ -n "$DOMAIN_NAME" ]]; then
        read -p "Use SSL/HTTPS? [y/N]: " SSL_CHOICE
        if [[ "$SSL_CHOICE" =~ ^[Yy]$ ]]; then
            USE_SSL=true
        fi
    fi
    
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    msg_ok "JWT secret generated"
    
    # Summary
    echo ""
    echo -e "${CYAN}Configuration Summary:${NC}"
    echo "  PostgreSQL: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
    echo "  API Port: ${API_PORT}"
    echo "  Web Port: ${WEB_PORT}"
    if [[ -n "$DOMAIN_NAME" ]]; then
        echo "  Domain: ${DOMAIN_NAME}"
        echo "  SSL: ${USE_SSL}"
    fi
    echo ""
    read -p "Continue with installation? [Y/n]: " CONFIRM
    if [[ "$CONFIRM" =~ ^[Nn]$ ]]; then
        msg_info "Installation cancelled"
        exit 0
    fi
}

# Install system dependencies
install_dependencies() {
    msg_step "Installing system dependencies..."
    
    export DEBIAN_FRONTEND=noninteractive
    
    msg_info "Updating package list..."
    apt-get update -qq
    
    msg_info "Installing packages..."
    apt-get install -y -qq \
        curl \
        wget \
        git \
        build-essential \
        ca-certificates \
        gnupg \
        lsb-release \
        postgresql-client \
        docker.io \
        docker-compose \
        nginx \
        certbot \
        python3-certbot-nginx \
        openssl \
        > /dev/null 2>&1
    
    msg_ok "System dependencies installed"
}

# Install Node.js
install_nodejs() {
    msg_step "Installing Node.js..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        msg_info "Node.js already installed: $NODE_VERSION"
        
        # Check if version is 18+
        NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v\([0-9]*\).*/\1/')
        if [[ $NODE_MAJOR -ge 18 ]]; then
            msg_ok "Node.js version is compatible"
            return
        else
            msg_warn "Node.js version is too old. Installing Node.js 20.x..."
        fi
    fi
    
    msg_info "Adding NodeSource repository..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    
    msg_info "Installing Node.js 20.x..."
    apt-get install -y -qq nodejs > /dev/null 2>&1
    
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    msg_ok "Node.js $NODE_VERSION installed (npm $NPM_VERSION)"
}

# Configure Docker
configure_docker() {
    msg_step "Configuring Docker..."
    
    if systemctl is-active --quiet docker; then
        msg_ok "Docker is already running"
    else
        msg_info "Starting Docker..."
        systemctl enable docker > /dev/null 2>&1
        systemctl start docker > /dev/null 2>&1
        msg_ok "Docker started"
    fi
}

# Prepare database
prepare_database() {
    msg_step "Preparing database..."
    
    if [[ "$DB_LOCAL" == "true" ]]; then
        msg_info "PostgreSQL is local. Please ensure the database and user are created."
        msg_info "If not, run these commands:"
        echo ""
        echo "  sudo -u postgres psql"
        echo "  CREATE DATABASE ${DB_NAME};"
        echo "  CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';"
        echo "  GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
        echo "  \\c ${DB_NAME}"
        echo "  GRANT ALL ON SCHEMA public TO ${DB_USER};"
        echo "  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};"
        echo "  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};"
        echo ""
        read -p "Press Enter when the database is ready..."
    else
        msg_info "PostgreSQL is remote. Please ensure:"
        msg_info "  1. The database '${DB_NAME}' exists"
        msg_info "  2. The user '${DB_USER}' exists and has permissions"
        msg_info "  3. PostgreSQL accepts remote connections (listen_addresses = '*')"
        msg_info "  4. pg_hba.conf allows connections from this host"
        echo ""
        read -p "Press Enter when the database is ready..."
    fi
    
    # Test connection again
    msg_info "Testing database connection..."
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &> /dev/null; then
        msg_ok "Database connection successful"
    else
        msg_error "Cannot connect to database. Please check your configuration."
        exit 1
    fi
}

# Clone and setup project
setup_project() {
    msg_step "Setting up project..."
    
    if [[ -d "$PROJECT_DIR" ]]; then
        msg_warn "Directory $PROJECT_DIR already exists"
        read -p "Remove and reinstall? [y/N]: " REINSTALL
        if [[ "$REINSTALL" =~ ^[Yy]$ ]]; then
            msg_info "Removing existing installation..."
            rm -rf "$PROJECT_DIR"
        else
            msg_info "Using existing installation"
            return
        fi
    fi
    
    msg_info "Creating project directory..."
    mkdir -p "$PROJECT_DIR"
    
    msg_info "Cloning repository..."
    git clone -b "$BRANCH" "$GIT_REPO_URL" "$PROJECT_DIR" > /dev/null 2>&1
    msg_ok "Repository cloned"
    
    cd "$PROJECT_DIR"
    
    # Modify docker-compose.yml to exclude PostgreSQL if remote
    if [[ "$DB_LOCAL" == "false" ]]; then
        msg_info "Modifying docker-compose.yml for remote PostgreSQL..."
        sed -i '/^  postgres:/,/^    volumes:/d' docker-compose.yml
        sed -i '/^  postgres_data:/d' docker-compose.yml
        sed -i 's/^volumes:$/volumes:\n  # postgres_data:  # Not needed, using remote PostgreSQL/' docker-compose.yml
        msg_ok "docker-compose.yml updated"
    fi
}

# Install npm dependencies
install_npm_dependencies() {
    msg_step "Installing npm dependencies..."
    
    cd "$PROJECT_DIR"
    
    msg_info "This may take several minutes..."
    npm install > /dev/null 2>&1
    msg_ok "npm dependencies installed"
    
    msg_info "Generating Prisma client..."
    cd packages/database
    npx prisma generate > /dev/null 2>&1
    msg_ok "Prisma client generated"
}

# Configure environment files
configure_env() {
    msg_step "Configuring environment files..."
    
    # Determine API and Web URLs
    if [[ -n "$DOMAIN_NAME" ]]; then
        if [[ "$USE_SSL" == "true" ]]; then
            API_URL="https://${DOMAIN_NAME}"
            WS_URL="wss://${DOMAIN_NAME}"
        else
            API_URL="http://${DOMAIN_NAME}"
            WS_URL="ws://${DOMAIN_NAME}"
        fi
    else
        CONTAINER_IP=$(hostname -I | awk '{print $1}')
        API_URL="http://${CONTAINER_IP}:${API_PORT}"
        WS_URL="ws://${CONTAINER_IP}:${API_PORT}"
    fi
    
    # Database .env
    msg_info "Creating database .env..."
    cat > "$PROJECT_DIR/packages/database/.env" << EOF
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
EOF
    
    # Server .env
    msg_info "Creating server .env..."
    cat > "$PROJECT_DIR/apps/server/.env" << EOF
# Database
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

# JWT
JWT_SECRET="${JWT_SECRET}"
JWT_EXPIRES_IN="7d"

# API
API_PORT=${API_PORT}
API_URL="${API_URL}"

# WebSocket
WS_URL="${WS_URL}"

# Frontend
NEXT_PUBLIC_API_URL="${API_URL}"
NEXT_PUBLIC_WS_URL="${WS_URL}"

# OpenSearch
OPENSEARCH_URL="http://localhost:9200"

# Environment
NODE_ENV=production
EOF
    
    # Web .env
    msg_info "Creating web .env..."
    cat > "$PROJECT_DIR/apps/web/.env" << EOF
# API Configuration
NEXT_PUBLIC_API_URL="${API_URL}"
NEXT_PUBLIC_WS_URL="${WS_URL}"

# Environment
NODE_ENV=production
EOF
    
    msg_ok "Environment files created"
}

# Start Docker services (OpenSearch)
start_docker_services() {
    msg_step "Starting Docker services (OpenSearch)..."
    
    cd "$PROJECT_DIR"
    
    msg_info "Starting OpenSearch..."
    docker-compose up -d > /dev/null 2>&1
    
    msg_info "Waiting for OpenSearch to be ready..."
    sleep 10
    
    # Check OpenSearch health
    if curl -s http://localhost:9200/_cluster/health > /dev/null 2>&1; then
        msg_ok "OpenSearch is ready"
    else
        msg_warn "OpenSearch may not be ready yet. Continuing..."
    fi
}

# Initialize database
initialize_database() {
    msg_step "Initializing database..."
    
    cd "$PROJECT_DIR/packages/database"
    
    msg_info "Running migrations..."
    npx prisma migrate deploy > /dev/null 2>&1
    msg_ok "Migrations applied"
    
    msg_info "Seeding database..."
    npx ts-node prisma/seed.ts > /dev/null 2>&1
    msg_ok "Database seeded"
    
    msg_warn "Default admin credentials:"
    msg_warn "  Email: admin@archimodeler.com"
    msg_warn "  Password: admin"
    msg_warn "  ⚠️  Please change the password after first login!"
}

# Build project
build_project() {
    msg_step "Building project..."
    
    cd "$PROJECT_DIR"
    
    msg_info "This may take several minutes..."
    npm run build > /dev/null 2>&1
    msg_ok "Project built successfully"
}

# Configure systemd services
configure_systemd() {
    msg_step "Configuring systemd services..."
    
    # Server service
    msg_info "Creating archimodeler-server service..."
    cat > /etc/systemd/system/archimodeler-server.service << EOF
[Unit]
Description=ArchiModeler Server
After=network.target docker.service

[Service]
Type=simple
User=root
WorkingDirectory=${PROJECT_DIR}/apps/server
Environment=NODE_ENV=production
EnvironmentFile=${PROJECT_DIR}/apps/server/.env
ExecStart=/usr/bin/npm run start:prod
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
    
    # Web service
    msg_info "Creating archimodeler-web service..."
    cat > /etc/systemd/system/archimodeler-web.service << EOF
[Unit]
Description=ArchiModeler Web
After=network.target archimodeler-server.service

[Service]
Type=simple
User=root
WorkingDirectory=${PROJECT_DIR}/apps/web
Environment=NODE_ENV=production
EnvironmentFile=${PROJECT_DIR}/apps/web/.env
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable archimodeler-server archimodeler-web > /dev/null 2>&1
    msg_ok "Systemd services configured"
}

# Configure Nginx
configure_nginx() {
    msg_step "Configuring Nginx..."
    
    SERVER_NAME="${DOMAIN_NAME:-_}"
    
    msg_info "Creating Nginx configuration..."
    cat > /etc/nginx/sites-available/archimodeler << EOF
server {
    listen 80;
    server_name ${SERVER_NAME};

    # Frontend
    location / {
        proxy_pass http://localhost:${WEB_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:${API_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:${API_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF
    
    ln -sf /etc/nginx/sites-available/archimodeler /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    if nginx -t > /dev/null 2>&1; then
        systemctl reload nginx
        msg_ok "Nginx configured"
    else
        msg_error "Nginx configuration test failed"
        exit 1
    fi
}

# Configure SSL
configure_ssl() {
    if [[ "$USE_SSL" != "true" ]]; then
        return
    fi
    
    msg_step "Configuring SSL..."
    
    msg_info "Obtaining SSL certificate..."
    if certbot --nginx -d "$DOMAIN_NAME" --non-interactive --agree-tos --register-unsafely-without-email > /dev/null 2>&1; then
        msg_ok "SSL certificate obtained"
    else
        msg_warn "SSL certificate could not be obtained automatically"
        msg_info "You can run: certbot --nginx -d $DOMAIN_NAME"
    fi
}

# Start services
start_services() {
    msg_step "Starting services..."
    
    msg_info "Starting archimodeler-server..."
    systemctl start archimodeler-server
    sleep 5
    
    msg_info "Starting archimodeler-web..."
    systemctl start archimodeler-web
    sleep 5
    
    # Check services status
    if systemctl is-active --quiet archimodeler-server; then
        msg_ok "archimodeler-server is running"
    else
        msg_error "archimodeler-server failed to start"
        msg_info "Check logs with: journalctl -u archimodeler-server -n 50"
    fi
    
    if systemctl is-active --quiet archimodeler-web; then
        msg_ok "archimodeler-web is running"
    else
        msg_error "archimodeler-web failed to start"
        msg_info "Check logs with: journalctl -u archimodeler-web -n 50"
    fi
}

# Installation summary
show_summary() {
    header
    
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}                  ${GREEN}Installation Complete!${NC}                    ${GREEN}║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${CYAN}Access Information:${NC}"
    if [[ -n "$DOMAIN_NAME" ]]; then
        if [[ "$USE_SSL" == "true" ]]; then
            echo "  URL: https://${DOMAIN_NAME}"
        else
            echo "  URL: http://${DOMAIN_NAME}"
        fi
    else
        CONTAINER_IP=$(hostname -I | awk '{print $1}')
        echo "  URL: http://${CONTAINER_IP}"
    fi
    echo ""
    
    echo -e "${CYAN}Default Admin Credentials:${NC}"
    echo "  Email: admin@archimodeler.com"
    echo "  Password: admin"
    echo "  ${YELLOW}⚠️  Please change the password after first login!${NC}"
    echo ""
    
    echo -e "${CYAN}Useful Commands:${NC}"
    echo "  Check server status: systemctl status archimodeler-server"
    echo "  Check web status: systemctl status archimodeler-web"
    echo "  View server logs: journalctl -u archimodeler-server -f"
    echo "  View web logs: journalctl -u archimodeler-web -f"
    echo "  Restart services: systemctl restart archimodeler-server archimodeler-web"
    echo ""
    
    echo -e "${CYAN}Configuration Files:${NC}"
    echo "  Server .env: ${PROJECT_DIR}/apps/server/.env"
    echo "  Web .env: ${PROJECT_DIR}/apps/web/.env"
    echo "  Database .env: ${PROJECT_DIR}/packages/database/.env"
    echo ""
    
    echo -e "${GREEN}Installation completed successfully!${NC}"
    echo ""
}

# Main installation function
main() {
    header
    
    check_root
    check_system
    interactive_config
    
    install_dependencies
    install_nodejs
    configure_docker
    prepare_database
    setup_project
    install_npm_dependencies
    configure_env
    start_docker_services
    initialize_database
    build_project
    configure_systemd
    configure_nginx
    configure_ssl
    start_services
    
    show_summary
}

# Run main function
main "$@"


