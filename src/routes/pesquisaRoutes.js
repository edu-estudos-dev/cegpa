import express from "express";
import pesquisaController from "../controllers/pesquisaController.js";

const router = express.Router();

// Rota para obter o relatório de entradas
router.get("/relatorio-entradas", pesquisaController.fetchRelatorioEntradas);

// Rota para obter o relatório de saídas
router.get("/relatorio-saidas", pesquisaController.fetchRelatorioSaidas);

// Rota para obter o histórico de movimentação
router.get("/historico-movimentacao", pesquisaController.fetchHistoricoMovimentacao);

// Rota para pesquisa avançada no estoque
router.get("/pesquisa-avancada", pesquisaController.pesquisaAvancada);

// Rota para renderizar a página de relatórios
router.get("/relatorios", pesquisaController.renderRelatorios);

// Rota para renderizar a página de histórico de movimentação
router.get("/historico-movimentacao-page", pesquisaController.renderHistoricoMovimentacao);

// Rota para pesquisa avançada no estoque
router.get("/pesquisa-avancada", pesquisaController.pesquisaAvancada);

// Rota para renderizar a página de pesquisa avançada
router.get("/pesquisa-avancada-page", pesquisaController.renderPesquisaAvancada);

// Nova rota para buscar informações do tombo
router.get("/fetch-info-tombo", pesquisaController.fetchInfoPorTombo);

export default router;
