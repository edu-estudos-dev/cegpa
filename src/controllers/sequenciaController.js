   import sequenciaModel from '../models/sequenciaModel.js';

   class SequenciaController {
      gerarTermoResponsabilidade = async (req, res) => {
         try {
            const anoAtual = new Date().getFullYear();
            const sequenciaAtual = await sequenciaModel.getSequenciaAtual(anoAtual);
            const doc_saida = `${sequenciaAtual.toString().padStart(5, '0')}/${anoAtual}`; // Formato com 5 dígitos

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
            const ano = parseInt(req.query.ano);
            if (!ano) {
               return res.status(400).json({ error: 'Ano é obrigatório' });
            }
            const sequencia = await sequenciaModel.getSequenciaAtual(ano);
            res.status(200).json({ sequencia });
         } catch (error) {
            console.error('Erro ao consultar sequência:', error);
            res.status(500).json({
               error: 'Erro ao consultar sequência',
               details: error.message,
            });
         }
      };
   }

   export default new SequenciaController();