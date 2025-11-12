# نظام إدارة التأجير
Rental Management System

نظام متكامل لإدارة تأجير المعدات مع واجهة أمامية (React) وخلفية (FastAPI) وقاعدة بيانات (MongoDB).

---

## 📋 المحتويات
- [المتطلبات](#المتطلبات)
- [التثبيت والتشغيل](#التثبيت-والتشغيل)
- [بنية المشروع](#بنية-المشروع)
- [المستخدمون والصلاحيات](#المستخدمون-والصلاحيات)
- [الميزات الرئيسية](#الميزات-الرئيسية)
- [API Endpoints](#api-endpoints)
- [استكشاف الأخطاء](#استكشاف-الأخطاء)

---

## 🔧 المتطلبات

### البيئة المحلية:
- **Python**: 3.11+
- **Node.js**: 18+
- **MongoDB**: 5.0+
- **Yarn**: 1.22+

### المكتبات الأساسية:
- **Backend**: FastAPI, Motor (MongoDB), JWT, Pydantic
- **Frontend**: React 18, TailwindCSS, Axios, React Router

---

## 🚀 التثبيت والتشغيل

### 1️⃣ إعداد قاعدة البيانات MongoDB

```bash
# تأكد من تشغيل MongoDB
sudo systemctl start mongodb
# أو
mongod --dbpath /data/db
```

### 2️⃣ إعداد Backend (FastAPI)

```bash
# الانتقال إلى مجلد Backend
cd /app/backend

# تثبيت المكتبات
pip install -r requirements.txt

# إعداد ملف البيئة .env
# تأكد من وجود المتغيرات التالية:
MONGO_URL="mongodb://localhost:27017"
DB_NAME="rental_management"
JWT_SECRET="your-secret-key-here"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES="43200"
MANAGER_PHONE="+96812345678"
WHATSAPP_API_TOKEN="your-whatsapp-token"

# تشغيل الخادم (عبر Supervisor في الإنتاج)
sudo supervisorctl restart backend

# أو للتطوير المحلي:
# uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### 3️⃣ إعداد Frontend (React)

```bash
# الانتقال إلى مجلد Frontend
cd /app/frontend

# تثبيت المكتبات
yarn install

# إعداد ملف البيئة .env
REACT_APP_BACKEND_URL=https://your-domain.com

# تشغيل الخادم (عبر Supervisor في الإنتاج)
sudo supervisorctl restart frontend

# أو للتطوير المحلي:
# yarn start
```

### 4️⃣ التحقق من التشغيل

```bash
# فحص حالة الخدمات
sudo supervisorctl status

# يجب أن ترى:
# backend     RUNNING
# frontend    RUNNING

# اختبار Backend API
curl http://localhost:8001/api/

# اختبار Frontend
curl http://localhost:3000
```

---

## 📁 بنية المشروع

```
/app
├── backend/
│   ├── server.py              # نقطة البداية الرئيسية
│   ├── models.py              # نماذج البيانات (Pydantic)
│   ├── routers/               # API Endpoints
│   │   ├── auth.py           # المصادقة والتسجيل
│   │   ├── users.py          # إدارة المستخدمين
│   │   ├── customers.py      # إدارة العملاء
│   │   ├── equipment.py      # إدارة المعدات
│   │   ├── rentals.py        # إدارة العقود
│   │   ├── invoices.py       # إدارة الفواتير
│   │   ├── reports.py        # التقارير والإحصائيات
│   │   ├── exports.py        # تصدير البيانات (PDF/Excel)
│   │   └── reminders.py      # الإشعارات والتذكيرات
│   ├── services/             # منطق الأعمال
│   ├── middleware/           # التحقق من الصلاحيات
│   └── .env                  # متغيرات البيئة
│
├── frontend/
│   ├── src/
│   │   ├── App.js            # التطبيق الرئيسي والتوجيه
│   │   ├── pages/            # صفحات التطبيق
│   │   │   ├── LoginPage.js
│   │   │   ├── VerifyOtpPage.js
│   │   │   ├── DashboardPage.js      # لوحة التحكم (للموظفين)
│   │   │   ├── CustomerPortalPage.js # بوابة العملاء
│   │   │   ├── RentalsPage.js
│   │   │   ├── InvoicesPage.js
│   │   │   └── ...
│   │   ├── components/       # المكونات القابلة لإعادة الاستخدام
│   │   ├── context/          # إدارة الحالة (AuthContext)
│   │   └── api/              # إعداد Axios
│   └── .env                  # متغيرات البيئة
│
└── README.md                 # هذا الملف
```

---

## 👥 المستخدمون والصلاحيات

### أنواع المستخدمين:

#### 1. **المدير (Admin)**
- الوصول الكامل لجميع الميزات
- إدارة المستخدمين والصلاحيات
- عرض التقارير والإحصائيات

#### 2. **الموظف (Employee)**
- إدارة العقود والفواتير
- إدارة العملاء والمعدات
- لا يمكنه إدارة المستخدمين

#### 3. **المحاسب (Accountant)**
- عرض وإدارة الفواتير
- عرض التقارير المالية
- لا يمكنه إنشاء عقود جديدة

#### 4. **العميل (Customer)**
- عرض عقوده وفواتيره الخاصة فقط
- بوابة منفصلة عن لوحة التحكم
- لا يمكنه الوصول لبيانات العملاء الآخرين

### آلية تسجيل الدخول:

```
1. الموظفون: يتم إنشاؤهم من قبل المدير فقط
2. العملاء: يتم إنشاء حساب تلقائياً عند أول تسجيل دخول
   (شرط: يجب أن يكون رقم الهاتف مسجل في قاعدة البيانات كعميل)
3. المصادقة: OTP عبر WhatsApp
```

---

## ✨ الميزات الرئيسية

### 🏠 لوحة التحكم
- إحصائيات شاملة (الإيرادات، العقود النشطة، المتأخرة)
- رسوم بيانية تفاعلية
- تنبيهات وإشعارات

### 📊 التقارير
- تقارير الإيرادات (يومية، شهرية، سنوية)
- تقارير العملاء والعقود
- تصدير PDF و Excel

### 💰 إدارة الفواتير
- إنشاء تلقائي عند إغلاق العقد
- حساب الضرائب والخصومات
- تتبع حالة الدفع

### 📱 الإشعارات (WhatsApp)
- إشعار OTP عند تسجيل الدخول
- إشعار للعميل عند تفعيل العقد
- إشعار عند إصدار فاتورة
- تذكير قبل انتهاء العقد
- إشعار التأخير

### 🔐 الأمان
- JWT Authentication
- Role-Based Access Control (RBAC)
- OTP Verification
- Rate Limiting على endpoints الحساسة

---

## 🔌 API Endpoints

### المصادقة (Authentication)
```
POST /api/auth/login           # إرسال OTP
POST /api/auth/verify          # التحقق من OTP
POST /api/auth/logout          # تسجيل الخروج
```

### المستخدمون
```
GET    /api/users/me           # بيانات المستخدم الحالي
GET    /api/users              # قائمة المستخدمين
POST   /api/users              # إنشاء مستخدم جديد
PUT    /api/users/:id          # تحديث مستخدم
DELETE /api/users/:id          # حذف مستخدم
```

### العملاء
```
GET    /api/customers          # قائمة العملاء
POST   /api/customers          # إضافة عميل
PUT    /api/customers/:id      # تحديث عميل
DELETE /api/customers/:id      # حذف عميل
```

### العقود
```
GET    /api/rentals            # قائمة العقود
POST   /api/rentals            # إنشاء عقد جديد
PUT    /api/rentals/:id        # تحديث عقد
POST   /api/rentals/:id/close  # إغلاق عقد
DELETE /api/rentals/:id        # حذف عقد
```

### التقارير
```
GET /api/reports/dashboard-stats      # إحصائيات لوحة التحكم
GET /api/reports/revenue-detailed     # تقرير الإيرادات المفصل
GET /api/reports/customers-detailed   # تقرير العملاء
```

### التصدير
```
GET /api/exports/revenue/excel        # تصدير الإيرادات Excel
GET /api/exports/revenue/pdf          # تصدير الإيرادات PDF
```

---

## 🐛 استكشاف الأخطاء

### المشكلة: الخدمات لا تعمل

```bash
# فحص حالة الخدمات
sudo supervisorctl status

# إعادة تشغيل الخدمات
sudo supervisorctl restart backend
sudo supervisorctl restart frontend

# فحص السجلات (logs)
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/frontend.err.log
```

### المشكلة: خطأ في الاتصال بقاعدة البيانات

```bash
# التحقق من MongoDB
sudo systemctl status mongodb

# اختبار الاتصال
mongo --eval "db.adminCommand('ping')"

# التحقق من MONGO_URL في .env
cat /app/backend/.env | grep MONGO_URL
```

### المشكلة: Frontend لا يتصل بـ Backend

```bash
# التحقق من REACT_APP_BACKEND_URL
cat /app/frontend/.env | grep REACT_APP_BACKEND_URL

# يجب أن يكون:
REACT_APP_BACKEND_URL=https://your-domain.com

# إعادة تشغيل Frontend بعد تعديل .env
sudo supervisorctl restart frontend
```

### المشكلة: العميل لا يتم توجيهه لبوابته

```bash
# التحقق من بيانات المستخدم في قاعدة البيانات
mongo rental_management --eval 'db.users.find({phone: "+96892345218"}).pretty()'

# يجب أن يحتوي على:
# - role: "customer"
# - is_customer_only: true
# - customer_id: "xxx"

# إذا كانت القيم فارغة، سيتم تحديثها تلقائياً عند تسجيل الدخول التالي
```

### المشكلة: OTP لا يصل عبر WhatsApp

```bash
# التحقق من WHATSAPP_API_TOKEN
cat /app/backend/.env | grep WHATSAPP_API_TOKEN

# فحص سجلات الإشعارات
mongo rental_management --eval 'db.notification_logs.find().sort({created_at: -1}).limit(5).pretty()'
```

---

## 📞 الدعم

للمشاكل التقنية أو الاستفسارات، يرجى:
1. فحص سجلات الأخطاء (logs)
2. مراجعة قسم [استكشاف الأخطاء](#استكشاف-الأخطاء)
3. التواصل مع فريق الدعم التقني

---

## 📝 ملاحظات مهمة

1. **Hot Reload**: الخدمات تدعم Hot Reload - لا حاجة لإعادة التشغيل عند تعديل الكود
2. **إعادة التشغيل مطلوبة**: فقط عند:
   - تثبيت مكتبات جديدة
   - تعديل ملف `.env`
3. **النسخ الاحتياطي**: يُنصح بعمل نسخ احتياطي دوري لقاعدة البيانات
4. **الأمان**: لا تشارك محتوى ملف `.env` أو `JWT_SECRET`

---

## 🔄 التحديثات الأخيرة

- ✅ نظام المصادقة عبر OTP (WhatsApp)
- ✅ فصل صلاحيات الموظفين والعملاء
- ✅ بوابة خاصة للعملاء (Customer Portal)
- ✅ لوحة تحكم شاملة مع إحصائيات
- ✅ تقارير قابلة للتصدير (PDF/Excel)
- ✅ نظام الإشعارات عبر WhatsApp
- ✅ حساب تلقائي للضرائب والخصومات

---

**تاريخ آخر تحديث**: نوفمبر 2025
**الإصدار**: 1.0.0
