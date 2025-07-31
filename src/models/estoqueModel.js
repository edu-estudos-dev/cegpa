import connection from '../../db_config/connection.js';

class EstoqueModel {
   /* ********************************************************************************
                  Métodos para a ENTRADA de itens no Estoque
   *********************************************************************************/

   // Método para atualizar um item no estoque
   updateEstoque = async (id, data) => {
      // Validação dos dados recebidos
      const requiredFields = [
         'data_de_entrada',
         'descricao',
         'tombo',
         'categoria',
         'conta_contabil',
         'doc_origem',
         'estoque',
         'valor',
         'situacao',
      ];

      for (const field of requiredFields) {
         if (data[field] === undefined || data[field] === null) {
            throw new Error(
               `Campo obrigatório '${field}' está ausente ou nulo.`
            );
         }
      }

      const query = `
         UPDATE estoqueatual 
         SET 
            data_de_entrada = ?, 
            descricao = ?, 
            tombo = ?, 
            categoria = ?, 
            conta_contabil = ?, 
            doc_origem = ?, 
            estoque = ?, 
            valor = ?, 
            situacao = ?, 
            observacao = ?
         WHERE id = ?`;
      try {
         console.log('Dados recebidos para atualização:', data); // Log para depuração
         const [result] = await connection.execute(query, [
            data.data_de_entrada,
            data.descricao,
            data.tombo,
            data.categoria,
            data.conta_contabil,
            data.doc_origem,
            data.estoque,
            data.valor,
            data.situacao,
            data.observacao,
            id,
         ]);
         console.log('Resultado da atualização:', result); // Log para depuração
         return result.affectedRows;
      } catch (error) {
         console.error('Erro ao atualizar o item no estoque:', {
            error: error.message,
            data,
            id,
         });
         throw new Error(
            `Erro ao atualizar o item no estoque: ${error.message}`
         );
      }
   };

   // Método para atualizar um item no tombamento
   updateTombamento = async (id, data) => {
      const query = `
      UPDATE registrodetombamento
      SET 
         data_de_entrada = ?, 
         quantidade = ?, 
         tipo_tombo = ?, 
         tombo = ?, 
         categoria = ?, 
         doc_origem = ?, 
         estoque = ?, 
         valor = ?, 
         situacao = ?, 
         observacao = ?, 
         conta_contabil = ?
      WHERE id = ?
   `;
      const values = [
         data.data_de_entrada,
         data.quantidade,
         data.tipo_tombo,
         data.tombo_inicial || null, // Usamos tombo_inicial como tombo
         data.categoria,
         data.doc_origem,
         data.estoque,
         data.valor,
         data.situacao,
         data.observacao,
         data.conta_contabil,
         id,
      ];

      try {
         if (data.tombo_inicial && data.tombo_inicial.toString().length !== 6) {
            throw new Error(
               `O tombo ${data.tombo_inicial} deve ter exatamente 6 dígitos.`
            );
         }
         const [result] = await connection.execute(query, values);
         return result.affectedRows;
      } catch (error) {
         console.error('Erro ao atualizar tombamento:', error);
         throw error;
      }
   };

