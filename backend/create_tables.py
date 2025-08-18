# backend/create_tables.py
import dotenv

dotenv.load_dotenv()

from app.database import init_db

# Chama a função que cria as tabelas
if __name__ == "__main__":
    init_db()