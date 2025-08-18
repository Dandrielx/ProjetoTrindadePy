# backend/app/__init__.py
from flask import Flask
from flask_cors import CORS
from .models import bcrypt
from .routes import users_bp

def create_app():
    app = Flask(__name__)
    CORS(app) # Habilita CORS

    # Inicializa extensões
    bcrypt.init_app(app)

    # Registra o Blueprint de rotas de usuário
    app.register_blueprint(users_bp)

    # Rota de teste
    @app.route('/')
    def index():
        return "Servidor backend do Projeto Trindade está no ar!"

    return app