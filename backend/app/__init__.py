# backend/app/__init__.py
from flask import Flask
from flask_cors import CORS
from .models import bcrypt
from .routes import auth_bp
from .marcacoes_routes import marcacoes_bp
from .upload_routes import upload_bp

def create_app():
    app = Flask(__name__)
    CORS(app)

    bcrypt.init_app(app)

    # Regista os blueprints com os seus prefixos definidos nos seus próprios ficheiros
    app.register_blueprint(auth_bp)
    app.register_blueprint(marcacoes_bp)
    app.register_blueprint(upload_bp)

    @app.route('/')
    def index():
        return "Servidor backend do Projeto Trindade está no ar!"

    return app