#!/usr/bin/env bash
set -Eeuo pipefail

# ============================================================
# MIS Platform - Linux Unit-Test Deployment Script
#
# Usage:
#   1. Put this script and the latest MIS platform ZIP in the
#      same directory on the Linux server.
#   2. chmod +x deploy-test.sh
#   3. sudo ./deploy-test.sh
#
# The script performs, in order:
#   - OS package installation
#   - Node.js LTS installation/check
#   - MySQL database/user creation
#   - Application extraction
#   - Backend .env creation
#   - Frontend .env.local creation
#   - Database migrations in sorted order
#   - Test Admin + Super Admin creation
#   - npm install/build
#   - PM2 setup/start
#   - Nginx reverse proxy setup
#   - Health checks
#
# This is intended for a FRESH/UNIT-TEST environment.
# ============================================================

APP_NAME="mis-platform"
APP_ROOT="/var/www/${APP_NAME}"
BACKUP_ROOT="/var/backups/${APP_NAME}"
BACKEND_PORT="5001"
FRONTEND_PORT="3000"

# ---------- Defaults (edit these if you want non-interactive deployment) ----------
DB_NAME_DEFAULT="mis_platform_test"
DB_USER_DEFAULT="mis_test"
DB_PASSWORD_DEFAULT=""
SERVER_NAME_DEFAULT="_"
SUPER_ADMIN_EMAIL_DEFAULT="superadmin@mis.local"
SUPER_ADMIN_PASSWORD_DEFAULT="Admin@123"
ADMIN_EMAIL_DEFAULT="admin@mis.local"
ADMIN_PASSWORD_DEFAULT="Admin@123"

log()  { echo -e "\n[INFO] $*"; }
warn() { echo -e "\n[WARN] $*"; }
fail() { echo -e "\n[ERROR] $*" >&2; exit 1; }

trap 'echo -e "\n[ERROR] Deployment failed at line $LINENO. Check the output above." >&2' ERR

if [[ "${EUID}" -ne 0 ]]; then
    fail "Run this script with sudo/root: sudo ./deploy-test.sh"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---------- Find application ZIP ----------
APP_ZIP="${1:-}"
if [[ -z "${APP_ZIP}" ]]; then
    APP_ZIP="$(find "${SCRIPT_DIR}" -maxdepth 1 -type f -name '*.zip' ! -name '*deploy*' | head -n 1 || true)"
fi

if [[ -z "${APP_ZIP}" || ! -f "${APP_ZIP}" ]]; then
    fail "Application ZIP not found. Put the latest MIS platform ZIP beside this script or run: sudo ./deploy-test.sh /path/to/app.zip"
fi

APP_ZIP="$(readlink -f "${APP_ZIP}")"

# ---------- Configuration ----------
echo
printf '%s\n' '============================================================'
printf '%s\n' ' MIS Platform - Unit Test Deployment'
printf '%s\n' '============================================================'
echo

auto_input() {
    local prompt="$1" default="$2" value
    read -r -p "${prompt} [${default}]: " value || true
    echo "${value:-$default}"
}

DB_NAME="$(auto_input 'Test database name' "${DB_NAME_DEFAULT}")"
DB_USER="$(auto_input 'Test database user' "${DB_USER_DEFAULT}")"
DB_PASSWORD="${DB_PASSWORD_DEFAULT}"
if [[ -z "${DB_PASSWORD}" ]]; then
    read -r -s -p "MySQL password for ${DB_USER}: " DB_PASSWORD
    echo
fi
SERVER_NAME="$(auto_input 'Domain name or server IP (use _ for any host)' "${SERVER_NAME_DEFAULT}")"

read -r -p "Reset/recreate test database ${DB_NAME}? [Y/n]: " RESET_DB
RESET_DB="${RESET_DB:-Y}"

read -r -p "Enable HTTPS with Certbot now? [y/N]: " ENABLE_SSL
ENABLE_SSL="${ENABLE_SSL:-N}"

read -r -p "Create/reset test ORG_ADMIN (${ADMIN_EMAIL_DEFAULT})? [Y/n]: " CREATE_ADMIN
CREATE_ADMIN="${CREATE_ADMIN:-Y}"

