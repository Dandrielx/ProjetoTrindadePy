# backend/app/auth.py
import os
import jwt
from functools import wraps
from flask import request, jsonify
from .models import Usuario  # Importa o modelo SQLAlchemy
from .database import SessionLocal # Importa o criador de sessão da base de dados

# Este é o nosso decorator de autenticação
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # O token JWT é geralmente enviado no cabeçalho 'Authorization'
        if 'Authorization' in request.headers:
            # O formato comum é "Bearer <token>"
            token = request.headers['Authorization'].split(" ")[1]

        if not token:
            return jsonify({'message': 'O token está em falta!'}), 401

        db = SessionLocal()
        try:
            # Decodifica o token usando a mesma chave secreta
            jwt_secret = os.getenv("JWT_SECRET")
            data = jwt.decode(token, jwt_secret, algorithms=["HS256"])
            
            # --- LÓGICA ATUALIZADA ---
            # Procura o utilizador na base de dados usando o ID guardado no token
            current_user = db.query(Usuario).filter(Usuario.id == data['user_id']).first()
            
            if not current_user:
                 return jsonify({'message': 'O token é inválido!'}), 401

        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'O token expirou!'}), 401
        except Exception as e:
            return jsonify({'message': 'O token é inválido!', 'error': str(e)}), 401
        finally:
            # Garante que a sessão da base de dados é sempre fechada
            db.close()
        
        # Passa o objeto do utilizador (obtido do SQLAlchemy) para a rota
        return f(current_user, *args, **kwargs)

    return decorated