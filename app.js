import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import methodOverride from 'method-override';
import estoqueRoutes from './src/routes/estoqueRoutes.js';

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

app.use((req, res, next) => {
  console.log(`Requisição recebida: ${req.method} ${req.url}`);
  next();
});

// Uso das rotas do estoque
app.use('/', estoqueRoutes);

app.use((req, res, next) => {
  console.log(`URL solicitada: ${req.url}`);
  next();
});

// Tratamento de erros
app.use((req, res, next) => {
  res.status(404).render('404'); // Certifique-se de que o nome do template está correto
  console.log('Página 404 renderizada');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});

export default app;
