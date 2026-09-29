#!/bin/bash

set -e

echo "Starting TalentFlow AI EC2 setup..."

# ------------------------------------------------------------
# System update
# ------------------------------------------------------------

dnf update -y

# ------------------------------------------------------------
# Install required packages
# ------------------------------------------------------------

dnf install -y git nodejs22

# ------------------------------------------------------------
# Create application directory
# ------------------------------------------------------------

mkdir -p /opt/talentflow-ai

cd /opt/talentflow-ai

# ------------------------------------------------------------
# Clone application
# ------------------------------------------------------------

git clone https://github.com/YOUR_GITHUB_USERNAME/TalentFlow-AI.git .

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

S3_BUCKET=${s3_bucket}
AWS_REGION=eu-north-1

NODE_ENV=production
EOF

# ------------------------------------------------------------
# Install backend dependencies
# ------------------------------------------------------------

cd /opt/talentflow-ai/backend

npm ci

# ------------------------------------------------------------
# Install PM2
# ------------------------------------------------------------

npm install -g pm2

# ------------------------------------------------------------
# Start application
# ------------------------------------------------------------

pm2 start server.js --name talentflow-backend

pm2 save

# ------------------------------------------------------------
# Configure PM2 startup
# ------------------------------------------------------------

env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user

# ------------------------------------------------------------
# Allow application port locally
# ------------------------------------------------------------

echo "TalentFlow AI application setup completed."