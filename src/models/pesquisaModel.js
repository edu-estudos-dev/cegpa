import connection from "../../db_config/connection.js";

class PesquisaModel {
  // Método para pesquisa por similaridade na descrição (LIKE %valor%)
  async pesquisaPorSimilaridade(valor) {
    console.log("Valor de pesquisa recebido:", valor); // Logar dados recebidos

    const queryEstoque = `
    SELECT COUNT(*) AS quantidadeNoEstoque 
    FROM estoqueatual 
    WHERE descricao LIKE ?
  `;

    const queryItensPagos = `
    SELECT COUNT(*) AS quantidadePagos 
    FROM itenspagos 
    WHERE descricao LIKE ?
  `;

    try {
      const valorLike = `%${valor}%`;
      const [resultEstoque] = await connection.execute(queryEstoque, [
        valorLike,
      ]);
      const [resultPagos] = await connection.execute(queryItensPagos, [
        valorLike,
      ]);

      console.log(
        "Quantidade de itens no estoque com descrição similar:",
        resultEstoque
      );
      console.log(
        "Quantidade de itens pagos com descrição similar:",
        resultPagos
      );

      const quantidadeNoEstoque = resultEstoque[0].quantidadeNoEstoque || 0;
      const quantidadePagos = resultPagos[0].quantidadePagos || 0;

      return { quantidadeNoEstoque, quantidadePagos };
    } catch (error) {
      console.error("Erro na pesquisa por similaridade:", error);
      throw error;
    }
  }

  // Método para obter a quantidade de itens no estoque para a categoria selecionda
  async getItensNaoPagosPorCategoria(categoria) {
    const query = `
      SELECT COUNT(*) AS quantidadeNaoPagos 
      FROM estoqueatual 
      WHERE pago = 0 
      AND categoria = ?;
    `;

    try {
      const [results] = await connection.execute(query, [categoria]);
      console.log("Resultados da query getItensNaoPagosPorCategoria:", results); // Logar resultados da query

      if (results.length === 0) {
        console.error(
          "Nenhum resultado encontrado para a categoria:",
          categoria
        );
        return 0;
      }

      return results[0].quantidadeNaoPagos || 0;
    } catch (error) {
      console.error("Erro ao buscar itens não pagos por categoria:", error);
      throw error;
    }
  }

  // Método para obter a quantidade de itens no estoque para pelo subgrupo seleciondo.
  async getItensNaoPagosPorSubgrupo(subgrupo) {
    console.log(
      "Subgrupo recebido no método getItensNaoPagosPorSubgrupo:",
      subgrupo
    ); // Logar dados recebidos

    const query = `
      SELECT COUNT(*) AS quantidadeNaoPagos 
      FROM estoqueatual 
      WHERE pago = 0 
      AND subgrupo = ?;
    `;

    try {
      const [results] = await connection.execute(query, [subgrupo]);
      console.log("Resultados da query getItensNaoPagosPorSubgrupo:", results); // Logar resultados da query

      if (results.length === 0) {
        console.error("Nenhum resultado encontrado para o subgrupo:", subgrupo);
        return 0;
      }

      return results[0].quantidadeNaoPagos || 0;
    } catch (error) {
      console.error("Erro ao buscar itens não pagos por subgrupo:", error);
      throw error;
    }
  }

  // Método para obter o histórico de movimentação
  async getMovimentacaoBruta() {
    const query = `
      SELECT 
        'entrada' AS tipo, 
        data_de_entrada AS data, 
        descricao, 
        quantidade 
      FROM estoqueatual
      UNION ALL
      SELECT 
        'saida' AS tipo, 
        data_de_saida AS data, 
        descricao, 
        quantidade 
      FROM itenspagos
      ORDER BY data;
    `;
    try {
      const [results] = await connection.execute(query);
      return results;
    } catch (error) {
      console.error("Erro ao buscar movimentação bruta:", error);
      throw error;
    }
  }

