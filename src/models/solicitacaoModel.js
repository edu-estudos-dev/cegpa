import connection from '../../db_config/connection.js';

class SolicitacaoModel {
   // Método para criar uma nova solicitação
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

   // Método para buscar todas as solicitações
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
         NUP AS nup
      FROM solicitacaoaquisicao
   `;
      try {
         const [results] = await connection.execute(query);
         return results;
      } catch (error) {
         console.error('Erro ao buscar estoque atual:', error);
         throw error;
      }
   };

   // método para buscar uma solicitação por ID
   getSolicitacaoById = async (id) => {
      try {
         console.log(`[DEBUG] Executando consulta SQL para ID ${id}`);
         const [results] = await connection.execute(
            'SELECT * FROM solicitacaoaquisicao WHERE id = ?',
            [id]
         );
         console.log(
            `[DEBUG] Resultado da consulta para ID ${id}:`,
            results[0]
         );
         return results[0] || null;
      } catch (error) {
         console.error(
            `[ERROR] Erro ao buscar solicitação por ID ${id}:`,
            error
         );
         throw error;
      }
   };

   // método para atualizar a situação de uma solicitação
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

   // método para atualizar uma solicitação
   async updateSolicitacao(id, data) {
      const query = `
         UPDATE solicitacaoaquisicao 
         SET 
            data_da_solicitacao = ?, 
            quantidade = ?, 
            solicitante = ?, 
            situacao = ?, 
            descricao = ?, 
            nup = ?, 
            observacao = ?
         WHERE id = ?`;
      try {
         const [result] = await connection.execute(query, [
            data.data_da_solicitacao,
            data.quantidade,
            data.solicitante,
            data.situacao,
            data.descricao,
            data.nup,
            data.observacao,
            id,
         ]);
         return result;
      } catch (error) {
         console.error('Erro ao atualizar solicitação:', error);
         throw error;
      }
   }

   // método para excluir uma solicitação
   async deleteSolicitacao(id) {
      const query = `DELETE FROM solicitacaoaquisicao WHERE id = ?`;
      try {
         const [result] = await connection.execute(query, [id]);
         return result;
      } catch (error) {
         console.error('Erro ao excluir solicitação:', error);
         throw error;
      }
   }
}

export default new SolicitacaoModel();