   // Método para obter todo o estoque
   getAllEstoque = async () => {
      const query = `SELECT * FROM estoqueatual WHERE pago = FALSE ORDER BY descricao ASC`;
      try {
         const [results] = await connection.execute(query);
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
      observacao,
      tipo_tombo = 'AUTO'
   ) => {
      if (
         !Number.isInteger(Number(tombo)) ||
         tombo < 0 ||
         tombo.toString().length !== 6
      ) {
         throw new Error(
            'O tombo deve ser um número inteiro de exatamente 6 dígitos.'
         );
      }
      const query = `
      INSERT INTO estoqueatual (
         data_de_entrada, descricao, tombo, quantidade, categoria, 
         conta_contabil, doc_origem, estoque, valor, situacao, 
         observacao, tipo_tombo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
   `;
      try {
         const [result] = await connection.execute(query, [
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
            tipo_tombo,
         ]);
         return result.affectedRows;
      } catch (error) {
         console.error('Erro ao criar item no estoque:', error);
         throw error;
      }
   };

   // Método para criar itens em lote no estoque
   createEstoqueLote = async (itens) => {
      const query = `
      INSERT INTO estoqueatual (
         data_de_entrada, descricao, tombo, quantidade, categoria, 
         conta_contabil, doc_origem, estoque, valor, situacao, 
         observacao, tipo_tombo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
   `;
      try {
         for (const item of itens) {
            if (item.tombo.toString().length !== 6) {
               throw new Error(
                  `O tombo ${item.tombo} deve ter exatamente 6 dígitos.`
               );
            }
            await connection.execute(query, [
               item.data_de_entrada,
               item.descricao,
               item.tombo,
               item.quantidade,
               item.categoria,
               item.conta_contabil,
               item.doc_origem,
               item.estoque,
               item.valor,
               item.situacao,
               item.observacao,
               item.tipo_tombo,
            ]);
         }
         return itens.length;
      } catch (error) {
         console.error('Erro ao criar itens em lote no estoque:', error);
         throw error;
      }
   };

   // Método para criar itens em lote no tombamento
   createTombamentoLote = async (itens) => {
      const query = `
      INSERT INTO registrodetombamento (
         data_de_entrada, quantidade, tipo_tombo, tombo, categoria, 
         doc_origem, estoque, valor, situacao, observacao, 
         conta_contabil
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
   `;
      try {
         for (const item of itens) {
            if (item.tombo.toString().length !== 6) {
               throw new Error(
                  `O tombo ${item.tombo} deve ter exatamente 6 dígitos.`
               );
            }
            await connection.execute(query, [
               item.data_de_entrada,
               item.quantidade,
               item.tipo_tombo,
               item.tombo,
               item.categoria,
               item.doc_origem,
               item.estoque,
               item.valor,
               item.situacao,
               item.observacao,
               item.conta_contabil,
            ]);
         }
         return itens.length;
      } catch (error) {
         console.error('Erro ao criar itens em lote no tombamento:', error);
         throw error;
      }
   };

   // Método para obter informações de um item pelo ID
   getInfoByID = async (id) => {
      const query = `SELECT * FROM estoqueatual WHERE id = ?`;
      try {
         const [results] = await connection.execute(query, [id]);
         return results[0] || null;
      } catch (error) {
         console.error('Erro ao buscar item por ID:', error);
         throw error;
      }
   };

   // Método para obter informações de um item pelo tombo
   getInfoByTombo = async (tombo) => {
      const query = `SELECT * FROM estoqueatual WHERE tombo = ?`;
      try {
         const [results] = await connection.execute(query, [tombo]);
         return results[0] || null;
      } catch (error) {
         console.error('Erro ao buscar item por tombo:', error);
         throw error;
      }
   };

   // Método para obter informações de um item no tombamento pelo tombo
   getInfoByTomboTombamento = async (tombo) => {
      const query = `SELECT * FROM registrodetombamento WHERE tombo = ?`;
      try {
         const [results] = await connection.execute(query, [tombo]);
         return results[0] || null;
      } catch (error) {
         console.error('Erro ao buscar item no tombamento por tombo:', error);
         throw error;
      }
   };

   // Método para obter informações de um item no tombamento pelo ID
   getInfoByIdTombamento = async (id) => {
      const query = `SELECT * FROM registrodetombamento WHERE id = ?`;
      try {
         const [results] = await connection.execute(query, [id]);
         return results[0] || null;
      } catch (error) {
         console.error('Erro ao buscar item no tombamento por ID:', error);
         throw error;
      }
   };

   // Método para obter todos os itens novos
   getAllItensNovos = async () => {
      const query = `SELECT * FROM estoqueatual WHERE situacao = 'NOVO' AND pago = FALSE ORDER BY descricao ASC`;
      try {
         const [results] = await connection.execute(query);
         return results;
      } catch (error) {
         console.error('Erro ao buscar itens novos:', error);
         throw error;
      }
   };

   // Método para obter todos os itens usados
   getAllItensUsados = async () => {
      const query = `SELECT * FROM estoqueatual WHERE situacao = 'USADO' AND pago = FALSE ORDER BY descricao ASC`;
      try {
         const [results] = await connection.execute(query);
         return results;
      } catch (error) {
         console.error('Erro ao buscar itens usados:', error);
         throw error;
      }
   };

   // Método para obter todos os itens do tombamento
   getAllTombamento = async () => {
      const query = `SELECT * FROM registrodetombamento ORDER BY descricao ASC`;
      try {
         const [results] = await connection.execute(query);
         return results;
      } catch (error) {
         console.error('Erro ao buscar tombamento:', error);
         throw error;
      }
   };

   // Método para obter o último tombo
   getUltimoTombo = async () => {
      const query = `
      SELECT tombo 
      FROM (
         SELECT tombo FROM estoqueatual WHERE LENGTH(tombo) = 6
         UNION 
         SELECT tombo FROM registrodetombamento WHERE LENGTH(tombo) = 6
      ) AS combined 
      ORDER BY tombo DESC 
      LIMIT 1
   `;
      try {
         const [results] = await connection.execute(query);
         return results[0]?.tombo ? parseInt(results[0].tombo) : 0;
      } catch (error) {
         console.error('Erro ao obter último tombo:', error);
         throw error;
      }
   };

   // Método para obter quantidade única de itens no estoque
   getQtdeUnicaEstoque = async () => {
      const query = `
         SELECT 
            descricao, 
            categoria, 
            COUNT(*) AS quantidade 
         FROM estoqueatual 
         WHERE pago = FALSE 
         GROUP BY descricao, categoria 
         ORDER BY quantidade DESC, descricao ASC
      `;
      try {
         const [results] = await connection.execute(query);
         return results;
      } catch (error) {
         console.error('Erro ao obter quantidade única de estoque:', error);
         throw error;
      }
   };

   getAllItensPagos = async (data_inicial, data_final) => {
      let query = `
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
   `;
      const params = [];

      if (data_inicial && data_final) {
         const dataFinalAjustada = `${data_final} 23:59:59`;
         query += ` WHERE ip.data_de_saida BETWEEN ? AND ?`;
         params.push(data_inicial, dataFinalAjustada);
      }

      query += ` ORDER BY ip.data_de_saida DESC`;

      try {
         const [results] = await connection.execute(query, params);
         console.log(
            'Resultados da query getAllItensPagos:',
            results.map((item) => ({
               id: item.id,
               tombo: item.tombo_estoqueatual,
               descricao: item.descricao,
               valor: item.valor,
               data_de_saida: item.data_de_saida,
            }))
         );
         return results.map((item) => ({
            ...item,
            descricao: item.descricao || '',
            valor: item.valor ? parseFloat(item.valor) : 0,
         }));
      } catch (error) {
         console.error('Erro ao buscar itens pagos:', error);
         throw error;
      }
   };

   // Método para excluir um item do estoque
   delete = async (id) => {
      const query = `DELETE FROM estoqueatual WHERE id = ?`;
      try {
         const [result] = await connection.execute(query, [id]);
         return result.affectedRows;
      } catch (error) {
         console.error('Erro ao excluir item do estoque:', error);
         throw error;
      }
   };

   // Método para excluir um item do tombamento
   deleteTombamento = async (id) => {
      const query = `DELETE FROM registrodetombamento WHERE id = ?`;
      try {
         const [result] = await connection.execute(query, [id]);
         return result.affectedRows;
      } catch (error) {
         console.error('Erro ao excluir item do tombamento:', error);
         throw error;
      }
   };

   /* ********************************************************************************
                  Métodos para a SAÍDA de itens no Estoque
   *********************************************************************************/

   // Método para obter itens disponíveis
   getItensDisponiveis = async () => {
      const query = `
         SELECT id, tombo, descricao, situacao, estoque 
         FROM estoqueatual 
         WHERE pago = FALSE 
         ORDER BY tombo ASC
      `;
      try {
         const [results] = await connection.execute(query);
         return results;
      } catch (error) {
         console.error('Erro ao buscar itens disponíveis:', error);
         throw error;
      }
   };

   // Método para registrar saída de itens
   createSaida = async (
      estoqueatual_id,
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
      const query = `
      INSERT INTO itenspagos (
         estoqueatual_id, tombo, doc_saida, data_de_saida, quantidade, 
         referencia, destino, posto_graduacao, mat_funcional, telefone, 
         nome_completo, observacao, descricao
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
   `;
      try {
         console.log('Inserindo na tabela itenspagos com os seguintes dados:', {
            estoqueatual_id,
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
         const [result] = await connection.execute(query, [
            estoqueatual_id,
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
         const updateQuery = `UPDATE estoqueatual SET pago = 1 WHERE id = ?`;
         await connection.execute(updateQuery, [estoqueatual_id]);
         return result.insertId;
      } catch (error) {
         console.error('Erro ao inserir dados na tabela itenspagos:', error);
         throw error;
      }
   };

   // Método para marcar um item como pago
   markAsPaid = async (id) => {
      const query = `UPDATE estoqueatual SET pago = TRUE WHERE id = ?`;
      try {
         const [result] = await connection.execute(query, [id]);
         return result.affectedRows;
      } catch (error) {
         console.error('Erro ao marcar item como pago:', error);
         throw error;
      }
   };

   // Método para obter itens pagos
   getItensPagos = async (data_inicial = null, data_final = null) => {
      let query = `
         SELECT 
            ip.*, 
            e.descricao, 
            e.tombo AS tombo_estoqueatual, 
            e.doc_origem 
         FROM itenspagos ip 
         LEFT JOIN estoqueatual e ON ip.estoqueatual_id = e.id
      `;
      const params = [];

      if (data_inicial && data_final) {
         query += ` WHERE ip.data_de_saida BETWEEN ? AND ?`;
         params.push(data_inicial, data_final);
      }

      query += ` ORDER BY ip.data_de_saida DESC`;

      try {
         const [results] = await connection.execute(query, params);
         return results;
      } catch (error) {
         console.error('Erro ao buscar itens pagos:', error);
         throw error;
      }
   };

   // Método para obter detalhes de um item pago pelo ID
   getItemPagoDetalhes = async (id) => {
      const query = `
         SELECT 
            ip.*, 
            e.descricao, 
            e.tombo AS tombo_estoqueatual, 
            e.doc_origem, 
            e.valor 
         FROM itenspagos ip 
         LEFT JOIN estoqueatual e ON ip.estoqueatual_id = e.id 
         WHERE ip.id = ?
      `;
      try {
         const [results] = await connection.execute(query, [id]);
         return results[0] || null;
      } catch (error) {
         console.error('Erro ao buscar detalhes do item pago:', error);
         throw error;
      }
   };

   // Método para obter itens pagos para PDF
   getItensPagosForPDF = async (data_inicial, data_final) => {
      const query = `
         SELECT 
            ip.*, 
            e.descricao, 
            e.tombo AS tombo_estoqueatual, 
            e.doc_origem, 
            e.valor 
         FROM itenspagos ip 
         LEFT JOIN estoqueatual e ON ip.estoqueatual_id = e.id 
         WHERE ip.data_de_saida BETWEEN ? AND ? 
         ORDER BY ip.data_de_saida DESC
      `;
      try {
         const [results] = await connection.execute(query, [
            data_inicial,
            data_final,
         ]);
         return results;
      } catch (error) {
         console.error('Erro ao buscar itens pagos para PDF:', error);
         throw error;
      }
   };

   // Método para reverter saída
   reverterSaida = async (id, estoqueatual_id) => {
      const deleteQuery = `DELETE FROM itenspagos WHERE id = ?`;
      const updateQuery = `UPDATE estoqueatual SET pago = FALSE WHERE id = ?`;
      const conn = await connection.getConnection();
      try {
         await conn.beginTransaction();
         await conn.execute(deleteQuery, [id]);
         await conn.execute(updateQuery, [estoqueatual_id]);
         await conn.commit();
         return true;
      } catch (error) {
         await conn.rollback();
         console.error('Erro ao reverter saída:', error);
         throw error;
      } finally {
         conn.release();
      }
   };

   // Método para obter item pago pelo ID
   getItemPagoByID = async (id) => {
      const query = `
         SELECT * FROM itenspagos WHERE id = ?
      `;
      try {
         const [results] = await connection.execute(query, [id]);
         return results[0] || null;
      } catch (error) {
         console.error('Erro ao buscar item pago por ID:', error);
         throw error;
      }
   };

   // Método para obter saída por ID de estoqueatual
   getSaidaByEstoqueatualId = async (estoqueatual_id) => {
      const query = `
         SELECT * FROM itenspagos WHERE estoqueatual_id = ?
      `;
      try {
         const [results] = await connection.execute(query, [estoqueatual_id]);
         return results[0] || null;
      } catch (error) {
         console.error('Erro ao buscar saída por estoqueatual_id:', error);
         throw error;
      }
   };
}

export default new EstoqueModel();
