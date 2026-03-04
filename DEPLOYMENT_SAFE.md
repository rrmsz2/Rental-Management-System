# 🚀 دليل النشر الآمن - Safe Deployment Guide
## للخوادم التي تحتوي على حاويات أخرى

---

## ⚠️ ملاحظة مهمة
هذا الدليل مصمم خصيصاً للخوادم التي:
- تحتوي على حاويات Docker أخرى تعمل
- لديها Nginx مثبت مسبقاً
- تحتاج لتجنب تعارض المنافذ

---

## 📋 البنية المستخدمة

```
الخادم الحالي:
├── Nginx الموجود (Port 80/443)
│   └── سيتم إضافة proxy للتطبيق
├── حاويات أخرى موجودة
└── التطبيق الجديد:
    ├── rental-app (Port 8001 - داخلي)
    └── rental-mongodb (Port 27027 - داخلي)
```

---

## 🔧 خطوات التثبيت

### 1. تحضير الملفات

```bash
# استنساخ المشروع
git clone <your-repo-url> rental-management
cd rental-management

# إنشاء ملف البيئة
cp .env.production .env
```

### 2. تعديل ملف البيئة (.env)

```bash
nano .env
```

**غيّر القيم التالية:**
```env
# MongoDB - استخدم كلمة مرور قوية
MONGO_ROOT_USER=rental_admin
MONGO_ROOT_PASSWORD=YOUR_STRONG_PASSWORD_HERE

# JWT - استخدم مفتاح عشوائي طويل
JWT_SECRET=YOUR_RANDOM_LONG_STRING_HERE

# Admin Account
ADMIN_PASSWORD=YOUR_ADMIN_PASSWORD_HERE
ADMIN_PHONE=+968XXXXXXXX
ADMIN_EMAIL=admin@yourcompany.om

# WhatsApp (اختياري)
WHATSAPP_API_TOKEN=your-textmebot-token
```

### 3. بناء وتشغيل الحاويات

```bash
# استخدم docker-compose.production.yml المخصص
docker-compose -f docker-compose.production.yml up -d --build

# تحقق من الحالة
docker-compose -f docker-compose.production.yml ps

# عرض السجلات
docker-compose -f docker-compose.production.yml logs -f
```

### 4. إعداد Nginx الموجود

```bash
# انسخ إعدادات الموقع
sudo cp nginx-site-config.conf /etc/nginx/sites-available/rental

# عدّل الإعدادات
sudo nano /etc/nginx/sites-available/rental
```

**غيّر:**
- `server_name` إلى نطاقك
- مسارات SSL إذا كنت تستخدم HTTPS

```bash
# فعّل الموقع
sudo ln -s /etc/nginx/sites-available/rental /etc/nginx/sites-enabled/

# تحقق من الإعدادات
sudo nginx -t

# أعد تحميل Nginx
sudo systemctl reload nginx
```

---

## 🔍 المنافذ المستخدمة

| الخدمة | المنفذ | الوصول | ملاحظة |
|--------|--------|--------|---------|
| rental-app | 8001 | 127.0.0.1 فقط | لا يتعارض مع خدمات أخرى |
| rental-mongodb | 27027 | 127.0.0.1 فقط | منفذ مختلف عن MongoDB الافتراضي |
| Nginx (موجود) | 80/443 | public | يستخدم proxy_pass إلى 8001 |

---

## 🛡️ الأمان

### الشبكة المعزولة
التطبيق يستخدم شبكة Docker منفصلة:
```yaml
networks:
  rental-internal:
    name: rental_management_network
```

### المنافذ المحلية فقط
```yaml
ports:
  - "127.0.0.1:8001:8001"  # لا يمكن الوصول من الخارج
  - "127.0.0.1:27027:27017"  # MongoDB محلي فقط
```

---

## 📊 التحقق من التشغيل

### 1. فحص الحاويات
```bash
# عرض حاويات التطبيق فقط
docker ps | grep rental

# يجب أن ترى:
# rental-app       (Port 8001)
# rental-mongodb   (Port 27027)
```

