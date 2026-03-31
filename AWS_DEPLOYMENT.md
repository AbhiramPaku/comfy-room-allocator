# ComFy Room Allocator - AWS EC2 Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the ComFy Room Allocator website on AWS EC2. The architecture consists of:
- **Frontend**: React + Vite application hosted on Nginx (EC2)
- **Backend**: Node.js Express server running locally on your machine
- **Database**: MongoDB Atlas (cloud)
- **Backend Tunnel**: ngrok or Cloudflare Tunnel for local backend exposure

## Prerequisites
- AWS account with EC2 access
- EC2 instance running Ubuntu 22.04 (or similar)
- Node.js and npm installed locally
- Git installed locally and on EC2
- Backend running on local machine with MongoDB Atlas connection

## Part 1: EC2 Instance Setup

### Step 1: SSH into EC2
```bash
ssh -i your-key.pem ubuntu@16.112.131.196
```

### Step 2: Install Dependencies
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# Install Nginx
sudo apt install -y nginx

# Install Git
sudo apt install -y git
```

### Step 3: Configure Nginx for SPA
```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/comfy-room-allocator > /dev/null << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;
    root /home/ubuntu/comfy-room-allocator-main/dist;

    # SPA routing - all requests to non-existent files go to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache-bust static assets with hash in filename
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/comfy-room-allocator /etc/nginx/sites-enabled/

# Disable default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Part 2: Frontend Deployment

### Step 1: Clone Repository on EC2
```bash
cd /home/ubuntu
git clone https://github.com/vedaanth-arch/comfy-room-allocator.git
cd comfy-room-allocator-main
```

### Step 2: Install Frontend Dependencies
```bash
npm ci  # Use ci instead of install for production
```

### Step 3: Set Up Backend Tunnel (Choose One)

#### Option A: Using ngrok (Simpler)
On your **local machine**:
1. Download ngrok from https://ngrok.com
2. Authenticate: `ngrok config add-authtoken YOUR_TOKEN`
3. Start tunnel: `ngrok http 5000`
4. Note the URL (e.g., `https://abc123.ngrok.io`)

#### Option B: Using Cloudflare Tunnel (More Stable)
On your **local machine**:
```bash
# Install cloudflared
# macOS: brew install cloudflare/cloudflare/cloudflared
# Windows: Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create comfy-backend

# Configure tunnel to route to localhost:5000
cloudflared tunnel route dns comfy-backend <your-domain.com>

# Start tunnel
cloudflared tunnel run comfy-backend
```

### Step 4: Build Frontend on EC2
On your **local machine**, prepare environment variables:
```bash
# Get tunnel URL from ngrok or Cloudflare
export VITE_API_BASE_URL="https://your-tunnel-url"  # e.g., https://abc123.ngrok.io

# Build the project
npm run build
```

### Step 5: Deploy Built Files
```bash
# Push built dist to GitHub (optional, for version control)
# OR manually copy files to EC2

# On EC2, the Nginx root is already pointing to:
# /home/ubuntu/comfy-room-allocator-main/dist
```

### Step 6: Verify Frontend Build Permissions
On EC2:
```bash
sudo chown -R ubuntu:ubuntu /home/ubuntu/comfy-room-allocator-main
sudo chmod -R 755 /home/ubuntu/comfy-room-allocator-main/dist
```

## Part 3: Local Backend Setup

### Step 1: Ensure Backend is Running
On your **local machine**:
```bash
cd /path/to/comfy-room-allocator-main
npm run backend
```

Expected output:
```
✓ Connected to MongoDB Atlas
✓ Server listening on port 5000
```

### Step 2: Verify Health Endpoint
```bash
curl http://localhost:5000/health
```

Should return:
```json
{
  "ok": true,
  "dbConnected": true,
  "pingMs": 12,
  "uptime": 1234,
  "timestamp": "2026-03-31T10:30:00.000Z"
}
```

### Step 3: Keep Backend Running
Options:
- Run in a dedicated terminal window
- Use PM2: `npm install -g pm2` → `pm2 start server.js` → `pm2 save`
- Use a tmux session: `tmux new-session -d -s backend 'npm run backend'`

