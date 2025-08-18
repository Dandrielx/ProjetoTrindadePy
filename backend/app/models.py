# backend/app/models.py
from flask_bcrypt import Bcrypt

# Inicializa o Bcrypt para senhas
bcrypt = Bcrypt()

# Para este exemplo, vamos armazenar os usuários em memória.
# Em um projeto real, isso seria uma classe que interage com um banco de dados.
users = {}

def add_user(username, email, password):
    if email in users:
        return None  # Retorna None se o usuário já existe
    
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    users[email] = {
        "username": username,
        "email": email,
        "password": hashed_password
    }
    print("Usuários cadastrados:", users) # Log para debug
    return users[email]

def find_user_by_email(email):
    return users.get(email)

def check_password(hashed_password, password):
    return bcrypt.check_password_hash(hashed_password, password)