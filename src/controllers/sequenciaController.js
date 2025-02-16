import sequenciaModel from "../models/sequenciaModel.js";

class SequenciaController {
   getProximaSequencia = async (req, res) => {
      try {
         const ano = new Date().getFullYear();
         const sequencia = await sequenciaModel.getSequencia(ano);
         const doc_saida = `${ano}/${String(sequencia).padStart(5, '0')}`;
         res.json({ doc_saida });
      } catch (error) {
         res.status(500).json({ error: 'Erro ao obter próxima sequência.' });
      }
   };

   incrementarSequencia = async (ano) => {
      try {
         await sequenciaModel.incrementarSequencia(ano);
      } catch (error) {
         console.error('Erro ao incrementar sequência:', error);
      }
   };
}

export default new SequenciaController();