read -r -p "Create/reset test SUPER_ADMIN (${SUPER_ADMIN_EMAIL_DEFAULT})? [Y/n]: " CREATE_SUPER_ADMIN
CREATE_SUPER_ADMIN="${CREATE_SUPER_ADMIN:-Y}"

export DEBIAN_FRONTEND=noninteractive

# ---------- OS packages ----------
log "Installing required OS packages"
apt-get update
apt-get install -y ca-certificates curl gnupg unzip nginx mysql-server openssl rsync

# ---------- Node.js LTS ----------
if command -v node >/dev/null 2>&1; then
    NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
else
    NODE_MAJOR="0"
fi

if [[ "${NODE_MAJOR}" -lt 20 ]]; then
    log "Installing Node.js 20 LTS"
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
        | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" \
        > /etc/apt/sources.list.d/nodesource.list
    apt-get update
    apt-get install -y nodejs
fi

log "Node version: $(node -v)"
log "NPM version: $(npm -v)"

# ---------- PM2 ----------
if ! command -v pm2 >/dev/null 2>&1; then
    log "Installing PM2"
    npm install -g pm2
fi

# ---------- MySQL ----------
log "Starting MySQL"
systemctl enable --now mysql

# Validate identifiers to avoid accidental SQL injection through configuration.
[[ "${DB_NAME}" =~ ^[A-Za-z0-9_]+$ ]] || fail "Invalid database name: ${DB_NAME}"
[[ "${DB_USER}" =~ ^[A-Za-z0-9_]+$ ]] || fail "Invalid database user: ${DB_USER}"

log "Preparing MySQL database ${DB_NAME}"
if [[ "${RESET_DB}" =~ ^[Yy]$ ]]; then
    mysql <<SQL
