import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import methodOverride from 'method-override';
import session from 'express-session'; // Adicionar express-session para gerenciar sessões
import estoqueRoutes from './src/routes/estoqueRoutes.js';
import loginLogoutRoutes from './src/routes/loginLogoutRoutes.js'; // Atualização da rota de login e logout
import isAuthenticated from './src/middleware/auth.js'; // Importação do middleware de autenticação

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações básicas do servidor
app.use(express.static(path.join(__dirname, 'public')));
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs'))); // Corrigido para o diretório raiz
app.set('views', path.join(__dirname, 'src', 'views', 'pages'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Configuração da sessão
app.use(session({
  secret: 'sua_chave_secreta', // Use uma chave secreta segura e aleatória
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Defina como true se estiver usando HTTPS
}));

// Rotas de login e logout, sem verificação de autenticação
app.use('/', loginLogoutRoutes);

// Aplicando o middleware de autenticação às rotas protegidas
app.use(isAuthenticated);

// Rotas protegidas
app.use('/', estoqueRoutes);


app.use((req, res, next) => {
  console.log(`URL solicitada: ${req.url}`);
  next();
});

// Tratamento de erros
app.use((req, res, next) => {
  console.log(`Página 404 renderizada para URL: ${req.url}`);
  res.status(404).render('404'); // Certifique-se de que o nome do template está correto
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});

export default app;
