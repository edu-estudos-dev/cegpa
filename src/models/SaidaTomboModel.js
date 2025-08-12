import connection from '../../db_config/connection.js';
import sequenciaModel from '../models/sequenciaModel.js';

export default {
   // Busca tombos disponíveis
   async getTombosDisponiveis() {
      try {
         const [rows] = await connection.query(
            'SELECT tombo, descricao FROM registrodetombamento WHERE usado = 0'
         );
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

   async registrarSaida(
      tombos,
      referencia,
      destino,
      postoGrad,
      mf_recebedor,
      tel_recebedor,
      nome_do_recebedor,
      observacao,
      dataSaida,
      docSaida // Novo parâmetro
   ) {
      console.log('[SaidaTomboModel.registrarSaida] Iniciando registro com:', {
         tombos,
         referencia,
         destino,
         postoGrad,
         mf_recebedor,
         tel_recebedor,
         nome_do_recebedor,
         observacao,
         dataSaida,
         docSaida,
      });

      let conn;
      try {
         conn = await connection.getConnection();
         await conn.beginTransaction();

         // Usa o docSaida fornecido pelo frontend (já no formato NNNNN/AAAA)
         const docSaidaFormatado = docSaida;

         for (const tombo of tombos) {
            // Verifica se o tombo existe em registrodetombamento
            const [tomboExists] = await conn.query(
               `SELECT tombo FROM registrodetombamento WHERE tombo = ? AND usado = 0`,
               [tombo]
            );
            if (tomboExists.length === 0) {
               throw new Error(
                  `Tombo ${tombo} não encontrado ou já está em uso`
               );
            }

            // Insere na tabela saida_tombo
            const [result] = await conn.query(
               `INSERT INTO saida_tombo (tombo, doc_saida, referencia, destino, posto_grad, mf_recebedor, tel_recebedor, nome_recebedor, observacao, data_saida)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
               [
                  tombo,
                  docSaidaFormatado,
                  referencia,
                  destino,
                  postoGrad,
                  mf_recebedor,
                  tel_recebedor,
                  nome_do_recebedor,
                  observacao || null,
                  dataSaida,
               ]
            );
            console.log(
               `[SaidaTomboModel.registrarSaida] Inserção na tabela saida_tombo para tombo ${tombo} com doc_saida ${docSaidaFormatado}:`,
               result
            );

            // Atualiza o campo usado na tabela registrodetombamento
            await conn.query(
               `UPDATE registrodetombamento SET usado = 1 WHERE tombo = ?`,
               [tombo]
            );
         }

         await conn.commit();
         return { success: true, docSaida: docSaidaFormatado };
      } catch (error) {
         console.error(
            '[SaidaTomboModel.registrarSaida] Erro ao registrar:',
            error
         );
         if (conn) await conn.rollback();
         throw new Error(`Erro ao registrar saída: ${error.message}`);
      } finally {
         if (conn) conn.release();
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
         st.doc_saida,
         rt.valor,
         rt.*  -- Inclui todas as colunas de registrodetombamento para inspeção
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
         console.log(
            'Resultados completos da query getAllTombosUsados:',
            JSON.stringify(results, null, 2)
         );
         return results;
      } catch (error) {
         console.error('Erro ao buscar tombos usados:', error);
         throw error;
      }
   },

   // Método para obter detalhes de um tombo usado por ID
   async getTomboUsadoDetalhes(id) {
      try {
         const [rows] = await connection.query(
            `SELECT rt.*, st.data_saida, st.destino, st.referencia, st.doc_saida, st.posto_grad, st.mf_recebedor, st.tel_recebedor, st.nome_recebedor, st.observacao
          FROM registrodetombamento rt
          LEFT JOIN saida_tombo st ON rt.tombo = st.tombo
          WHERE rt.id = ? AND rt.usado = 1`,
            [id]
         );
         console.log(
            `[SaidaTomboModel.getTomboUsadoDetalhes] Dados retornados para id ${id} :`,
            rows[0]
         );
         return rows[0] || null;
      } catch (error) {
         console.error(
            '[SaidaTomboModel.getTomboUsadoDetalhes] Erro ao buscar detalhes:',
            error
         );
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
