# backend/app/database.py
import os
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.ext.declarative import declarative_base

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("A variável de ambiente DATABASE_URL não foi definida.")

# Engine de conexão com o banco
engine = create_engine(DATABASE_URL)

# Sessão para interagir com o banco
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para as classes de modelo
Base = declarative_base()

# --- DEFINIÇÃO DOS MODELOS (TABELAS) ---

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    instituicao = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    senha_hash = Column(String, nullable=False)

    # Relacionamento: Um usuário tem muitas marcações
    marcacoes = relationship("Marcacao", back_populates="autor")


class Marcacao(Base):
    __tablename__ = "marcacoes"

    id = Column(Integer, primary_key=True, index=True)
    tipo_poluicao = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    imagem_url = Column(String, nullable=True)
    intensidade = Column(Integer, nullable=False)
    descricao = Column(String, nullable=True)
    
    # Chave estrangeira para o ID do usuário
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)

    # Relacionamento: Uma marcação pertence a um autor (usuário)
    autor = relationship("Usuario", back_populates="marcacoes")


def init_db():
    # Cria todas as tabelas no banco de dados
    print("Criando tabelas no banco de dados...")
    Base.metadata.create_all(bind=engine)
    print("Tabelas criadas com sucesso.")