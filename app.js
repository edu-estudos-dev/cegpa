import cors from 'cors';
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import methodOverride from "method-override";
import estoqueRoutes from "./src/routes/estoqueRoutes.js";
import pesquisaRoutes from "./src/routes/pesquisaRoutes.js";
import loginLogoutRoutes from "./src/routes/loginLogoutRoutes.js";
import painelRoutes from "./src/routes/painelRoutes.js";
import sequenciaRoutes from "./src/routes/sequenciaRoutes.js";
import solicitacaoRoutes from "./src/routes/solicitacaoRoutes.js";
import isAuthenticated from "./src/middleware/auth.js";
import { createClient } from 'redis';
import session from "express-session";
import { RedisStore } from 'connect-redis'; // Corrija esta linha

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use("/pdfs", express.static(path.join(__dirname, "pdfs")));
app.set("views", path.join(__dirname, "src", "views", "pages"));
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));


const redisClient = createClient({ url: 'redis://127.0.0.1:6379' });
redisClient.connect().catch(console.error);

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: 'sua_chave_secreta_aqui',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'lax'
    }
  })
);

// No middleware de log existente
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Session ID: ${req.sessionID} - User: ${req.session.user ? JSON.stringify(req.session.user) : 'Nenhum usuário'}`);
  next();
});

// Rotas públicas (sem autenticação)
app.use("/", loginLogoutRoutes);

// Rotas protegidas (requerem autenticação)
app.use("/painel", isAuthenticated, painelRoutes);
app.use("/", isAuthenticated, estoqueRoutes); // Prefixo /estoque aplicado aqui
app.use("/", isAuthenticated, pesquisaRoutes);
app.use("/", isAuthenticated, sequenciaRoutes);
app.use("/", isAuthenticated, solicitacaoRoutes);

// Tratamento de erro 404
app.use((req, res, next) => {
  res.status(404).render("404");
});

// Tratamento de erros genéricos
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err);
  res.status(500).json({ error: "Algo deu errado!" });
});

export default app;
