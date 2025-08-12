import solicitacaoModel from '../models/solicitacaoModel.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

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

   // Método para exportar relatório de solicitações
   async exportarRelatorioSolicitacoes(req, res) {
      try {
         const formato = req.query.formato || 'pdf';
         const solicitacoes = await solicitacaoModel.getAllSolicitacaoModel();
         if (formato === 'excel') {
            const ExcelJS = (await import('exceljs')).default;
            const workbook = new ExcelJS.Workbook();
            const title = 'Relatório de Solicitações';
            const columns = [
               { header: 'ID', dataKey: 'id', width: 8 },
               { header: 'Data', dataKey: 'data_da_solicitacao', width: 20 },
               { header: 'Descrição', dataKey: 'descricao', width: 95 },
               { header: 'Qtde.', dataKey: 'quantidade', width: 18 },
               { header: 'Solicitante', dataKey: 'solicitante', width: 76 },
               { header: 'Situação', dataKey: 'situacao', width: 20 },
               { header: 'NUP', dataKey: 'nup', width: 40 },
            ];
            console.log('[EXCEL] Título da planilha:', title);
            const worksheet = workbook.addWorksheet(title);
            worksheet.mergeCells(`A1:${String.fromCharCode(65 + columns.length - 1)}1`);
            worksheet.getCell('A1').value = title;
            worksheet.getCell('A1').alignment = { horizontal: 'center' };
            worksheet.getCell('A1').font = { size: 16, bold: true };
            worksheet.addRow([`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`]);
            worksheet.addRow(columns.map((col) => col.header)).eachCell((cell) => {
               cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FF228B22' },
               };
               cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
               cell.alignment = { horizontal: 'center' };
            });
            solicitacoes.forEach(item => {
               worksheet.addRow([
                  item.id,
                  new Date(item.data_da_solicitacao).toLocaleDateString('pt-BR'),
                  item.descricao,
                  item.quantidade,
                  item.solicitante,
                  item.situacao,
                  item.nup
               ]);
            });
            worksheet.columns = columns.map((col) => ({ width: col.width }));
            const excelBuffer = await workbook.xlsx.writeBuffer();
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=relatorio_solicitacoes.xlsx');
            res.send(excelBuffer);
         } else {
            // PDF com jsPDF + autotable (importação dinâmica)
            const { jsPDF } = await import('jspdf');
            await import('jspdf-autotable');
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            const title = 'Relatório de Solicitações';
            const columns = [
               { header: 'ID', dataKey: 'id' },
               { header: 'Data', dataKey: 'data_da_solicitacao' },
               { header: 'Descrição', dataKey: 'descricao' },
               { header: 'Qtde.', dataKey: 'quantidade' },
               { header: 'Solicitante', dataKey: 'solicitante' },
               { header: 'Situação', dataKey: 'situacao' },
               { header: 'NUP', dataKey: 'nup' },
            ];
            const rows = solicitacoes.map(item => ({
               id: item.id,
               data_da_solicitacao: new Date(item.data_da_solicitacao).toLocaleDateString('pt-BR'),
               descricao: item.descricao,
               quantidade: item.quantidade,
               solicitante: item.solicitante,
               situacao: item.situacao,
               nup: item.nup,
            }));
            // Cabeçalho (igual padrão dos itens pagos)
            doc.setFontSize(15);
            doc.text(title, 10, 15); // Título alinhado à esquerda
            doc.setFontSize(6);
            const generatedText = `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`;
            doc.text(generatedText, 10, 22);
            const pageNumberText = `Página 1`;
            doc.text(pageNumberText, doc.internal.pageSize.width - 10, 22, { align: 'right' });

            doc.autoTable({
               startY: 25,
               margin: { left: 8, right: 8, top: 25 },
               head: [columns.map(col => col.header)],
               body: rows.map(row => columns.map(col => row[col.dataKey])),
               styles: {
                  fontSize: 8,
                  cellPadding: 2,
                  halign: 'center',
                  overflow: 'linebreak',
               },
               headStyles: {
                  fontSize: 9,
                  fillColor: [34, 139, 34],
                  textColor: 255,
                  fontStyle: 'bold',
               },
               columnStyles: {
                  0: { cellWidth: 8 }, // ID
                  1: { cellWidth: 20 }, // Data
                  2: { cellWidth: 95, halign: 'left' }, // Descrição
                  3: { cellWidth: 18 }, // Qtde.
                  4: { cellWidth: 76, halign: 'left' }, // Solicitante
                  5: { cellWidth: 20 }, // Situação
                  6: { cellWidth: 40 }, // NUP
               },
               didDrawPage: function (data) {
                  doc.setFontSize(15);
                  doc.text(title, 10, 15); // Título alinhado à esquerda
                  doc.setFontSize(6);
                  doc.text(generatedText, 10, 22);
                  const pageStr = `Página ${data.pageNumber}`;
                  doc.text(pageStr, doc.internal.pageSize.width - 10, 22, { align: 'right' });
               },
            });
            const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=relatorio_solicitacoes.pdf`);
            res.send(pdfBuffer);
         }
      } catch (error) {
         console.error('Erro ao exportar relatório de solicitações:', error);
         res.status(500).send('Erro ao exportar relatório de solicitações.');
      }
   }
}

export default new SolicitacaoController();
