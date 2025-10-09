from flask import Blueprint, request, jsonify
from .database import SessionLocal, engine
from .models import Marcacao, Usuario
from .auth import token_required
from datetime import datetime, timedelta

# Cria um novo Blueprint para as marcações
marcacoes_bp = Blueprint('marcacoes', __name__, url_prefix='/api/marcacoes')

@marcacoes_bp.route('/', methods=['GET'])
def get_all_marcacoes():
    """
    Rota para obter as marcações, agora com a lógica de filtro corrigida e com depuração.
    """
    db = SessionLocal()
    try:
        # Imprime os argumentos recebidos para depuração
        print(f"Filtros recebidos: {request.args}")

        query = db.query(Marcacao)

        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        types_str = request.args.get('types')

        # Filtro de data inicial
        if start_date_str:
            start_date = datetime.fromisoformat(start_date_str)
            query = query.filter(Marcacao.data_criacao >= start_date)
            print(f"A aplicar filtro de data inicial: >= {start_date_str}")

        # Filtro de data final
        if end_date_str:
            # Adiciona 1 dia e usa '<' para garantir que o dia final completo é incluído
            end_date = datetime.fromisoformat(end_date_str) + timedelta(days=1)
            query = query.filter(Marcacao.data_criacao < end_date)
            print(f"A aplicar filtro de data final: < {end_date.strftime('%Y-%m-%d')}")

        # Filtro de tipos
        if types_str:
            # Remove espaços em branco e garante que a lista não está vazia
            type_list = [t.strip() for t in types_str.split(',') if t.strip()]
            if type_list:
                query = query.filter(Marcacao.tipo_poluicao.in_(type_list))
                print(f"A aplicar filtro de tipos: {type_list}")

        marcacoes = query.order_by(Marcacao.data_criacao.desc()).all()
        
        print(f"Encontradas {len(marcacoes)} marcações após os filtros.")

        resultado = [
            {
                "lat": marcacao.latitude,
                "lng": marcacao.longitude,
                "intensity": marcacao.intensidade,
                "type": marcacao.tipo_poluicao,
                "description": marcacao.descricao,
                "image_url": marcacao.imagem_url,
                "data_criacao": marcacao.data_criacao.isoformat() if marcacao.data_criacao else None
            }
            for marcacao in marcacoes
        ]
        return jsonify(resultado), 200
    except Exception as e:
        print(f"ERRO na rota de marcações: {e}")
        return jsonify({"error": "Erro interno no servidor"}), 500
    finally:
        db.close()

@marcacoes_bp.route('/', methods=['POST'])
@token_required # <-- Rota protegida.
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