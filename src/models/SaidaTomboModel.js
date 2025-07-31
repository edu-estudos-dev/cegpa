import connection from '../../db_config/connection.js';

export default {
   // Busca tombos disponíveis
   async getTombosDisponiveis() {
      try {
         const [tombosDisponiveis] = await connection.query(`
            SELECT id, tombo, descricao
            FROM registrodetombamento
            WHERE situacao != 'inservivel' AND tombo NOT IN (
               SELECT tombo FROM saida_tombo WHERE data_devolucao IS NULL
            )
            ORDER BY tombo
         `);
         return tombosDisponiveis;
      } catch (error) {
         console.error('Erro ao buscar tombos disponíveis:', error);
         throw error;
      }
   },

   // Gera um número único para o termo de recebimento
   async gerarTermoRecebimento() {
      try {
         const [rows] = await connection.query(`
            SELECT MAX(CAST(SUBSTRING_INDEX(doc_saida, "-", 1) AS UNSIGNED)) as ultimo_numero 
            FROM saida_tombo 
            WHERE doc_saida LIKE "%-____"
         `);
         const ultimoNumero = rows[0].ultimo_numero || 0;
         const anoAtual = new Date().getFullYear();
         const novoNumero = String(ultimoNumero + 1).padStart(5, '0');
         return `${novoNumero}-${anoAtual}`;
      } catch (error) {
         console.error('Erro ao gerar termo:', error);
         throw error;
      }
   },

   // Verifica se os tombos são válidos e estão disponíveis
   async validarTombos(tombos) {
      try {
         // Verifica se os tombos existem e não são inservíveis
         const [tombosExistentes] = await connection.query(
            `SELECT tombo FROM registrodetombamento WHERE tombo IN (?) AND situacao != 'inservivel'`,
            [tombos]
         );
         const tombosExistentesArray = tombosExistentes.map(t => t.tombo);
         const tombosInvalidos = tombos.filter(t => !tombosExistentesArray.includes(t));
         if (tombosInvalidos.length > 0) {
            return { valido: false, erro: `Tombos inválidos: ${tombosInvalidos.join(', ')}` };
         }

         // Verifica se os tombos já estão em saída sem devolução
         const [tombosEmSaida] = await connection.query(
            `SELECT tombo FROM saida_tombo WHERE tombo IN (?) AND data_devolucao IS NULL`,
            [tombos]
         );
         if (tombosEmSaida.length > 0) {
            return { valido: false, erro: `Tombos já em saída: ${tombosEmSaida.map(t => t.tombo).join(', ')}` };
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
   async registrarSaida(tombos, doc_saida, referencia, destino, postoGrad, mf_recebedor, tel_recebedor, nome_do_recebedor, observacao, dataSaida) {
      try {
         for (const tombo of tombos) {
            await connection.query(
               `INSERT INTO saida_tombo (tombo, doc_saida, referencia, destino, posto_grad, mf_recebedor, tel_recebedor, nome_recebedor, observacao, data_saida)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
               [tombo, doc_saida, referencia, destino, postoGrad, mf_recebedor, tel_recebedor, nome_do_recebedor, observacao, dataSaida]
            );
         }
      } catch (error) {
         console.error('Erro ao registrar saída:', error);
         throw error;
      }
   }
};