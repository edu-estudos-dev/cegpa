import solicitacaoModel from '../models/solicitacaoModel.js';

class SolicitacaoController {
   renderSolicitacaoForm(req, res) {
      if (!req.session.user) {
         return res.status(401).redirect('/login');
      }
      res.render('cadastrarSolicitacao', {
         title: 'Formulário de solicitação',
         usuario: req.session.user,
      });
   }

   async createSolicitacao(req, res) {
      try {
         const {
            data_da_solicitacao,
            qtd,
            solicitante,
            situacao,
            descricao,
            observacao,
         } = req.body;

         if (!data_da_solicitacao)
            return res
               .status(400)
               .json({ error: 'A data de solicitação é obrigatória.' });
         if (!solicitante)
            return res
               .status(400)
               .json({ error: 'O solicitante é obrigatório.' });
         if (!qtd || Number(qtd) <= 0)
            return res
               .status(400)
               .json({ error: 'A quantidade deve ser maior que zero.' });
         if (!situacao)
            return res.status(400).json({ error: 'A situação é obrigatória.' });
         if (!descricao)
            return res
               .status(400)
               .json({ error: 'A descrição é obrigatória.' });

         const safeData = {
            data_da_solicitacao,
            quantidade: Number(qtd),
            solicitante: solicitante.toUpperCase(),
            descricao: descricao.toUpperCase(),
            situacao: situacao.toUpperCase(),
            observacao: observacao ? observacao.toUpperCase() : null,
         };

         const result = await solicitacaoModel.criarSolicitacao(
            safeData.data_da_solicitacao,
            safeData.quantidade,
            safeData.solicitante,
            safeData.situacao,
            safeData.descricao,
            safeData.observacao
         );

         res.redirect(
            '/form-solicitacao?success=Solicitação registrada com sucesso!'
         );
      } catch (error) {
         console.error(
            'Erro ao registrar solicitação de material:',
            error.message,
            error.stack
         );
         res.status(500).json({
            error: `Erro interno ao registrar a solicitação de material: ${error.message}`,
         });
      }
   }
}

export default new SolicitacaoController();
