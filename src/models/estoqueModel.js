import connection from "../../db_config/connection.js";

class EstoqueModel {
  //   /* ********************************************************************************
  //                   Métodos para a ENTRADA de itens no Estoque
  //   *********************************************************************************/

  // Método para obter todo o estoque
  getAllEstoque = async () => {
    const query = `SELECT * FROM estoqueAtual WHERE pago = FALSE`;
    try {
      const [results] = await connection.execute(query);
      return results; // Retorna apenas os itens não pagos
    } catch (error) {
      console.error("Erro ao buscar estoque Atual:", error);
      throw error;
    }
  };

  // Método para criar um novo item no estoque
  createEstoque = async (
    data_de_entrada,
    descricao,
    tombo,
    quantidade,
    subgrupo,
    categoria,
    conta_contabil,
    doc_origem,
    estoque,
    valor,
    situacao,
    observacao
  ) => {
    const query = `INSERT INTO estoqueatual (data_de_entrada, descricao, tombo, quantidade, subgrupo, categoria, conta_contabil, doc_origem, estoque, valor, situacao, observacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    try {
      await connection.execute(query, [
        data_de_entrada,
        descricao,
        tombo,
        quantidade,
        subgrupo,
        categoria,
        conta_contabil,
        doc_origem,
        estoque,
        valor,
        situacao,
        observacao,
      ]);
    } catch (error) {
      console.error("Erro ao inserir dados no estoque:", error);
      throw error;
    }
  };

  // Método para obter o último tombo de um subgrupo em um ano específico
  getUltimoTombo = async (ano, subgrupo) => {
    const query = `
      SELECT MAX(CAST(SUBSTR(tombo, 8) AS UNSIGNED)) AS ultimoTombo
      FROM estoqueAtual
      WHERE SUBSTR(tombo, 3, 4) = ? AND SUBSTR(tombo, 7, 1) = ?
    `;
    try {
      const [results] = await connection.execute(query, [ano, subgrupo]);
      return results[0]?.ultimoTombo || 0; // Retorna o último tombo ou 0 se não houver resultados
    } catch (error) {
      console.error("Erro ao obter o último tombo:", error);
      throw error;
    }
  };

  /* ********************************************************************************
                  Métodos para a SAÍDA de itens no Estoque
  *********************************************************************************/

  // Método para obter os itens disponíveis
  getItensDisponiveis = async () => {
    const query = `SELECT * FROM estoqueAtual WHERE pago = FALSE`;
    try {
      const [results] = await connection.execute(query);
      return results; // Retorna apenas os itens disponíveis
    } catch (error) {
      console.error("Erro ao buscar itens disponíveis:", error);
      throw error;
    }
  };

  // Método para remover itens selecionados pela coluna tombo
  removeItens = async (tombos) => {
    const query = `DELETE FROM estoqueAtual WHERE tombo IN (${tombos
      .map(() => "?")
      .join(", ")})`;
    try {
      await connection.execute(query, tombos);
    } catch (error) {
      console.error("Erro ao remover itens:", error);
      throw error;
    }
  };

  // Método para adicionar a saida no banco de dados
  createSaida = async (
    tombo,
    doc_saida,
    data_de_saida,
    quantidade,
    referencia,
    destino,
    posto_graduacao,
    mat_funcional,
    telefone,
    nome_completo,
    observacao,
    descricao
  ) => {
    const query = `INSERT INTO itensPagos (tombo, doc_saida, data_de_saida, quantidade, referencia, destino, posto_graduacao, mat_funcional, telefone, nome_completo, observacao, descricao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    try {
      console.log("Inserindo na tabela itensPagos com os seguintes dados:", {
        tombo,
        doc_saida,
        data_de_saida,
        quantidade,
        referencia,
        destino,
        posto_graduacao,
        mat_funcional,
        telefone,
        nome_completo,
        observacao,
        descricao,
      });

      await connection.execute(query, [
        tombo,
        doc_saida,
        data_de_saida,
        quantidade,
        referencia,
        destino,
        posto_graduacao,
        mat_funcional,
        telefone,
        nome_completo,
        observacao,
        descricao,
      ]);

      console.log("Atualizando a coluna pago para o tombo:", tombo);

      const updateQuery = `UPDATE estoqueatual SET pago = 1 WHERE tombo = ?`;
      await connection.execute(updateQuery, [tombo]);

      console.log("Atualização concluída para o tombo:", tombo);
    } catch (error) {
      console.error("Erro ao inserir dados na tabela itensPagos:", error);
      throw error;
    }
  };

  markAsPaid = async (id) => {
    const query = `UPDATE estoqueatual SET pago = 1 WHERE id = ?`;
    try {
      await connection.execute(query, [id]);
    } catch (error) {
      console.error(
        "Erro ao atualizar a coluna pago na tabela estoqueatual:",
        error
      );
      throw error;
    }
  };

  getItemByTombo = async (tombo) => {
    const query = `SELECT * FROM estoqueAtual WHERE tombo = ?`;
    try {
      const [results] = await connection.execute(query, [tombo]);
      return results[0];
    } catch (error) {
      console.error("Erro ao buscar item pelo tombo:", error);
      throw error;
    }
  };

  //   /* ********************************************************************************
  //                   Métodos para a Pesquisa
  //   *********************************************************************************/

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
  pesquisaAvancada = async (ano) => {
    console.log("Ano recebido no método pesquisaAvancada:", ano); // Adicionado log aqui
  
    const queryEntraram = `SELECT SUM(quantidade) AS quantidadeEntraram FROM estoqueatual WHERE YEAR(data_de_entrada) = ?`;
    const querySaidos = `SELECT SUM(quantidade) AS quantidadeSaidos FROM itenspagos WHERE YEAR(data_de_saida) = ?`;
  
    try {
      const [resultados] = await connection.execute(
        `SELECT * FROM estoqueatual WHERE pago = FALSE`
      );
      console.log("Resultados da query SELECT * FROM estoqueatual:", resultados); // Adicionado log aqui
  
      const [quantidadeEntraram] = await connection.execute(
        queryEntraram,
        ano ? [ano] : [null]
      );
      console.log("Quantidade de itens que entraram - queryEntraram:", quantidadeEntraram); // Adicionado log aqui
  
      const [quantidadeSaidos] = await connection.execute(
        querySaidos,
        ano ? [ano] : [null]
      );
      console.log("Quantidade de itens que saíram - querySaidos:", quantidadeSaidos); // Adicionado log aqui
  
      return {
        resultados,
        quantidadeEntraram: quantidadeEntraram[0].quantidadeEntraram || 0,
        quantidadeSaidos: quantidadeSaidos[0].quantidadeSaidos || 0,
      };
    } catch (error) {
      console.error("Erro na pesquisa avançada:", error);
      throw error;
    }
  };
  
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
    `; // Alteração aqui, mudando tombo para id_estoque

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
    console.log("Ano recebido no método getItensSaidosPorAno:", ano); // Logar dados recebidos
  
    if (!ano || isNaN(ano)) {
      throw new Error(`Ano inválido: ${ano}`); // Verificar se os argumentos são válidos
    }
  
    const query = `
      SELECT SUM(quantidade) AS quantidade_saidos 
      FROM itenspagos 
      WHERE YEAR(data_de_saida) = ?
    `;
  
    try {
      const [results] = await connection.execute(query, [ano]);
      console.log("Resultados da query getItensSaidosPorAno:", results); // Logar resultados da query
  
      if (!results.length || results[0].quantidade_saidos === null) {
        console.error("Nenhum resultado encontrado para o ano:", ano);
        return 0;
      }
  
      return results[0].quantidade_saidos || 0;
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
}

export default new EstoqueModel();
