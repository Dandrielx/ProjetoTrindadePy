import os
import cloudinary
import cloudinary.uploader
from flask import Blueprint, request, jsonify
from .auth import token_required

# Configura o Cloudinary com as credenciais do .env
cloudinary.config(
  cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"),
  api_key = os.getenv("CLOUDINARY_API_KEY"),
  api_secret = os.getenv("CLOUDINARY_API_SECRET"),
  secure = True
)

upload_bp = Blueprint('upload', __name__, url_prefix='/api/upload')

@upload_bp.route('/', methods=['POST'], strict_slashes=False)
@token_required # Protege a rota para que só utilizadores logados possam fazer uploads
def upload_image(current_user):
    if 'file' not in request.files:
        return jsonify({"error": "Nenhum ficheiro enviado"}), 400
    
    file_to_upload = request.files['file']

    try:
        # Envia o ficheiro para o Cloudinary
        upload_result = cloudinary.uploader.upload(file_to_upload)
        # O Cloudinary devolve um dicionário com muitas informações,
        # incluindo a URL segura da imagem.
        image_url = upload_result.get('secure_url')
        
        return jsonify({"message": "Upload bem-sucedido", "image_url": image_url}), 201

    except Exception as e:
        return jsonify({"error": "Falha no upload da imagem", "details": str(e)}), 500