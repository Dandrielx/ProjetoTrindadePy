import random
import os
from dotenv import load_dotenv

# 1. Carrega variáveis DEPOIS dos imports de sistema
load_dotenv()

from app import create_app
from app.database import SessionLocal, init_db
# CORREÇÃO AQUI: hash_password está em models, não em auth
from app.models import Marcacao, Usuario, hash_password 

# Coordenadas da Ilha da Trindade
LAT_MIN, LAT_MAX = -20.5250, -20.4900
LON_MIN, LON_MAX = -29.3450, -29.2900

def seed_database():
    app = create_app()
    
    with app.app_context():
        print("--- Iniciando Simulação de Dados na Ilha da Trindade ---")
        
        # Cria tabelas se não existirem
        init_db()

        session = SessionLocal()

        try:
            # Cria usuário de teste
            email_teste = "pesquisador@trindade.com"
            usuario = session.query(Usuario).filter_by(email=email_teste).first()
            
            if not usuario:
                usuario = Usuario(
                    nome="Pesquisador Trindade",
                    instituicao="UFES/FURG",
                    email=email_teste,
                    senha_hash=hash_password("123456")
                )
                session.add(usuario)
                session.commit()
                session.refresh(usuario)
                print(f"Usuário criado: {email_teste}")
            else:
                print(f"Usando usuário existente: {usuario.email}")

            # Gera marcacões
            tipos = ['Microplástico', 'Óleo', 'Rede de Pesca', 'Garrafa PET', 'Fragmento Rígido']
            qtd_marcacoes = 50
            
            novas_marcacoes = []
            for _ in range(qtd_marcacoes):
                marcacao = Marcacao(
                    tipo_poluicao=random.choice(tipos),
                    latitude=random.uniform(LAT_MIN, LAT_MAX),
                    longitude=random.uniform(LON_MIN, LON_MAX),
                    imagem_url="https://via.placeholder.com/150", 
                    intensidade=random.randint(1, 10),
                    descricao="Dado gerado via simulação (seed)",
                    usuario_id=usuario.id
                )
                novas_marcacoes.append(marcacao)

            session.add_all(novas_marcacoes)
            session.commit()
            print(f"--- Sucesso! {qtd_marcacoes} pontos adicionados ao mapa. ---")
            
        except Exception as e:
            print(f"Erro ao inserir dados: {e}")
            session.rollback()
        finally:
            session.close()

if __name__ == "__main__":
    seed_database()