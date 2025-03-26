import sequenciaModel from '../models/sequenciaModel.js';

class SequenciaController {
   // Gera o termo atual sem incrementar
   gerarTermoResponsabilidade = async (req, res) => {
      try {
         const anoAtual = new Date().getFullYear();
         const sequenciaAtual = await sequenciaModel.getSequenciaAtual(anoAtual);
         const doc_saida = `${sequenciaAtual.toString().padStart(5, '0')}/${anoAtual}`;

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

   // (Opcional) Consulta sequência por ano
   consultarSequencia = async (req, res) => {
      try {
         const { ano } = req.params;
         const sequencia = await sequenciaModel.getSequenciaAtual(ano);

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