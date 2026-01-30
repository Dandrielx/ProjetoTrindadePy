# backend/app/routes.py
import os
import jwt
import datetime
from flask import Blueprint, request, jsonify
from .database import SessionLocal
from .models import Usuario, hash_password, check_password
from .auth import token_required

# Renomeei de 'users_bp' para 'auth_bp' para ficar mais claro
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    nome = data.get('nome')
    email = data.get('email')
    senha = data.get('senha')
    cargo = data.get('cargo', 'cidadao')

    if not all([nome, email, senha]):
        return jsonify({"error": "Nome, email e senha são obrigatórios."}), 400

    db = SessionLocal()
    try:
        # Verifica se o utilizador já existe no banco de dados
        if db.query(Usuario).filter(Usuario.email == email).first():
            return jsonify({"error": "Este email já está cadastrado."}), 409

        # Cria a nova instância do utilizador com a senha hasheada
        novo_usuario = Usuario(
            nome=nome,
            email=email,
            senha_hash=hash_password(senha), # Usa a função de hash de models.py
            cargo=cargo
        )
        
        db.add(novo_usuario)
        db.commit()
        
        return jsonify({
            "message": "Utilizador criado com sucesso!",
            "user": {"nome": novo_usuario.nome, "email": novo_usuario.email, "role": cargo}
        }), 201
    finally:
        db.close()

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    senha = data.get('senha')

    if not email or not senha:
        return jsonify({"error": "Email e senha são obrigatórios."}), 400

    db = SessionLocal()
    try:
        # Encontra o utilizador no banco de dados
        user = db.query(Usuario).filter(Usuario.email == email).first()

        # Verifica se o utilizador existe e se a senha está correta
        if user and check_password(user.senha_hash, senha):
            jwt_secret = os.getenv("JWT_SECRET")
            if not jwt_secret:
                return jsonify({"error": "Configuração do servidor incompleta."}), 500

            token_payload = {
                'user_id': user.id, 
                "id": user.id,
                'email': user.email,
                'cargo': user.cargo,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
            }
            token = jwt.encode(token_payload, jwt_secret, algorithm="HS256")

            return jsonify({
                "message": "Login bem-sucedido!",
                "token": token,
                "user": {"nome": user.nome, "id": user.id, "email": user.email, "cargo": user.cargo}
            }), 200
        
        return jsonify({"error": "Email ou senha inválidos."}), 401
    finally:
        db.close()
        
@auth_bp.route('/validate-token', methods=['GET'])
@token_required
def validate_token(current_user):
    # Se o decorator @token_required passar, o token é válido.
    # Retornamos os dados do usuário para o app poder usá-los se quiser.
    return jsonify({
        "message": "Token é válido.",
        "user": {
            "nome": current_user.nome,
            "id": current_user.id,
            "email": current_user.email, 
            "cargo": current_user.cargo}
    }), 200