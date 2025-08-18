import { sql } from '../src/db.js'

sql`

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,  -- Começa de 1 e auto incrementa
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL
);

`.then(() => {
    console.log('Tabela criada')
})