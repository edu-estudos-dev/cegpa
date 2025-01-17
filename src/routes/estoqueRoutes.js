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

// Nova rota para obter o último tombo
router.get("/ultimo-tombo", estoqueController.fetchUltimoTombo);

// Nova rota para mostrar tabela com estoque atual
router.get("/tabela", estoqueController.getAllEstoque);

/* ********************************************************************************
                  Rotas para a SAÍDA de itens no Estoque
  *********************************************************************************/

// Rota para renderizar o formulário de SAÍDA
router.get("/saida", estoqueController.renderSaidaForm);

// Rota para buscar itens disponíveis
router.get("/api/itens-disponiveis", estoqueController.fetchItensDisponiveis);

// Rota para registrar a saída de itens
router.post("/saida", estoqueController.registrarSaida);

/* ********************************************************************************
                  Rotas para a Pesquisa
  *********************************************************************************/

// Nova rota para buscar a quantidade de itens saídos em um determinado ano
router.get("/itens-saidos-ano", estoqueController.fetchItensSaidosPorAno);

// Rota para obter o relatório de entradas
router.get("/relatorio-entradas", estoqueController.fetchRelatorioEntradas);

// Rota para obter o relatório de saídas
router.get("/relatorio-saidas", estoqueController.fetchRelatorioSaidas);

// Rota para obter o histórico de movimentação
router.get("/historico-movimentacao", estoqueController.fetchHistoricoMovimentacao);

// Rota para pesquisa avançada no estoque
router.get("/pesquisa-avancada", estoqueController.pesquisaAvancada);

// Rota para renderizar a página de relatórios
router.get("/relatorios", estoqueController.renderRelatorios);

// Rota para renderizar a página de histórico de movimentação
router.get("/historico-movimentacao-page", estoqueController.renderHistoricoMovimentacao);

// Rota para pesquisa avançada no estoque
router.get("/pesquisa-avancada", estoqueController.pesquisaAvancada);


// Rota para renderizar a página de pesquisa avançada
router.get("/pesquisa-avancada-page", estoqueController.renderPesquisaAvancada);


export default router;
