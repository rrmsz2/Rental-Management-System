# دليل تشغيل التطبيق محليًا على Windows
**Rental Management System - Local Development Guide**

---

## 📋 المتطلبات الأساسية

قبل البدء، تأكد من تثبيت البرامج التالية:

### 1. Python 3.11+
```powershell
# تحقق من إصدار Python
python --version
```
إذا لم يكن مثبتًا، قم بتحميله من: https://www.python.org/downloads/

### 2. Node.js 18+
```powershell
# تحقق من إصدار Node.js
node --version
```
إذا لم يكن مثبتًا، قم بتحميله من: https://nodejs.org/

### 3. Yarn
```powershell
# تثبيت Yarn عبر npm
npm install -g yarn

# تحقق من التثبيت
yarn --version
```

### 4. MongoDB
قم بتحميل وتثبيت MongoDB Community Edition من:
https://www.mongodb.com/try/download/community

أو استخدم MongoDB Atlas (السحابي) للتطوير السريع.

---

## 🚀 خطوات التشغيل

### الخطوة 1️⃣: تشغيل MongoDB

#### الخيار أ: MongoDB محلي
```powershell
# ابدأ خدمة MongoDB
net start MongoDB

# أو إذا كنت تستخدم MongoDB بدون خدمة
mongod --dbpath "C:\data\db"
```

#### الخيار ب: MongoDB Atlas (موصى به للتطوير)
1. سجل حساب مجاني على https://www.mongodb.com/cloud/atlas
2. أنشئ Cluster جديد
3. احصل على Connection String
4. استخدمه في ملف `.env` للـ Backend

---

### الخطوة 2️⃣: إعداد Backend (FastAPI)

```powershell
# انتقل إلى مجلد Backend
cd backend

# أنشئ بيئة افتراضية (Virtual Environment)
python -m venv venv

# فعّل البيئة الافتراضية
.\venv\Scripts\activate

# ثبّت المكتبات المطلوبة
pip install -r requirements.txt

# أنشئ ملف .env
# يمكنك نسخ المحتوى التالي وحفظه في backend\.env
```

**محتوى ملف `backend\.env`:**
```env
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
# أو إذا كنت تستخدم MongoDB Atlas:
# MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/

DB_NAME=rental_management

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# WhatsApp Configuration (اختياري للتطوير)
MANAGER_PHONE=+96812345678
WHATSAPP_API_TOKEN=your-whatsapp-token-here

# Environment
ENVIRONMENT=development
```

**تشغيل Backend:**
```powershell
# تأكد من أنك في مجلد backend والبيئة الافتراضية مفعلة
uvicorn server:app --host 127.0.0.1 --port 8001 --reload
```

✅ يجب أن ترى رسالة مثل:
```
INFO:     Uvicorn running on http://127.0.0.1:8001
INFO:     Application startup complete.
```

🔗 اختبر Backend: افتح المتصفح على http://127.0.0.1:8001/docs

---

### الخطوة 3️⃣: إعداد Frontend (React)

**افتح نافذة PowerShell جديدة:**

```powershell
# انتقل إلى مجلد Frontend
cd frontend

# ثبّت المكتبات
yarn install

# أنشئ ملف .env
# يمكنك نسخ المحتوى التالي وحفظه في frontend\.env
```

**محتوى ملف `frontend\.env`:**
```env
REACT_APP_BACKEND_URL=http://127.0.0.1:8001
```

**تشغيل Frontend:**
```powershell
# تأكد من أنك في مجلد frontend
yarn start
```

✅ يجب أن يفتح المتصفح تلقائيًا على http://localhost:3000

---

## 🎯 التحقق من التشغيل

### 1. Backend API
افتح: http://127.0.0.1:8001/docs
- يجب أن ترى واجهة Swagger UI مع جميع API endpoints

### 2. Frontend
افتح: http://localhost:3000
- يجب أن ترى صفحة تسجيل الدخول

### 3. قاعدة البيانات
```powershell
# اتصل بـ MongoDB
mongo

# أو إذا كنت تستخدم MongoDB Compass
# افتح MongoDB Compass واتصل بـ: mongodb://localhost:27017
```

