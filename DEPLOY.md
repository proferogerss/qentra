# Qentra — Guía completa de despliegue
# Servidor: Hetzner CX22 · 178.104.243.176
# Dominio destino: qentra.codenovatech.com.mx

============================================================
## PARTE 1 — PREPARACIÓN LOCAL (Windows)
============================================================

### 1.1 Crear repositorio en GitHub
---
Crea un nuevo repo en GitHub: https://github.com/new
  - Nombre: qentra
  - Privado ✅

### 1.2 Subir el código
---
En la carpeta del proyecto (después de descomprimir el ZIP):

cd C:\ruta\donde\descomprimiste\biomag

git init
git add .
git commit -m "feat: Qentra v1.0 inicial"
git remote add origin https://github.com/proferogerss/qentra.git
git branch -M main
git push -u origin main


============================================================
## PARTE 2 — SERVIDOR HETZNER
============================================================

Conectarse:
  ssh root@178.104.243.176

### 2.1 Crear base de datos PostgreSQL
---
sudo -u postgres psql

-- En psql:
CREATE DATABASE qentra_db;
GRANT ALL PRIVILEGES ON DATABASE qentra_db TO appuser;
\c qentra_db
GRANT ALL ON SCHEMA public TO appuser;
\q

### 2.2 Clonar repositorio
---
cd /var/www
git clone https://github.com/proferogerss/qentra.git qentra_db
cd /var/www/qentra

### 2.3 Crear archivo .env
---
cp .env.example .env
nano .env

# Valores a editar:
PORT=3005
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=qentra_db
DB_USER=appuser
DB_PASSWORD=[tu_password_de_appuser]   # mismo que usa Bitácora SS
JWT_SECRET=qentra_super_secret_CAMBIAR_$(openssl rand -hex 32)
FRONTEND_URL=https://qentra.codenovatech.com.mx
APP_NAME=Qentra
APP_URL=https://qentra.codenovatech.com.mx

### 2.4 Ejecutar migración SQL
---
psql -h 127.0.0.1 -U appuser -d qentra_db -f /var/www/qentra/backend/src/migrations/001_initial.sql

# Verificar que se crearon las tablas:
psql -h 127.0.0.1 -U appuser -d qentra_db -c "\dt"

### 2.5 Instalar dependencias del backend
---
cd /var/www/qentra/backend
npm install

### 2.6 Construir frontend
---
cd /var/www/qentra/frontend
npm install
npm run build

### 2.7 Iniciar con PM2
---
cd /var/www/qentra
pm2 start ecosystem.config.js
pm2 save

# Verificar:
pm2 status
pm2 logs qentra --lines 20


============================================================
## PARTE 3 — NGINX
============================================================

### 3.1 Crear virtual host para qentra.codenovatech.com.mx
---
nano /etc/nginx/sites-available/biomag

# Pegar esta configuración:
---
server {
    listen 80;
    server_name qentra.codenovatech.com.mx;

    location / {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 20M;
        proxy_request_buffering off;
        proxy_read_timeout 120s;
    }
}
---

ln -s /etc/nginx/sites-available/biomag /etc/nginx/sites-enabled/biomag
nginx -t
systemctl reload nginx

### 3.2 Configurar Cloudflare
---
En el dashboard de Cloudflare (zona codenovatech.com.mx):
  - Agregar registro DNS tipo A:
    Nombre: biomag
    IPv4: 178.104.243.176
    Proxied: ✅ (nube naranja)

Esperar 2-5 minutos para propagación.

### 3.3 Verificar
---
curl https://qentra.codenovatech.com.mx/api/auth/me
# Debe regresar: {"error":"Token requerido"}  ← OK ✅


============================================================
## PARTE 4 — BOTÓN EN CODENOVATECH.COM.MX
============================================================

### 4.1 Editar el landing de CodeNova
---
# El archivo está en /var/www/codenovatech/ (o donde está el landing)
# Agregar este botón en la sección de productos/servicios del index.html:

