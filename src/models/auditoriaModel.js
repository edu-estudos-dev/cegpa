// src/models/AuditoriaModel.js
import connection from '../../db_config/connection.js';

class AuditoriaModel {
   static async registrarLog({ usuario, acao, tabela_afetada, id_registro, tombo, detalhes }) {
      console.log('[AuditoriaModel.registrarLog] Iniciando registro de log:', {
         usuario,
         acao,
         tabela_afetada,
         id_registro,
         tombo,
         detalhes: JSON.stringify(detalhes)
      });
      const query = `
         INSERT INTO auditoria (usuario, acao, tabela_afetada, id_registro, tombo, detalhes, data_hora)
         VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;
      try {
         const [result] = await connection.execute(query, [
            usuario,
            acao,
            tabela_afetada,
            id_registro,
            tombo,
            JSON.stringify(detalhes || {})
         ]);
         console.log('[AuditoriaModel.registrarLog] Log registrado com sucesso:', {
            affectedRows: result.affectedRows,
            insertId: result.insertId
         });
         return result;
      } catch (error) {
         console.error('[AuditoriaModel.registrarLog] Erro ao registrar log:', {
            error: error.message,
            usuario,
            acao,
            tabela_afetada,
            id_registro,
            tombo,
            detalhes: JSON.stringify(detalhes)
         });
         throw error;
      }
   }

   static async buscarPorTombo(tombo) {
      console.log('[AuditoriaModel.buscarPorTombo] Buscando histórico para tombo:', tombo);
      const query = `
         SELECT id, usuario, acao, tabela_afetada, id_registro, tombo, detalhes,
                DATE_FORMAT(data_hora, '%d/%m/%Y %H:%i:%s') as data_hora
         FROM auditoria 
         WHERE tombo = ? 
         ORDER BY data_hora DESC
      `;
      try {
         const [results] = await connection.execute(query, [tombo]);
         console.log('[AuditoriaModel.buscarPorTombo] Resultados da query:', {
            tombo,
            resultsCount: results.length,
            results: results.map(log => ({
               id: log.id,
               usuario: log.usuario,
               acao: log.acao,
               data_hora: log.data_hora
            }))
         });
         // Parse detalhes de JSON para objeto
         return results.map(log => ({
            ...log,
            detalhes: log.detalhes ? JSON.parse(log.detalhes) : {}
         }));
      } catch (error) {
         console.error('[AuditoriaModel.buscarPorTombo] Erro ao buscar histórico de auditoria:', {
            tombo,
            error: error.message
         });
         throw error;
      }
   }
}

export default AuditoriaModel;