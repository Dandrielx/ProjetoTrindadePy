// backend/src/server.js
import Fastify from 'fastify';
import userRoutes from '../routes/user.js'; // Ajuste o caminho se necessário
import { sql } from './db.js'; // Importa sql e implicitamente executa dotenv.config() de db.js

const fastify = Fastify({
    logger: true // Habilita logs. Em produção, configure um logger mais robusto.
});

// Disponibiliza a conexão `sql` para as rotas através de fastify.db.sql
fastify.decorate('db', { sql });

// Registra as rotas de usuário.
// Todas as rotas definidas em userRoutes terão o prefixo '/api/users'
// Ex: /api/users/register, /api/users/login
fastify.register(userRoutes, { prefix: '/api/users' });

// Rota raiz para teste
fastify.get('/', async (request, reply) => {
    return { message: 'Servidor backend do Projeto Trindade está no ar!' };
});

const start = async () => {
    try {
        const port = process.env.PORT || 3001; // Lê a porta do .env ou usa 3001 como padrão
        // host: '0.0.0.0' permite que o servidor seja acessível de fora do localhost (útil para testes com emulador/dispositivo móvel na mesma rede)
        await fastify.listen({ port: parseInt(port, 10), host: '0.0.0.0' });
        // fastify.log.info(`Servidor rodando na porta ${fastify.server.address().port}`); // Removido para usar o logger padrão que já informa
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();