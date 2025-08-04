import connection from '../../db_config/connection.js';
import sequenciaModel from '../models/sequenciaModel.js';

export default {
   // Busca tombos disponíveis
   async getTombosDisponiveis() {
      try {
         const [rows] = await connection.query(
            'SELECT tombo, descricao FROM registrodetombamento WHERE usado = 0'
         );
         console.log('Tombos retornados da tabela registrodetombamento:', rows);
         return rows;
      } catch (error) {
         console.error(
            'Erro ao buscar tombos disponíveis em getTombosDisponiveis:',
            error
         );
         throw error;
      }
   },

   // Gera um número único para o termo de recebimento
   async gerarTermoRecebimento() {
      try {
         const anoAtual = new Date().getFullYear();
         const sequenciaAtual = await sequenciaModel.getSequenciaAtual(
            anoAtual
         );
         const novoNumero = String(sequenciaAtual).padStart(5, '0'); // Formato com 5 dígitos
         return `${novoNumero}/${anoAtual}`; // Formato NNNNN/AAAA (ex.: 00318/2025)
      } catch (error) {
         console.error('Erro ao gerar termo:', error);
         throw error;
      }
   },

   // Verifica se os tombos são válidos e estão disponíveis
   async validarTombos(tombos) {
      try {
         const [rows] = await connection.query(
            'SELECT tombo FROM registrodetombamento WHERE tombo IN (?) AND usado = 0',
            [tombos]
         );
         console.log(
            'Tombos válidos retornados da tabela registrodetombamento:',
            rows
         );
         if (rows.length !== tombos.length) {
            const tombosInvalidos = tombos.filter(
               (t) => !rows.some((row) => row.tombo === t)
            );
            return {
               valido: false,
               erro: `Tombos já em saída: ${tombosInvalidos.join(', ')}`,
            };
         }
         return { valido: true };
      } catch (error) {
         console.error('Erro ao validar tombos:', error);
         throw error;
      }
   },

   // Busca informações dos tombos para o PDF
   async getTombosInfo(tombos) {
      try {
         const [tombosInfo] = await connection.query(
            `SELECT tombo, descricao FROM registrodetombamento WHERE tombo IN (?)`,
            [tombos]
         );
         return tombosInfo;
      } catch (error) {
         console.error('Erro ao buscar informações dos tombos:', error);
         throw error;
      }
   },

   // Insere registros de saída na tabela saida_tombo
   async registrarSaida(
      tombos,
      doc_saida,
      referencia,
      destino,
      postoGrad,
      mf_recebedor,
      tel_recebedor,
      observacao,
      dataSaida
   ) {
      try {
         const connectionPool = await connection.getConnection();
         await connectionPool.beginTransaction();

         try {
            for (const tombo of tombos) {
               await connectionPool.query(
                  'INSERT INTO saida_tombo (tombo, doc_saida, referencia, destino, posto_grad, mf_recebedor, tel_recebedor, observacao, data_saida) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                  [
                     tombo.tombo || tombo,
                     doc_saida,
                     referencia,
                     destino,
                     postoGrad,
                     mf_recebedor,
                     tel_recebedor,
                     observacao,
                     dataSaida,
                  ]
               );
               await connectionPool.query(
                  'UPDATE estoqueatual SET situacao = "SAIDA" WHERE tombo = ?',
                  [tombo.tombo || tombo]
               );
               await connectionPool.query(
                  'UPDATE registrodetombamento SET usado = 1 WHERE tombo = ?',
                  [tombo.tombo || tombo]
               );
            }
            await connectionPool.commit();
            return { success: true };
         } catch (error) {
            await connectionPool.rollback();
            throw error;
         } finally {
            connectionPool.release();
         }
      } catch (error) {
         console.error('Erro ao registrar saída:', error);
         throw error;
      }
   },

   // Método para obter todos os tombos usados
   async getAllTombosUsados(data_inicial, data_final) {
      let query = `
         SELECT 
            st.id,
            st.data_saida,
            rt.descricao,
            st.tombo,
            st.destino,
            st.referencia,
            st.doc_saida
         FROM saida_tombo st
         JOIN registrodetombamento rt ON st.tombo = rt.tombo
         WHERE rt.usado = 1
      `;
      const params = [];

      if (data_inicial && data_final) {
         const dataFinalAjustada = `${data_final} 23:59:59`;
         query += ` AND st.data_saida BETWEEN ? AND ?`;
         params.push(data_inicial, dataFinalAjustada);
      }

      query += ` ORDER BY st.data_saida DESC`;

      try {
         const [results] = await connection.query(query, params);
         console.log('Resultados da query getAllTombosUsados:', results);
         return results;
      } catch (error) {
         console.error('Erro ao buscar tombos usados:', error);
         throw error;
      }
   },

   // Método para obter detalhes de um tombo usado por ID
   async getTomboUsadoDetalhes(id) {
      const query = `
         SELECT 
            st.*,
            rt.descricao
         FROM saida_tombo st
         JOIN registrodetombamento rt ON st.tombo = rt.tombo
         WHERE st.id = ?
      `;
      try {
         const [results] = await connection.query(query, [id]);
         return results[0] || null;
      } catch (error) {
         console.error('Erro ao buscar detalhes do tombo usado:', error);
         throw error;
      }
   },

   // Método para reverter a saída de um tombo
   async reverterSaida(id, tombo) {
      const deleteQuery = `DELETE FROM saida_tombo WHERE id = ?`;
      const updateQuery = `UPDATE registrodetombamento SET usado = 0 WHERE tombo = ?`;
      const conn = await connection.getConnection();
      try {
         await conn.beginTransaction();
         await conn.execute(deleteQuery, [id]);
         await conn.execute(updateQuery, [tombo]);
         await conn.commit();
         return true;
      } catch (error) {
         await conn.rollback();
         console.error('Erro ao reverter saída do tombo:', error);
         throw error;
      } finally {
         conn.release();
      }
   },
};