### 2. فحص الصحة
```bash
# من الخادم مباشرة
curl http://127.0.0.1:8001/api/health

# من خلال Nginx
curl http://yourdomain.com/api/health
```

### 3. الوصول للتطبيق
- **من المتصفح**: `http://yourdomain.com`
- **API Docs**: `http://yourdomain.com/docs`

---

## 🔧 الأوامر المفيدة

### إدارة التطبيق
```bash
# إيقاف التطبيق فقط (لا يؤثر على حاويات أخرى)
docker-compose -f docker-compose.production.yml stop

# إعادة تشغيل التطبيق
docker-compose -f docker-compose.production.yml restart rental-app

# حذف التطبيق (احذر - سيحذف البيانات)
docker-compose -f docker-compose.production.yml down -v
```

### عرض السجلات
```bash
# سجلات التطبيق
docker logs rental-app -f

# سجلات MongoDB
docker logs rental-mongodb -f

# آخر 100 سطر
docker logs rental-app --tail 100
```

### النسخ الاحتياطي
```bash
# نسخ احتياطي لـ MongoDB
docker exec rental-mongodb mongodump \
  --archive=/tmp/backup.archive --gzip

docker cp rental-mongodb:/tmp/backup.archive \
  ./backups/backup_$(date +%Y%m%d).archive
```

---

## ⚠️ تحذيرات مهمة

### 1. لا تستخدم docker-compose.yml العادي
```bash
# خطأ - قد يتعارض مع خدمات أخرى
docker-compose up  # ❌

# صحيح - يستخدم إعدادات آمنة
docker-compose -f docker-compose.production.yml up  # ✅
```

### 2. تحقق من المنافذ قبل التشغيل
```bash
# تحقق من المنفذ 8001
sudo lsof -i :8001

# تحقق من المنفذ 27027
sudo lsof -i :27027
```

### 3. لا تحذف الشبكات أو الvolumes الأخرى
```bash
# خطير - يحذف كل شيء
docker system prune -a  # ❌

# آمن - يحذف فقط ما يخص التطبيق
docker-compose -f docker-compose.production.yml down -v  # ✅
```

---

## 🆘 حل المشاكل

### المشكلة: تعارض المنافذ
```bash
# غيّر المنفذ في docker-compose.production.yml
ports:
  - "127.0.0.1:8002:8001"  # استخدم 8002 بدلاً من 8001

# حدّث Nginx
upstream rental_app {
    server 127.0.0.1:8002;  # نفس المنفذ الجديد
}
```

### المشكلة: Nginx لا يعمل
```bash
# تحقق من الإعدادات
sudo nginx -t

# عرض سجل الأخطاء
sudo tail -f /var/log/nginx/error.log

# أعد تشغيل Nginx
sudo systemctl restart nginx
```

### المشكلة: التطبيق لا يتصل بـ MongoDB
```bash
# تحقق من الشبكة
docker network ls | grep rental

# تحقق من اتصال الحاويات بالشبكة
docker network inspect rental_management_network

# أعد إنشاء الشبكة
docker-compose -f docker-compose.production.yml down
docker network rm rental_management_network
docker-compose -f docker-compose.production.yml up -d
```

---

## ✅ قائمة التحقق النهائية

- [ ] تم تغيير كل كلمات المرور الافتراضية
- [ ] تم التحقق من عدم تعارض المنافذ
- [ ] تم إعداد Nginx بشكل صحيح
- [ ] Health check يعمل: `/api/health`
- [ ] يمكن تسجيل الدخول كـ admin
- [ ] لا توجد أخطاء في السجلات
- [ ] النسخ الاحتياطي مُعد
- [ ] الحاويات الأخرى تعمل بشكل طبيعي

---

## 📝 ملخص

هذا الإعداد:
- ✅ **آمن**: لا يؤثر على الحاويات الأخرى
- ✅ **معزول**: يستخدم شبكة وvolumes منفصلة
- ✅ **مرن**: يمكن تغيير المنافذ بسهولة
- ✅ **متوافق**: يعمل مع Nginx الموجود

---

**تاريخ الإنشاء**: ديسمبر 2024
**مُحدث للعمل مع**: خوادم بها حاويات متعددة