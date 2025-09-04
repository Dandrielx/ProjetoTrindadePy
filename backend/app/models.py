from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from flask_bcrypt import Bcrypt
from .database import Base # Importa a Base declarativa do nosso ficheiro de base de dados

# Inicializa o Bcrypt
bcrypt = Bcrypt()

# --- DEFINIÇÃO DOS MODELOS (TABELAS) DO SQLAlchemy ---

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    instituicao = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    senha_hash = Column(String, nullable=False)

    # Relacionamento: Um utilizador tem muitas marcações
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
    
    # Chave estrangeira para o ID do utilizador
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)

    # Relacionamento: Uma marcação pertence a um autor (utilizador)
    autor = relationship("Usuario", back_populates="marcacoes")


# --- FUNÇÕES DE AJUDA PARA UTILIZADORES ---

def hash_password(password):
    """Gera o hash de uma senha."""
    return bcrypt.generate_password_hash(password).decode('utf-8')

def check_password(hashed_password, password):
    """Verifica se uma senha corresponde ao seu hash."""
    return bcrypt.check_password_hash(hashed_password, password)