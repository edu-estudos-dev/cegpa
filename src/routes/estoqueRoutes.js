import express from "express";
import estoqueController from "../controllers/estoqueController.js";

const router = express.Router();

/* ********************************************************************************
                  Rotas para a ENTRADA de itens no Estoque
  *********************************************************************************/

// Rota para listar todo o estoque
router.get("/", estoqueController.index);

// Rota para renderizar o formulário de entrada
router.get("/entrada", estoqueController.renderEntradaForm);

// Rota para inserir dados no estoque
router.post("/entrada", estoqueController.create);

// rota para obter o último tombo
router.get("/ultimo-tombo", estoqueController.fetchUltimoTombo);

// rota para mostrar tabela com estoque atual
router.get("/tabela/estoqueatual", estoqueController.getAllEstoque);

// Nova rota para mostrar quantidade única de itens no estoque
router.get("/qtde-unica", estoqueController.getQtdeUnicaEstoque);


/* ********************************************************************************
                  Rotas para a SAÍDA de itens no Estoque
  *********************************************************************************/

// Rota para renderizar o formulário de SAÍDA
router.get("/saida", estoqueController.renderSaidaForm);

// rota para mostrar tabela com itens pagos
router.get("/estoque/itenspagos", estoqueController.getAllItensPagos);

// Rota para buscar itens disponíveis
router.get("/api/itens-disponiveis", estoqueController.fetchItensDisponiveis);

// Rota para registrar a saída de itens
router.post("/saida", estoqueController.registrarSaida);


export default router;
