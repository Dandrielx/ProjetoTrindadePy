import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Carrega a URL do banco de dados do arquivo .env
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("A variável de ambiente DATABASE_URL não foi definida.")

# Engine de conexão com o banco
engine = create_engine(DATABASE_URL)

# Sessão para interagir com o banco
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para as nossas classes de modelo (que agora estão em models.py)
Base = declarative_base()

def init_db():
    # Importa os modelos aqui dentro da função para garantir que a Base
    # já "conhece" as suas tabelas antes de tentar criá-las.
    from . import models
    print("A criar tabelas na base de dados...")
    Base.metadata.create_all(bind=engine)
    print("Tabelas criadas com sucesso.")