  // Método para pesquisa avançada no estoque
  async pesquisaAvancada(ano) {
    console.log("Ano recebido no método pesquisaAvancada:", ano);

    const queryEntraram = `
      SELECT COALESCE(SUM(quantidade), 0) AS quantidadeEntraram 
      FROM estoqueatual 
      WHERE pago = 0
      ${ano ? "AND YEAR(data_de_entrada) = ?" : ""}
    `;

    const paramsEntraram = [];
    if (ano) paramsEntraram.push(ano);

    const querySaidos = `
      SELECT COALESCE(SUM(quantidade), 0) AS quantidadeSaidos 
      FROM itenspagos 
      WHERE 1
      ${ano ? "AND YEAR(data_de_saida) = ?" : ""}
    `;

    const paramsSaidos = [];
    if (ano) paramsSaidos.push(ano);

    try {
      const [quantidadeEntraram] = await connection.execute(
        queryEntraram,
        paramsEntraram
      );
      console.log(
        "Quantidade de itens que entraram - queryEntraram:",
        quantidadeEntraram
      );

      const [quantidadeSaidos] = await connection.execute(
        querySaidos,
        paramsSaidos
      );
      console.log(
        "Quantidade de itens que saíram - querySaidos:",
        quantidadeSaidos
      );

      return {
        quantidadeEntraram: quantidadeEntraram[0].quantidadeEntraram || 0,
        quantidadeSaidos: quantidadeSaidos[0].quantidadeSaidos || 0,
      };
    } catch (error) {
      console.error("Erro na pesquisa avançada:", error);
      throw error;
    }
  }

  // Método para obter a quantidade de itens saídos por ano
  async getSaidaPorTombo(tombo) {
    const queryEstoque = `
        SELECT id
        FROM estoqueatual
        WHERE tombo = ?
    `;

    const querySaida = `
        SELECT
            data_de_saida, doc_saida, referencia, destino, 
            posto_graduacao, mat_funcional, telefone, nome_completo, observacao AS observacao_saida 
        FROM itenspagos
        WHERE id_estoque = ?
    `;

    try {
      const [resultsEstoque] = await connection.execute(queryEstoque, [tombo]);
      console.log("Resultados da query de estoque:", resultsEstoque);

      if (resultsEstoque.length === 0) {
        console.log(
          "Nenhum registro encontrado na tabela estoqueatual para o tombo:",
          tombo
        );
        return null;
      }

      const idEstoque = resultsEstoque[0].id;
      console.log("ID encontrado na tabela estoqueatual:", idEstoque);

      const [resultsSaida] = await connection.execute(querySaida, [idEstoque]);
      console.log("Resultados da query de saída do tombo:", resultsSaida);

      if (resultsSaida.length === 0) {
        console.log(
          "Nenhum registro encontrado na tabela itenspagos para o ID:",
          idEstoque
        );
        return null;
      }
      return resultsSaida[0];
    } catch (error) {
      console.error("Erro ao buscar informações de saída do tombo:", error);
      throw error;
    }
  }

  // Método para obter a quantidade de itens entrou por ano
  async getItensEntradaPorAno(ano) {
    console.log("Ano recebido no método getItensEntradaPorAno:", ano); // Logar dados recebidos

    if (!ano || isNaN(ano)) {
      throw new Error(`Ano inválido: ${ano}`); // Verificar se os argumentos são válidos
    }

    const query = `
      SELECT SUM(quantidade) AS quantidade_entraram 
      FROM estoqueatual 
      WHERE YEAR(data_de_entrada) = ?
    `;

    try {
      const [results] = await connection.execute(query, [ano]);
      console.log("Resultados da query getItensEntradaPorAno:", results); // Logar resultados da query

      if (!results.length || results[0].quantidade_entraram === null) {
        console.error("Nenhum resultado encontrado para o ano:", ano);
        return 0;
      }

      return results[0].quantidade_entraram || 0;
    } catch (error) {
      console.error("Erro ao buscar itens entraram por ano:", error);
      throw error;
    }
  }