<a href="https://qentra.codenovatech.com.mx" target="_blank"
   class="biomag-btn"
   style="
     display: inline-flex; align-items: center; gap: 10px;
     background: linear-gradient(135deg, #2337e8, #14b8a6);
     color: white; font-weight: 700; text-decoration: none;
     padding: 14px 28px; border-radius: 14px;
     font-family: 'Outfit', sans-serif; font-size: 16px;
     box-shadow: 0 8px 30px rgba(35,55,232,0.35);
     transition: transform 0.2s, box-shadow 0.2s;
   "
   onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 12px 40px rgba(35,55,232,0.5)'"
   onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 8px 30px rgba(35,55,232,0.35)'">
  🧲 Qentra — Sistema de Par Biomagnético
</a>

Guardar y recargar nginx si es necesario.


============================================================
## PARTE 5 — PRIMER LOGIN
============================================================

URL: https://qentra.codenovatech.com.mx
Email: admin@qentra.pro
Contraseña inicial: Qentra2026#

⚠️  IMPORTANTE: Cambiar la contraseña al primer acceso
    Ir a: Perfil → Cambiar contraseña


============================================================
## FLUJO DE DESPLIEGUE CONTINUO (cambios futuros)
============================================================

### Windows → push:
cd C:\ruta\qentra
git add .
git commit -m "descripción del cambio"
git push origin main

### Servidor — backend + frontend:
cd /var/www/qentra && git pull origin main && cd frontend && npm run build && cd .. && pm2 restart qentra

### Servidor — solo backend:
cd /var/www/qentra && git pull origin main && pm2 restart qentra

### Servidor — con migración SQL:
cd /var/www/qentra && git pull origin main && psql -h 127.0.0.1 -U appuser -d qentra_db -f backend/src/migrations/NNN_nombre.sql && cd frontend && npm run build && cd .. && pm2 restart qentra

### Comandos PM2 útiles:
pm2 status
pm2 logs qentra --lines 30
pm2 restart qentra
pm2 restart qentra --update-env


============================================================
## SOLUCIÓN DE PROBLEMAS COMUNES
============================================================

Error 502 Bad Gateway:
→ pm2 logs qentra --lines 10  (buscar el error)
→ Revisar que .env esté bien configurado
→ pm2 restart qentra --update-env

Error de base de datos:
→ psql -h 127.0.0.1 -U appuser -d qentra_db -c "SELECT 1"
→ Verificar que la DB exista y el usuario tenga permisos

Frontend no carga (HTML vacío):
→ cd /var/www/qentra/frontend && npm run build
→ Verificar que /dist/index.html exista

CORS error:
→ Verificar FRONTEND_URL en .env
→ pm2 restart qentra --update-env

Error "relation does not exist":
→ Ejecutar la migración: psql -h 127.0.0.1 -U appuser -d qentra_db -f backend/src/migrations/001_initial.sql


============================================================
## ESTRUCTURA DEL PROYECTO
============================================================

qentra_db/
├── .env                          ← Variables de entorno (NO en git)
├── .env.example                  ← Template
├── .gitignore
├── ecosystem.config.js           ← PM2
├── backend/
│   ├── package.json
│   └── src/
│       ├── server.js             ← Entrada
│       ├── config/db.js          ← Pool PostgreSQL
│       ├── middleware/auth.js    ← JWT middleware
│       ├── migrations/
│       │   └── 001_initial.sql   ← Schema completo
│       └── routes/
│           ├── auth.js
│           ├── pacientes.js
│           ├── citas.js
│           ├── sesiones.js
│           ├── pares.js
│           ├── catalogo.js
│           ├── dashboard.js
│           └── usuarios.js
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── context/AuthContext.jsx
        ├── utils/api.js
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── PacientesPage.jsx
        │   ├── PacienteDetallePage.jsx
        │   ├── CitasPage.jsx
        │   ├── SesionPage.jsx
        │   ├── CatalogoPage.jsx
        │   ├── EquipoPage.jsx
        │   └── AdminPage.jsx
        └── components/
            ├── shared/
            │   ├── Layout.jsx
            │   └── CategoriaBadge.jsx
            ├── pacientes/
            │   └── ModalPaciente.jsx
            ├── citas/
            │   └── ModalNuevaCita.jsx
            └── sesion/
                └── CuerpoSVG.jsx
