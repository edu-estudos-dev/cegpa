import connection from '../../db_config/connection.js';

class EstoqueModel {
   constructor() {
      console.log('Instanciando EstoqueModel...');
   }

   /* ********************************************************************************
                  Métodos para a ENTRADA de itens no Estoque
   *********************************************************************************/

   // Método para obter todo o estoque
   getAllEstoque = async () => {
      const query = `SELECT * FROM estoqueatual WHERE pago = FALSE ORDER BY descricao ASC`;
      try {
         const [results] = await connection.execute(query);
         console.log('Resultados de getAllEstoque:', results);
         return results;
      } catch (error) {
         console.error('Erro ao buscar estoque atual:', error);
         throw error;
      }
   };

   // Método para criar um novo item no estoque
   createEstoque = async (
      data_de_entrada,
      descricao,
      tombo,
      quantidade,
      categoria,
      conta_contabil,
      doc_origem,
      estoque,
      valor,
      situacao,
      observacao
   ) => {
      // Validar que tombo é um número inteiro
      if (!Number.isInteger(Number(tombo)) || tombo < 0) {
         throw new Error('O tombo deve ser um número inteiro não negativo.');
      }
      const query = `INSERT INTO estoqueatual (data_de_entrada, descricao, tombo, quantidade, categoria, conta_contabil, doc_origem, estoque, valor, situacao, observacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      try {
         await connection.execute(query, [
            data_de_entrada,
            descricao,
            tombo,
            quantidade,
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

   // Método para obter o último tombo
   getUltimoTombo = async () => {
      // Logar todos os tombos para depuração
      const queryAll = `SELECT tombo FROM estoqueatual ORDER BY tombo ASC`;
      const [allResults] = await connection.execute(queryAll);
      console.log('Todos os tombos no banco:', allResults);

      // Consulta para obter o maior tombo
      const query = `
         SELECT tombo
         FROM estoqueatual
         ORDER BY tombo DESC
         LIMIT 1;
      `;
      try {
         const [results] = await connection.execute(query);
         console.log('Resultado da query para maior tombo:', results);
         if (!results || results.length === 0) {
            console.log('Nenhum tombo encontrado, usando 70000 como fallback.');
            return 70149;  // <<<===== ajuste para iniciar a partir do último tombo 
         }
         const ultimoTombo = results[0].tombo;
         console.log('Maior tombo encontrado no banco:', ultimoTombo);
         return ultimoTombo;
      } catch (error) {
         console.error('Erro ao obter o último tombo:', error);
         throw error;
      }
   };

   // Método para obter apenas os itens Novos do estoque
   getAllItensNovos = async () => {
      const query = `SELECT * FROM estoqueatual WHERE pago = FALSE AND situacao = 'NOVO' ORDER BY descricao ASC`;
      try {
         const [results] = await connection.execute(query);
         return results;
      } catch (error) {
         console.error('Erro ao buscar itens novos no estoque atual:', error);
         throw error;
      }
   };

   // Método para obter apenas os itens Usados do estoque
   getAllItensUsados = async () => {
      const query = `SELECT * FROM estoqueatual WHERE pago = FALSE AND (situacao = 'BOM' OR situacao = 'OTIMO' OR situacao = 'REGULAR') ORDER BY descricao ASC`;
      try {
         const [results] = await connection.execute(query);
         return results;
      } catch (error) {
         console.error('Erro ao buscar itens Usados no estoque atual:', error);
         throw error;
      }
   };

   // Método para obter quantidade de itens únicos com base na descrição
   getQtdeUnicaEstoque = async () => {
      const query = `
         SELECT descricao, COUNT(*) AS quantidade
         FROM estoqueatual
         WHERE pago = FALSE
         GROUP BY descricao
         ORDER BY descricao ASC;
      `;
      try {
         const [results] = await connection.execute(query);
         return results;
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
      const query = `SELECT * FROM estoqueatual WHERE pago = FALSE`;
      try {
         const [results] = await connection.execute(query);
         return results;
      } catch (error) {
         console.error('Erro ao buscar itens disponíveis:', error);
         throw error;
      }
   };

   // Método para obter os itens que saíram do estoque
   getItensPagos = async () => {
      const query = `
      SELECT 
        ip.id,
        ip.data_de_saida,
        ip.descricao,
        ea.tombo AS tombo_estoqueatual,
        ip.destino,
        ip.referencia,
        ip.doc_saida,
        ea.doc_origem,
        ea.valor
      FROM itenspagos ip
      JOIN estoqueatual ea ON ip.estoqueatual_id = ea.id
      ORDER BY ip.data_de_saida DESC;
    `;
      try {
         const [results] = await connection.execute(query);
         console.log('Resultados de getItensPagos:', results);
         return results;
      } catch (error) {
         console.error('Erro ao buscar itens pagos:', error);
         throw error;
      }
   };

   // Método para obter os itens pagos formatados para o PDF
   getItensPagosForPDF = async () => {
      const query = `
         SELECT 
            ip.id,
            ip.data_de_saida,
            ip.descricao,
            ea.tombo AS tombo_estoqueatual,
            ip.destino,
            ip.referencia,
            ip.doc_saida,
            ea.doc_origem,  -- Adicionado o campo doc_origem
            ea.valor
         FROM itenspagos ip
         JOIN estoqueatual ea ON ip.estoqueatual_id = ea.id
         ORDER BY ip.data_de_saida DESC;
      `;
      try {
         const [results] = await connection.execute(query);
         console.log('Resultados de getItensPagosForPDF:', results);
         return results;
      } catch (error) {
         console.error('Erro ao trazer itens pagos para PDF:', error);
         throw error;
      }
   };

   // Método para obter os detalhes do item pago com informações do estoque atual
   getItemPagoDetalhes = async (id) => {
      const query = `
         SELECT 
            ip.*, 
            ea.tombo AS tombo_estoqueatual,
            ea.valor AS valor,
            ea.doc_origem AS doc_origem
         FROM 
            itenspagos ip
         JOIN 
            estoqueatual ea 
         ON 
            ip.estoqueatual_id = ea.id
         WHERE 
            ip.id = ?`;
      try {
         const [results] = await connection.execute(query, [id]);
         console.log('Query executada:', query);
         console.log('Parâmetro ID:', id);
         console.log('Resultados da query:', results);
         return results.length > 0 ? results[0] : null;
      } catch (error) {
         console.error('Erro ao buscar detalhes do item pago:', error);
         throw error;
      }
   };

   // Método para adicionar a saída no banco de dados
   createSaida = async (
      estoqueatual_id,
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
      const query = `INSERT INTO itenspagos (estoqueatual_id, doc_saida, data_de_saida, quantidade, referencia, destino, posto_graduacao, mat_funcional, telefone, nome_completo, observacao, descricao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      try {
         console.log('Inserindo na tabela itenspagos com os seguintes dados:', {
            estoqueatual_id,
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

         const [result] = await connection.execute(query, [
            estoqueatual_id,
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

         const updateQuery = `UPDATE estoqueatual SET pago = 1 WHERE id = ?`;
         await connection.execute(updateQuery, [estoqueatual_id]);

         return result.insertId;
      } catch (error) {
         console.error('Erro ao inserir dados na tabela itenspagos:', error);
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
   getInfoByTombo = async (tombo) => {
      // Validar que tombo é um número inteiro
      if (!Number.isInteger(Number(tombo)) || tombo < 0) {
         throw new Error('O tombo deve ser um número inteiro não negativo.');
      }
      const query = `SELECT * FROM estoqueatual WHERE tombo = ?`; // Removida a restrição pago = FALSE
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
      const query = `SELECT * FROM estoqueatual WHERE id = ?`;
      try {
         const [results] = await connection.execute(query, [id]);
         return results.length > 0 ? results[0] : null;
      } catch (error) {
         console.error('Erro ao buscar informações do tombo:', error);
         throw error;
      }
   };

   // Método para obter informações do item pago pelo ID
   getItemPagoByID = async (id) => {
      const query = `
        SELECT 
          ip.id,
          ip.data_de_saida,
          ip.descricao,
          ea.tombo AS tombo_estoqueatual,
          ip.destino,
          ip.referencia,
          ip.doc_saida,
          ea.doc_origem,
          ea.valor, // <-- Certifique-se que este campo está presente
          ip.nome_completo,
          ip.posto_graduacao,
          ip.mat_funcional,
          ip.telefone,
          ip.observacao
        FROM itenspagos ip
        JOIN estoqueatual ea ON ip.estoqueatual_id = ea.id
        WHERE ip.id = ?;
      `;
      // ... resto do código
   };

   // Método para excluir um item do estoque
   delete = async (id) => {
      const query = `DELETE FROM estoqueatual WHERE id = ?`;
      try {
         const [results] = await connection.execute(query, [id]);
         return results.affectedRows;
      } catch (error) {
         console.error('Erro ao excluir item:', error);
         throw error;
      }
   };

   // Método para obter informações de saída com base no estoqueatual_id (adicionado)
   getSaidaByEstoqueatualId = async (estoqueatual_id) => {
      const query = `SELECT * FROM itenspagos WHERE estoqueatual_id = ?`;
      try {
         const [results] = await connection.execute(query, [estoqueatual_id]);
         console.log('Resultados de getSaidaByEstoqueatualId:', results);
         return results.length > 0 ? results[0] : null;
      } catch (error) {
         console.error(
            'Erro ao buscar dados de saída pelo estoqueatual_id:',
            error
         );
         throw error;
      }
   };
}

export default new EstoqueModel();
