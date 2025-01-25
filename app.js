import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import methodOverride from 'method-override';
import session from 'express-session';
import estoqueRoutes from './src/routes/estoqueRoutes.js';
import pesquisaRoutes from './src/routes/pesquisaRoutes.js';
import loginLogoutRoutes from './src/routes/loginLogoutRoutes.js';
import painelRoutes from './src/routes/painelRoutes.js';
import isAuthenticated from './src/middleware/auth.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')));
app.set('views', path.join(__dirname, 'src', 'views', 'pages'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.use(session({
  secret: 'sua_chave_secreta',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use('/', loginLogoutRoutes);
app.use(isAuthenticated);
app.use('/', estoqueRoutes);
app.use('/', pesquisaRoutes);
app.use('/painel', painelRoutes);
app.use('/estoque', estoqueRoutes);

// Tratamento de erros
app.use((req, res, next) => {
  console.log(`Página 404 renderizada para URL: ${req.url}`);
  res.status(404).render('404');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});

export default app;

