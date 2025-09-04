# backend/app/__init__.py
from flask import Flask
from flask_cors import CORS
from .models import bcrypt
from .routes import auth_bp
from .marcacoes_routes import marcacoes_bp

def create_app():
    app = Flask(__name__)
    CORS(app) # Habilita CORS

    # Inicializa extensões
    bcrypt.init_app(app)

    # Registra o Blueprint de rotas de usuário
    app.register_blueprint(auth_bp)
    app.register_blueprint(marcacoes_bp)

    # Rota de teste
    @app.route('/')
    def index():
        return "Servidor backend do Projeto Trindade está no ar!"

    return app