# backend/create_tables.py
import dotenv
dotenv.load_dotenv()

from app.database import engine, Base, init_db

def reset_database():
    print("Conectando ao Neon e deletando tabelas antigas...")
    # Isso apaga tudo o que estiver definido no Base.metadata
    Base.metadata.drop_all(bind=engine) 
    
    print("Criando novas tabelas com a estrutura atualizada...")
    Base.metadata.create_all(bind=engine)
    print("Banco de dados resetado com sucesso!")

if __name__ == "__main__":
    reset_database()