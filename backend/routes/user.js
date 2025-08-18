// backend/routes/user.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const saltRounds = 10; // Para o bcrypt

export default async function (fastify, opts) {

    // ROTA DE CADASTRO
    fastify.post('/register', async (request, reply) => {
        const { nome, email, senha } = request.body;

        // Validações básicas
        if (!nome || !email || !senha) {
            return reply.code(400).send({ error: 'Nome, email e senha são obrigatórios.' });
        }
        if (senha.length < 6) { // Exemplo simples de validação de senha
            return reply.code(400).send({ error: 'A senha deve ter pelo menos 6 caracteres.' });
        }
        // Adicione aqui validação de formato de e-mail se desejar

        try {
            const existingUser = await fastify.db.sql`
                SELECT id FROM usuarios WHERE email = ${email}
            `;
            if (existingUser.length > 0) {
                return reply.code(409).send({ error: 'Este email já está cadastrado.' });
            }

            const hashedPassword = await bcrypt.hash(senha, saltRounds);

            const result = await fastify.db.sql`
                INSERT INTO usuarios (nome, email, senha) 
                VALUES (${nome}, ${email}, ${hashedPassword}) 
                RETURNING id`;

            if (result && result.length > 0) {
                return reply.code(201).send({ message: 'Usuário criado com sucesso!', userId: result[0].id });
            } else {
                fastify.log.error('Falha ao inserir usuário, nenhum ID retornado.');
                return reply.code(500).send({ error: 'Erro ao processar o cadastro.' });
            }

        } catch (err) {
            fastify.log.error({ msg: 'Erro na rota /register', error: err.message, stack: err.stack });
            // Trata erro de constraint UNIQUE do email (código '23505' para PostgreSQL)
            if (err.code === '23505' && err.message.includes('usuarios_email_key')) {
                return reply.code(409).send({ error: 'Este email já está em uso.' });
            }
            return reply.code(500).send({ error: 'Erro interno no servidor ao tentar cadastrar.' });
        }
    });

    // ROTA DE LOGIN
    fastify.post('/login', async (request, reply) => {
        const { email, senha } = request.body;

        if (!email || !senha) {
            return reply.code(400).send({ error: 'Email e senha são obrigatórios.' });
        }

        try {
            const users = await fastify.db.sql`
                SELECT id, nome, email, senha FROM usuarios WHERE email = ${email}
            `;

            if (users.length === 0) {
                return reply.code(401).send({ error: 'Email ou senha inválidos.' });
            }

            const user = users[0];
            const passwordMatch = await bcrypt.compare(senha, user.senha);

            if (!passwordMatch) {
                return reply.code(401).send({ error: 'Email ou senha inválidos.' });
            }

            // Senha correta, gerar token JWT
            const tokenPayload = {
                userId: user.id,
                nome: user.nome,
                email: user.email
            };

            if (!process.env.JWT_SECRET) {
                fastify.log.error('Variável de ambiente JWT_SECRET não definida!');
                return reply.code(500).send({ error: 'Erro de configuração interna do servidor.' });
            }

            const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '48h' }); // Token expira em 48 horas

            return reply.send({
                message: 'Login bem-sucedido!',
                token: token,
                user: {
                    id: user.id,
                    nome: user.nome,
                    email: user.email
                }
            });

        } catch (err) {
            fastify.log.error({ msg: 'Erro na rota /login', error: err.message, stack: err.stack });
            return reply.code(500).send({ error: 'Erro interno no servidor ao tentar fazer login.' });
        }
    });
}