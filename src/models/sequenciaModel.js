import connection from '../../db_config/connection.js';

class SequenciaModel {
   getSequencia = async (ano) => {
      try {
         // Define o valor inicial como 42 para 2025, e 1 para outros anos
         const initialValue = ano === 2025 ? 42 : 1;
         const insertQuery = `
                INSERT INTO doc_sequencia (ano, sequencia)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE sequencia = sequencia
            `;
         await connection.execute(insertQuery, [ano, initialValue]);

         // Busca a sequência atual
         const selectQuery = `SELECT sequencia FROM doc_sequencia WHERE ano = ?`;
         const [results] = await connection.execute(selectQuery, [ano]);

         return results[0].sequencia;
      } catch (error) {
         console.error('Erro ao obter sequência:', error);
         throw error;
      }
   };

   incrementarSequencia = async (ano) => {
      try {
         const query = `
                UPDATE doc_sequencia 
                SET sequencia = sequencia + 1 
                WHERE ano = ?`;

         await connection.execute(query, [ano]);

         // Retorna a nova sequência após incremento
         const [results] = await connection.execute(
            'SELECT sequencia FROM doc_sequencia WHERE ano = ?',
            [ano]
         );

         return results[0].sequencia;
      } catch (error) {
         console.error('Erro ao incrementar sequência:', error);
         throw error;
      }
   };
}

export default new SequenciaModel();
