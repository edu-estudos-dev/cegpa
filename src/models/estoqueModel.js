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
         tombo_final = ?, 
         tombo_lote_manual = ?, 
         categoria = ?, 
         doc_origem = ?, 
         estoque = ?, 
         valor = ?, 
         situacao = ?, 
         observacao = ?, 
         conta_contabil = ?,
         descricao = ?
      WHERE id = ?
   `;
      const values = [
         data.data_de_entrada,
         data.quantidade,
         data.tipo_tombo,
         data.tombo || null,
         data.tombo_final || null,
         data.tombo_lote_manual ? JSON.stringify(data.tombo_lote_manual) : null,
         data.categoria,
         data.doc_origem,
         data.estoque,
         data.valor,
         data.situacao,
         data.observacao,
         data.conta_contabil,
         data.descricao,
         id,
      ];

      try {
         const [result] = await connection.execute(query, values);
         if (result.affectedRows === 0) {
            console.warn(
               `Nenhuma linha afetada ao atualizar tombamento com ID ${id}`
            );
         }
         return result.affectedRows;
      } catch (error) {
         console.error('Erro ao atualizar tombamento:', error);
         throw error;
      }
   };

   // Método para obter todo o estoque
   getAllEstoque = async () => {
      const query = `
      SELECT ea.* 
      FROM estoqueatual ea
      LEFT JOIN reservas r ON ea.id = r.item_id AND r.ativo = TRUE
      WHERE ea.pago = FALSE AND r.id IS NULL
      ORDER BY ea.descricao ASC
   `;
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
      // Validação de campos obrigatórios
      const requiredFields = [
         { field: data_de_entrada, name: 'data_de_entrada' },
         { field: descricao, name: 'descricao' },
         { field: tombo, name: 'tombo' },
         { field: quantidade, name: 'quantidade' },
         {
            field: categoria,
            name: 'categoria',
            invalid: 'SELECIONE UMA CATEGORIA...',
         },
         {
            field: conta_contabil,
            name: 'conta_contabil',
            invalid: 'ESCOLHA UMA OPÇÃO...',
         },
         { field: doc_origem, name: 'doc_origem' },
         { field: estoque, name: 'estoque', invalid: 'ESCOLHA UMA OPÇÃO...' },
         { field: valor, name: 'valor' },
         { field: situacao, name: 'situacao', invalid: 'ESCOLHA UMA OPÇÃO...' },
      ];

      for (const { field, name, invalid } of requiredFields) {
         if (
            field === undefined ||
            field === null ||
            field === '' ||
            (invalid && field.toUpperCase() === invalid)
         ) {
            throw new Error(
               `Campo obrigatório '${name}' está ausente ou inválido.`
            );
         }
      }

      if (!Number.isInteger(Number(tombo)) || Number(tombo) <= 0) {
         throw new Error('O tombo deve ser um número inteiro positivo.');
      }
      if (!Number.isInteger(Number(quantidade)) || Number(quantidade) <= 0) {
         throw new Error('A quantidade deve ser um número inteiro positivo.');
      }
      if (Number(valor) <= 0) {
         throw new Error('O valor deve ser um número positivo.');
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
            descricao.toUpperCase(),
            tombo,
            quantidade,
            categoria.toUpperCase(),
            conta_contabil.toUpperCase(),
            doc_origem.toUpperCase(),
            estoque.toUpperCase(),
            valor,
            situacao.toUpperCase(),
            observacao ? observacao.toUpperCase() : null,
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
      const conn = await connection.getConnection();
      try {
         await conn.beginTransaction();
         let firstInsertId = null;
         for (const item of itens) {
            // Validação de campos obrigatórios (como acima)
            const requiredFields = [
               { field: item.data_de_entrada, name: 'data_de_entrada' },
               // ... outros campos ...
            ];
            // ... validação ...
            const [result] = await conn.execute(query, [
               item.data_de_entrada,
               item.descricao.toUpperCase(),
               item.tombo,
               item.quantidade,
               item.categoria.toUpperCase(),
               item.conta_contabil.toUpperCase(),
               item.doc_origem.toUpperCase(),
               item.estoque.toUpperCase(),
               item.valor,
               item.situacao.toUpperCase(),
               item.observacao ? item.observacao.toUpperCase() : null,
               item.tipo_tombo,
            ]);
            if (!firstInsertId) {
               firstInsertId = result.insertId;
            }
         }
         await conn.commit();
         return { insertId: firstInsertId, affectedRows: itens.length };
      } catch (error) {
         await conn.rollback();
         console.error('Erro ao criar itens em lote no estoque:', error);
         throw error;
      } finally {
         conn.release();
      }
   };

   // Método para criar itens em lote no tombamento
   createTombamentoLote = async (itens) => {
      const query = `
      INSERT INTO registrodetombamento (
         data_de_entrada, quantidade, tipo_tombo, tombo, categoria, 
         doc_origem, estoque, valor, situacao, observacao, 
         conta_contabil, descricao
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
   `;
      try {
         let firstInsertId = null;
         for (const item of itens) {
            // Validação de campos obrigatórios para cada item
            const requiredFields = [
               { field: item.data_de_entrada, name: 'data_de_entrada' },
               { field: item.quantidade, name: 'quantidade' },
               { field: item.tombo, name: 'tombo' },
               {
                  field: item.categoria,
                  name: 'categoria',
                  invalid: 'SELECIONE UMA CATEGORIA...',
               },
               { field: item.doc_origem, name: 'doc_origem' },
               {
                  field: item.estoque,
                  name: 'estoque',
                  invalid: 'ESCOLHA UMA OPÇÃO...',
               },
               { field: item.valor, name: 'valor' },
               {
                  field: item.situacao,
                  name: 'situacao',
                  invalid: 'ESCOLHA UMA OPÇÃO...',
               },
               {
                  field: item.conta_contabil,
                  name: 'conta_contabil',
                  invalid: 'ESCOLHA UMA OPÇÃO...',
               },
               { field: item.descricao, name: 'descricao' },
            ];

            for (const { field, name, invalid } of requiredFields) {
               if (
                  field === undefined ||
                  field === null ||
                  field === '' ||
                  (invalid && field.toUpperCase() === invalid)
               ) {
                  throw new Error(
                     `Campo obrigatório '${name}' está ausente ou inválido no item com tombo ${item.tombo}.`
                  );
               }
            }

            if (
               !Number.isInteger(Number(item.tombo)) ||
               Number(item.tombo) <= 0
            ) {
               throw new Error(
                  `O tombo ${item.tombo} deve ser um número inteiro positivo.`
               );
            }
            if (
               !Number.isInteger(Number(item.quantidade)) ||
               Number(item.quantidade) <= 0
            ) {
               throw new Error(
                  `A quantidade do item com tombo ${item.tombo} deve ser um número inteiro positivo.`
               );
            }
            if (Number(item.valor) <= 0) {
               throw new Error(
                  `O valor do item com tombo ${item.tombo} deve ser um número positivo.`
               );
            }

            const [result] = await connection.execute(query, [
               item.data_de_entrada,
               item.quantidade,
               item.tipo_tombo,
               item.tombo,
               item.categoria.toUpperCase(),
               item.doc_origem.toUpperCase(),
               item.estoque.toUpperCase(),
               item.valor,
               item.situacao.toUpperCase(),
               item.observacao ? item.observacao.toUpperCase() : null,
               item.conta_contabil.toUpperCase(),
               item.descricao.toUpperCase(),
            ]);
            if (!firstInsertId) {
               firstInsertId = result.insertId;
            }
         }
         return { insertId: firstInsertId, affectedRows: itens.length };
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
      const query = `
      SELECT 
         id,
         data_de_entrada,
         quantidade,
         tipo_tombo,
         tombo,
         tombo_final,
         tombo_lote_manual,
         categoria,
         doc_origem,
         estoque,
         valor,
         situacao,
         observacao,
         conta_contabil,
         descricao
      FROM registrodetombamento 
      WHERE id = ?
   `;
      try {
         const [results] = await connection.execute(query, [id]);
         const item = results[0] || null;
         if (item && item.tombo_lote_manual) {
            item.tombo_lote_manual = JSON.parse(item.tombo_lote_manual);
         }
         return item;
      } catch (error) {
         console.error('Erro ao buscar item no tombamento por ID:', error);
         throw error;
      }
   };

   // Método para obter todos os itens do tombamento
   async getAllTombamento() {
      try {
         const [rows] = await connection.query(
            'SELECT * FROM registrodetombamento WHERE usado = 0'
         );
         return rows;
      } catch (error) {
         console.error('Erro ao buscar tombamentos:', error);
         throw error;
      }
   }

   // Obtém o último tombo considerando estoqueatual e registrodetombamento
   static async getUltimoTombo() {
      try {
         const query = `
            SELECT MAX(CAST(tombo AS UNSIGNED)) as ultimo_tombo 
            FROM (
               SELECT tombo FROM estoqueatual
               UNION
               SELECT tombo FROM registrodetombamento
            ) AS combined_tombos
         `;
         const [results] = await connection.execute(query);
         return results[0].ultimo_tombo || 0;
      } catch (error) {
         console.error('Erro ao obter último tombo:', error);
         throw error;
      }
   }

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
            ea.valor,
            ea.situacao
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

   async savePDFData(pdfData) {
      try {
         const connectionPool = await connection.getConnection();
         try {
            const [result] = await connectionPool.query(
               'INSERT INTO pdfs (filename, file_path, uploaded_by, upload_date, id_registro, tombo) VALUES (?, ?, ?, ?, ?, ?)',
               [
                  pdfData.filename,
                  pdfData.file_path,
                  pdfData.uploaded_by,
                  pdfData.upload_date,
                  pdfData.id_registro || null,
                  pdfData.tombo || null,
               ]
            );
            return result;
         } finally {
            connectionPool.release();
         }
      } catch (error) {
         console.error('[EstoqueModel.savePDFData] Erro ao salvar PDF:', error);
         throw error;
      }
   }

   async getPDFByTombo(tombo) {
      try {
         const [rows] = await connection.execute(
            'SELECT * FROM pdfs WHERE tombo = ? LIMIT 1',
            [tombo]
         );
         return rows.length > 0 ? rows[0] : null;
      } catch (error) {
         console.error('Erro ao buscar PDF por tombo:', error);
         throw error;
      }
   }

   async getAllRegistroTombamento() {
      try {
         console.log('Executando consulta em registrodetombamento...');
         const [rows] = await connection.execute(
            'SELECT * FROM registrodetombamento WHERE usado = 0 ORDER BY id'
         );
         console.log(
            'Consulta SQL: SELECT * FROM registrodetombamento WHERE usado = 0 ORDER BY id'
         );
         console.log('Registros encontrados:', rows.length);
         console.log('Primeiros 5 registros:', rows.slice(0, 5));
         return rows;
      } catch (error) {
         console.error('Erro ao buscar registros de tombamento:', error);
         throw error;
      }
   }
   async getTombosInfo(tombos) {
      const placeholders = tombos.map(() => '?').join(',');
      const query = `
      SELECT id, tombo, descricao, situacao, estoque 
      FROM estoqueatual 
      WHERE tombo IN (${placeholders}) AND pago = FALSE
      ORDER BY tombo ASC
   `;
      try {
         const [results] = await connection.execute(query, tombos);
         return results;
      } catch (error) {
         console.error('Erro ao buscar informações dos tombos:', error);
         throw error;
      }
   }

   async registrarSaida(
      tombos,
      doc_saida,
      referencia,
      destino,
      posto_graduacao,
      mat_funcional,
      telefone,
      nome_completo,
      observacao,
      data_de_saida
   ) {
      const conn = await connection.getConnection();
      try {
         await conn.beginTransaction();

         for (const tombo of tombos) {
            const item = await this.getInfoByTombo(tombo);
            if (!item) {
               throw new Error(`Tombo ${tombo} não encontrado.`);
            }

            const query = `
            INSERT INTO itenspagos (
               estoqueatual_id, tombo, doc_saida, data_de_saida, quantidade,
               referencia, destino, posto_graduacao, mat_funcional, telefone,
               nome_completo, observacao, descricao
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         `;
            await conn.execute(query, [
               item.id,
               tombo,
               doc_saida,
               data_de_saida,
               1,
               referencia,
               destino,
               posto_graduacao,
               mat_funcional,
               telefone,
               nome_completo,
               observacao,
               item.descricao,
            ]);

            const updateQuery = `UPDATE estoqueatual SET pago = TRUE WHERE tombo = ?`;
            await conn.execute(updateQuery, [tombo]);
         }

         await conn.commit();
         return true;
      } catch (error) {
         await conn.rollback();
         console.error('Erro ao registrar saída:', error);
         throw error;
      } finally {
         conn.release();
      }
   }

   // Método para criar uma reserva de item
   async createReserva(itemId, destino, usuario) {
      const conn = await connection.getConnection();
      console.log('[createReserva] Iniciando criação de reserva:', {
         itemId,
         destino,
         usuario,
      });

      try {
         await conn.beginTransaction();

         // Verificar se o item existe e não está pago
         console.log(
            '[createReserva] Verificando item no estoqueatual para ID:',
            itemId
         );
         const [item] = await conn.execute(
            `SELECT id, pago FROM estoqueatual WHERE id = ? AND pago = FALSE`,
            [itemId]
         );

         if (!item || item.length === 0) {
            console.log(
               '[createReserva] Item não encontrado ou já pago:',
               itemId
            );
            throw new Error('Item não encontrado ou já foi pago.');
         }
         console.log('[createReserva] Item válido encontrado:', item[0]);

         // Verificar se o item já está reservado
         console.log(
            '[createReserva] Verificando se item já está reservado:',
            itemId
         );
         const [reservaExistente] = await conn.execute(
            `SELECT id FROM reservas WHERE item_id = ? AND ativo = TRUE`,
            [itemId]
         );

         if (reservaExistente.length > 0) {
            console.log('[createReserva] Item já reservado:', itemId);
            throw new Error('Item já está reservado.');
         }

         // Inserir a reserva na tabela reservas
         const dataReserva = new Date()
            .toISOString()
            .slice(0, 19)
            .replace('T', ' ');
         console.log('[createReserva] Inserindo reserva na tabela reservas:', {
            itemId,
            destino,
            dataReserva,
            usuario,
         });
         const [result] = await conn.execute(
            `INSERT INTO reservas (item_id, destino, data_reserva, usuario, ativo) VALUES (?, ?, ?, ?, TRUE)`,
            [itemId, destino.toUpperCase(), dataReserva, usuario]
         );

         console.log(
            '[createReserva] Reserva inserida com sucesso, ID:',
            result.insertId
         );
         await conn.commit();
         return { insertId: result.insertId };
      } catch (error) {
         console.error(
            '[createReserva] Erro ao criar reserva:',
            error.message,
            error.stack
         );
         await conn.rollback();
         throw error;
      } finally {
         conn.release();
         console.log('[createReserva] Conexão com o banco liberada');
      }
   }

   async getAllReservas() {
      const query = `
   SELECT 
      r.id AS reserva_id,
      r.item_id,
      r.destino,
      r.data_reserva,
      r.usuario,
      e.descricao,
      e.tombo,
      e.categoria,
      e.estoque,
      e.situacao,
      e.doc_origem
   FROM reservas r
   INNER JOIN estoqueatual e ON r.item_id = e.id
   WHERE r.ativo = 1
   ORDER BY r.data_reserva DESC;
`;
      try {
         const [rows] = await connection.execute(query);
         return rows;
      } catch (error) {
         console.error('Erro ao buscar reservas:', error);
         throw new Error('Erro ao buscar reservas no banco de dados');
      }
   }

   async desativarReserva(reservaId) {
      const conn = await connection.getConnection();
      try {
         await conn.beginTransaction();

         // Verificar se a reserva existe
         const [reserva] = await conn.execute(
            `SELECT r.id, r.item_id, e.tombo, r.destino 
          FROM reservas r 
          INNER JOIN estoqueatual e ON r.item_id = e.id 
          WHERE r.id = ? AND r.ativo = TRUE`,
            [reservaId]
         );

         if (!reserva || reserva.length === 0) {
            throw new Error('Reserva não encontrada ou já cancelada.');
         }

         const tombo = reserva[0].tombo;

         // Deletar a reserva
         const [result] = await conn.execute(
            `DELETE FROM reservas WHERE id = ?`,
            [reservaId]
         );

         if (result.affectedRows === 0) {
            throw new Error('Nenhuma reserva foi deletada.');
         }

         await conn.commit();
         return { affectedRows: result.affectedRows, tombo };
      } catch (error) {
         await conn.rollback();
         console.error('Erro ao deletar reserva:', error);
         throw error;
      } finally {
         conn.release();
      }
   }
}

const estoqueModelInstance = new EstoqueModel();
export default estoqueModelInstance;
export { EstoqueModel };
