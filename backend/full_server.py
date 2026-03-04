from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
import os
from bson import ObjectId

app = FastAPI(title="نظام إدارة التأجير", version="2.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
mongo_url = os.getenv("MONGO_URL", "mongodb://mongodb:27017")
client = AsyncIOMotorClient(mongo_url)
db = client[os.getenv("DB_NAME", "rental_management")]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"

# HTML Template for main page
HTML_TEMPLATE = """
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>نظام إدارة التأجير - الصفحة الرئيسية</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            direction: rtl;
        }

        /* Header */
        .header {
            background: rgba(255, 255, 255, 0.95);
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 1rem 0;
            position: fixed;
            width: 100%;
            top: 0;
            z-index: 1000;
        }

        .nav-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 1.5rem;
            font-weight: bold;
            color: #764ba2;
        }

        .nav-links {
            display: flex;
            gap: 2rem;
            list-style: none;
        }

        .nav-links a {
            text-decoration: none;
            color: #333;
            font-weight: 500;
            transition: color 0.3s;
        }

        .nav-links a:hover {
            color: #667eea;
        }

        .login-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 0.5rem 1.5rem;
            border-radius: 25px;
            text-decoration: none;
            transition: transform 0.3s;
        }

        .login-btn:hover {
            transform: translateY(-2px);
        }

        /* Hero Section */
        .hero {
            margin-top: 80px;
            padding: 4rem 2rem;
            text-align: center;
            color: white;
        }

        .hero h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            animation: fadeInUp 1s;
        }

        .hero p {
            font-size: 1.3rem;
            margin-bottom: 2rem;
            opacity: 0.9;
            animation: fadeInUp 1s 0.2s both;
        }

        .hero-buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
            animation: fadeInUp 1s 0.4s both;
        }

        .btn-primary {
            background: white;
            color: #764ba2;
            padding: 1rem 2rem;
            border-radius: 30px;
            text-decoration: none;
            font-weight: bold;
            transition: all 0.3s;
        }

        .btn-primary:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }

        .btn-secondary {
            background: transparent;
            color: white;
            padding: 1rem 2rem;
            border: 2px solid white;
            border-radius: 30px;
            text-decoration: none;
            font-weight: bold;
            transition: all 0.3s;
        }

        .btn-secondary:hover {
            background: white;
            color: #764ba2;
        }

        /* Features Section */
        .features {
            background: white;
            padding: 4rem 2rem;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .section-title {
            text-align: center;
            font-size: 2.5rem;
            color: #333;
            margin-bottom: 3rem;
        }

        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }

        .feature-card {
            padding: 2rem;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            text-align: center;
            transition: transform 0.3s;
        }

        .feature-card:hover {
            transform: translateY(-5px);
        }

        .feature-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }

        .feature-card h3 {
            color: #333;
            margin-bottom: 1rem;
        }

        .feature-card p {
            color: #666;
            line-height: 1.6;
        }

        /* Stats Section */
        .stats {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 4rem 2rem;
            color: white;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
            max-width: 1000px;
            margin: 0 auto;
        }

        .stat-card {
            text-align: center;
        }

        .stat-number {
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }

        .stat-label {
            font-size: 1.1rem;
            opacity: 0.9;
        }

        /* Services Section */
        .services {
            background: #f8f9fa;
            padding: 4rem 2rem;
        }

        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
        }

        .service-card {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            text-align: center;
            transition: all 0.3s;
        }

        .service-card:hover {
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transform: translateY(-5px);
        }

        .service-icon {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
            font-size: 1.5rem;
            color: white;
        }

        /* Footer */
        .footer {
            background: #1a1a1a;
            color: white;
            padding: 3rem 2rem 1rem;
        }

        .footer-content {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin-bottom: 2rem;
        }

        .footer-section h3 {
            margin-bottom: 1rem;
            color: #667eea;
        }

        .footer-section p,
        .footer-section ul {
            line-height: 1.8;
            color: #aaa;
        }

        .footer-section ul {
            list-style: none;
        }

        .footer-section a {
            color: #aaa;
            text-decoration: none;
            transition: color 0.3s;
        }

        .footer-section a:hover {
            color: #667eea;
        }

        .footer-bottom {
            text-align: center;
            padding-top: 2rem;
            border-top: 1px solid #333;
            color: #aaa;
        }

        /* Animations */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Responsive */
        @media (max-width: 768px) {
            .hero h1 {
                font-size: 2rem;
            }

            .hero p {
                font-size: 1rem;
            }

            .nav-links {
                display: none;
            }

            .hero-buttons {
                flex-direction: column;
                align-items: center;
            }

            .features-grid,
            .services-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="nav-container">
            <div class="logo">
                <span>🏢</span>
                <span>نظام إدارة التأجير</span>
            </div>
            <nav>
                <ul class="nav-links">
                    <li><a href="#home">الرئيسية</a></li>
                    <li><a href="#features">المميزات</a></li>
                    <li><a href="#services">الخدمات</a></li>
                    <li><a href="#about">من نحن</a></li>
                    <li><a href="#contact">اتصل بنا</a></li>
                </ul>
            </nav>
            <a href="/login" class="login-btn">تسجيل الدخول</a>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="hero" id="home">
        <h1>نظام إدارة التأجير المتكامل</h1>
        <p>حل شامل لإدارة عمليات التأجير والمعدات والعملاء بكفاءة عالية</p>
        <div class="hero-buttons">
            <a href="/register" class="btn-primary">ابدأ الآن مجاناً</a>
            <a href="#features" class="btn-secondary">اكتشف المزيد</a>
        </div>
    </section>

    <!-- Features Section -->
    <section class="features" id="features">
        <div class="container">
            <h2 class="section-title">لماذا تختار نظامنا؟</h2>
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">📊</div>
                    <h3>تقارير مفصلة</h3>
                    <p>احصل على تقارير شاملة عن أداء عملك وإحصائيات مفصلة عن العمليات والإيرادات</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">📱</div>
                    <h3>متوافق مع الجوال</h3>
                    <p>استخدم النظام من أي جهاز وفي أي وقت مع واجهة سهلة الاستخدام</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🔒</div>
                    <h3>أمان عالي</h3>
                    <p>حماية متقدمة لبياناتك مع نسخ احتياطي تلقائي وتشفير كامل</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">⚡</div>
                    <h3>سرعة فائقة</h3>
                    <p>أداء سريع ومعالجة فورية للعمليات مع واجهة سلسة</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🌐</div>
                    <h3>دعم متعدد اللغات</h3>
                    <p>واجهة باللغة العربية والإنجليزية مع دعم كامل للاتجاه من اليمين لليسار</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">💬</div>
                    <h3>تنبيهات WhatsApp</h3>
                    <p>إرسال تنبيهات تلقائية للعملاء عبر WhatsApp</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Stats Section -->
    <section class="stats">
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">500+</div>
                <div class="stat-label">عميل سعيد</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">10,000+</div>
                <div class="stat-label">عملية تأجير</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">99.9%</div>
                <div class="stat-label">وقت التشغيل</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">24/7</div>
                <div class="stat-label">دعم فني</div>
            </div>
        </div>
    </section>

    <!-- Services Section -->
    <section class="services" id="services">
        <div class="container">
            <h2 class="section-title">خدماتنا</h2>
            <div class="services-grid">
                <div class="service-card">
                    <div class="service-icon">🚗</div>
                    <h3>إدارة المعدات</h3>
                    <p>تتبع جميع معداتك وحالتها وتوفرها في الوقت الفعلي</p>
                </div>
                <div class="service-card">
                    <div class="service-icon">👥</div>
                    <h3>إدارة العملاء</h3>
                    <p>قاعدة بيانات شاملة للعملاء مع تاريخ المعاملات الكامل</p>
                </div>
                <div class="service-card">
                    <div class="service-icon">📄</div>
                    <h3>العقود والفواتير</h3>
                    <p>إنشاء وإدارة العقود والفواتير بشكل تلقائي</p>
                </div>
                <div class="service-card">
                    <div class="service-icon">📈</div>
                    <h3>التقارير المالية</h3>
                    <p>تقارير مالية مفصلة وإحصائيات الأرباح والخسائر</p>
                </div>
                <div class="service-card">
                    <div class="service-icon">🔔</div>
                    <h3>التنبيهات الذكية</h3>
                    <p>تنبيهات تلقائية لانتهاء العقود والمواعيد المهمة</p>
                </div>
                <div class="service-card">
                    <div class="service-icon">🔧</div>
                    <h3>جدولة الصيانة</h3>
                    <p>تتبع وجدولة صيانة المعدات بشكل منتظم</p>
                </div>
            </div>
        </div>
    </section>

    <!-- About Section -->
    <section class="features" id="about">
        <div class="container">
            <h2 class="section-title">من نحن</h2>
            <div style="max-width: 800px; margin: 0 auto; text-align: center; line-height: 1.8; color: #666;">
                <p style="margin-bottom: 1.5rem;">
                    نحن فريق متخصص في تطوير الحلول البرمجية المتكاملة لقطاع التأجير.
                    نسعى لتوفير أفضل الأدوات التقنية التي تساعد أصحاب الأعمال على إدارة عملياتهم بكفاءة وفعالية.
                </p>
                <p>
                    مع خبرة تزيد عن 10 سنوات في هذا المجال، نفخر بخدمة مئات العملاء
                    وتسهيل آلاف العمليات يومياً من خلال منصتنا المتطورة.
                </p>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer" id="contact">
        <div class="footer-content">
            <div class="footer-section">
                <h3>نظام إدارة التأجير</h3>
                <p>
                    حل متكامل وموثوق لإدارة جميع عمليات التأجير
                    بكفاءة عالية وسهولة استخدام
                </p>
            </div>
            <div class="footer-section">
                <h3>روابط سريعة</h3>
                <ul>
                    <li><a href="#home">الرئيسية</a></li>
                    <li><a href="#features">المميزات</a></li>
                    <li><a href="#services">الخدمات</a></li>
                    <li><a href="/api">API للمطورين</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h3>تواصل معنا</h3>
                <ul>
                    <li>📧 info@rental-system.com</li>
                    <li>📱 +968 9234 5678</li>
                    <li>📍 مسقط، سلطنة عمان</li>
                    <li>🕒 الأحد - الخميس: 9 صباحاً - 6 مساءً</li>
                </ul>
            </div>
            <div class="footer-section">
                <h3>تابعنا</h3>
                <p>احصل على آخر التحديثات والعروض</p>
                <div style="margin-top: 1rem;">
                    <a href="#" style="margin-left: 10px;">Facebook</a>
                    <a href="#" style="margin-left: 10px;">Twitter</a>
                    <a href="#" style="margin-left: 10px;">LinkedIn</a>
                    <a href="#">Instagram</a>
                </div>
            </div>
        </div>
        <div class="footer-bottom">
            <p>© 2024 نظام إدارة التأجير. جميع الحقوق محفوظة.</p>
        </div>
    </footer>
</body>
</html>
"""

@app.get("/", response_class=HTMLResponse)
async def root():
    return HTML_TEMPLATE

@app.get("/api")
async def api_root():
    return {
        "message": "Rental Management System API",
        "version": "2.0.0",
        "status": "running",
        "endpoints": {
            "auth": "/api/auth",
            "equipment": "/api/equipment",
            "customers": "/api/customers",
            "rentals": "/api/rentals",
            "reports": "/api/reports"
        }
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "rental-management",
        "version": "2.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/login", response_class=HTMLResponse)
async def login_page():
    return """
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تسجيل الدخول</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0;
            }
            .login-container {
                background: white;
                padding: 3rem;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                width: 100%;
                max-width: 400px;
            }
            h2 {
                text-align: center;
                color: #333;
                margin-bottom: 2rem;
            }
            .form-group {
                margin-bottom: 1.5rem;
            }
            label {
                display: block;
                margin-bottom: 0.5rem;
                color: #666;
            }
            input {
                width: 100%;
                padding: 0.8rem;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 1rem;
            }
            button {
                width: 100%;
                padding: 1rem;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 1rem;
                cursor: pointer;
                transition: transform 0.3s;
            }
            button:hover {
                transform: translateY(-2px);
            }
            .back-link {
                text-align: center;
                margin-top: 1rem;
            }
            .back-link a {
                color: #667eea;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="login-container">
            <h2>🔐 تسجيل الدخول</h2>
            <form>
                <div class="form-group">
                    <label>اسم المستخدم أو البريد الإلكتروني</label>
                    <input type="text" placeholder="أدخل اسم المستخدم" required>
                </div>
                <div class="form-group">
                    <label>كلمة المرور</label>
                    <input type="password" placeholder="أدخل كلمة المرور" required>
                </div>
                <button type="submit">دخول</button>
            </form>
            <div class="back-link">
                <a href="/">العودة للصفحة الرئيسية</a>
            </div>
        </div>
    </body>
    </html>
    """

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)