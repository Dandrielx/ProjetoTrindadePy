import http from "http";
import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

// Carrega variáveis de ambiente (.env)
dotenv.config();

if (!process.env.DATABASE_URL) {
    console.error("ERRO FATAL: DATABASE_URL não está definida no arquivo .env da pasta backend.");
    process.exit(1); // Encerra a aplicação se o DB URL não estiver definido
}

// JWT_SECRET warning can remain or be removed if you handle it elsewhere
if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'test') {
    console.warn("AVISO: JWT_SECRET não está definida no arquivo .env. Necessário para login.");
}

export const sql = neon(process.env.DATABASE_URL);

/*
const requestHandler = async (req, res) => {
    try {
        const result = await sql`SELECT version()`;
        const { version } = result[0];
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(version); q
    } catch (error) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Erro ao conectar com o banco");
        console.error(error);
    }
};

http.createServer(requestHandler).listen(4242, () => {
    console.log("Server running at http://localhost:4242");
});
*/