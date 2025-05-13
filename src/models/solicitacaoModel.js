// solicitacaoModel.js
import connection from '../../db_config/connection.js';

class SolicitacaoModel {
   async criarSolicitacao(
      data_da_solicitacao,
      quantidade,
      solicitante,
      situacao,
      descricao,
      nup,
      observacao
   ) {
      if (
         !data_da_solicitacao ||
         !quantidade ||
         !solicitante ||
         !situacao ||
         !descricao
      ) {
         throw new Error('Campos obrigatórios não preenchidos.');
      }

      const query = `
      INSERT INTO solicitacaoaquisicao (
        data_da_solicitacao, quantidade, solicitante, situacao, descricao, nup, observacao
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
      try {
         const [result] = await connection.execute(query, [
            data_da_solicitacao,
            quantidade,
            solicitante,
            situacao,
            descricao,
            nup,
            observacao,
         ]);
         console.log(result);
         return result;
      } catch (error) {
         console.error(
            'Erro ao inserir dados da solicitação de material:',
            error
         );
         throw error;
      }
   }

   // Método para obter todas as solicitações de requisição
   getAllSolicitacaoModel = async () => {
      const query = `
      SELECT 
         id,
         solicitante,
         data_da_solicitacao,
         descricao,
         quantidade,
         situacao,
         observacao,
         NUP AS nup  -- Renomeia a coluna NUP para nup
      FROM solicitacaoaquisicao
   `;
      try {
         const [results] = await connection.execute(query);
         console.log('Dados brutos do banco:', results);
         return results;
      } catch (error) {
         console.error('Erro ao buscar estoque atual:', error);
         throw error;
      }
   };
   // Método para obter uma solicitação por ID
   getSolicitacaoById = async (id) => {
      const query = `SELECT * FROM solicitacaoaquisicao WHERE id = ?`;
      try {
         const [results] = await connection.execute(query, [id]);
         return results[0]; // Retorna o primeiro (e único) resultado, ou undefined se não encontrado
      } catch (error) {
         console.error('Erro ao buscar solicitação por ID:', error);
         throw error;
      }
   };

   async atualizarSituacao(id, situacao) {
      const query = `UPDATE solicitacaoaquisicao SET situacao = ? WHERE id = ?`;
      try {
         const [result] = await connection.execute(query, [situacao, id]);
         return result;
      } catch (error) {
         console.error('Erro ao atualizar situação:', error);
         throw error;
      }
   }
}

export default new SolicitacaoModel();
