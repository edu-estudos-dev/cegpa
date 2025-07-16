import connection from '../../db_config/connection.js';

class AuditoriaModel {
  static async registrarLog({ usuario, acao, tabela_afetada, id_registro, tombo, detalhes }) {
    const query = `
      INSERT INTO auditoria (usuario, acao, tabela_afetada, id_registro, tombo, detalhes)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await connection.execute(query, [
      usuario,
      acao,
      tabela_afetada,
      id_registro,
      tombo,
      JSON.stringify(detalhes || {})
    ]);
  }

  static async buscarPorTombo(tombo) {
    const query = `SELECT * FROM auditoria WHERE tombo = ? ORDER BY data_hora`;
    const [results] = await connection.execute(query, [tombo]);
    // Parse detalhes de JSON para objeto
    return results.map(log => ({
      ...log,
      detalhes: log.detalhes ? JSON.parse(log.detalhes) : {}
    }));
  }
}

export default AuditoriaModel; 