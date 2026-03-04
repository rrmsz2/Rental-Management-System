# ⚠️ تحذير أمني عاجل - URGENT SECURITY WARNING

## 🚨 يجب تنفيذ هذه الخطوات فوراً:

### 1. غيّر كلمة مرور Root فوراً:
```bash
# اتصل بالخادم
ssh root@75.119.156.14

# غيّر كلمة المرور فوراً
passwd
# أدخل كلمة مرور قوية جديدة
```

### 2. غيّر كلمة مرور VNC:
```bash
vncpasswd
# أدخل كلمة مرور جديدة
```

### 3. أنشئ مستخدم جديد وعطّل root SSH:
```bash
# أنشئ مستخدم جديد
adduser rental_admin
usermod -aG sudo rental_admin
usermod -aG docker rental_admin

# انسخ SSH keys إذا كان لديك
rsync --archive --chown=rental_admin:rental_admin ~/.ssh /home/rental_admin

# عطّل root login
nano /etc/ssh/sshd_config
# غيّر: PermitRootLogin no
# غيّر: PasswordAuthentication no (بعد إعداد SSH keys)

systemctl restart sshd
```

### 4. قم بإعداد Firewall:
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

### 5. قم بتحديث النظام:
```bash
apt update && apt upgrade -y
apt install fail2ban -y
```

## ⛔ لا تشارك أبداً:
- كلمات مرور root
- كلمات مرور VNC
- SSH private keys
- أي بيانات دخول

## ✅ بدلاً من ذلك، شارك:
- IP العام فقط
- نوع النظام
- الخدمات المطلوبة
- المنافذ المتاحة

---

# بعد تأمين الخادم، استخدم هذه الخطوات للنشر: