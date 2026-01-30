from flask import Blueprint, request, jsonify
from .database import SessionLocal, engine
from .models import Marcacao, Usuario, MarcacaoDetalhe
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
                "id": marcacao.id,
                "lat": marcacao.latitude,
                "lng": marcacao.longitude,
                "usuario_id": marcacao.usuario_id,
                "intensity": marcacao.intensidade,
                "type": marcacao.tipo_poluicao,
                "projeto": marcacao.projeto,
                "agua": marcacao.agua,
                "tipo_local": marcacao.tipo_local,
                "description": marcacao.descricao,
                "image_url": marcacao.imagem_url,
                "data_criacao": marcacao.data_criacao.isoformat() if marcacao.data_criacao else None,
                "detalhes": [
                    {"chave": d.chave, "valor": d.valor} 
                    for d in marcacao.detalhes
                ]
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
    
    # LOG DE DEPURAÇÃO: Verifique no terminal o que o front está enviando
    print(f"Dados recebidos no POST: {data}")

    # Campos obrigatórios (incluí os novos já que são nullable=False no banco)
    required_fields = ['latitude', 'longitude', 'intensidade', 'tipo_poluicao', 'agua', 'tipo_local', 'projeto']
    
    if not data or not all(field in data for field in required_fields):
        # Retorna quais campos estão faltando para facilitar o seu debug
        missing = [f for f in required_fields if f not in (data or {})]
        return jsonify({"error": "Dados em falta", "missing_fields": missing}), 400

    db = SessionLocal()
    try:
        nova_marcacao = Marcacao(
            latitude=data['latitude'],
            longitude=data['longitude'],
            intensidade=data['intensidade'],
            tipo_poluicao=data['tipo_poluicao'],
            agua=data['agua'],
            tipo_local=data['tipo_local'],
            projeto=data['projeto'],
            descricao=data.get('descricao'), # .get() para campos opcionais
            imagem_url=data.get('imagem_url'),
            usuario_id=current_user.id
        )
        db.add(nova_marcacao)
        detalhes_data = data.get('detalhes', []) # Espera lista de {chave, valor}
        for det in detalhes_data:
            novo_detalhe = MarcacaoDetalhe(
                chave=det['chave'],
                valor=str(det['valor']),
                marcacao=nova_marcacao
            )
            db.add(novo_detalhe)
        db.commit()
        db.refresh(nova_marcacao)
        
        return jsonify({"message": "Marcação criada com sucesso!", "id": nova_marcacao.id}), 201
    except Exception as e:
        db.rollback()
        print(f"ERRO INTERNO: {e}") 
        return jsonify({"error": "Erro ao criar marcação", "details": str(e)}), 500
    finally:
        db.close()
        
@marcacoes_bp.route('/config/campos/<projeto>', methods=['GET'])
def get_projeto_fields(projeto):
    """Retorna chaves únicas de metadados já usadas no projeto para sugestão no App."""
    db = SessionLocal()
    try:
        # Busca todas as chaves distintas para aquele projeto específico
        campos = db.query(MarcacaoDetalhe.chave).join(Marcacao).filter(
            Marcacao.projeto == projeto
        ).distinct().all()
        return jsonify([c[0] for c in campos]), 200
    finally:
        db.close()

@marcacoes_bp.route('/<int:id>', methods=['PUT'])
@token_required
def update_marcacao(current_user, id):
    """Atualiza uma marcação existente e seus metadados."""
    data = request.get_json()
    db = SessionLocal()
    try:
        marcacao = db.query(Marcacao).filter(Marcacao.id == id).first()
        if not marcacao:
            return jsonify({"error": "Não encontrada"}), 404
        
        # 1. Atualiza campos geográficos e descrição
        marcacao.latitude = data.get('latitude', marcacao.latitude)
        marcacao.longitude = data.get('longitude', marcacao.longitude)
        marcacao.descricao = data.get('descricao', marcacao.descricao)
        
        # 2. Lógica da Imagem: Mantém a atual se 'imagem_url' não for enviada ou for nula
        nova_imagem = data.get('imagem_url')
        if nova_imagem:
            marcacao.imagem_url = nova_imagem

        # 3. Atualiza campos específicos do Cidadão (Aba Comum)
        # Estes campos agora são atualizados corretamente
        marcacao.tipo_poluicao = data.get('tipo_poluicao', marcacao.tipo_poluicao)
        marcacao.agua = data.get('agua', marcacao.agua)
        marcacao.tipo_local = data.get('tipo_local', marcacao.tipo_local)
        
        # 4. Lógica de Intensidade
        if marcacao.projeto == 'comunitario':
            marcacao.intensidade = data.get('intensidade', marcacao.intensidade)
        else:
            # Se for pesquisa, mantém o padrão 5 conforme sua exigência
            marcacao.intensidade = 5

        # 5. Atualiza Detalhes (EAV) - Limpa e reinsere se houver novos dados técnicos
        # Nota: Se for 'comunitario', o modal já envia detalhes como []
        db.query(MarcacaoDetalhe).filter(MarcacaoDetalhe.marcacao_id == id).delete()
        detalhes = data.get('detalhes', [])
        for det in detalhes:
            if det.get('chave') and det.get('valor'):
                novo_det = MarcacaoDetalhe(
                    chave=det['chave'].lower(), 
                    valor=str(det['valor']), 
                    marcacao_id=id
                )
                db.add(novo_det)

        db.commit()
        return jsonify({"message": "Atualizado com sucesso"}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500
    finally:
        db.close()