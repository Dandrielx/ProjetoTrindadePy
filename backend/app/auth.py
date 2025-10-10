import os
import jwt
from functools import wraps
from flask import request, jsonify
from .models import Usuario
from .database import SessionLocal

# Este é o nosso decorator de autenticação
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Usar .get() é mais seguro pois evita erros se o cabeçalho não existir
        auth_header = request.headers.get('Authorization')

        # Log para depurar o que o backend está a receber
        print(f"Auth Header Recebido: {auth_header}")

        # Verifica se o cabeçalho existe e tem o formato "Bearer <token>"
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(" ")[1]
        else:
            print("Cabeçalho 'Authorization' em falta ou mal formatado.")

        if not token:
            return jsonify({'message': 'O token está em falta ou o cabeçalho está mal formatado!'}), 401

        db = SessionLocal()
        try:
            jwt_secret = os.getenv("JWT_SECRET")
            # Verifica se a chave secreta foi carregada do .env
            if not jwt_secret:
                print("ERRO CRÍTICO: A variável de ambiente JWT_SECRET não foi definida no backend.")
                return jsonify({'message': 'Erro de configuração interna do servidor.'}), 500
            
            data = jwt.decode(token, jwt_secret, algorithms=["HS256"])
            
            # Procura o utilizador na base de dados usando o ID guardado no token
            current_user = db.query(Usuario).filter(Usuario.id == data['user_id']).first()
            
            if not current_user:
                 print(f"Token válido, mas o utilizador com id {data.get('user_id')} não foi encontrado na base de dados.")
                 return jsonify({'message': 'O token é inválido (utilizador não encontrado)!'}), 401

        except jwt.ExpiredSignatureError:
            print("Erro de token: A assinatura expirou.")
            return jsonify({'message': 'O token expirou!'}), 401
        except Exception as e:
            # Log do erro específico para o terminal do backend
            print(f"Erro ao decodificar o token: {e}")
            return jsonify({'message': 'O token é inválido!', 'error': str(e)}), 401
        finally:
            # Garante que a sessão da base de dados é sempre fechada
            db.close()
        
        # Passa o objeto do utilizador para a rota
        return f(current_user, *args, **kwargs)

    return decorated
