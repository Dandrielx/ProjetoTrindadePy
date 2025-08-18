# backend/app/routes.py
from flask import Blueprint, request, jsonify
# import jwt # para gerar tokens no futuro
from .models import add_user, find_user_by_email, check_password

# Cria um Blueprint. É como um mini-app com suas próprias rotas.
# O prefixo '/api/users' será adicionado a todas as rotas aqui.
users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    nome = data.get('nome')
    email = data.get('email')
    senha = data.get('senha')

    if not all([nome, email, senha]):
        return jsonify({"error": "Nome, email e senha são obrigatórios."}), 400

    if find_user_by_email(email):
        return jsonify({"error": "Este email já está cadastrado."}), 409

    new_user = add_user(nome, email, senha)
    
    return jsonify({"message": "Usuário criado com sucesso!", "user": {"nome": new_user['username'], "email": new_user['email']}}), 201

@users_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    senha = data.get('senha')

    if not email or not senha:
        return jsonify({"error": "Email e senha são obrigatórios."}), 400

    user = find_user_by_email(email)

    if user and check_password(user['password'], senha):
        # Senha correta, gerar token JWT aqui no futuro
        # token = jwt.encode(...)
        return jsonify({
            "message": "Login bem-sucedido!",
            # "token": token,
            "user": {
                "nome": user['username'],
                "email": user['email']
            }
        }), 200
    
    return jsonify({"error": "Email ou senha inválidos."}), 401