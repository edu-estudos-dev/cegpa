import connection from '../../db_config/connection.js';

class SolicitacaoModel {
  async criarSolicitacao(data_da_solicitacao, quantidade, solicitante, situacao, descricao, observacao) {
    if (!data_da_solicitacao || !quantidade || !solicitante || !situacao || !descricao) {
      throw new Error('Campos obrigatórios não preenchidos.');
    }

    const query = `
      INSERT INTO solicitacaoaquisicao (
        data_da_solicitacao, quantidade, solicitante, situacao, descricao, observacao
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    try {
      const [result] = await connection.execute(query, [
        data_da_solicitacao,
        quantidade,
        solicitante,
        situacao,
        descricao,
        observacao,
      ]);
      return result;
    } catch (error) {
      console.error('Erro ao inserir dados da solicitação de material:', error);
      throw error;
    }
  }
}

export default new SolicitacaoModel();