import os
from dotenv import load_dotenv
from sqlmodel import Session, create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ ERROR: La variable DATABASE_URL no está configurada en tu .env")
    exit(1)

try:
    print("Conectando a Supabase desde Codespaces...")
    engine = create_engine(DATABASE_URL)

    with Session(engine) as session:
        result = session.exec(text("SELECT version();")).first()
        print("✅ ¡CONEXIÓN EXITOSA CON SUPABASE!")
        print(f"Versión de PostgreSQL: {result[0]}")

except Exception as e:
    print("❌ ERROR DE CONEXIÓN:")
    print(e)