DROP DATABASE IF EXISTS \`${DB_NAME}\`;
CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
DROP USER IF EXISTS '${DB_USER}'@'localhost';
CREATE USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD//'/''}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL
else
    mysql <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD//'/''}';
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD//'/''}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL
fi

# ---------- Extract application ----------
log "Preparing application directory"
mkdir -p "${BACKUP_ROOT}"

if [[ -d "${APP_ROOT}" ]]; then
    BACKUP_DIR="${BACKUP_ROOT}/$(date +%Y%m%d_%H%M%S)"
    log "Backing up existing application to ${BACKUP_DIR}"
    mkdir -p "${BACKUP_DIR}"
    rsync -a --exclude node_modules --exclude .next "${APP_ROOT}/" "${BACKUP_DIR}/"
fi

rm -rf "${APP_ROOT}.new"
mkdir -p "${APP_ROOT}.new"
unzip -q "${APP_ZIP}" -d "${APP_ROOT}.new"

# Normalize ZIP layouts. Current project ZIP has a top-level mis_work directory.
if [[ -d "${APP_ROOT}.new/mis_work/backend" && -d "${APP_ROOT}.new/mis_work/frontend" ]]; then
    mv "${APP_ROOT}.new/mis_work/backend" "${APP_ROOT}.new/backend"
    mv "${APP_ROOT}.new/mis_work/frontend" "${APP_ROOT}.new/frontend"
fi

# If the ZIP itself contains a single project directory, normalize it.
if [[ ! -d "${APP_ROOT}.new/backend" || ! -d "${APP_ROOT}.new/frontend" ]]; then
    CANDIDATE="$(find "${APP_ROOT}.new" -mindepth 1 -maxdepth 2 -type d -name backend | head -n 1 || true)"
    if [[ -n "${CANDIDATE}" ]]; then
        PROJECT_DIR="$(dirname "${CANDIDATE}")"
        if [[ -d "${PROJECT_DIR}/frontend" ]]; then
            mv "${PROJECT_DIR}/backend" "${APP_ROOT}.new/backend"
            mv "${PROJECT_DIR}/frontend" "${APP_ROOT}.new/frontend"
        fi
    fi
fi

[[ -d "${APP_ROOT}.new/backend" ]] || fail "backend directory not found in application ZIP"
[[ -d "${APP_ROOT}.new/frontend" ]] || fail "frontend directory not found in application ZIP"

rm -rf "${APP_ROOT}"
mv "${APP_ROOT}.new" "${APP_ROOT}"

# ---------- Backend environment ----------
log "Creating backend environment"
JWT_SECRET="$(openssl rand -hex 48)"
cat > "${APP_ROOT}/backend/.env" <<EOF
PORT=${BACKEND_PORT}
DB_HOST=localhost
DB_PORT=3306
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=8h
SUPER_ADMIN_EMAIL=${SUPER_ADMIN_EMAIL_DEFAULT}
SUPER_ADMIN_PASSWORD=${SUPER_ADMIN_PASSWORD_DEFAULT}
SUPER_ADMIN_NAME=Platform Super Admin
EOF
chmod 600 "${APP_ROOT}/backend/.env"

# ---------- Frontend environment ----------
log "Creating frontend environment"
if [[ "${SERVER_NAME}" == "_" ]]; then
    # Use the server's first non-loopback IPv4 address for direct unit testing.
    SERVER_IP="$(hostname -I | awk '{print $1}')"
    FRONTEND_API_URL="http://${SERVER_IP}"
else
    FRONTEND_API_URL="http://${SERVER_NAME}"
fi

cat > "${APP_ROOT}/frontend/.env.local" <<EOF
NEXT_PUBLIC_API_URL=${FRONTEND_API_URL}
EOF

# ---------- Install backend dependencies ----------
log "Installing backend dependencies"
cd "${APP_ROOT}/backend"
npm ci --omit=dev

# ---------- Database migrations ----------
log "Running database migrations"
MIGRATION_DIR="${APP_ROOT}/backend/database/migrations"
TEMP_MIGRATION_DIR="$(mktemp -d)"
trap 'rm -rf "${TEMP_MIGRATION_DIR}"' EXIT

# Migration 001 hardcodes the original database name. Replace it for the test DB.
for migration in "${MIGRATION_DIR}"/*.sql; do
    [[ -f "${migration}" ]] || continue
    migration_name="$(basename "${migration}")"
    sed "s/`mis_platform`/`${DB_NAME}`/g; s/USE mis_platform;/USE ${DB_NAME};/g" \
        "${migration}" > "${TEMP_MIGRATION_DIR}/${migration_name}"
done

for migration in "${TEMP_MIGRATION_DIR}"/*.sql; do
    [[ -f "${migration}" ]] || continue
    log "Applying $(basename "${migration}")"
    mysql "${DB_NAME}" < "${migration}"
done

# Verify essential tables.
log "Verifying database schema"
TABLE_COUNT="$(mysql -N -B "${DB_NAME}" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_NAME}';")"
[[ "${TABLE_COUNT}" -ge 10 ]] || fail "Database schema verification failed. Only ${TABLE_COUNT} tables found."

# Verify nullable organization_id for SUPER_ADMIN design.
ORG_NULLABLE="$(mysql -N -B "${DB_NAME}" -e "SELECT IS_NULLABLE FROM information_schema.columns WHERE table_schema='${DB_NAME}' AND table_name='users' AND column_name='organization_id';")"
[[ "${ORG_NULLABLE}" == "YES" ]] || fail "users.organization_id is not nullable; Super Admin requires NULL organization_id."

# ---------- Test users ----------
if [[ "${CREATE_ADMIN}" =~ ^[Yy]$ ]]; then
    log "Creating/resetting ORG_ADMIN"
    node create-admin.js
fi

if [[ "${CREATE_SUPER_ADMIN}" =~ ^[Yy]$ ]]; then
    log "Creating/resetting SUPER_ADMIN"
    node create-super-admin.js
fi

# ---------- Backend syntax checks ----------
log "Checking backend JavaScript syntax"
find "${APP_ROOT}/backend/src" -type f -name '*.js' -print0 \
    | xargs -0 -n1 node --check
node --check "${APP_ROOT}/backend/create-admin.js"
node --check "${APP_ROOT}/backend/create-super-admin.js"

# ---------- Frontend dependencies/build ----------
log "Installing frontend dependencies"
cd "${APP_ROOT}/frontend"
npm ci

log "Building frontend"
npm run build

# ---------- PM2 ----------
log "Configuring PM2"
cd "${APP_ROOT}"

pm2 delete mis-backend >/dev/null 2>&1 || true
pm2 delete mis-frontend >/dev/null 2>&1 || true

cd "${APP_ROOT}/backend"
pm2 start src/app.js --name mis-backend --cwd "${APP_ROOT}/backend"

cd "${APP_ROOT}/frontend"
pm2 start npm --name mis-frontend --cwd "${APP_ROOT}/frontend" -- start

pm2 save

# Make PM2 survive reboot for the current root user.
STARTUP_CMD="$(pm2 startup systemd -u root --hp /root | tail -n 1 || true)"
if [[ "${STARTUP_CMD}" == sudo* || "${STARTUP_CMD}" == env* ]]; then
    eval "${STARTUP_CMD}" || true
fi
pm2 save

# ---------- Nginx ----------
log "Configuring Nginx"
cat > /etc/nginx/sites-available/mis-platform <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${SERVER_NAME};

    client_max_body_size 100M;

    location /api/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT}/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }

    location / {
        proxy_pass http://127.0.0.1:${FRONTEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

ln -sf /etc/nginx/sites-available/mis-platform /etc/nginx/sites-enabled/mis-platform
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl restart nginx

# ---------- Optional HTTPS ----------
if [[ "${ENABLE_SSL}" =~ ^[Yy]$ && "${SERVER_NAME}" != "_" ]]; then
    log "Installing Certbot and requesting HTTPS certificate"
    apt-get install -y certbot python3-certbot-nginx
    certbot --nginx --non-interactive --agree-tos --redirect \
        -m "admin@${SERVER_NAME}" \
        -d "${SERVER_NAME}"
fi

# ---------- Health checks ----------
log "Checking backend directly"
for i in {1..20}; do
    if curl -fsS "http://127.0.0.1:${BACKEND_PORT}/api/health" >/tmp/mis-health.json 2>/dev/null; then
        break
    fi
    sleep 2
done

cat /tmp/mis-health.json || fail "Backend health check failed"
grep -q '"success":true' /tmp/mis-health.json || fail "Backend reported an unhealthy state"

log "Checking Nginx/frontend"
for i in {1..20}; do
    if curl -fsS "http://127.0.0.1/" >/tmp/mis-home.html 2>/dev/null; then
        break
    fi
    sleep 2
done

test -s /tmp/mis-home.html || fail "Frontend/Nginx health check failed"

# ---------- Final status ----------
log "PM2 status"
pm2 status

SERVER_URL="${FRONTEND_API_URL}"
if [[ "${ENABLE_SSL}" =~ ^[Yy]$ && "${SERVER_NAME}" != "_" ]]; then
    SERVER_URL="https://${SERVER_NAME}"
fi

echo
printf '%s\n' '============================================================'
printf '%s\n' ' DEPLOYMENT COMPLETE'
printf '%s\n' '============================================================'
echo "Application:      ${APP_ROOT}"
echo "Database:         ${DB_NAME}"
echo "Backend:          http://127.0.0.1:${BACKEND_PORT}"
echo "Frontend/URL:     ${SERVER_URL}"
echo "Health endpoint:  ${SERVER_URL}/api/health"
echo
if [[ "${CREATE_ADMIN}" =~ ^[Yy]$ ]]; then
    echo "ORG_ADMIN:        ${ADMIN_EMAIL_DEFAULT} / ${ADMIN_PASSWORD_DEFAULT}"
fi
if [[ "${CREATE_SUPER_ADMIN}" =~ ^[Yy]$ ]]; then
    echo "SUPER_ADMIN:      ${SUPER_ADMIN_EMAIL_DEFAULT} / ${SUPER_ADMIN_PASSWORD_DEFAULT}"
fi
echo
printf '%s\n' 'Next: open the URL in a browser and run the unit-test checklist.'
printf '%s\n' '============================================================'
