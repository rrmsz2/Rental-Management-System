# 📘 دليل النشر على Ubuntu 20.04 VPS

## ⚠️ تنبيه أمني مهم
**لا تشارك أبداً كلمات مرور root أو VNC في أي مكان!**

---

## 📋 معلومات الخادم
- **IP**: 75.119.156.14
- **النظام**: Ubuntu 20.04 (64-bit)
- **النوع**: VPS M SSD

---

## 🚀 خطوات النشر الكاملة

### الخطوة 1: الاتصال بالخادم وتأمينه

```bash
# اتصل بالخادم
ssh root@75.119.156.14

# غيّر كلمة المرور فوراً
passwd

# حدّث النظام
apt update && apt upgrade -y
```

### الخطوة 2: تشغيل سكريبت الإعداد

```bash
# حمّل سكريبت الإعداد
wget https://raw.githubusercontent.com/YOUR_REPO/main/ubuntu-deploy.sh
# أو انسخه يدوياً

# اجعله قابل للتنفيذ
chmod +x ubuntu-deploy.sh

# شغّله
./ubuntu-deploy.sh
```

### الخطوة 3: نقل ملفات التطبيق

من جهازك المحلي:
```bash
# انسخ ملفات المشروع
scp -r ./backend root@75.119.156.14:/home/rental_user/rental-management/
scp -r ./frontend root@75.119.156.14:/home/rental_user/rental-management/
scp ./Dockerfile.standalone root@75.119.156.14:/home/rental_user/rental-management/
scp ./.dockerignore root@75.119.156.14:/home/rental_user/rental-management/
```

### الخطوة 4: تكوين البيئة

```bash
# على الخادم
su - rental_user
cd rental-management

# عدّل ملف البيئة
nano .env
```

**غيّر هذه القيم:**
```env
MONGO_ROOT_PASSWORD=كلمة_مرور_قوية_جداً_123
JWT_SECRET=سلسلة_عشوائية_طويلة_64_حرف
ADMIN_PASSWORD=كلمة_مرور_المدير_القوية
ADMIN_PHONE=+968XXXXXXXX
```

### الخطوة 5: بناء وتشغيل التطبيق

```bash
# كـ rental_user
cd /home/rental_user/rental-management

# بناء الصور
docker-compose build

# تشغيل التطبيق
docker-compose up -d

# تحقق من الحالة
docker-compose ps

# شاهد السجلات
docker-compose logs -f
```

### الخطوة 6: التحقق من التشغيل

```bash
# من الخادم
curl http://localhost:8001/api/health

# من المتصفح
http://75.119.156.14
```

---

## 🔒 تأمين إضافي

### 1. إعداد SSH Keys

على جهازك المحلي:
```bash
# توليد مفتاح
ssh-keygen -t ed25519 -C "your_email@example.com"

# نسخه للخادم
ssh-copy-id rental_user@75.119.156.14
```

على الخادم:
```bash
# عطّل تسجيل الدخول بكلمة المرور
nano /etc/ssh/sshd_config

# غيّر:
PasswordAuthentication no
PermitRootLogin no

# أعد تشغيل SSH
systemctl restart sshd
```

### 2. إعداد SSL (اختياري)

إذا كان لديك domain:
```bash
# كـ root
certbot --nginx -d yourdomain.com
```

### 3. مراقبة الموارد

```bash
# استخدام CPU و RAM
htop

# مساحة القرص
df -h

# حالة Docker
docker stats
```

---

## 🔧 الصيانة

### النسخ الاحتياطي

```bash
# يدوياً
/home/rental_user/rental-management/backup.sh

# تلقائياً (يومياً 2 صباحاً)
# تم إعداده في crontab
```

### التحديثات

```bash
# كـ rental_user
cd /home/rental_user/rental-management
git pull
docker-compose down
docker-compose up -d --build
```

### عرض السجلات

```bash
# سجلات التطبيق
docker logs rental-app -f

# سجلات MongoDB
docker logs rental-mongodb -f

# سجلات Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 🚨 حل المشاكل

### المشكلة: التطبيق لا يعمل
```bash
# تحقق من Docker
docker ps -a
docker-compose logs

# أعد التشغيل
docker-compose restart
```

### المشكلة: Nginx Error 502
```bash
# تحقق من التطبيق
curl http://localhost:8001/api/health

# تحقق من Nginx
nginx -t
systemctl status nginx
```

### المشكلة: MongoDB لا يعمل
```bash
# تحقق من MongoDB
docker logs rental-mongodb

# أعد إنشاء الحاوية
docker-compose down
docker-compose up -d mongodb
docker-compose up -d app
```

---

## 📊 مواصفات الأداء

مع مواصفات VPS M SSD، التطبيق يمكنه:
- خدمة ~100-200 مستخدم متزامن
- معالجة ~1000 طلب/ثانية
- تخزين ~10,000 عقد إيجار

للحصول على أداء أفضل:
1. استخدم CDN للملفات الثابتة
2. فعّل Redis للـ caching
3. استخدم MongoDB Atlas للـ database

---

## 📝 قائمة التحقق النهائية

- [ ] تم تغيير كلمة مرور root
- [ ] تم إنشاء مستخدم rental_user
- [ ] تم تكوين الجدار الناري
- [ ] تم تثبيت Docker و Docker Compose
- [ ] تم نقل ملفات التطبيق
- [ ] تم تعديل ملف .env
- [ ] تم تشغيل التطبيق
- [ ] يعمل على http://75.119.156.14
- [ ] تم إعداد النسخ الاحتياطي
- [ ] تم إعداد SSL (اختياري)

---

## 📞 معلومات الدخول للتطبيق

بعد النشر الناجح:

**Admin Login:**
- URL: http://75.119.156.14/admin-login
- Username: admin
- Password: (الذي وضعته في ADMIN_PASSWORD)

**Customer Portal:**
- URL: http://75.119.156.14
- يحتاج رقم هاتف مسجل + OTP

---

## ⚡ أوامر سريعة

```bash
# الدخول للخادم
ssh rental_user@75.119.156.14

# إيقاف التطبيق
docker-compose stop

# تشغيل التطبيق
docker-compose start

# إعادة التشغيل
docker-compose restart

# حذف كل شيء (احذر!)
docker-compose down -v
```

---

**آخر تحديث**: ديسمبر 2024
**مُحسّن لـ**: Ubuntu 20.04 VPS