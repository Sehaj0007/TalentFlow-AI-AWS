#!/bin/bash

set -e

echo "============================================================"
echo "TalentFlow AI - EC2 Initialisation"
echo "============================================================"

# ------------------------------------------------------------
# System update
# ------------------------------------------------------------

dnf update -y

# ------------------------------------------------------------
# Install required packages
# ------------------------------------------------------------

dnf install -y git nodejs22 postgresql15

# ------------------------------------------------------------
# Create application directory
# ------------------------------------------------------------

mkdir -p /opt/talentflow-ai

cd /opt/talentflow-ai

# ------------------------------------------------------------
# Clone application
# ------------------------------------------------------------

git clone https://github.com/Sehaj0007/TalentFlow-AI-AWS.git .

# ------------------------------------------------------------
# Backend environment
# ------------------------------------------------------------

cat > /opt/talentflow-ai/backend/.env <<EOF
PORT=3010

DB_HOST=${db_host}
DB_PORT=${db_port}
DB_NAME=${db_name}
DB_USER=${db_username}
DB_PASSWORD=${db_password}

TALENTFLOW_S3_BUCKET=${s3_bucket}
AWS_REGION=eu-north-1

NODE_ENV=production
EOF

chmod 600 /opt/talentflow-ai/backend/.env

# ------------------------------------------------------------
# Install backend dependencies
# ------------------------------------------------------------

cd /opt/talentflow-ai/backend

npm ci

# ------------------------------------------------------------
# Initialise PostgreSQL schema
# ------------------------------------------------------------

echo "Initialising TalentFlow PostgreSQL schema..."

export PGPASSWORD="${db_password}"

psql \
  -h "${db_host}" \
  -p "${db_port}" \
  -U "${db_username}" \
  -d "${db_name}" \
  -f /opt/talentflow-ai/backend/models/schema.sql

unset PGPASSWORD

echo "Database schema initialised successfully."

# ------------------------------------------------------------
# Seed database
# ------------------------------------------------------------

echo "Seeding TalentFlow database..."

npm run seed || echo "Database seed completed with warnings."

# ------------------------------------------------------------
# Install PM2
# ------------------------------------------------------------

npm install -g pm2

# ------------------------------------------------------------
# Start TalentFlow application
# ------------------------------------------------------------

pm2 delete talentflow-backend || true

pm2 start server.js \
  --name talentflow-backend \
  --cwd /opt/talentflow-ai/backend

pm2 save

# ------------------------------------------------------------
# Configure PM2 startup
# ------------------------------------------------------------

env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user > /tmp/pm2-startup.txt

STARTUP_COMMAND=$(grep -E '^sudo ' /tmp/pm2-startup.txt | tail -1 || true)

if [ -n "$STARTUP_COMMAND" ]; then
    eval "$STARTUP_COMMAND"
fi

pm2 save

# ------------------------------------------------------------
# Create deployment marker
# ------------------------------------------------------------

cat > /opt/talentflow-ai/deployment-info.txt <<EOF
TalentFlow AI AWS Deployment
Environment: production
Application: Node.js + Express
Database: Amazon RDS PostgreSQL
Storage: Amazon S3
Infrastructure: Terraform
Region: eu-north-1
EOF

# ------------------------------------------------------------
# Completion marker
# ------------------------------------------------------------

touch /opt/talentflow-ai/.deployment-complete

echo "============================================================"
echo "TalentFlow AI EC2 setup completed successfully."
echo "============================================================"