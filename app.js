import cors from 'cors';
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import methodOverride from "method-override";
import session from "express-session";
import estoqueRoutes from "./src/routes/estoqueRoutes.js";
import pesquisaRoutes from "./src/routes/pesquisaRoutes.js";
import loginLogoutRoutes from "./src/routes/loginLogoutRoutes.js";
import painelRoutes from "./src/routes/painelRoutes.js";
import sequenciaRoutes from "./src/routes/sequenciaRoutes.js";
import isAuthenticated from "./src/middleware/auth.js";

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

app.use(
  session({
    secret: "sua_chave_secreta",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// Rotas que não precisam de autenticação
app.use("/", loginLogoutRoutes);

// Aplicando o middleware de autenticação apenas às rotas protegidas
// Mantendo as URLs originais, mas protegendo-as com o middleware
app.use("/painel", isAuthenticated, painelRoutes);
app.use("/", isAuthenticated, estoqueRoutes); // Os caminhos já estão definidos no router
app.use("/", isAuthenticated, pesquisaRoutes); // Os caminhos já estão definidos no router
app.use("/", isAuthenticated, sequenciaRoutes); // Os caminhos já estão definidos no router

app.use((req, res, next) => {
  res.status(404).render("404");
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: "Algo deu errado!" });
});

export default app;