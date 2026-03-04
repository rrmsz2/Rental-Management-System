# 🚀 دليل نشر التطبيق للإنتاج - Production Deployment Guide

## 📋 المتطلبات الأساسية

- Docker Engine 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum
- 10GB disk space
- Domain name (optional)
- SSL certificate (optional)

---

## 🔧 إعداد البيئة

### 1. استنساخ المشروع
```bash
git clone https://github.com/your-repo/rental-management-system.git
cd rental-management-system
```

### 2. إعداد ملف البيئة
```bash
# انسخ ملف البيئة النموذجي
cp .env.production .env

# عدّل الملف بالقيم الخاصة بك
nano .env
```

**⚠️ مهم: يجب تغيير القيم التالية:**
- `JWT_SECRET` - استخدم سلسلة عشوائية طويلة
- `ADMIN_PASSWORD` - كلمة مرور قوية للمدير
- `MONGO_ROOT_PASSWORD` - كلمة مرور قوية لـ MongoDB
- `WHATSAPP_API_TOKEN` - رمز API من TextMeBot

### 3. إنشاء كلمة سر قوية
```bash
# توليد JWT Secret
openssl rand -base64 64

# توليد كلمة مرور للمدير
openssl rand -base64 32
```

---

## 🐳 النشر باستخدام Docker

### الطريقة 1: Docker Compose (موصى بها)

```bash
# بناء وتشغيل التطبيق
docker-compose up -d --build

# التحقق من الحالة
docker-compose ps

# مشاهدة السجلات
docker-compose logs -f app

# إيقاف التطبيق
docker-compose down

# إيقاف وحذف البيانات (احذر!)
docker-compose down -v
```

### الطريقة 2: Docker مستقل (بدون MongoDB)

```bash
# بناء الصورة
docker build -t rental-app .

# تشغيل التطبيق (مع MongoDB خارجي)
docker run -d \
  --name rental-app \
  -p 80:80 \
  --env-file .env \
  -e MONGO_URL=mongodb://your-mongodb-host:27017 \
  rental-app
```

---

## 🔒 الأمان في الإنتاج

### 1. تفعيل HTTPS/SSL

#### استخدام Nginx مع SSL:
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

#### استخدام Traefik (Auto SSL):
```yaml
# docker-compose.override.yml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./traefik.yml:/etc/traefik/traefik.yml
      - /var/run/docker.sock:/var/run/docker.sock
      - letsencrypt:/letsencrypt

  app:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app.rule=Host(`yourdomain.com`)"
      - "traefik.http.routers.app.tls=true"
      - "traefik.http.routers.app.tls.certresolver=letsencrypt"

volumes:
  letsencrypt:
```

### 2. تأمين MongoDB

```bash
# الاتصال بـ MongoDB
docker exec -it rental-mongodb mongosh

# إنشاء مستخدم للتطبيق
use rental_management
db.createUser({
  user: "app_user",
  pwd: "strong_password",
  roles: [
    { role: "readWrite", db: "rental_management" }
  ]
})

# تحديث connection string
MONGO_URL=mongodb://app_user:strong_password@mongodb:27017/rental_management
```

### 3. جدار الحماية

```bash
# السماح بالمنافذ الضرورية فقط
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

---

## 📊 المراقبة والسجلات

### عرض السجلات
```bash
# سجلات التطبيق
docker logs rental-app

# سجلات MongoDB
docker logs rental-mongodb

# سجلات في الوقت الفعلي
docker-compose logs -f --tail 100

# سجلات محددة
docker exec rental-app cat /var/log/fastapi/stdout.log
docker exec rental-app cat /var/log/nginx/access.log
```

### المراقبة الصحية
```bash
# فحص صحة التطبيق
curl http://localhost/api/health

# فحص حالة Docker
docker ps
docker stats

# فحص استخدام القرص
df -h
docker system df
```

---

## 🔄 التحديثات والصيانة

### تحديث التطبيق
```bash
# سحب آخر التحديثات
git pull origin main

# إعادة بناء وتشغيل
docker-compose down
docker-compose up -d --build

# أو بدون توقف (Zero-downtime)
docker-compose build app
docker-compose up -d --no-deps app
```

### النسخ الاحتياطي

#### نسخ احتياطي لـ MongoDB:
```bash
# إنشاء نسخة احتياطية
docker exec rental-mongodb mongodump \
  --out /backup/$(date +%Y%m%d_%H%M%S)

# أو باستخدام script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup MongoDB
docker exec rental-mongodb mongodump --out /tmp/backup
docker cp rental-mongodb:/tmp/backup $BACKUP_DIR/mongodb

# Backup environment
cp .env $BACKUP_DIR/

echo "✅ Backup completed: $BACKUP_DIR"
EOF

chmod +x backup.sh
./backup.sh
```

#### استعادة النسخة الاحتياطية:
```bash
# استعادة MongoDB
docker cp ./backup/mongodb rental-mongodb:/tmp/restore
docker exec rental-mongodb mongorestore /tmp/restore
```

---

## 🚨 حل المشاكل

### المشكلة: التطبيق لا يعمل
```bash
# فحص حالة الحاويات
docker-compose ps

# فحص السجلات
docker-compose logs app

# إعادة تشغيل
docker-compose restart app
```

### المشكلة: MongoDB connection failed
```bash
# التحقق من MongoDB
docker exec rental-mongodb mongosh --eval "db.adminCommand('ping')"

# فحص الشبكة
docker network ls
docker network inspect rental-management_rental-network
```

### المشكلة: Port already in use
```bash
# إيجاد العملية
sudo lsof -i :80
sudo lsof -i :27017

# إيقاف العملية أو تغيير المنفذ في docker-compose.yml
```

---

## 📝 قائمة فحص الإنتاج

### قبل النشر:
- [ ] تغيير جميع كلمات المرور الافتراضية
- [ ] تحديث JWT_SECRET
- [ ] إعداد WhatsApp API credentials
- [ ] تكوين CORS للنطاق الصحيح
- [ ] تفعيل HTTPS/SSL
- [ ] إعداد النسخ الاحتياطي التلقائي
- [ ] تكوين جدار الحماية
- [ ] إزالة ملفات الاختبار

### بعد النشر:
- [ ] التحقق من /api/health
- [ ] اختبار تسجيل الدخول
- [ ] اختبار إرسال OTP
- [ ] التحقق من السجلات
- [ ] إعداد المراقبة
- [ ] توثيق إعدادات الإنتاج

---

## 🔗 أوامر مفيدة

```bash
# دخول حاوية التطبيق
docker exec -it rental-app bash

# دخول Python shell
docker exec -it rental-app python

# تنظيف Docker
docker system prune -a
docker volume prune

# عرض استخدام الموارد
docker stats --no-stream

# تصدير السجلات
docker logs rental-app > app_logs_$(date +%Y%m%d).txt
```

---

## 📞 الدعم

في حالة وجود مشاكل:
1. راجع السجلات: `docker-compose logs`
2. تحقق من الصحة: `curl http://localhost/api/health`
3. راجع هذا الدليل مرة أخرى
4. افتح issue على GitHub

---

**تاريخ التحديث**: ديسمبر 2024
**الإصدار**: 1.0.0