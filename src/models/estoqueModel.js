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

  // Método para pesquisa avançada no estoque
  pesquisaAvancada = async (filtros) => {
    const { descricao, categoria, subgrupo, data_inicio, data_fim, ano } = filtros;
    let query = `SELECT * FROM estoqueatual WHERE pago = FALSE `;
    const params = [];
  
    if (descricao) {
      query += `AND descricao LIKE ? `;
      params.push(`%${descricao}%`);
    }
    if (categoria && categoria !== 'Selecione...') {
      query += `AND categoria = ? `;
      params.push(categoria);
    }
    if (subgrupo) {
      query += `AND subgrupo = ? `;
      params.push(subgrupo);
    }
    if (data_inicio) {
      query += `AND data_de_entrada >= ? `;
      params.push(data_inicio);
    }
    if (data_fim) {
      query += `AND data_de_entrada <= ? `;
      params.push(data_fim);
    }
  
    try {
      const [resultados] = await connection.execute(query, params);
      let quantidadeSaidos;
      if (ano) {
        quantidadeSaidos = await this.getItensSaidosPorAno(ano);
      }
      return { resultados, quantidadeSaidos };
    } catch (error) {
      console.error("Erro na pesquisa avançada:", error);
      throw error;
    }
  };
  

  // Método para obter a quantidade de itens saídos por ano
  getItensSaidosPorAno = async (ano) => {
    const query = `
      SELECT 
        COUNT(*) AS quantidade_saidos 
      FROM 
        itenspagos 
      WHERE 
        YEAR(data_de_saida) = ?
    `;
    console.log("Executando query para obter itens saídos por ano:", ano);
  
    try {
      const [results] = await connection.execute(query, [ano]);
      console.log("Resultados da query:", results);
      if (results.length === 0) {
        console.error("Nenhum resultado encontrado para o ano:", ano);
        return 0;
      }
      console.log("Quantidade de itens que saíram no ano:", results[0].quantidade_saidos);
      return results[0].quantidade_saidos;
    } catch (error) {
      console.error("Erro ao buscar itens saídos por ano:", error);
      throw error;
    }
  };
  
  // Método para obter a quantidade de itens entrou por ano
  getItensEntradaPorAno = async (ano) => {
    const query = `
      SELECT 
        COUNT(*) AS quantidade_entraram 
      FROM 
        estoqueatual 
      WHERE 
        YEAR(data_de_entrada) = ?
    `;
    console.log("Executando query para obter itens de entrada por ano:", ano);
  
    try {
      const [results] = await connection.execute(query, [ano]);
      console.log("Resultados da query:", results);
      if (results.length === 0) {
        console.error("Nenhum resultado encontrado para o ano:", ano);
        return 0;
      }
      console.log("Quantidade de itens que entraram no ano:", results[0].quantidade_entraram);
      return results[0].quantidade_entraram;
    } catch (error) {
      console.error("Erro ao buscar itens entraram por ano:", error);
      throw error;
    }
  };
  

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
}

export default new EstoqueModel();