## Part 4: Testing & Access

### Step 1: Access Frontend
Open browser and navigate to:
```
http://16.112.131.196
```

Should load the ComFy Room Allocator dashboard.

### Step 2: Test API Connectivity
In browser console or via curl:
```bash
curl http://16.112.131.196/rooms
```

Should return a list of rooms from MongoDB.

### Step 3: Verify CORS
Backend at `server.js` has CORS allowlist. Current allowed origins:
- `http://localhost:5173` (local dev)
- `http://127.0.0.1:5173` (local dev)
- `http://16.112.131.196` (EC2)
- `https://16.112.131.196` (EC2 HTTPS)

If deploying with a domain, update `.env`:
```
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://your-domain.com,https://your-domain.com
```

## Part 5: Production Hardening (Optional)

### Enable HTTPS with Let's Encrypt (Requires Domain)
```bash
# On EC2
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d your-domain.com

# Update Nginx config with SSL
sudo tee /etc/nginx/sites-available/comfy-room-allocator > /dev/null << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    root /home/ubuntu/comfy-room-allocator-main/dist;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location ~ /\. {
        deny all;
    }
}
EOF

# Restart Nginx
sudo systemctl restart nginx
```

### Allocate Elastic IP (Recommended)
To prevent IP changes on EC2 restart:
1. Go to AWS Console → EC2 → Elastic IPs
2. Allocate new Elastic IP
3. Associate with your EC2 instance
4. Update `.env` CORS_ORIGINS with Elastic IP instead of temporary IP

## Part 6: Troubleshooting

### Issue: Frontend shows blank page
- Check browser console for errors
- Verify VITE_API_BASE_URL is set correctly during build
- Ensure Nginx is running: `sudo systemctl status nginx`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`

### Issue: API requests failing (CORS error)
- Verify backend tunnel is running (ngrok/Cloudflare)
- Check backend is accessible: `curl https://your-tunnel-url/health`
- Verify CORS_ORIGINS in backend `.env` includes EC2 IP/domain
- Restart backend after .env changes

### Issue: MongoDB connection errors
- Check MongoDB Atlas IP allowlist includes EC2 IP and your machine IP
- Verify MONGODB_URI in `.env` is correct
- Test connection: `curl http://localhost:5000/health`

### Issue: Port 5000 already in use
```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill process
sudo kill -9 <PID>
```

## Part 7: Quick Restart Procedures

### Restart Frontend (on EC2)
```bash
# Pull latest code
cd /home/ubuntu/comfy-room-allocator-main
git pull origin main

# Rebuild with tunnel URL (local machine)
npm run build

# Nginx automatically serves from dist
sudo systemctl restart nginx
```

### Restart Backend (on local machine)
```bash
# Kill existing process
npm run backend  # Ctrl+C

# Verify tunnel still running
# Restart backend
npm run backend
```

### Check All Services
```bash
# On EC2
sudo systemctl status nginx
curl http://localhost/health

# On local machine
curl http://localhost:5000/health
curl https://your-tunnel-url/health (via EC2)
```

## Summary of URLs

| Service | URL | Location |
|---------|-----|----------|
| Frontend | `http://16.112.131.196` | EC2 via Nginx |
| Backend API | `https://your-tunnel-url` | Local machine via ngrok/Cloudflare |
| Backend Health | `http://localhost:5000/health` | Local machine direct |
| MongoDB | `mongodb+srv://...` | Atlas (cloud) |

## Next Steps

1. Complete Part 1-3 above
2. Test access to frontend via EC2 IP
3. Verify API calls work
4. (Optional) Set up Elastic IP to prevent IP changes
5. (Optional) Configure domain and HTTPS
6. (Optional) Set up PM2 for persistent backend process

## Support

For issues or questions, check:
- Backend logs: `npm run backend` console output
- Nginx logs: `/var/log/nginx/error.log`
- MongoDB Atlas console: https://cloud.mongodb.com
- ngrok dashboard: https://dashboard.ngrok.com (if using ngrok)
