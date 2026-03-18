# backend/app/models.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, func
# Importação explícita de datetime para o default da coleta
from datetime import datetime
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

    # Relacionamentos
    marcacoes = relationship("Marcacao", back_populates="autor")
    coletas = relationship("Coleta", back_populates="pesquisador")

class Marcacao(Base):
    __tablename__ = "marcacoes"

    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    projeto = Column(String, default='comunitario', nullable=False)
    
    # Atributos fixos do local
    agua = Column(Boolean, default=False, nullable=False)
    tipo_local = Column(String, nullable=False) 
    
    # Criador do ponto geográfico
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    autor = relationship("Usuario", back_populates="marcacoes")
    
    # Uma marcação agora tem várias coletas (histórico)
    coletas = relationship("Coleta", back_populates="ponto", cascade="all, delete-orphan")

class Coleta(Base):
    __tablename__ = "coletas"

    id = Column(Integer, primary_key=True, index=True)
    marcacao_id = Column(Integer, ForeignKey("marcacoes.id"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False) # Quem realizou a coleta
    
    # Dados que variam por coleta
    data_coleta = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    descricao = Column(String, nullable=True)
    imagem_url = Column(String, nullable=True)
    intensidade = Column(Integer, default=5, nullable=False)
    tipo_poluicao = Column(String, nullable=False) # ex: 'pesquisa' ou 'oleo'

    # Relacionamentos
    ponto = relationship("Marcacao", back_populates="coletas")
    pesquisador = relationship("Usuario", back_populates="coletas")
    detalhes = relationship("MarcacaoDetalhe", back_populates="coleta", cascade="all, delete-orphan")

class MarcacaoDetalhe(Base):
    __tablename__ = "marcacoes_detalhes"

    id = Column(Integer, primary_key=True, index=True)
    # Agora vinculado à Coleta, não à Marcação
    coleta_id = Column(Integer, ForeignKey("coletas.id"), nullable=False)
    chave = Column(String, nullable=False) 
    valor = Column(String, nullable=False) 

    coleta = relationship("Coleta", back_populates="detalhes")

def hash_password(password):
    return bcrypt.generate_password_hash(password).decode('utf-8')

def check_password(hashed_password, password):
    return bcrypt.check_password_hash(hashed_password, password)