import sequenciaModel from '../models/sequenciaModel.js';

class SequenciaController {
   gerarTermoResponsabilidade = async (req, res) => {
      try {
         const anoAtual = new Date().getFullYear();

         // 1. Garante que a sequência existe para o ano atual
         await sequenciaModel.getSequencia(anoAtual);

         // 2. Incrementa e obtém a nova sequência
         const novaSequencia = await sequenciaModel.incrementarSequencia(
            anoAtual
         );

         // 3. Formata o número do termo
         const doc_saida = `${novaSequencia
            .toString()
            .padStart(5, '0')}/${anoAtual}`;

         res.status(200).json({
            success: true,
            doc_saida,
         });
      } catch (error) {
         console.error('Erro ao gerar termo:', error);
         res.status(500).json({
            success: false,
            message: 'Erro ao gerar número do termo de responsabilidade',
            error: error.message,
         });
      }
   };

   consultarSequencia = async (req, res) => {
      try {
         const { ano } = req.params;
         const sequencia = await sequenciaModel.getSequencia(ano);

         res.status(200).json({
            ano,
            sequencia,
         });
      } catch (error) {
         console.error('Erro na consulta:', error);
         res.status(500).json({
            success: false,
            message: 'Erro ao consultar sequência',
            error: error.message,
         });
      }
   };
}

export default new SequenciaController();
