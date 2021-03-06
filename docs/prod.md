Production deployment
=====================

First, install the prerequisites system (we assume Debian or Ubuntu here):

```bash
apt-get install build-essential python3-dev python3-pip python3-venv
```

In production, you should create a dedicated user for the application. All steps for the installation, which do not need root access, should be done using this user. We assume this user is called `chatbot`, it’s home is `/srv/chatbot` and the application is located in `/srv/chatbot/chatbot`. The user can be created using:

```bash
# as root
useradd -u 2000 -c 'Chatbot' -s /bin/bash -d /srv/chatbot -m chatbot
```

Using this user, clone the repository, change directory and create a virtual env in the home of this user:

```bash
# as chatbot
git clone https://github.com/de-hub/chatbot
cd chatbot

python3 -m venv env
source env/bin/activate
```

Install production dependencies:

```bash
# as chatbot
pip install --upgrade pip wheel setuptools
pip install -r requirements/prod.txt
pip install psychopg2-binary  # for PostgreSQL
pip install mysqlclient       # for MySQL
```

Create `/srv/chatbot/chatbot/.env` with the folowing content:

```bash
SECRET_KEY=<a long random secret key>
DATABASE=postgresql://@/<dbname>                      # for PostgreSQL, using peer auth
DATABASE=mysql://<username>:<password>@localhost/<dbname>  # for MySQL
ALLOWED_HOSTS=<your hostname>
```

Create the database user and the database:

```sql
# for PostgreSQL
CREATE ROLE <username>;
CREATE DATABASE <dbname> OWNER <username>;

# for MySQL
CREATE USER '<username>'@'localhost' identified by '<password>';
CREATE DATABASE `<dbname>` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON `<dbname>`.* to '<username>'@'localhost';
```

Run the database migrations and create a superuser:

```bash
# as chatbot
./manage.py migrate
./manage.py createsuperuser
```

#### Front end

If nodejs is not desired on the prodction system, you can also perform the following steps on a different machine and copy the `/static` directory to `/srv/chatbot/chaterbot` on the server.

Install [nvm](https://github.com/nvm-sh/nvm) for the `chatbot` user:

```bash
# as chatbot
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
. ~/.bashrc
```

Install the front-end dependencies and build the static files using:

```bash
# as chatbot
nvm install
npm install
npm run build:prod
```

#### Gunicorn setup

Systemd will launch the Gunicorn process on startup and keep running. Create a new systemd service file (you will need root/sudo permissions for that):

```
# /etc/systemd/system/chatbot.service
[Unit]
Description=Chatbot gunicorn daemon
After=network.target

[Service]
User=chatbot
Group=chatbot
WorkingDirectory=/srv/chatbot/chatbot
EnvironmentFile=/srv/chatbot/chatbot/.env
ExecStart=/srv/chatbot/chatbot/env/bin/gunicorn --bind 127.0.0.1:9000 config.wsgi:application

[Install]
WantedBy=multi-user.target
```

This service needs to be started and enabled like any other service:

```bash
# as root
systemctl daemon-reload
systemctl start chatbot
systemctl enable chatbot
systemctl status chatbot
```

#### NGINX

Next, install NGINX:

```bash
# as root
sudo apt-get install nginx
```

Crate the Nginx configuration as follows (again with root/sudo permissions):

```
# /etc/nginx/sites-available/YOURDOMAIN
server {
    listen 80;
    server_name YOURDOMAIN;

    access_log /var/log/nginx/YOURDOMAIN.access.log;
    error_log /var/log/nginx/YOURDOMAIN.error.log;

    location / {
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $http_host;
        proxy_pass http://127.0.0.1:9000;
    }
    location /static/ {
        alias /srv/chatbot/chatbot/static_root/;
    }
}
```

Enable the site:

```bash
# as root
ln -s /etc/nginx/sites-available/YOURDOMAIN /etc/nginx/sites-enabled/YOURDOMAIN
nginx -t
systemctl reload nginx
```

The application should now be available on YOURDOMAIN.

#### Apache2

Alternatively to NGINX, install Apache2:

```bash
# as root
sudo apt-get install apache2
a2enmod proxy
a2enmod proxy_http
```

Create the Apache2 configuration as follows (again with root/sudo permissions):

```
# /etc/apache2/sites-available/chatbot.conf
<VirtualHost *:80>
    ServerName <hostname>
    ServerAdmin <emain>
    DocumentRoot /var/www/html

    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined

    Alias /static/ /srv/chatbot/chatbot/static_root/
    <Directory /srv/chatbot/chatbot/static_root/>
        Require all granted
    </Directory>

    ProxyPass /static !
    ProxyPass / http://localhost:9000/
    ProxyPassReverse / http://localhost:9000/
</VirtualHost>
```

Enable the site:

```bash
# as root
a2ensite chatbot.conf
apachectl -S
systemctl reload apache2
```

#### Collect static files

As you can see from the virtual host configurations, the static assets such as CSS and JavaScript files are served independently from the reverse proxy to the gunicorn process. In order to do so they need to be gathered in the `static_root` directory. This can be achieved by running:

```bash
# as chatbot
python manage.py collectstatic
```

#### Let's Encrypt

Install the NGINX intergration:

```bash
# as root
apt-get install python3-certbot-nginx
certbot --nginx -d YOURDOMAIN   # for NGINX
certbot --apache -d YOURDOMAIN  # for Apache2
```

And follow the questions. Thats it.
