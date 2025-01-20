import express from "express";
import pesquisaController from "../controllers/pesquisaController.js";

const router = express.Router();

// Nova rota para buscar a quantidade de itens saídos em um determinado ano
router.get("/itens-saidos-ano", pesquisaController.fetchItensSaidosPorAno);

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

// Rota para buscar itens não pagos por categoria
router.get("/fetch-itens-nao-pagos", pesquisaController.fetchItensNaoPagosPorCategoria);

// Rota para buscar itens não pagos por subgrupo
router.get("/fetch-itens-nao-pagos-subgrupo", pesquisaController.fetchItensNaoPagosPorSubgrupo);

// Rota para pesquisa por similaridade na descrição
router.get("/pesquisa-similaridade", pesquisaController.pesquisaPorSimilaridade);


export default router;
