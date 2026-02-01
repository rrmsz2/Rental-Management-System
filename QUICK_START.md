# 🚀 تشغيل سريع - Quick Start

## الخطوات الأساسية

### 1️⃣ تشغيل MongoDB
```powershell
# ابدأ خدمة MongoDB
net start MongoDB
```

### 2️⃣ تشغيل Backend
```powershell
# افتح PowerShell في مجلد المشروع
cd backend

# شغّل السكريبت التلقائي
.\start.ps1
```

### 3️⃣ تشغيل Frontend
```powershell
# افتح PowerShell جديد في مجلد المشروع
cd frontend

# شغّل السكريبت التلقائي
.\start.ps1
```

---

## 🔗 الروابط

- **Frontend**: http://localhost:3000
- **Backend API**: http://127.0.0.1:8001
- **API Docs**: http://127.0.0.1:8001/docs

---

## 📚 للمزيد من التفاصيل

راجع الدليل الكامل: [LOCAL_SETUP_WINDOWS.md](./LOCAL_SETUP_WINDOWS.md)

---

## ⚠️ ملاحظة مهمة

قبل التشغيل للمرة الأولى:
1. تأكد من تثبيت Python 3.11+ و Node.js 18+
2. تأكد من تشغيل MongoDB
3. أنشئ ملفات `.env` من `env.example` في كل من `backend` و `frontend`
