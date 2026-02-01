from passlib.context import CryptContext
print("Imported CryptContext")
try:
    pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
    print("Context created")
    h = pwd_context.hash("test")
    print(f"Hash created: {h}")
except Exception as e:
    print(f"Error: {e}")
