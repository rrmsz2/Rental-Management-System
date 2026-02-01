# سكريبت تشغيل سريع للـ Frontend
# Quick Start Script for Frontend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Rental Management System - Frontend  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# التحقق من وجود Node.js
Write-Host "[1/4] التحقق من Node.js..." -ForegroundColor Yellow
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js غير مثبت! يرجى تثبيت Node.js 18+ أولاً" -ForegroundColor Red
    exit 1
}
$nodeVersion = node --version
Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green
Write-Host ""

# التحقق من وجود Yarn
Write-Host "[2/4] التحقق من Yarn..." -ForegroundColor Yellow
if (!(Get-Command yarn -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Yarn غير مثبت! جاري التثبيت..." -ForegroundColor Yellow
    npm install -g yarn
    Write-Host "✅ تم تثبيت Yarn" -ForegroundColor Green
} else {
    $yarnVersion = yarn --version
    Write-Host "✅ Yarn $yarnVersion" -ForegroundColor Green
}
Write-Host ""

# تثبيت المكتبات
Write-Host "[3/4] تثبيت المكتبات..." -ForegroundColor Yellow
if (!(Test-Path "node_modules")) {
    Write-Host "📦 جاري تثبيت المكتبات (قد يستغرق بضع دقائق)..." -ForegroundColor Yellow
    yarn install
    Write-Host "✅ تم تثبيت المكتبات" -ForegroundColor Green
} else {
    Write-Host "✅ المكتبات مثبتة بالفعل" -ForegroundColor Green
}
Write-Host ""

# التحقق من ملف .env
Write-Host "[4/4] التحقق من ملف .env..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Write-Host "⚠️  ملف .env غير موجود!" -ForegroundColor Yellow
    if (Test-Path "env.example") {
        Write-Host "📋 جاري نسخ env.example إلى .env..." -ForegroundColor Yellow
        Copy-Item "env.example" ".env"
        Write-Host "✅ تم إنشاء ملف .env من env.example" -ForegroundColor Green
    } else {
        Write-Host "❌ env.example غير موجود! يرجى إنشاء ملف .env يدويًا" -ForegroundColor Red
    }
} else {
    Write-Host "✅ ملف .env موجود" -ForegroundColor Green
}
Write-Host ""

# تشغيل الخادم
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🚀 جاري تشغيل Frontend Server...  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "🔗 Backend: http://127.0.0.1:8001" -ForegroundColor Green
Write-Host ""
Write-Host "⏹️  للإيقاف: اضغط Ctrl+C" -ForegroundColor Yellow
Write-Host ""

yarn start
