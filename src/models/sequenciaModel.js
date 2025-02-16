import connection from "../../db_config/connection.js";

class SequenciaModel {
   getSequencia = async (ano) => {
      const query = `SELECT * FROM doc_sequencia WHERE ano = ?`;
      try {
         const [results] = await connection.execute(query, [ano]);
         if (results.length > 0) {
            return results[0].sequencia;
         } else {
            const insertQuery = `INSERT INTO doc_sequencia (ano, sequencia) VALUES (?, 1)`;
            await connection.execute(insertQuery, [ano]);
            return 1;
         }
      } catch (error) {
         throw error;
      }
   };

   incrementarSequencia = async (ano) => {
      const query = `UPDATE doc_sequencia SET sequencia = sequencia + 1 WHERE ano = ?`;
      try {
         await connection.execute(query, [ano]);
      } catch (error) {
         throw error;
      }
   };
}

export default new SequenciaModel();
