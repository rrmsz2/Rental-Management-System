# سكريبت تشغيل سريع للـ Backend
# Quick Start Script for Backend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Rental Management System - Backend  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# التحقق من وجود Python
Write-Host "[1/5] التحقق من Python..." -ForegroundColor Yellow
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python غير مثبت! يرجى تثبيت Python 3.11+ أولاً" -ForegroundColor Red
    exit 1
}
$pythonVersion = python --version
Write-Host "✅ $pythonVersion" -ForegroundColor Green
Write-Host ""

# التحقق من البيئة الافتراضية
Write-Host "[2/5] التحقق من البيئة الافتراضية..." -ForegroundColor Yellow
if (!(Test-Path "venv")) {
    Write-Host "⚠️  البيئة الافتراضية غير موجودة. جاري الإنشاء..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "✅ تم إنشاء البيئة الافتراضية" -ForegroundColor Green
} else {
    Write-Host "✅ البيئة الافتراضية موجودة" -ForegroundColor Green
}
Write-Host ""

# تفعيل البيئة الافتراضية
Write-Host "[3/5] تفعيل البيئة الافتراضية..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"
Write-Host "✅ تم تفعيل البيئة الافتراضية" -ForegroundColor Green
Write-Host ""

# تثبيت المكتبات
Write-Host "[4/5] تثبيت المكتبات..." -ForegroundColor Yellow
pip install -r requirements.txt --quiet
Write-Host "✅ تم تثبيت المكتبات" -ForegroundColor Green
Write-Host ""

# التحقق من ملف .env
Write-Host "[5/5] التحقق من ملف .env..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Write-Host "⚠️  ملف .env غير موجود!" -ForegroundColor Yellow
    if (Test-Path "env.example") {
        Write-Host "📋 جاري نسخ env.example إلى .env..." -ForegroundColor Yellow
        Copy-Item "env.example" ".env"
        Write-Host "✅ تم إنشاء ملف .env من env.example" -ForegroundColor Green
        Write-Host "⚠️  يرجى تحديث إعدادات MongoDB و JWT في ملف .env" -ForegroundColor Yellow
    } else {
        Write-Host "❌ env.example غير موجود! يرجى إنشاء ملف .env يدويًا" -ForegroundColor Red
    }
} else {
    Write-Host "✅ ملف .env موجود" -ForegroundColor Green
}
Write-Host ""

# تشغيل الخادم
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🚀 جاري تشغيل Backend Server...  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Backend API: http://127.0.0.1:8001" -ForegroundColor Green
Write-Host "📚 API Docs: http://127.0.0.1:8001/docs" -ForegroundColor Green
Write-Host ""
Write-Host "⏹️  للإيقاف: اضغط Ctrl+C" -ForegroundColor Yellow
Write-Host ""

uvicorn server:app --host 127.0.0.1 --port 8001 --reload
