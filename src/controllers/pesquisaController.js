import PesquisaModel from "../models/pesquisaModel.js";

class PesquisaController {

  // Método para pesquisa por similaridade na descrição
  async pesquisaPorSimilaridade(req, res) {
    const { valor } = req.query;
    console.log(
      "Valor recebido na requisição de pesquisa por similaridade:",
      valor
    );

    if (!valor) {
      console.error("Valor de pesquisa não fornecido na requisição.");
      return res
        .status(400)
        .json({ error: "Valor de pesquisa não fornecido." });
    }

    try {
      const { quantidadeNoEstoque, quantidadePagos } =
        await PesquisaModel.pesquisaPorSimilaridade(valor);
      res.json({ quantidadeNoEstoque, quantidadePagos });
    } catch (error) {
      console.error("Erro na pesquisa por similaridade:", error);
      res.status(500).json({ error: "Erro na pesquisa por similaridade." });
    }
  }

  // Método para obter a quantidade de itens no estoque para a categoria selecionda
  async fetchItensNaoPagosPorCategoria(req, res) {
    const { categoria } = req.query;
    console.log("Categoria recebida na requisição:", categoria);

    if (!categoria) {
      console.error("Categoria não fornecida na requisição.");
      return res.status(400).json({ error: "Categoria não fornecida." });
    }

    try {
      const quantidadeNaoPagos =
        await PesquisaModel.getItensNaoPagosPorCategoria(categoria);
      console.log(
        "Quantidade de itens em estoque na categoria",
        categoria,
        ":",
        quantidadeNaoPagos
      );
      res.json({ quantidadeNaoPagos }); // Retorna a quantidade de itens não pagos como JSON
    } catch (error) {
      console.error("Erro ao buscar itens não pagos por categoria:", error);
      res
        .status(500)
        .json({ error: "Erro ao buscar itens não pagos por categoria." });
    }
  }

  // Método para obter a quantidade de itens no estoque para pelo subgrupo seleciondo.
  async fetchItensNaoPagosPorSubgrupo(req, res) {
    const { subgrupo } = req.query;
    console.log("Subgrupo recebido na requisição:", subgrupo);

    if (!subgrupo) {
      console.error("Subgrupo não fornecido na requisição.");
      return res.status(400).json({ error: "Subgrupo não fornecido." });
    }

    try {
      const quantidadeNaoPagos = await PesquisaModel.getItensNaoPagosPorSubgrupo(
        subgrupo
      );
      console.log(
        "Quantidade de itens não pagos no subgrupo",
        subgrupo,
        ":",
        quantidadeNaoPagos
      );
      res.json({ quantidadeNaoPagos }); // Retorna a quantidade de itens não pagos como JSON
    } catch (error) {
      console.error("Erro ao buscar itens não pagos por subgrupo:", error);
      res
        .status(500)
        .json({ error: "Erro ao buscar itens não pagos por subgrupo." });
    }
  }

  // Método para buscar a quantidade de itens saídos em um determinado ano
  fetchItensSaidosPorAno = async (req, res) => {
    const { qtd_itens_sairam, categoria } = req.query;
    console.log("Requisição recebida com parâmetros:", req.query);

    if (!qtd_itens_sairam) {
      return res
        .status(400)
        .json({ error: "Quantidade de itens saídos não fornecida." });
    }

    try {
      const quantidadeSaidos = await PesquisaModel.getItensSaidosPorAno(
        qtd_itens_sairam
      );
      const quantidadeNoEstoque = await PesquisaModel.getQuantidadeNoEstoque(
        categoria || ""
      ); // Corrige para buscar quantidade no estoque
      res.json({ quantidadeSaidos, quantidadeNoEstoque });
    } catch (error) {
      console.log("Erro ao buscar itens saídos por ano:", error);
      res.status(500).json({ error: "Erro ao buscar itens saídos por ano." });
    }
  };

  // Método para buscar a quantidade de itens entrada em um determinado ano
  fetchItensEntradaPorAno = async (req, res) => {
    const { qtd_itens_entraram } = req.query;
    console.log(
      "Quantidade de itens de entrada recebida na requisição:",
      qtd_itens_entraram
    );

    if (!qtd_itens_entraram) {
      console.error(
        "Quantidade de itens de entrada não fornecida na requisição."
      );
      return res
        .status(400)
        .json({ error: "Quantidade de itens de entrada não fornecida." });
    }

    try {
      const quantidadeEntraram = await PesquisaModel.getItensEntradaPorAno(
        qtd_itens_entraram
      );
      console.log(
        "Quantidade de itens que entraram no ano",
        qtd_itens_entraram,
        ":",
        quantidadeEntraram
      );
      res.json({ quantidadeEntraram }); // Retorna a quantidade de itens que entraram como JSON
    } catch (error) {
      console.error("Erro ao buscar itens entraram por ano:", error);
      res.status(500).json({ error: "Erro ao buscar itens entraram por ano." });
    }
  };

