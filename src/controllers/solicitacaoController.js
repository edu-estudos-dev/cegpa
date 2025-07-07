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
         console.log(
            'Recebendo solicitação POST para /form-solicitacao:',
            req.body
         );
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

         console.log(
            'Solicitação registrada com sucesso, redirecionando para /tabela/solicitacao'
         );
         res.redirect(
            `/solicitacao/tabela/solicitacao?success=Solicitação registrada com sucesso!`
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

   // método para renderizar a tabela de solicitações
   getAllSolicitacaoController = async (req, res) => {
      try {
         console.log('Acessando rota /tabela/solicitacao');
         const solicitacao = await solicitacaoModel.getAllSolicitacaoModel();
         // console.log(
         //    'Solicitações retornadas para o EJS (getAllSolicitacaoController):',
         //    solicitacao
         // );
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

   // método para buscar uma solicitação por ID
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

   // método para atualizar a situação de uma solicitação
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

   // método para renderizar o formulário de edição
   renderEditForm = async (req, res) => {
      console.log(`[DEBUG] Acessando renderEditForm para ID: ${req.params.id}`);
      console.log(`[DEBUG] Usuário na sessão:`, req.session.user);
      try {
         const { id } = req.params;
         console.log(`[DEBUG] Buscando solicitação com ID ${id}`);
         const solicitacao = await solicitacaoModel.getSolicitacaoById(id);
         if (!solicitacao) {
            console.log(`[DEBUG] Solicitação com ID ${id} não encontrada`);
            return res
               .status(404)
               .json({ error: 'Solicitação não encontrada.' });
         }
         console.log(`[DEBUG] Solicitação encontrada:`, solicitacao);
         console.log(`[DEBUG] Valor do campo NUP:`, solicitacao.NUP);
         const item = {
            id: solicitacao.id,
            data_da_solicitacao: solicitacao.data_da_solicitacao,
            solicitante: solicitacao.solicitante,
            quantidade: solicitacao.quantidade,
            descricao: solicitacao.descricao,
            nup: solicitacao.NUP || '', // Alterado de solicitacao.nup para solicitacao.NUP
            observacao: solicitacao.observacao || '',
            situacao: solicitacao.situacao || 'PENDENTE',
         };
         console.log(`[DEBUG] Objeto item enviado ao template:`, item);
         return res.render('formEditSolicitacao', {
            title: 'Editar Solicitação',
            item,
            userRole: req.session.user?.role || 'user',
            error: null,
            success: null,
         });
      } catch (error) {
         console.error(
            `[ERROR] Erro ao renderizar formulário de edição para ID ${id}:`,
            error
         );
         return res.status(500).json({
            error: 'Erro interno ao carregar o formulário de edição.',
         });
      }
   };

   // método para atualizar uma solicitação
   updateSolicitacao = async (req, res) => {
      console.log('Recebendo requisição para atualizar solicitação:', req.body);
      try {
         const { id } = req.params;
         const {
            data_da_solicitacao,
            solicitante,
            qtd,
            descricao,
            nup,
            observacao,
         } = req.body;

         console.log('[DEBUG] Valores recebidos em req.body:', {
            data_da_solicitacao,
            solicitante,
            qtd,
            descricao,
            nup,
            observacao,
            _method: req.body._method, // Log do campo _method, se presente
         });

         // Validação dos campos obrigatórios
         if (!data_da_solicitacao || !solicitante || !qtd || !descricao) {
            console.log('Campos obrigatórios ausentes:', {
               data_da_solicitacao,
               solicitante,
               qtd,
               descricao,
            });
            return res
               .status(400)
               .json({ error: 'Campos obrigatórios não preenchidos.' });
         }

         // Validação do NUP
         const nupDigits = nup ? nup.replace(/[^\d]/g, '') : '';
         if (nupDigits && nupDigits.length !== 17) {
            console.log('NUP inválido:', nup);
            return res.status(400).json({
               error: 'O NUP deve conter exatamente 17 dígitos ou estar vazio.',
            });
         }

         // Atualizar a solicitação no banco de dados
         const solicitacao = {
            data_da_solicitacao,
            solicitante,
            quantidade: parseInt(qtd),
            descricao,
            nup: nup || null,
            observacao: observacao || null,
            situacao: req.body.situacao || 'PENDENTE', // Adiciona situacao, caso esteja no formulário
         };

         console.log('[DEBUG] Dados a serem atualizados:', solicitacao);

         const updated = await solicitacaoModel.updateSolicitacao(
            id,
            solicitacao
         );
         if (!updated) {
            console.log(`Solicitação com ID ${id} não encontrada`);
            return res
               .status(404)
               .json({ error: 'Solicitação não encontrada.' });
         }

         console.log('Solicitação atualizada com sucesso:', solicitacao);
         return res.status(200).json({ success: true });
      } catch (error) {
         console.error('Erro ao atualizar solicitação:', error);
         return res
            .status(500)
            .json({ error: 'Erro interno ao atualizar solicitação.' });
      }
   };

   // método para excluir uma solicitação
   async destroy(req, res) {
      try {
         const { id } = req.params;
         const result = await solicitacaoModel.deleteSolicitacao(id);
         if (result.affectedRows === 0) {
            return res
               .status(404)
               .json({ error: 'Solicitação não encontrada.' });
         }
         res.status(200).json({ message: 'Solicitação excluída com sucesso!' });
      } catch (error) {
         console.error('Erro ao excluir solicitação:', error);
         res.status(500).json({ error: 'Erro ao excluir solicitação.' });
      }
   }
}

export default new SolicitacaoController();