---

## 🔑 تسجيل الدخول الأولي

### إنشاء مستخدم مدير (Admin)

يمكنك إنشاء مستخدم مدير بطريقتين:

#### الطريقة 1: عبر MongoDB مباشرة
```javascript
// افتح MongoDB shell أو Compass
use rental_management

// أنشئ مستخدم مدير
db.users.insertOne({
  phone: "+96812345678",
  name: "المدير",
  role: "admin",
  is_active: true,
  is_customer_only: false,
  created_at: new Date(),
  updated_at: new Date()
})
```

#### الطريقة 2: عبر API
استخدم Swagger UI على http://127.0.0.1:8001/docs:
1. اذهب إلى `/api/users` endpoint
2. اضغط "Try it out"
3. أدخل بيانات المستخدم
4. اضغط "Execute"

---

## 📝 ملاحظات مهمة

### 🔄 Hot Reload
- **Backend**: يدعم Hot Reload تلقائيًا (بفضل `--reload`)
- **Frontend**: يدعم Hot Reload تلقائيًا (بفضل React Scripts)

### 🛑 إيقاف الخوادم
```powershell
# لإيقاف Backend أو Frontend
# اضغط Ctrl+C في نافذة PowerShell
```

### 🔧 استكشاف الأخطاء

#### المشكلة: Backend لا يعمل
```powershell
# تحقق من تشغيل MongoDB
mongo --eval "db.adminCommand('ping')"

# تحقق من ملف .env
cat backend\.env

# تحقق من تثبيت المكتبات
pip list
```

#### المشكلة: Frontend لا يتصل بـ Backend
```powershell
# تحقق من ملف .env في Frontend
cat frontend\.env

# يجب أن يكون:
# REACT_APP_BACKEND_URL=http://127.0.0.1:8001

# أعد تشغيل Frontend بعد تعديل .env
```

#### المشكلة: Port مستخدم بالفعل
```powershell
# للبحث عن العملية المستخدمة للـ Port
netstat -ano | findstr :8001
netstat -ano | findstr :3000

# لإيقاف العملية (استبدل PID برقم العملية)
taskkill /PID <PID> /F
```

---

## 📦 البنية النهائية للمشروع

```
Rental-Management-System/
├── backend/
│   ├── venv/                    # البيئة الافتراضية
│   ├── .env                     # متغيرات البيئة (أنشئه يدويًا)
│   ├── server.py
│   ├── models.py
│   ├── requirements.txt
│   └── routers/
│
├── frontend/
│   ├── node_modules/            # يتم إنشاؤه بعد yarn install
│   ├── .env                     # متغيرات البيئة (أنشئه يدويًا)
│   ├── package.json
│   └── src/
│
└── README.md
```

---

## 🎓 الخطوات التالية

1. ✅ تشغيل MongoDB
2. ✅ تشغيل Backend على http://127.0.0.1:8001
3. ✅ تشغيل Frontend على http://localhost:3000
4. ✅ إنشاء مستخدم مدير
5. ✅ تسجيل الدخول والبدء في التطوير!

---

## 💡 نصائح للتطوير

### استخدام Git Bash أو WSL
إذا كنت تفضل بيئة Linux-like:
```bash
# في Git Bash أو WSL
source venv/bin/activate  # بدلاً من .\venv\Scripts\activate
```

### استخدام VS Code
- ثبّت امتدادات: Python, ESLint, Prettier
- افتح المشروع في VS Code
- استخدم Terminal المدمج

### قاعدة بيانات تجريبية
- استخدم MongoDB Atlas للتطوير (مجاني)
- أو استخدم Docker لـ MongoDB

---

## 📞 الدعم

إذا واجهت أي مشاكل:
1. راجع قسم [استكشاف الأخطاء](#-استكشاف-الأخطاء)
2. تحقق من سجلات الأخطاء في Terminal
3. تأكد من تثبيت جميع المتطلبات بشكل صحيح

---

**تاريخ الإنشاء**: نوفمبر 2025  
**الإصدار**: 1.0.0
