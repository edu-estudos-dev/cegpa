import solicitacaoModel from '../models/solicitacaoModel.js';

class SolicitacaoController {
   renderSolicitacaoForm(req, res) {
      if (!req.session.user) {
         console.log('Usuário não autenticado, redirecionando para /login');
         return res.status(401).redirect('/login');
      }
      console.log('Renderizando formulário de solicitação');
      res.render('cadastrarSolicitacao', {
         title: 'Formulário de solicitação',
         usuario: req.session.user,
         success: null,
         error: null,
         data_da_solicitacao: null,
         solicitante: null,
         qtd: null,
         descricao: null,
         nup: null,
         observacao: null,
      });
   }

   async createSolicitacao(req, res) {
      try {
         console.log('Recebendo solicitação POST para /form-solicitacao:', req.body);
         const {
            data_da_solicitacao,
            qtd,
            solicitante,
            descricao,
            nup,
            observacao,
         } = req.body;

         if (!data_da_solicitacao) {
            console.log('Erro: Data de solicitação é obrigatória');
            return res.status(400).render('cadastrarSolicitacao', {
               title: 'Formulário de solicitação',
               usuario: req.session.user,
               success: null,
               error: 'A data de solicitação é obrigatória.',
               data_da_solicitacao,
               solicitante,
               qtd,
               descricao,
               nup,
               observacao,
            });
         }
         if (!solicitante) {
            console.log('Erro: Solicitante é obrigatório');
            return res.status(400).render('cadastrarSolicitacao', {
               title: 'Formulário de solicitação',
               usuario: req.session.user,
               success: null,
               error: 'O solicitante é obrigatório.',
               data_da_solicitacao,
               solicitante,
               qtd,
               descricao,
               nup,
               observacao,
            });
         }
         if (!qtd || Number(qtd) <= 0) {
            console.log('Erro: Quantidade deve ser maior que zero');
            return res.status(400).render('cadastrarSolicitacao', {
               title: 'Formulário de solicitação',
               usuario: req.session.user,
               success: null,
               error: 'A quantidade deve ser maior que zero.',
               data_da_solicitacao,
               solicitante,
               qtd,
               descricao,
               nup,
               observacao,
            });
         }
         if (!descricao) {
            console.log('Erro: Descrição é obrigatória');
            return res.status(400).render('cadastrarSolicitacao', {
               title: 'Formulário de solicitação',
               usuario: req.session.user,
               success: null,
               error: 'A descrição é obrigatória.',
               data_da_solicitacao,
               solicitante,
               qtd,
               descricao,
               nup,
               observacao,
            });
         }
         if (!nup || nup === 'NUP ') {
            console.log('Erro: NUP é obrigatório');
            return res.status(400).render('cadastrarSolicitacao', {
               title: 'Formulário de solicitação',
               usuario: req.session.user,
               success: null,
               error: 'O campo NUP é obrigatório.',
               data_da_solicitacao,
               solicitante,
               qtd,
               descricao,
               nup,
               observacao,
            });
         }
         const nupDigits = nup.replace(/[^\d]/g, '');
         if (nupDigits.length !== 17) {
            console.log('Erro: NUP deve conter exatamente 17 dígitos');
            return res.status(400).render('cadastrarSolicitacao', {
               title: 'Formulário de solicitação',
               usuario: req.session.user,
               success: null,
               error: 'O NUP deve conter exatamente 17 dígitos.',
               data_da_solicitacao,
               solicitante,
               qtd,
               descricao,
               nup,
               observacao,
            });
         }

         const safeData = {
            data_da_solicitacao,
            quantidade: Number(qtd),
            solicitante: solicitante.toUpperCase(),
            descricao: descricao.toUpperCase(),
            situacao: 'PENDENTE',
            nup,
            observacao: observacao ? observacao.toUpperCase() : null,
         };

         console.log('Salvando solicitação no banco de dados:', safeData);
         await solicitacaoModel.criarSolicitacao(
            safeData.data_da_solicitacao,
            safeData.quantidade,
            safeData.solicitante,
            safeData.situacao,
            safeData.descricao,
            safeData.nup,
            safeData.observacao
         );

         console.log('Solicitação registrada com sucesso, redirecionando para /tabela/solicitacao');
         res.redirect(
            '/tabela/solicitacao?success=' +
               encodeURIComponent('Solicitação registrada com sucesso!')
         );
      } catch (error) {
         console.error(
            'Erro ao registrar solicitação de material:',
            error.message,
            error.stack
         );
         res.status(500).render('cadastrarSolicitacao', {
            title: 'Formulário de solicitação',
            usuario: req.session.user,
            success: null,
            error: `Erro interno ao registrar a solicitação de material: ${error.message}`,
            data_da_solicitacao: req.body.data_da_solicitacao,
            solicitante: req.body.solicitante,
            qtd: req.body.qtd,
            descricao: req.body.descricao,
            nup: req.body.nup,
            observacao: req.body.observacao,
         });
      }
   }

   getAllSolicitacaoController = async (req, res) => {
      try {
         console.log('Acessando rota /tabela/solicitacao');
         const solicitacao = await solicitacaoModel.getAllSolicitacaoModel();
         console.log(
            'Solicitações retornadas para o EJS (getAllSolicitacaoController):',
            solicitacao
         );
         const successMessage = req.query.success || null;
         res.status(200).render('tabelaSolicitacao', {
            solicitacao,
            userRole: req.session.user.role,
            success: successMessage,
         });
      } catch (error) {
         console.error('Erro ao carregar as Solicitações:', error);
         res.status(500).json({
            error: 'Erro ao carregar as Solicitações.',
         });
      }
   };

   getSolicitacaoById = async (req, res) => {
      try {
         const id = req.params.id;
         const solicitacao = await solicitacaoModel.getSolicitacaoById(id);
         if (!solicitacao) {
            return res
               .status(404)
               .json({ error: 'Solicitação não encontrada.' });
         }
         res.status(200).json(solicitacao);
      } catch (error) {
         console.error('Erro ao buscar solicitação:', error);
         res.status(500).json({ error: 'Erro ao buscar solicitação.' });
      }
   };

   async atualizarSituacao(req, res) {
      try {
         const id = req.params.id;
         const { situacao } = req.body;

         if (!['PENDENTE', 'ADQUIRIDO'].includes(situacao)) {
            return res.status(400).json({ error: 'Situação inválida.' });
         }

         const result = await solicitacaoModel.atualizarSituacao(id, situacao);
         if (result.affectedRows === 0) {
            return res
               .status(404)
               .json({ error: 'Solicitação não encontrada.' });
         }

         res.status(200).json({ message: 'Situação atualizada com sucesso.' });
      } catch (error) {
         console.error('Erro ao atualizar situação:', error);
         res.status(500).json({ error: 'Erro ao atualizar situação.' });
      }
   }
}

export default new SolicitacaoController();