  // Método para obter a quantidade de itens saiu por ano
  async getItensSaidosPorAno(ano) {
    console.log("Ano recebido no método getItensSaidosPorAno:", ano);

    if (!ano || isNaN(ano)) {
      throw new Error(`Ano inválido: ${ano}`);
    }

    const query = `
      SELECT SUM(quantidade) AS quantidadeSaidos 
      FROM itenspagos 
      WHERE YEAR(data_de_saida) = ?
    `;

    try {
      const [results] = await connection.execute(query, [ano]);
      console.log("Resultados da query getItensSaidosPorAno:", results);

      if (!results.length || results[0].quantidadeSaidos === null) {
        console.error("Nenhum resultado encontrado para o ano:", ano);
        return 0;
      }

      return results[0].quantidadeSaidos || 0;
    } catch (error) {
      console.error("Erro ao buscar itens saídos por ano:", error);
      throw error;
    }
  }

  // Método para obter o relatório de entradas por mês e ano
  getRelatorioEntradas = async () => {
    const query = `
    SELECT 
      DATE_FORMAT(data_de_entrada, '%m-%Y') AS mes_ano, 
      COUNT(*) AS total_entradas 
    FROM estoqueatual 
    GROUP BY mes_ano
    ORDER BY mes_ano;
  `;
    try {
      const [results] = await connection.execute(query);
      return results;
    } catch (error) {
      console.error("Erro ao buscar relatório de entradas:", error);
      throw error;
    }
  };

  // Método para obter o relatório de saídas por mês e ano
  getRelatorioSaidas = async () => {
    const query = `
      SELECT 
        DATE_FORMAT(data_de_saida, '%m-%Y') AS mes_ano, 
        COUNT(*) AS total_saidas 
      FROM itenspagos 
      GROUP BY mes_ano
      ORDER BY mes_ano;
    `;
    try {
      const [results] = await connection.execute(query);
      return results;
    } catch (error) {
      console.error("Erro ao buscar relatório de saídas:", error);
      throw error;
    }
  };

  // Método para buscar dados da tabela estoqueatual
  getInfoPorTombo = async (tombo) => {
    const queryEstoque = `
        SELECT
          id, data_de_entrada, descricao, tombo, categoria,
          doc_origem, estoque, valor, situacao, observacao
        FROM estoqueatual
        WHERE tombo = ? AND pago = 1
      `;
    try {
      const [resultsEstoque] = await connection.execute(queryEstoque, [tombo]);
      console.log("Resultados da query de estoque:", resultsEstoque);
      return resultsEstoque.length > 0 ? resultsEstoque[0] : null;
    } catch (error) {
      console.error("Erro ao buscar informações do estoque:", error);
      throw error;
    }
  };

  // Método para buscar dados da tabela itenspagos
  getSaidaPorTombo = async (tombo) => {
    const queryEstoque = `
        SELECT id
        FROM estoqueatual
        WHERE tombo = ?
      `;

    const querySaida = `
        SELECT
          data_de_saida, doc_saida, referencia, destino,
          posto_graduacao, mat_funcional, telefone, nome_completo, observacao AS observacao_saida
        FROM itenspagos
        WHERE tombo = ?
      `;

    try {
      const [resultsEstoque] = await connection.execute(queryEstoque, [tombo]);
      console.log("Resultados da query de estoque:", resultsEstoque);

      if (resultsEstoque.length === 0) {
        console.log(
          "Nenhum registro encontrado na tabela estoqueatual para o tombo:",
          tombo
        );
        return null;
      }

      const idEstoque = resultsEstoque[0].id;
      console.log("ID encontrado na tabela estoqueatual:", idEstoque);

      const [resultsSaida] = await connection.execute(querySaida, [idEstoque]);
      console.log("Resultados da query de saída:", resultsSaida);
      if (resultsSaida.length === 0) {
        console.log(
          "Nenhum registro encontrado na tabela itenspagos para o ID:",
          idEstoque
        );
        return null;
      }
      return resultsSaida[0];
    } catch (error) {
      console.error("Erro ao buscar informações de saída do tombo:", error);
      throw error;
    }
  };

  getItemByTombo = async (tombo) => {
    const query = `SELECT * FROM estoqueAtual WHERE tombo = ?`;
    try {
      const [results] = await connection.execute(query, [tombo]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error("Erro ao buscar item pelo tombo:", error);
      throw error;
    }
  };
}

export default new PesquisaModel();
