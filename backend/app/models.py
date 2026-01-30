# backend/app/models.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, func
from sqlalchemy.orm import relationship
from flask_bcrypt import Bcrypt
from .database import Base 

bcrypt = Bcrypt()

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    instituicao = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    senha_hash = Column(String, nullable=False)
    
    cargo = Column(String, default='cidadao', nullable=False) # 'cidadao' ou 'pesquisador'
    
    pontuacao = Column(Integer, default=0)
    is_admin = Column(Boolean, default=False)

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
    data_criacao = Column(DateTime(timezone=True), server_default=func.now())
    
    projeto = Column(String, default='comunitario', nullable=False) # 'comunitario', 'quimica_ma', 'trindade'
    
    agua = Column(Boolean, default=False, nullable=False)
    tipo_local = Column(String, nullable=False) # 'unico' para lixo único ou 'sujo' para local sujo
    
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    autor = relationship("Usuario", back_populates="marcacoes")
    
    detalhes = relationship("MarcacaoDetalhe", back_populates="marcacao", cascade="all, delete-orphan")

class MarcacaoDetalhe(Base):
    __tablename__ = "marcacoes_detalhes"

    id = Column(Integer, primary_key=True, index=True)
    marcacao_id = Column(Integer, ForeignKey("marcacoes.id"), nullable=False)
    chave = Column(String, nullable=False) # Ex: 'pH', 'salinidade'
    valor = Column(String, nullable=False) # Guardado como string para flexibilidade

    marcacao = relationship("Marcacao", back_populates="detalhes")

def hash_password(password):
    return bcrypt.generate_password_hash(password).decode('utf-8')

def check_password(hashed_password, password):
    return bcrypt.check_password_hash(hashed_password, password)