#!/bin/bash
export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a
sed -i "s/#\$nrconf{restart} = 'i';/\$nrconf{restart} = 'a';/g" /etc/needrestart/needrestart.conf || true

echo "Updating apt..."
apt-get update
echo "Installing nginx and certbot..."
apt-get -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" install nginx certbot python3-certbot-nginx

echo "Setting up pm2 on port 5500..."
export PATH=$PATH:/usr/bin:/usr/lib/node_modules/pm2/bin
cd /var/www/santuario
pm2 delete santuario || true
PORT=5500 pm2 start server.js --name "santuario"
pm2 save

echo "Configuring Nginx..."
cat > /etc/nginx/sites-available/santuario << 'EOF'
server {
    listen 80;
    server_name santuariodelhombre.com www.santuariodelhombre.com;
    location / {
        proxy_pass http://localhost:5500;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50M;
    }
}
EOF

ln -sf /etc/nginx/sites-available/santuario /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx

echo "Allowing firewall ports..."
ufw allow 80/tcp
ufw allow 443/tcp

echo "Running Certbot..."
certbot --nginx -n -m admin@santuariodelhombre.com --agree-tos -d santuariodelhombre.com -d www.santuariodelhombre.com

echo "DONE_NGINX_SETUP"
