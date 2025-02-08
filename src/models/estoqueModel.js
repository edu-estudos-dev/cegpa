import connection from '../../db_config/connection.js';

class EstoqueModel {
   //   /* ********************************************************************************
   //                   Métodos para a ENTRADA de itens no Estoque
   //   *********************************************************************************/

   // Método para obter todo o estoque
   getAllEstoque = async () => {
      const query = `SELECT * FROM estoqueAtual WHERE pago = FALSE ORDER BY descricao ASC`;
      try {
         const [results] = await connection.execute(query);
         return results; // Retorna apenas os itens não pagos
      } catch (error) {
         console.error('Erro ao buscar estoque Atual:', error);
         throw error;
      }
   };

   // Método para obter apenas os itens Usados do estoque
   getAllItensNovos = async () => {
      const query = `SELECT * FROM estoqueAtual WHERE pago = FALSE AND situacao = 'NOVO' ORDER BY descricao ASC`;
      try {
         const [results] = await connection.execute(query);
         return results; // Retorna apenas os itens não pagos
      } catch (error) {
         console.error('Erro ao buscar itens novos no estoque atual:', error);
         throw error;
      }
   };

   // Método para obter apenas os itens Usados do estoque
   getAllItensUsados = async () => {
      const query = `SELECT * FROM estoqueAtual WHERE pago = FALSE AND (situacao = 'BOM' OR situacao = 'OTIMO' OR situacao = 'REGULAR') ORDER BY descricao ASC`;
      try {
         const [results] = await connection.execute(query);
         return results; // Retorna apenas os itens não pagos
      } catch (error) {
         console.error('Erro ao buscar itens Usados no estoque atual:', error);
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
         console.error('Erro ao inserir dados no estoque:', error);
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
         console.error('Erro ao obter o último tombo:', error);
         throw error;
      }
   };

   // Método para obter quantidade de itens únicos com base na descrição
   getQtdeUnicaEstoque = async () => {
      const query = `
    SELECT descricao, COUNT(*) AS quantidade
    FROM estoqueAtual
    WHERE pago = FALSE
    GROUP BY descricao
    ORDER BY descricao ASC;
  `;
      try {
         const [results] = await connection.execute(query);
         return results; // Retorna a quantidade de itens únicos com base na descrição
      } catch (error) {
         console.error(
            'Erro ao buscar quantidade única de itens no estoque:',
            error
         );
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
         console.error('Erro ao buscar itens disponíveis:', error);
         throw error;
      }
   };

   // Método para obter os itens que sairam do estoque
   getItensPagos = async () => {
      const query = `SELECT * FROM itenspagos`;
      try {
         const [results] = await connection.execute(query);
         return results;
      } catch (error) {
         console.error('Erro ao trazer itens pagos:', error);
         throw error;
      }
   };

   // Método para obter os detalhes do item pago com informações do estoque atual
   getItemPagoDetalhes = async (id) => {
      const query = `
      SELECT 
        ip.*, 
        ea.tombo AS tombo_estoqueatual 
      FROM 
        itenspagos ip
      JOIN 
        estoqueatual ea 
      ON 
        ip.tombo = ea.id  -- Alterando aqui para corresponder ao ID do estoque atual
      WHERE 
        ip.id = ?`;
      try {
         const [results] = await connection.execute(query, [id]);
         console.log('Query executada:', query); // Log da query executada
         console.log('Parâmetro ID:', id); // Log do parâmetro ID
         console.log('Resultados da query:', results); // Log dos resultados
         return results.length > 0 ? results[0] : null;
      } catch (error) {
         console.error('Erro ao buscar detalhes do item pago:', error);
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
         console.log('Inserindo na tabela itensPagos com os seguintes dados:', {
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

         const updateQuery = `UPDATE estoqueatual SET pago = 1 WHERE tombo = ?`;
         await connection.execute(updateQuery, [tombo]);
      } catch (error) {
         console.error('Erro ao inserir dados na tabela itensPagos:', error);
         throw error;
      }
   };

   // Método para marcar item que saiu do estoque atual como 'pago'
   markAsPaid = async (id) => {
      const query = `UPDATE estoqueatual SET pago = 1 WHERE id = ?`;
      try {
         await connection.execute(query, [id]);
      } catch (error) {
         console.error(
            'Erro ao atualizar a coluna pago na tabela estoqueatual:',
            error
         );
         throw error;
      }
   };

   // Método para selecionar um item do estoque atual pelo tombo
   getItemByTombo = async (tombo) => {
      const query = `SELECT * FROM estoqueAtual WHERE tombo = ?`;
      try {
         const [results] = await connection.execute(query, [tombo]);
         return results.length > 0 ? results[0] : null;
      } catch (error) {
         console.error('Erro ao buscar item pelo tombo:', error);
         throw error;
      }
   };

   // Método para obter informações do tombo pelo ID
   getInfoByID = async (id) => {
      const query = `SELECT * FROM estoqueAtual WHERE id = ?`;
      try {
         const [results] = await connection.execute(query, [id]);
         return results[0]; // Retorna apenas o item correspondente ao id
      } catch (error) {
         console.error('Erro ao buscar informações do tombo:', error);
         throw error;
      }
   };

   // Método para obter informações do item pago pelo ID
   getItemPagoByID = async (id) => {
      const query = `SELECT * FROM itenspagos WHERE id = ?`;
      try {
         console.log('Executando query:', query); // log da query
         const [results] = await connection.execute(query, [id]);
         console.log('Results from getItemPagoByID:', results); // log dos resultados
         return results.length > 0 ? results[0] : null;
      } catch (error) {
         console.error('Erro ao buscar item pago pelo ID:', error);
         throw error;
      }
   };

   // Método para excluir um item do estoque
   delete = async (id) => {
      const query = `DELETE FROM estoqueAtual WHERE id = ?`;
      try {
         const [results] = await connection.execute(query, [id]);
         return results.affectedRows; // Retorna o número de linhas deletadas
      } catch (error) {
         console.error('Erro ao excluir item:', error);
         throw error;
      }
   };
}

export default new EstoqueModel();
