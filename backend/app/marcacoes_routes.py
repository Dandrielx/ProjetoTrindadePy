from flask import Blueprint, request, jsonify
from .database import SessionLocal, engine
from .models import Marcacao, Usuario
from .auth import token_required

# Cria um novo Blueprint para as marcações
marcacoes_bp = Blueprint('marcacoes', __name__, url_prefix='/api/marcacoes')

@marcacoes_bp.route('/', methods=['GET'])
def get_all_marcacoes():
    """
    Rota para obter todas as marcações.
    Por enquanto, retorna todas. No futuro, filtraremos pela área visível do mapa.
    """
    db = SessionLocal()
    try:
        marcacoes = db.query(Marcacao).all()
        # Converte os objetos Marcacao para um formato JSON
        resultado = [
            {
                "lat": marcacao.latitude,
                "lng": marcacao.longitude,
                "intensity": marcacao.intensidade,
                "type": marcacao.tipo_poluicao,
                "description": marcacao.descricao,
                "image_url": marcacao.imagem_url
            }
            for marcacao in marcacoes
        ]
        return jsonify(resultado), 200
    finally:
        db.close()

@marcacoes_bp.route('/', methods=['POST'])
@token_required # <-- A MÁGICA ACONTECE AQUI! Esta rota é protegida.
def create_marcacao(current_user):
    """
    Rota para criar uma nova marcação.
    Só pode ser acedida por um utilizador logado.
    """
    data = request.get_json()
    
    # Validação dos dados recebidos
    required_fields = ['latitude', 'longitude', 'intensidade', 'tipo_poluicao']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Dados em falta"}), 400

    db = SessionLocal()
    try:


        nova_marcacao = Marcacao(
            latitude=data['latitude'],
            longitude=data['longitude'],
            intensidade=data['intensidade'],
            tipo_poluicao=data['tipo_poluicao'],
            descricao=data.get('descricao'), # .get() para campos opcionais
            imagem_url=data.get('imagem_url'),
            usuario_id=current_user.id
        )
        db.add(nova_marcacao)
        db.commit()
        db.refresh(nova_marcacao)
        
        return jsonify({"message": "Marcação criada com sucesso!", "id": nova_marcacao.id}), 201
    except Exception as e:
        db.rollback()
        print(f"ERRO INTERNO: {e}") 
        return jsonify({"error": "Erro ao criar marcação", "details": str(e)}), 500
    finally:
        db.close()