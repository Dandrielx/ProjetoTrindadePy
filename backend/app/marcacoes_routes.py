from flask import Blueprint, request, jsonify
from .database import SessionLocal, engine
from .models import Marcacao, Usuario, MarcacaoDetalhe, Coleta
from .auth import token_required
from datetime import datetime, timedelta
from sqlalchemy.orm import joinedload

# Cria um novo Blueprint para as marcações
marcacoes_bp = Blueprint('marcacoes', __name__, url_prefix='/api/marcacoes')

@marcacoes_bp.route('/', methods=['GET'])
def get_all_marcacoes():
    db = SessionLocal()
    try:
        # 1. Pega os parâmetros da URL enviados pelo Drawer
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        types = request.args.get('types') # Recebe string "lixo,oleo,pesquisa"

        # 2. Inicia a query com Join na tabela de Coletas para poder filtrar
        query = db.query(Marcacao).join(Coleta)

        # 3. Filtro por Categoria (tipo_poluicao)
        if types:
            lista_tipos = types.split(',')
            query = query.filter(Coleta.tipo_poluicao.in_(lista_tipos))

        # 4. Filtro por Período
        if start_date:
            dt_inicio = datetime.fromisoformat(start_date)
            query = query.filter(Coleta.data_coleta >= dt_inicio)
        
        if end_date:
            # Soma 1 dia para incluir o dia final completo até 23:59:59
            dt_fim = datetime.fromisoformat(end_date) + timedelta(days=1)
            query = query.filter(Coleta.data_coleta < dt_fim)

        # 5. Executa a query carregando as relações e removendo duplicatas
        # (Um ponto geográfico pode ter várias coletas que batem no filtro)
        marcacoes = query.options(
            joinedload(Marcacao.coletas).joinedload(Coleta.detalhes)
        ).distinct().all()
        
        resultado = []
        for m in marcacoes:
            # Ordenamos as coletas da mais recente para a mais antiga para o histórico no mapa
            coletas_ordenadas = sorted(m.coletas, key=lambda x: x.data_coleta, reverse=True)
            
            if not coletas_ordenadas:
                continue

            resultado.append({
                "id": m.id,
                "lat": m.latitude,
                "lng": m.longitude,
                "projeto": m.projeto,
                "agua": m.agua,
                "tipo_local": m.tipo_local,
                "usuario_id": m.usuario_id,
                # Enviamos o histórico completo de coletas para a navegação por flechas no mapa
                "coletas": [{
                    "id": c.id,
                    "type": c.tipo_poluicao,
                    "intensity": c.intensidade,
                    "description": c.descricao,
                    "image_url": c.imagem_url,
                    "data": c.data_coleta.isoformat(),
                    "detalhes": [{"chave": d.chave, "valor": d.valor} for d in c.detalhes]
                } for c in coletas_ordenadas]
            })
        return jsonify(resultado), 200
    except Exception as e:
        print(f"Erro no filtro: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@marcacoes_bp.route('/', methods=['POST'])
@token_required
def create_marcacao(current_user):
    """
    Cria uma nova marcação (Ponto + Coleta) OU adiciona uma nova Coleta 
    a um ponto geográfico existente via marcacao_id.
    """
    data = request.get_json()
    db = SessionLocal()
    
    try:
        # 1. VERIFICA SE É UM PONTO EXISTENTE OU NOVO
        marcacao_id = data.get('marcacao_id')
        
        if not marcacao_id:
            # CRIAR NOVO PONTO GEOGRÁFICO (Marcacao)
            nova_marcacao = Marcacao(
                latitude=data['latitude'],
                longitude=data['longitude'],
                projeto=data.get('projeto', 'comunitario'),
                agua=data.get('agua', False),
                tipo_local=data.get('tipo_local', 'unico'),
                usuario_id=current_user.id
            )
            db.add(nova_marcacao)
            db.flush() # Gera o ID sem fechar a transação
            marcacao_id = nova_marcacao.id
        else:
            # PONTO EXISTENTE: Valida se o ID existe
            ponto_existente = db.query(Marcacao).filter(Marcacao.id == marcacao_id).first()
            if not ponto_existente:
                return jsonify({"error": "Ponto geográfico não encontrado"}), 404

        # 2. CRIAR A COLETA (Evento temporal/histórico)
        # Suporte para data manual enviada pelo modal
        data_manual = data.get('data_coleta')
        
        nova_coleta = Coleta(
            marcacao_id=marcacao_id,
            usuario_id=current_user.id,
            intensidade=data.get('intensidade', 5),
            tipo_poluicao=data.get('tipo_poluicao', 'lixo'),
            descricao=data.get('descricao'),
            imagem_url=data.get('imagem_url'),
            data_coleta=datetime.fromisoformat(data_manual) if data_manual else datetime.now()
        )
        db.add(nova_coleta)
        db.flush()

        # 3. ADICIONAR DETALHES TÉCNICOS
        detalhes_data = data.get('detalhes', [])
        for det in detalhes_data:
            novo_detalhe = MarcacaoDetalhe(
                chave=det['chave'],
                valor=str(det['valor']),
                coleta_id=nova_coleta.id
            )
            db.add(novo_detalhe)

        db.commit()
        return jsonify({"message": "Operação realizada com sucesso!", "id": marcacao_id}), 201

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@marcacoes_bp.route('/<int:id>', methods=['PUT'])
@token_required
def update_marcacao(current_user, id):
    """
    Atualiza o ponto geográfico e a ÚLTIMA coleta vinculada a ele.
    Também permite alterar a data da coleta.
    """
    data = request.get_json()
    db = SessionLocal()
    try:
        marcacao = db.query(Marcacao).filter(Marcacao.id == id).first()
        if not marcacao:
            return jsonify({"error": "Marcação não encontrada"}), 404
        
        # 1. Atualiza dados geográficos (Ponto)
        marcacao.latitude = data.get('latitude', marcacao.latitude)
        marcacao.longitude = data.get('longitude', marcacao.longitude)
        
        # 2. Busca a última coleta para atualizar os dados e a data
        ultima_coleta = db.query(Coleta).filter(Coleta.marcacao_id == id).order_by(Coleta.data_coleta.desc()).first()
        
        if ultima_coleta:
            ultima_coleta.descricao = data.get('descricao', ultima_coleta.descricao)
            ultima_coleta.tipo_poluicao = data.get('tipo_poluicao', ultima_coleta.tipo_poluicao)
            ultima_coleta.intensidade = data.get('intensidade', ultima_coleta.intensidade)
            
            # Atualização manual da data da coleta
            data_manual = data.get('data_coleta')
            if data_manual:
                ultima_coleta.data_coleta = datetime.fromisoformat(data_manual)
            
            if data.get('imagem_url'):
                ultima_coleta.imagem_url = data.get('imagem_url')

            # 3. Atualiza Detalhes da Coleta (Limpa e reinsere para evitar duplicidade)
            db.query(MarcacaoDetalhe).filter(MarcacaoDetalhe.coleta_id == ultima_coleta.id).delete()
            for det in data.get('detalhes', []):
                if det.get('chave') and det.get('valor'):
                    db.add(MarcacaoDetalhe(
                        chave=det['chave'].lower(), 
                        valor=str(det['valor']), 
                        coleta_id=ultima_coleta.id
                    ))

        db.commit()
        return jsonify({"message": "Marcação e coleta atualizadas com sucesso!"}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@marcacoes_bp.route('/config/campos/<projeto>', methods=['GET'])
def get_projeto_fields(projeto):
    db = SessionLocal()
    try:
        campos = db.query(MarcacaoDetalhe.chave).join(Coleta).join(Marcacao).filter(
            Marcacao.projeto == projeto
        ).distinct().all()
        return jsonify([c[0] for c in campos if c[0]]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@marcacoes_bp.route('/detalhes/chaves', methods=['GET'])
def get_unique_keys():
    db = SessionLocal()
    try:
        chaves_query = db.query(MarcacaoDetalhe.chave).distinct().all()
        return jsonify([c[0] for c in chaves_query if c[0]]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@marcacoes_bp.route('/detalhes/template/<int:marcacao_id>', methods=['GET'])
def get_coleta_template(marcacao_id):
    db = SessionLocal()
    try:
        ultima_coleta = db.query(Coleta).filter(
            Coleta.marcacao_id == marcacao_id
        ).order_by(Coleta.data_coleta.desc()).first()

        if not ultima_coleta:
            return jsonify([]), 200

        template = [{"chave": d.chave, "valor": ""} for d in ultima_coleta.detalhes]
        return jsonify(template), 200
    finally:
        db.close()