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
      nome_recebedor,
      observacao,
      dataSaida
   ) {
      try {
         const connectionPool = await connection.getConnection();
         await connectionPool.beginTransaction();

         // Log para verificar os parâmetros recebidos
         console.log(
            '========================================================='
         );
         console.log('[SaidaTomboModel.registrarSaida] Parâmetros recebidos:');
         console.log('tombos:', tombos);
         console.log('doc_saida:', doc_saida);
         console.log('referencia:', referencia);
         console.log('destino:', destino);
         console.log('postoGrad:', postoGrad);
         console.log('mf_recebedor:', mf_recebedor);
         console.log('tel_recebedor:', tel_recebedor);
         console.log('nome_recebedor:', nome_recebedor);
         console.log('observacao:', observacao);
         console.log('dataSaida:', dataSaida);
         console.log(
            '========================================================='
         );

         // Validar e formatar dataSaida
         let formattedDataSaida = dataSaida;
         console.log(
            '[SaidaTomboModel.registrarSaida] Valor recebido de dataSaida:',
            dataSaida
         );
         if (!dataSaida || isNaN(new Date(dataSaida).getTime())) {
            formattedDataSaida = new Date()
               .toISOString()
               .slice(0, 19)
               .replace('T', ' ');
            console.log(
               '[SaidaTomboModel.registrarSaida] dataSaida inválido, usando data atual:',
               formattedDataSaida
            );
         } else {
            formattedDataSaida = new Date(dataSaida)
               .toISOString()
               .slice(0, 19)
               .replace('T', ' ');
            console.log(
               '[SaidaTomboModel.registrarSaida] dataSaida válido, formatado:',
               formattedDataSaida
            );
         }

         try {
            for (const tombo of tombos) {
               console.log(
                  '[SaidaTomboModel.registrarSaida] Inserindo tombo:',
                  tombo
               );
               await connectionPool.query(
                  'INSERT INTO saida_tombo (tombo, doc_saida, referencia, destino, posto_grad, mf_recebedor, tel_recebedor, nome_recebedor, observacao, data_saida) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                  [
                     tombo.tombo || tombo,
                     doc_saida,
                     referencia,
                     destino,
                     postoGrad,
                     mf_recebedor,
                     tel_recebedor,
                     nome_recebedor,
                     observacao,
                     formattedDataSaida,
                  ]
               );
               console.log(
                  '[SaidaTomboModel.registrarSaida] Atualizando estoqueatual para tombo:',
                  tombo
               );
               await connectionPool.query(
                  'UPDATE estoqueatual SET situacao = "SAIDA" WHERE tombo = ?',
                  [tombo.tombo || tombo]
               );
               console.log(
                  '[SaidaTomboModel.registrarSaida] Atualizando registrodetombamento para tombo:',
                  tombo
               );
               await connectionPool.query(
                  'UPDATE registrodetombamento SET usado = 1 WHERE tombo = ?',
                  [tombo.tombo || tombo]
               );
            }
            await connectionPool.commit();
            console.log(
               '[SaidaTomboModel.registrarSaida] Saída registrada com sucesso, data_saida:',
               formattedDataSaida
            );
            return { success: true };
         } catch (error) {
            await connectionPool.rollback();
            console.error(
               '[SaidaTomboModel.registrarSaida] Erro na transação de registro:',
               error
            );
            throw error;
         } finally {
            connectionPool.release();
         }
      } catch (error) {
         console.error(
            '[SaidaTomboModel.registrarSaida] Erro ao registrar saída:',
            error
         );
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
            st.doc_saida,
            rt.valor
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
      try {
         const connectionPool = await connection.getConnection();
         try {
            const [rows] = await connectionPool.query(
               `SELECT 
               st.tombo, 
               st.doc_saida, 
               st.referencia, 
               st.destino, 
               st.posto_grad, 
               st.mf_recebedor, 
               st.tel_recebedor, 
               st.nome_recebedor, 
               st.observacao, 
               st.data_saida,
               rt.descricao,
               rt.valor
             FROM saida_tombo st
             JOIN registrodetombamento rt ON st.tombo = rt.tombo
             WHERE st.id = ?`,
               [id]
            );
            console.log(
               '[SaidaTomboModel.getTomboUsadoDetalhes] Dados retornados para id',
               id,
               ':',
               rows[0]
            );
            return rows[0] || null;
         } finally {
            connectionPool.release();
         }
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