  // Método para renderizar o formulário de pesquisa de itens saídos
  renderPesquisaForm = (_, res) => {
    res.render("pesquisaItensSaidos");
  };

  // Método para obter o relatório de entradas
  fetchRelatorioEntradas = async (_, res) => {
    try {
      const relatorio = await PesquisaModel.getRelatorioEntradas();
      res.json(relatorio);
    } catch (error) {
      console.error("Erro ao buscar relatório de entradas:", error);
      res.status(500).json({ error: "Erro ao buscar relatório de entradas." });
    }
  };

  // Método para obter o relatório de saídas
  fetchRelatorioSaidas = async (_, res) => {
    try {
      const relatorio = await PesquisaModel.getRelatorioSaidas();
      res.json(relatorio);
    } catch (error) {
      console.error("Erro ao buscar relatório de saídas:", error);
      res.status(500).json({ error: "Erro ao buscar relatório de saídas." });
    }
  };

  // Método para obter o histórico de movimentação
  async fetchHistoricoMovimentacao(_, res) {
    try {
      const movimentacaoBruta = await PesquisaModel.getMovimentacaoBruta();
      const consolidado = {};

      movimentacaoBruta.forEach((item) => {
        const dataAjustada = new Date(item.data);
        dataAjustada.setDate(dataAjustada.getDate() + 1);

        const key = `${item.tipo}_${dataAjustada.toISOString().split("T")[0]}_${
          item.descricao
        }`;
        if (!consolidado[key]) {
          consolidado[key] = {
            tipo: item.tipo,
            data: dataAjustada.toISOString().split("T")[0],
            descricao: item.descricao,
            quantidade: 0,
            dataOriginal: dataAjustada.toISOString().split("T")[0],
          };
        }
        consolidado[key].quantidade += item.quantidade;
      });

      const historico = Object.values(consolidado);

      res.json(historico);
    } catch (error) {
      console.error("Erro ao buscar histórico de movimentação:", error);
      res
        .status(500)
        .json({ error: "Erro ao buscar histórico de movimentação." });
    }
  }

  // Método para renderizar a página de relatórios
  renderRelatorios = (_, res) => {
    res.render("relatorios");
  };

  // Método para renderizar a página de histórico de movimentação
  renderHistoricoMovimentacao = (_, res) => {
    res.render("historicoMovimentacao");
  };

  // Método para pesquisa avançada no estoque, incluindo itens saídos por ano
  async pesquisaAvancada(req, res) {
    const { data: ano } = req.query;
    console.log("Ano recebido na requisição:", ano);

    try {
      const { quantidadeEntraram, quantidadeSaidos } =
        await PesquisaModel.pesquisaAvancada(ano);
      console.log("Quantidade de itens que entraram:", quantidadeEntraram);
      console.log("Quantidade de itens que saíram:", quantidadeSaidos);

      res.json({ quantidadeEntraram, quantidadeSaidos });
    } catch (error) {
      console.error("Erro na pesquisa avançada:", error);
      res.status(500).json({ error: "Erro na pesquisa avançada." });
    }
  }

  // Método para renderizar a página de pesquisa avançada
  renderPesquisaAvancada = (_, res) => {
    res.render("pesquisaAvancada");
  };

  // Método para buscar e exibir informações do tombo com logs adicionais
  fetchInfoPorTombo = async (req, res) => {
    const { tombo } = req.query;
   
    if (!tombo) {
      console.error("Tombo não fornecido na requisição.");
      return res.status(400).json({ error: "Tombo não fornecido." });
    }

    try {
      // Verificar se o tombo está na tabela estoqueatual
      const infoTombo = await PesquisaModel.getItemByTombo(tombo);
      if (infoTombo) {
       
        // Verificar se o item ainda não foi pago
        if (!infoTombo.pago) {
          return res.json({
            infoTombo,
            message: "Item consta no estoque, ainda não foi pago.",
          });
        }
      }

      // Buscar na tabela itenspagos
      const saidaTombo = await PesquisaModel.getSaidaPorTombo(tombo);
      console.log("Informações de saída do tombo:", saidaTombo);

      // Se não houver registros em nenhuma das tabelas
      if (!infoTombo && !saidaTombo) {
        console.log("Nenhuma informação encontrada para o tombo:", tombo);
        return res
          .status(404)
          .json({ error: "Tombo não encontrado ou não pago." });
      }

      // Se houver registros em ambas as tabelas (item pago)
      const fullInfoTombo = { ...infoTombo, saida: saidaTombo };
      console.log("Informações completas do tombo encontradas:", fullInfoTombo);
      res.json({ infoTombo: fullInfoTombo });
    } catch (error) {
      console.error("Erro ao buscar informações do tombo:", error);
      res.status(500).json({ error: "Erro ao buscar informações do tombo." });
    }
  };
}

export default new PesquisaController();
