import ExcelJS from 'exceljs';
import fs from 'fs';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import path from 'path';
import { fileURLToPath } from 'url';
import estoqueModel from '../models/estoqueModel.js';
import sequenciaModel from '../models/sequenciaModel.js';
import AuditoriaModel from '../models/auditoriaModel.js';

// Configurar __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EstoqueController {
   /* ********************************************************************************
                  Métodos para a ENTRADA de itens no Estoque
   *********************************************************************************/

   // Método para renderizar o formulário de edição
   renderEditForm = async (req, res) => {
      try {
         const { id } = req.params;
         const item = await estoqueModel.getInfoByID(id);
         if (!item) {
            return res.status(404).json({ error: 'Item não encontrado' });
         }
         // Ajustar formato da data para o input type="date" (YYYY-MM-DD)
         item.data_de_entrada = new Date(item.data_de_entrada)
            .toISOString()
            .split('T')[0];
         // Garantir que o valor seja um número puro
         item.valor = parseFloat(item.valor).toFixed(2);
         item.categoria = item.categoria.toLowerCase();
         item.estoque = item.estoque.toLowerCase();
         item.situacao = item.situacao.toLowerCase();
         item.conta_contabil = item.conta_contabil.toLowerCase();
         res.render('formEdit', { item });
      } catch (error) {
         console.error('Erro ao carregar o item para edição:', error);
         res.status(500).json({
            error: 'Erro ao carregar o item para edição.',
         });
      }
   };

   // Método para atualizar um item no estoque
   update = async (req, res) => {
      const { id } = req.params;
      const {
         data_de_entrada,
         descricao,
         tombo,
         categoria,
         conta_contabil,
         doc_origem,
         estoque,
         valor,
         situacao,
         observacao,
      } = req.body;

      // Validações básicas
      if (!data_de_entrada)
         return res
            .status(400)
            .json({ error: 'A data de entrada é obrigatória.' });
      if (!descricao)
         return res.status(400).json({ error: 'A descrição é obrigatória.' });
      if (!tombo || !Number.isInteger(Number(tombo)) || tombo < 0) {
         return res
            .status(400)
            .json({ error: 'O tombo deve ser um número inteiro válido.' });
      }
      if (!categoria || categoria === 'Selecione...')
         return res.status(400).json({ error: 'A categoria é obrigatória.' });
      if (!conta_contabil || conta_contabil === 'Escolha uma opção...') {
         return res
            .status(400)
            .json({ error: 'A conta contábil é obrigatória.' });
      }
      if (!estoque || estoque === 'Escolha uma opção...')
         return res.status(400).json({ error: 'O estoque é obrigatório.' });
      if (!doc_origem)
         return res
            .status(400)
            .json({ error: 'O documento de origem é obrigatório.' });
      if (!valor || valor <= 0)
         return res
            .status(400)
            .json({ error: 'O valor deve ser maior que zero.' });
      if (!situacao || situacao === 'Escolha uma opção...')
         return res.status(400).json({ error: 'A situação é obrigatória.' });
      // Removida a validação: if (observacao && observacao.trim() === '')

      const safeData = {
         data_de_entrada,
         descricao: descricao.toUpperCase(),
         tombo: Number(tombo),
         categoria: categoria.toUpperCase(),
         conta_contabil: conta_contabil.toUpperCase(),
         doc_origem: doc_origem.toUpperCase(),
         estoque: estoque.toUpperCase(),
         valor: Number(valor),
         situacao: situacao.toUpperCase(),
         observacao: observacao ? observacao.toUpperCase() : null,
      };

      try {
         console.log(
            'Dados recebidos no controlador para atualização:',
            safeData
         ); // Log para depuração
         const affectedRows = await estoqueModel.updateEstoque(id, safeData);
         if (affectedRows === 0) {
            return res.status(404).json({ error: 'Item não encontrado.' });
         }
         // Registrar log de auditoria (edição)
         await AuditoriaModel.registrarLog({
            usuario: req.user?.nome_completo || 'desconhecido',
            acao: 'EDIÇÃO',
            tabela_afetada: 'estoqueatual',
            id_registro: id,
            tombo: safeData.tombo,
            detalhes: { novos_dados: safeData }
         });
         res.status(200).json({ message: 'Item atualizado com sucesso!' });
      } catch (error) {
         console.error('Erro ao atualizar o item no estoque:', {
            error: error.message,
            data: safeData,
            id,
         });
         res.status(500).json({
            error: `Erro ao atualizar o item no estoque: ${error.message}`,
         });
      }
   };

   // Método para renderizar a tabela com os itens novos
   showItensNovos = async (req, res) => {
      try {
         const itensNovos = await estoqueModel.getAllItensNovos();
         const userRole = req.user ? req.user.role : 'user'; // Extrai o role ou usa 'user' como padrão
         res.render('tabelaItensNovos', { novos: itensNovos, userRole });
      } catch (error) {
         console.error('Erro ao carregar os itens novos:', error);
         res.status(500).json({ error: 'Erro ao carregar os itens novos.' });
      }
   };

   // Método para renderizar a tabela com os itens Usados
   showItensUsados = async (req, res) => {
      try {
         const itensUsados = await estoqueModel.getAllItensUsados();
         const userRole = req.user ? req.user.role : 'user'; // Extrai o role ou usa 'user' como padrão
         res.render('tabelaItensUsados', { usados: itensUsados, userRole });
      } catch (error) {
         console.error('Erro ao carregar os itens usados:', error);
         res.status(500).json({ error: 'Erro ao carregar os itens usados.' });
      }
   };

   // Método para listar todos os itens Usados no estoque
   getItensUsados = async (req, res) => {
      try {
         const itensUsados = await estoqueModel.getAllItensUsados();
         res.status(200).render('tabelaItensUsados', {
            usados: itensUsados,
         });
      } catch (error) {
         console.error('Erro ao carregar o estoque:', error);
         res.status(500).json({ error: 'Erro ao carregar o estoque.' });
      }
   };

   // Método para listar todos os itens no estoque
   getAllEstoque = async (req, res) => {
      try {
         const estoque = await estoqueModel.getAllEstoque();
         console.log('req.session.user:', req.session.user); // Debug
         res.status(200).render('tabelaEstoque', {
            estoque,
            userRole: req.session.user.role,
         });
      } catch (error) {
         console.error('Erro ao carregar o estoque:', error);
         res.status(500).json({ error: 'Erro ao carregar o estoque.' });
      }
   };

   // Método para renderizar o formulário de cadastro de estoque
   renderEntradaForm = (_, res) => {
      res.render('cadastrarEstoque');
   };

   // Método para criar um novo item no estoque
   create = async (req, res) => {
      console.log('Dados recebidos no método create (req.body):', req.body);

      try {
         const {
            data_de_entrada,
            quantidade,
            tipo_tombo,
            tombo_inicial,
            tombo_final,
            tombo_lote_manual,
            categoria,
            doc_origem,
            valor,
            descricao,
            situacao,
            conta_contabil,
            estoque,
            observacao,
         } = req.body;

         // Validação básica
         if (!data_de_entrada)
            return res
               .status(400)
               .json({ error: 'A data de entrada é obrigatória.' });
         if (!quantidade || Number(quantidade) <= 0)
            return res
               .status(400)
               .json({ error: 'A quantidade deve ser maior que zero.' });
         if (!tipo_tombo)
            return res
               .status(400)
               .json({ error: 'O tipo de tombo é obrigatório.' });
         if (!categoria || categoria === 'Selecione...')
            return res
               .status(400)
               .json({ error: 'A categoria é obrigatória.' });
         if (!doc_origem)
            return res
               .status(400)
               .json({ error: 'O documento de origem é obrigatório.' });
         if (!valor || Number(valor) <= 0)
            return res
               .status(400)
               .json({ error: 'O valor deve ser maior que zero.' });
         if (!descricao)
            return res
               .status(400)
               .json({ error: 'A descrição é obrigatória.' });
         if (!situacao || situacao === 'Escolha uma opção...')
            return res.status(400).json({ error: 'A situação é obrigatória.' });
         if (!conta_contabil || conta_contabil === 'Escolha uma opção...')
            return res
               .status(400)
               .json({ error: 'A conta contábil é obrigatória.' });
         if (!estoque || estoque === 'Escolha uma opção...')
            return res.status(400).json({ error: 'O estoque é obrigatório.' });

         const safeData = {
            data_de_entrada,
            quantidade: Number(quantidade),
            tipo_tombo: tipo_tombo || 'AUTO',
            categoria: categoria.toUpperCase(),
            doc_origem: doc_origem.toUpperCase(),
            valor: Number(valor),
            descricao: descricao.toUpperCase(),
            situacao: situacao.toUpperCase(),
            conta_contabil: conta_contabil.toUpperCase(),
            estoque: estoque.toUpperCase(),
            observacao: observacao ? observacao.toUpperCase() : null,
         };

         let tombos = [];
         if (safeData.tipo_tombo === 'AUTO') {
            const ultimoTombo = await estoqueModel.getUltimoTombo();
            const tomboInicial = ultimoTombo;
            for (let i = 0; i < safeData.quantidade; i++) {
               tombos.push(tomboInicial + 1 + i);
            }
         } else if (safeData.tipo_tombo === 'LOTE_MANUAL') {
            if (!tombo_lote_manual)
               return res
                  .status(400)
                  .json({ error: 'A lista de tombos do lote é obrigatória.' });
            tombos = JSON.parse(tombo_lote_manual);
            if (tombos.length !== safeData.quantidade)
               return res.status(400).json({
                  error: 'A quantidade de tombos não corresponde à quantidade informada.',
               });

            // Verificar duplicatas no banco
            for (const tombo of tombos) {
               const tomboExistente = await estoqueModel.getInfoByTombo(tombo);
               if (tomboExistente)
                  return res
                     .status(400)
                     .json({ error: `O tombo ${tombo} já existe no sistema.` });
            }
         } else if (safeData.tipo_tombo === 'LOTE') {
            if (!tombo_inicial || !tombo_final) {
               return res.status(400).json({
                  error: 'Tombo inicial e final são obrigatórios para o tipo LOTE.',
               });
            }

            const inicio = Number(tombo_inicial);
            const fim = Number(tombo_final);

            if (inicio >= fim) {
               return res.status(400).json({
                  error: 'O tombo inicial deve ser menor que o tombo final.',
               });
            }

            if (fim - inicio + 1 !== safeData.quantidade) {
               return res.status(400).json({
                  error: 'A quantidade informada não corresponde ao intervalo de tombos.',
               });
            }

            // Verificar duplicatas no banco
            for (let tombo = inicio; tombo <= fim; tombo++) {
               const tomboExistente = await estoqueModel.getInfoByTombo(tombo);
               if (tomboExistente) {
                  return res
                     .status(400)
                     .json({ error: `O tombo ${tombo} já existe no sistema.` });
               }
               tombos.push(tombo);
            }
         }

         // Preparar os itens para inserção em lote
         const itens = tombos.map((tombo) => ({
            data_de_entrada: safeData.data_de_entrada,
            descricao: safeData.descricao,
            tombo,
            quantidade: 1,
            categoria: safeData.categoria,
            conta_contabil: safeData.conta_contabil,
            doc_origem: safeData.doc_origem,
            estoque: safeData.estoque,
            valor: safeData.valor,
            situacao: safeData.situacao,
            observacao: safeData.observacao,
            tipo_tombo: safeData.tipo_tombo,
         }));

         // Inserir todos os itens de uma vez usando createEstoqueLote
         await estoqueModel.createEstoqueLote(itens);
         // Registrar log de auditoria (entrada)
         for (const item of itens) {
            await AuditoriaModel.registrarLog({
               usuario: req.user?.nome_completo || 'desconhecido',
               acao: 'ENTRADA',
               tabela_afetada: 'estoqueatual',
               id_registro: null, // O id só é conhecido após inserção individual, mas o tombo é único
               tombo: item.tombo,
               detalhes: { dados: item }
            });
         }
         res.status(200).json({ message: 'Entrada registrada com sucesso!' });
      } catch (error) {
         console.error(
            'Erro ao registrar entrada:',
            error.message,
            error.stack
         );
         res.status(500).json({
            error: 'Erro interno ao registrar a entrada.',
         });
      }
   };

   // Método para obter o último tombo (endpoint para o frontend)
   fetchUltimoTombo = async (req, res) => {
      try {
         const ultimoTombo = await estoqueModel.getUltimoTombo();
         res.json({ ultimoTombo });
      } catch (error) {
         console.error('Erro ao obter o último tombo:', error);
         res.status(500).json({ error: 'Erro ao obter o último tombo' });
      }
   };

   // Método para visualizar um item
   visualizarItem = async (req, res) => {
      try {
         const { id } = req.params;
         const item = await estoqueModel.getInfoByID(id);

         if (!item)
            return res.status(404).json({ error: 'Item não encontrado' });

         // Formatar datas e valores
         item.data_de_entrada = new Date(
            item.data_de_entrada
         ).toLocaleDateString('pt-BR');
         item.valor = item.valor.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
         });

         res.json(item);
      } catch (error) {
         console.error('Erro:', error);
         res.status(500).json({ error: 'Erro interno no servidor' });
      }
   };

   // Método para mostrar quantidade de itens únicos no estoque
   getQtdeUnicaEstoque = async (_, res) => {
      try {
         const estoque = await estoqueModel.getQtdeUnicaEstoque();
         res.render('qtde_disponivel_por_item', { estoque });
      } catch (error) {
         console.error(
            'Erro ao carregar quantidade única de itens no estoque:',
            error
         );
         res.status(500).json({
            error: 'Erro ao carregar quantidade única de itens no estoque.',
         });
      }
   };

   // Método para excluir do estoque
   destroy = async (req, res) => {
      try {
         const { id } = req.params;
         // Buscar o item antes de deletar para registrar o tombo
         const item = await estoqueModel.getInfoByID(id);
         const result = await estoqueModel.delete(id);
         if (result > 0) {
            // Registrar log de auditoria (exclusão)
            await AuditoriaModel.registrarLog({
               usuario: req.user?.nome_completo || 'desconhecido',
               acao: 'EXCLUSÃO',
               tabela_afetada: 'estoqueatual',
               id_registro: id,
               tombo: item?.tombo || null,
               detalhes: { dados: item }
            });
            return res.json({
               msg: 'Item deletado com sucesso!',
            });
         } else {
            return res.status(404).json({ msg: 'Item não encontrado' });
         }
      } catch (error) {
         console.error('Erro ao excluir o item:', error);
         return res.status(500).json({
            msg: 'Erro ao excluir o item',
            details: error.message,
         });
      }
   };

   // Método para Gerar Relatório da Tabela Geral (PDF ou Excel)
   generatePDF = async (req, res) => {
      try {
         const { formato = 'pdf' } = req.query; // Formato vem como query param, padrão é PDF
         const estoque = await estoqueModel.getAllEstoque();
         await this._generateReport(
            res,
            estoque,
            'Relatório de Estoque Geral - ANALÍTICO',
            formato
         );
      } catch (error) {
         console.error('Erro ao gerar relatório:', error);
         res.status(500).json({ error: 'Erro ao gerar relatório' });
      }
   };

   // Método para Gerar Relatório de Itens Novos (PDF ou Excel)
   generatePDFNovos = async (req, res) => {
      try {
         const { formato = 'pdf' } = req.query;
         const novos = await estoqueModel.getAllItensNovos();
         await this._generateReport(
            res,
            novos,
            'Relatório de Itens Novos',
            formato
         );
      } catch (error) {
         console.error('Erro ao gerar relatório:', error);
         res.status(500).json({ error: 'Erro ao gerar relatório' });
      }
   };

   // Método para Gerar Relatório de Itens Usados (PDF ou Excel)
   generatePDFUsados = async (req, res) => {
      try {
         const { formato = 'pdf' } = req.query;
         const usados = await estoqueModel.getAllItensUsados();
         await this._generateReport(
            res,
            usados,
            'Relatório de Itens Usados',
            formato
         );
      } catch (error) {
         console.error('Erro ao gerar relatório:', error);
         res.status(500).json({ error: 'Erro ao gerar relatório' });
      }
   };

   // Método privado para geração de relatórios gerais (PDF ou Excel)
   _generateReport = async (
      res,
      data,
      title,
      formato,
      customColumns = null
   ) => {
      const columns = customColumns || [
         // { header: 'ID', dataKey: 'id', width: 10 },
         { header: 'Entrada', dataKey: 'data_entrada', width: 18 },
         { header: 'Descrição', dataKey: 'descricao', width: 120 },
         { header: 'Tombo', dataKey: 'tombo', width: 20 },
         { header: 'Categoria', dataKey: 'categoria', width: 30 },
         { header: 'Local', dataKey: 'estoque', width: 20 },
         { header: 'Situação', dataKey: 'situacao', width: 20 },
         { header: 'Valor', dataKey: 'valor', width: 20 },
         { header: 'Doc Origem', dataKey: 'doc_origem', width: 30 },
      ];

      const rows = data.map((item) => {
         const row = {};
         columns.forEach((col) => {
            if (col.dataKey === 'data_entrada') {
               row[col.dataKey] = item.data_de_entrada
                  ? new Date(item.data_de_entrada).toLocaleDateString('pt-BR')
                  : 'N/A';
            } else if (col.dataKey === 'valor') {
               row[col.dataKey] = item.valor
                  ? parseFloat(item.valor).toLocaleString('pt-BR', {
                       style: 'currency',
                       currency: 'BRL',
                    })
                  : 'N/A';
            } else if (col.dataKey === 'doc_origem') {
               row[col.dataKey] = item.doc_origem
                  ? item.doc_origem.toUpperCase()
                  : 'N/A';
            } else {
               row[col.dataKey] = item[col.dataKey]
                  ? item[col.dataKey].toString().toUpperCase()
                  : 'N/A';
            }
         });
         return row;
      });

      if (formato === 'pdf') {
         const doc = new jsPDF({
            orientation: 'landscape', // Forçado para paisagem
            unit: 'mm',
            format: 'a4',
         });

         const generatedText = `Gerado em: ${new Date().toLocaleDateString(
            'pt-BR'
         )}`;

         // Função para desenhar o cabeçalho
         const drawHeader = (pageNumber) => {
            doc.setFontSize(14);
            doc.text(title, doc.internal.pageSize.width / 2, 15, {
               align: 'center',
            });
            doc.setFontSize(6);
            const pageStr = `Página ${pageNumber}`;
            doc.text(generatedText, 10, 22);
            doc.text(pageStr, doc.internal.pageSize.width - 10, 22, {
               align: 'right',
            });
         };

         // Desenha o cabeçalho na primeira página
         drawHeader(1);

         doc.autoTable({
            startY: 25, // Mantido em 25mm
            margin: { left: 10, right: 10, top: 30 },
            head: [columns.map((col) => col.header)],
            body: rows.map((row) => columns.map((col) => row[col.dataKey])),
            styles: {
               fontSize: 6,
               cellPadding: 2,
               halign: 'center',
               overflow: 'linebreak',
            },
            headStyles: {
               fontSize: 7,
               fillColor: [34, 139, 34],
               textColor: 255,
               fontStyle: 'bold',
            },
            columnStyles: columns.reduce((acc, col, index) => {
               acc[index] = {
                  cellWidth: col.width,
                  halign: col.dataKey === 'descricao' ? 'left' : 'center',
               };
               return acc;
            }, {}),
            didDrawPage: function (data) {
               drawHeader(data.pageNumber); // Desenha o cabeçalho em todas as páginas
               if (data.pageNumber < doc.internal.getNumberOfPages()) {
                  doc.autoTable.previous.finalY = 30; // Define o ponto de partida da próxima tabela como 30mm
               }
            },
         });

         const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
         res.setHeader('Content-Type', 'application/pdf');
         res.setHeader(
            'Content-Disposition',
            `attachment; filename=${title.replace(/ /g, '_')}.pdf`
         );
         res.send(pdfBuffer);
      } else if (formato === 'excel') {
         console.log('[EXCEL] Título da planilha:', title);
         const workbook = new ExcelJS.Workbook();
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
         rows.forEach((row) => {
            worksheet.addRow(columns.map((col) => row[col.dataKey]));
         });
         worksheet.columns = columns.map((col) => ({ width: col.width }));
         const excelBuffer = await workbook.xlsx.writeBuffer();
         res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
         );
         res.setHeader(
            'Content-Disposition',
            `attachment; filename=${title.replace(/ /g, '_')}.xlsx`
         );
         res.send(excelBuffer);
      } else {
         res.status(400).json({
            error: 'Formato inválido. Use "pdf" ou "excel".',
         });
      }
   };

   // Método para Gerar Relatório de Quantidade Disponível (PDF ou Excel)
   generatePDFQuantidadeDisponivel = async (req, res) => {
      try {
         const { formato = 'pdf' } = req.query;
         const estoque = await estoqueModel.getQtdeUnicaEstoque();
         await this._generateReport(
            res,
            estoque,
            'Relatório de Estoque Geral - SINTÉTICO',
            formato,
            [
               { header: 'Descrição', dataKey: 'descricao', width: 187 },
               { header: 'Categoria', dataKey: 'categoria', width: 60 },
               { header: 'Quantidade', dataKey: 'quantidade', width: 30 },
            ]
         );
      } catch (error) {
         console.error(
            'Erro ao gerar relatório de quantidade disponível:',
            error
         );
         res.status(500).json({ error: 'Erro ao gerar relatório' });
      }
   };

   // Método para Gerar Relatório de Itens Pagos (PDF ou Excel)
   generatePDFItensPagos = async (req, res) => {
      try {
         const { formato = 'pdf', data_inicial, data_final } = req.query;
         const itensPagos = await estoqueModel.getItensPagosForPDF(
            data_inicial,
            data_final
         );
         await this._generatePDFItensPagos(
            res,
            itensPagos,
            'Relatório de Itens Pagos',
            formato,
            data_inicial,
            data_final
         );
      } catch (error) {
         console.error('Erro ao gerar relatório:', error);
         res.status(500).json({ error: 'Erro ao gerar relatório' });
      }
   };

   // Método privado para geração de relatórios de itens pagos (PDF ou Excel)
   _generatePDFItensPagos = async (
      res,
      data,
      title,
      formato,
      data_inicial,
      data_final
   ) => {
      const columns = [
         { header: 'Saída', dataKey: 'data_de_saida', width: 17 },
         {
            header: 'Descrição',
            dataKey: 'descricao',
            width: 115,
            halign: 'left',
         },
         { header: 'Tombo', dataKey: 'tombo_estoqueatual', width: 15 },
         { header: 'Destino', dataKey: 'destino', width: 30 },
         { header: 'NUP (Suite)', dataKey: 'referencia', width: 32 },
         { header: 'Doc. Saída', dataKey: 'doc_saida', width: 18 },
         { header: 'Doc. Origem', dataKey: 'doc_origem', width: 30 },
         { header: 'Valor', dataKey: 'valor', width: 21 },
      ];

      const rows = data.map((item) => ({
         data_de_saida: new Date(item.data_de_saida).toLocaleDateString(
            'pt-BR'
         ),
         descricao: item.descricao ? item.descricao.toUpperCase() : 'N/A',
         tombo_estoqueatual: item.tombo_estoqueatual || 'N/A',
         destino: item.destino ? item.destino.toUpperCase() : 'N/A',
         referencia: item.referencia ? item.referencia.toUpperCase() : 'N/A',
         doc_saida: item.doc_saida || 'N/A',
         doc_origem: item.doc_origem ? item.doc_origem.toUpperCase() : 'N/A',
         valor: item.valor
            ? parseFloat(item.valor).toLocaleString('pt-BR', {
                 style: 'currency',
                 currency: 'BRL',
              })
            : 'N/A',
      }));

      // Calcular o total de itens pagos (número de linhas)
      const totalItensPagos = rows.length;

      if (formato === 'pdf') {
         const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
         });

         // Definir o título do relatório e o intervalo de datas na mesma linha
         doc.setFontSize(15);
         const titleWidth = doc.getTextWidth(title);
         const pageWidth = doc.internal.pageSize.width;
         doc.text(title, 10, 15); // Título alinhado à esquerda
         const dateRangeText = `de ${data_inicial} a ${data_final}`;
         doc.setFontSize(6); // Reduzido para 6, menos destaque
         const dateRangeWidth = doc.getTextWidth(dateRangeText);
         doc.text(dateRangeText, pageWidth - dateRangeWidth - 10, 15); // Intervalo alinhado à direita

         doc.setFontSize(8);

         // Texto "Gerado em" e número da página na mesma linha
         const generatedText = `Gerado em: ${new Date().toLocaleDateString(
            'pt-BR'
         )}`;
         const pageNumberText = `Página 1`;
         doc.text(generatedText, 10, 22);
         doc.text(pageNumberText, doc.internal.pageSize.width - 10, 22, {
            align: 'right',
         });

         doc.autoTable({
            startY: 25,
            margin: { left: 8, right: 8, top: 25 },
            head: [columns.map((col) => col.header)],
            body: [
               ...rows.map((row) => columns.map((col) => row[col.dataKey])),
               // Adicionar linha de total com mesclagem de colunas
               [
                  {
                     content: `Total Itens Pagos: ${totalItensPagos}`,
                     colSpan: 8, // Mescla todas as 8 colunas
                     styles: {
                        halign: 'center',
                        fontStyle: 'bold', // Negrito para destaque
                     },
                  },
               ],
            ],
            styles: {
               fontSize: 6,
               cellPadding: 2,
               halign: 'center',
               overflow: 'linebreak',
            },
            headStyles: {
               fontSize: 7,
               fillColor: [34, 139, 34],
               textColor: 255,
               fontStyle: 'bold',
            },
            columnStyles: columns.reduce((acc, col, index) => {
               acc[index] = {
                  cellWidth: col.width,
                  halign: col.halign || 'center',
               };
               return acc;
            }, {}),
            didDrawPage: function (data) {
               doc.setFontSize(15);
               const titleWidth = doc.getTextWidth(title);
               const pageWidth = doc.internal.pageSize.width;
               doc.text(title, 10, 15); // Título alinhado à esquerda
               const dateRangeText = `de ${data_inicial} a ${data_final}`;
               doc.setFontSize(6); // Reduzido para 6, menos destaque
               const dateRangeWidth = doc.getTextWidth(dateRangeText);
               doc.text(dateRangeText, pageWidth - dateRangeWidth - 10, 15); // Intervalo alinhado à direita

               doc.setFontSize(8);
               const pageStr = `Página ${data.pageNumber}`;
               doc.text(generatedText, 10, 22);
               doc.text(pageStr, doc.internal.pageSize.width - 10, 22, {
                  align: 'right',
               });
            },
         });
         const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
         res.setHeader('Content-Type', 'application/pdf');
         res.setHeader(
            'Content-Disposition',
            `attachment; filename=${title.replace(/ /g, '_')}.pdf`
         );
         res.send(pdfBuffer);
      } else if (formato === 'excel') {
         const workbook = new ExcelJS.Workbook();
         const worksheet = workbook.addWorksheet(title);

         // Adicionar o título e mesclar as células
         worksheet.mergeCells('A1:I1');
         worksheet.getCell('A1').value = title;
         worksheet.getCell('A1').alignment = { horizontal: 'center' };
         worksheet.getCell('A1').font = { size: 16, bold: true };

         // Adicionar a data de geração e intervalo de datas
         worksheet.addRow([
            `Gerado em: ${new Date().toLocaleDateString(
               'pt-BR'
            )} - de ${data_inicial} a ${data_final}`,
         ]);

         // Adicionar o cabeçalho
         worksheet.addRow(columns.map((col) => col.header)).eachCell((cell) => {
            cell.fill = {
               type: 'pattern',
               pattern: 'solid',
               fgColor: { argb: 'FF228B22' },
            };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            cell.alignment = { horizontal: 'center' };
         });

         // Adicionar os dados
         rows.forEach((row) => {
            worksheet.addRow(columns.map((col) => row[col.dataKey]));
         });

         // Adicionar linha de total de itens pagos com mesclagem
         const totalRow = worksheet.addRow([
            `Total Itens Pagos: ${totalItensPagos}`,
         ]);
         worksheet.mergeCells(`A${worksheet.rowCount}:H${worksheet.rowCount}`);
         totalRow.eachCell((cell) => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center' };
         });

         // Ajustar a largura das colunas
         worksheet.columns = columns.map((col) => ({ width: col.width }));

         const excelBuffer = await workbook.xlsx.writeBuffer();
         res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
         );
         res.setHeader(
            'Content-Disposition',
            `attachment; filename=${title.replace(/ /g, '_')}.xlsx`
         );
         res.send(excelBuffer);
      } else {
         res.status(400).json({
            error: 'Formato inválido. Use "pdf" ou "excel".',
         });
      }
   };

   /* ********************************************************************************
                  Métodos para a SAÍDA de itens no Estoque
   *********************************************************************************/

   // Método para Renderizar a view de SAÍDA de estoque com dados do estoque disponíveis
   async renderSaidaForm(req, res) {
      try {
         const itensDisponiveis = await estoqueModel.getItensDisponiveis();
         res.render('saidaEstoque', { itensDisponiveis });
      } catch (error) {
         console.error('Erro ao obter itens disponíveis:', error);
         res.status(500).json({ error: 'Erro ao obter itens disponíveis' });
      }
   }

   // Método para Renderizar a tabela de itens pagos
   renderTabelaSaida = (_, res) => {
      res.render('tabelaSaidaEstoque', { itensPagos: [] });
   };

   // Método para mostrar todos os itens pagos
   getAllItensPagos = async (req, res) => {
      try {
         const { data_inicial, data_final } = req.query;
         console.log('Requisição recebida em /estoque/itenspagos:', {
            data_inicial,
            data_final,
         });

         // Verificar se ambas as datas foram fornecidas
         if (data_inicial && data_final) {
            const itensPagos = await estoqueModel.getItensPagos(
               data_inicial,
               data_final
            );
            console.log('Itens pagos retornados do modelo:', itensPagos.length);

            const userRole = req.user ? req.user.role : 'user';
            return res.render('tabelaSaidaEstoque', {
               itensPagos,
               userRole,
               data_inicial,
               data_final,
            });
         }

         // Se não houver filtro de datas, retornar todos os itens
         const itensPagos = await estoqueModel.getItensPagos();
         const userRole = req.user ? req.user.role : 'user';
         res.render('tabelaSaidaEstoque', {
            itensPagos,
            userRole,
            data_inicial: null,
            data_final: null,
         });
      } catch (error) {
         console.error('Erro ao carregar os itens pagos:', {
            message: error.message,
            stack: error.stack,
            query: req.query,
         });
         res.status(500).render('tabelaSaidaEstoque', {
            itensPagos: [],
            userRole: req.user ? req.user.role : 'user',
            data_inicial: null,
            data_final: null,
            error: 'Erro ao carregar os itens pagos.',
         });
      }
   };

   // Método para mostrar os itens que foram pagos na tabela
   fetchItensDisponiveis = async (_, res) => {
      try {
         const itens = await estoqueModel.getItensDisponiveis();
         res.json(itens);
      } catch (error) {
         console.error('Erro ao buscar itens disponíveis:', error);
         res.status(500).json({
            error: 'Erro ao buscar itens disponíveis.',
            details: error.message,
         });
      }
   };

   // Método para registrar a saída de itens e gerar o PDF
   registrarSaida = async (req, res) => {
      console.log('Requisição recebida em registrarSaida:', req.body);
      const {
         tombos,
         doc_saida,
         referencia,
         destino,
         postoGrad,
         mf_recebedor,
         tel_recebedor,
         nome_do_recebedor,
         observacao,
      } = req.body;

      console.log('req.user no registrarSaida:', req.user);

      const usuarioLogado = req.user;
      const nomeResponsavel = usuarioLogado?.nome_completo;
      const mfResponsavel = usuarioLogado?.matricula;
      const postoGradResponsavel = usuarioLogado?.posto_grad;

      try {
         // Validação dos campos obrigatórios
         if (
            !tombos?.length ||
            !doc_saida ||
            !referencia ||
            !destino ||
            !postoGrad ||
            !mf_recebedor ||
            !tel_recebedor ||
            !nome_do_recebedor
         ) {
            console.log('Campos obrigatórios faltando:', {
               tombos,
               doc_saida,
               referencia,
               destino,
               postoGrad,
               mf_recebedor,
               tel_recebedor,
               nome_do_recebedor,
            });
            return res
               .status(400)
               .json({ error: 'Preencha todos os campos obrigatórios' });
         }

         if (!nomeResponsavel || !mfResponsavel || !postoGradResponsavel) {
            console.log('Dados do usuário logado incompletos:', {
               nomeResponsavel,
               mfResponsavel,
               postoGradResponsavel,
            });
            return res.status(401).json({
               error: 'Usuário autenticado não possui informações completas',
            });
         }

         const dataDeSaida = new Date();
         const doc = new jsPDF();

         console.log('Iniciando geração do PDF...');
         doc.setDrawColor(0);
         doc.setLineWidth(0.5);

         // Desenha a borda na primeira página
         doc.rect(
            5,
            5,
            doc.internal.pageSize.width - 10,
            doc.internal.pageSize.height - 10
         );

         // Carregar a imagem
         const imagePath = path.join(
            __dirname,
            '../../public/images/cabeçalho pmce.png'
         );
         const imageData = fs.readFileSync(imagePath).toString('base64');
         const imgProps = {
            format: 'PNG',
            width: 70, // Largura da imagem em mm
            height: 15, // Altura da imagem em mm
         };

         // Adicionar a imagem ao PDF
         doc.addImage(
            imageData,
            imgProps.format,
            67.5, // Posição X
            8, // Posição Y
            imgProps.width,
            imgProps.height
         );

         // Título do documento (ajustado para não sobrepor a imagem)
         doc.setFontSize(10);
         doc.text(
            'TERMO DE RECEBIMENTO E RESPONSABILIDADE - CEGPA/COLOG',
            105,
            12 + imgProps.height,
            { align: 'center' }
         );
         doc.setFontSize(10);

         const headerYStart = 20 + imgProps.height;
         const obsText = (observacao || 'Nenhuma').toUpperCase();
         const obsLines = doc.splitTextToSize(`Observações: ${obsText}`, 170); // aumente de 120 para 170

         const headerData = [
            `Nº Termo: ${doc_saida}`,
            `Data: ${dataDeSaida.toLocaleDateString('pt-BR')}`,
            `Destino: ${destino.toUpperCase()}`,
            `Responsável: ${postoGrad} ${nome_do_recebedor.toUpperCase()}`,
            `MF: ${mf_recebedor}`,
            `Contato: ${tel_recebedor}`,
            `Referência: ${referencia}`
            // Observações será renderizado separadamente
         ];

         // Renderiza o cabeçalho com destaque para o Nº Termo
         let headerYOffset = 0;
         headerData.forEach((line, index) => {
            if (line.startsWith('Nº Termo')) {
               doc.setFont('helvetica', 'bold');
               doc.setFontSize(12);
               doc.text(line, 14, headerYStart + headerYOffset);
               doc.setFont('helvetica', 'normal');
               doc.setFontSize(10);
            } else {
               doc.setFontSize(10);
               doc.text(line, 14, headerYStart + headerYOffset);
            }
            headerYOffset += 5;
         });
         // Renderiza as linhas de observação com quebra automática
         obsLines.forEach((obsLine) => {
            doc.setFontSize(10);
            doc.text(obsLine, 14, headerYStart + headerYOffset);
            headerYOffset += 5;
         });

         // Calcula a posição Y final após o cabeçalho e observação
         const tableStartY = headerYStart + headerYOffset + 2; // +2 para um pequeno espaçamento

         let ordem = 1;
         const items = [];

         console.log('Processando tombos:', tombos);
         for (const tombo of tombos) {
            console.log(`Buscando item com tombo ${tombo}...`);
            const itemEstoque = await estoqueModel.getInfoByTombo(tombo);

            if (!itemEstoque) {
               console.warn(`Tombo ${tombo} não encontrado`);
               continue;
            }

            if (itemEstoque.pago) {
               // Item já foi pago, não pode sair de novo!
               return res.status(400).json({
                  error: `O item com tombo ${tombo} já foi pago e não pode ser retirado novamente.`,
               });
            }

            console.log(`Item encontrado para tombo ${tombo}:`, itemEstoque);
            items.push([
               ordem++,
               itemEstoque.tombo,
               itemEstoque.descricao
                  .toUpperCase()
                  .replace('RETAINGLIAR', 'RETANGULAR'),
               itemEstoque.situacao.toUpperCase(),
            ]);

            console.log(`Registrando saída para tombo ${tombo}...`);
            await estoqueModel.createSaida(
               itemEstoque.id,
               itemEstoque.tombo,
               doc_saida,
               dataDeSaida,
               1,
               referencia,
               destino,
               postoGrad,
               mf_recebedor,
               tel_recebedor,
               nome_do_recebedor,
               observacao,
               itemEstoque.descricao
            );
            // Registrar log de auditoria (saída)
            await AuditoriaModel.registrarLog({
               usuario: req.user?.nome_completo || 'desconhecido',
               acao: 'SAÍDA',
               tabela_afetada: 'itenspagos',
               id_registro: itemEstoque.id,
               tombo: itemEstoque.tombo,
               detalhes: {
                  doc_saida,
                  referencia,
                  destino,
                  postoGrad,
                  mf_recebedor,
                  tel_recebedor,
                  nome_do_recebedor,
                  observacao,
                  descricao: itemEstoque.descricao
               }
            });

            console.log(`Marcando tombo ${tombo} como pago...`);
            await estoqueModel.markAsPaid(itemEstoque.id);
         }

         if (items.length === 0) {
            console.log('Nenhum item válido encontrado para gerar o termo.');
            return res.status(400).json({
               error: 'Nenhum item válido encontrado para gerar o termo.',
            });
         }

         // Renderiza a tabela
         console.log('Total de itens na tabela:', items.length);
         doc.autoTable({
            startY: tableStartY,
            head: [['ORD.', 'TOMBO', 'DESCRIÇÃO', 'SITUAÇÃO']],
            body: items,
            styles: {
               fontSize: 8,
               halign: 'center',
               cellPadding: 1.5,
               overflow: 'linebreak', // Garante que textos longos sejam quebrados
            },
            headStyles: {
               fillColor: [34, 139, 34],
               textColor: 255,
               fontStyle: 'bold',
            },
            columnStyles: {
               0: { cellWidth: 10 },
               1: { cellWidth: 25 },
               2: { cellWidth: 130, halign: 'left' },
               3: { cellWidth: 20 },
            },
            margin: { left: 13, right: 7, bottom: 10 }, // Adiciona margem inferior
            tableWidth: 'wrap',
            pageBreak: 'auto', // Garante quebra automática de página
            didDrawPage: (data) => {
               console.log('Desenhando página:', data.pageNumber);
               doc.rect(
                  5,
                  5,
                  doc.internal.pageSize.width - 10,
                  doc.internal.pageSize.height - 10
               );
            },
         });

         console.log(
            'Total de páginas geradas:',
            doc.internal.getNumberOfPages()
         );

         // Após a tabela ser renderizada
         const pageHeight = doc.internal.pageSize.height;

         // Garante que estamos na última página
         const totalPages = doc.internal.getNumberOfPages();
         doc.setPage(totalPages);

         // Define a posição Y das assinaturas fixas na parte inferior da página
         const signatureY = pageHeight - 20; // 20 mm acima da borda inferior para acomodar texto e linhas
         const lineLength = 50;
         const gapBetweenBlocks = 10;

         const totalBlockWidth = lineLength * 3 + gapBetweenBlocks * 2;
         const startX = 5 + (200 - totalBlockWidth) / 2;

         const leftPos = startX + lineLength / 2;
         const centerPos = leftPos + lineLength + gapBetweenBlocks;
         const rightPos = centerPos + lineLength + gapBetweenBlocks;

         doc.setLineWidth(0.3);

         doc.line(startX, signatureY, startX + lineLength, signatureY);
         doc.line(
            centerPos - lineLength / 2,
            signatureY,
            centerPos + lineLength / 2,
            signatureY
         );
         doc.line(
            rightPos - lineLength / 2,
            signatureY,
            rightPos + lineLength / 2,
            signatureY
         );

         doc.setFontSize(6);
         doc.text(
            `${postoGrad.toUpperCase()} ${nome_do_recebedor.toUpperCase()}\nMF: ${mf_recebedor}`,
            leftPos,
            signatureY + 4,
            { align: 'center' }
         );
         doc.setFontSize(6);
         doc.text('(Recebedor)', leftPos, signatureY + 8.5, {
            align: 'center',
         });

         doc.setFontSize(6);
         doc.text(
            'TEN. CEL. ALLAN KARDEK\nMF: 135.907-1-0',
            centerPos,
            signatureY + 4,
            { align: 'center' }
         );
         doc.setFontSize(6);
         doc.text('Comandante CEGPA', centerPos, signatureY + 8.5, {
            align: 'center',
         });

         doc.setFontSize(6);
         doc.text(
            `${postoGradResponsavel.toUpperCase()} ${nomeResponsavel.toUpperCase()}\nMF: ${mfResponsavel}`,
            rightPos,
            signatureY + 4,
            { align: 'center' }
         );
         doc.setFontSize(6);
         doc.text('(Responsável pela entrega)', rightPos, signatureY + 8.5, {
            align: 'center',
         });

         console.log('Salvando PDF...');
         const fileName = `Termo_${doc_saida.replace(/\//g, '-')}.pdf`;
         const pdfPath = path.join(__dirname, '../../pdfs', fileName);

         if (!fs.existsSync(path.dirname(pdfPath))) {
            fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
         }

         doc.save(pdfPath);

         const modoDocSaida = req.body.modoDocSaida || 'AUTO';
         // Antes de salvar o PDF e incrementar a sequência, verificar se o termo é automático
         // O termo automático segue o padrão sequencial do banco, enquanto o manual pode ser qualquer valor
         // Supondo que o termo automático é sempre igual ao próximo da sequência
         // Podemos identificar isso comparando doc_saida com o próximo termo esperado
         // Para garantir, vamos receber do frontend um campo opcional: modoDocSaida ('AUTO' ou 'MANUAL')
         // Se não vier, considerar 'AUTO' como padrão

         // No início do método registrarSaida:
         // const modoDocSaida = req.body.modoDocSaida || 'AUTO';

         // Antes de await sequenciaModel.incrementarSequencia(new Date().getFullYear());
         if (modoDocSaida === 'AUTO') {
            await sequenciaModel.incrementarSequencia(new Date().getFullYear());
         }

         console.log('Atualizando sequência...');
         // await sequenciaModel.incrementarSequencia(new Date().getFullYear());

         console.log('Enviando resposta de sucesso...');
         res.status(200).json({
            success: true,
            pdfPath: `/pdfs/${fileName}`,
            message: 'Saída registrada com sucesso!',
         });
      } catch (error) {
         console.error('Erro no registrarSaida:', error);
         res.status(500).json({
            success: false,
            error: 'Erro interno no servidor',
            details: error.message,
         });
      }
   };
   
   // Método para visualizar um item pago específico
   visualizarItemPago = async (req, res) => {
      const { id } = req.params;
      try {
         const item = await estoqueModel.getItemPagoDetalhes(id);
         console.log('Item retornado:', item);
         if (item) {
            res.json(item);
         } else {
            res.status(404).json({ error: 'Item pago não encontrado' });
         }
      } catch (error) {
         console.error('Erro ao buscar item pago pelo ID:', error);
         res.status(500).json({ error: 'Erro ao buscar item pago.' });
      }
   };

   // Método para verificar se já existe um PDF com o número do termo informado
   verificarTermoExistente = async (req, res) => {
      try {
         const { numero } = req.query;
         if (!numero) {
            return res.status(400).json({ existe: false, error: 'Número do termo não informado.' });
         }
         // Extrair ano do termo (últimos 4 dígitos)
         const match = numero.match(/-(\d{4})$/);
         if (!match) {
            return res.status(400).json({ existe: false, error: 'Formato do termo inválido.' });
         }
         const ano = match[1];
         // Montar o caminho da pasta do ano
         const pastaAno = `G:/Meu Drive/SERVIDOR_CEGPA/2. NUCPA/TERMOS RESPONSABILIDADE/${ano} TR SISTEMA NOVO`;
         // Procurar arquivos que começam com 'Termo_<numero>' e terminam com '.pdf'
         let existe = false;
         if (fs.existsSync(pastaAno)) {
            const arquivos = fs.readdirSync(pastaAno);
            existe = arquivos.some(nome => nome.startsWith(`Termo_${numero}`) && nome.endsWith('.pdf'));
         }
         return res.json({ existe });
      } catch (error) {
         return res.status(500).json({ existe: false, error: 'Erro ao verificar termo.' });
      }
   };

   // Método para buscar informações de um tombo (restaurado para Pesquisa Avançada)
   fetchInfoTombo = async (req, res) => {
      const { tombo } = req.query;
      try {
         console.log(`Buscando informações para o tombo: ${tombo}`);
         const infoTombo = await estoqueModel.getInfoByTombo(tombo);
         if (infoTombo) {
            console.log(`Tombo ${tombo} encontrado:`, infoTombo);
            const infoSaida = await estoqueModel.getSaidaByEstoqueatualId(
               infoTombo.id
            );
            res.json({ infoTombo, infoSaida });
         } else {
            console.log(`Tombo ${tombo} não encontrado.`);
            res.json({ infoTombo: null, infoSaida: null });
         }
      } catch (error) {
         console.error('Erro ao buscar informações do tombo:', error);
         res.status(500).json({
            error: 'Erro ao buscar informações do tombo.',
         });
      }
   };

   // Método para reverter a saída de um item
   reverterSaida = async (req, res) => {
      console.log(
         `[EstoqueController] Recebida requisição DELETE para reverter saída com ID: ${req.params.id}`
      );
      console.log(
         `[EstoqueController] Usuário autenticado: ${JSON.stringify(
            req.session.user
         )}`
      );
      const { id } = req.params;
      try {
         console.log(`[EstoqueController] Buscando item pago com ID: ${id}`);
         const item = await estoqueModel.getItemPagoByID(id);
         if (!item) {
            console.log(
               `[EstoqueController] Item pago não encontrado para ID: ${id}`
            );
            return res.status(404).json({ error: 'Item pago não encontrado.' });
         }

         if (!item.estoqueatual_id) {
            console.log(
               `[EstoqueController] estoqueatual_id não encontrado para item ID: ${id}`
            );
            return res.status(400).json({
               error: 'ID do estoque atual não encontrado para este item.',
            });
         }

         console.log(
            `[EstoqueController] Revertendo saída para item: ${JSON.stringify(
               item
            )}`
         );
         await estoqueModel.reverterSaida(id, item.estoqueatual_id);
         // Registrar log de auditoria (reversão)
         await AuditoriaModel.registrarLog({
            usuario: req.session.user?.nome_completo || 'desconhecido',
            acao: 'REVERSÃO',
            tabela_afetada: 'itenspagos',
            id_registro: id,
            tombo: item.tombo,
            detalhes: { motivo: 'Reversão de saída', id_estoqueatual: item.estoqueatual_id }
         });

         console.log(
            `[EstoqueController] Saída revertida com sucesso para ID: ${id}`
         );
         res.status(200).json({ message: 'Saída revertida com sucesso!' });
      } catch (error) {
         console.error(
            `[EstoqueController] Erro ao reverter saída para ID ${id}:`,
            error
         );
         res.status(500).json({
            error: 'Erro ao reverter saída.',
            details: error.message,
         });
      }
   };

   // API: Retorna histórico de auditoria de um tombo em JSON
   historicoAuditoriaTomboAPI = async (req, res) => {
      const { tombo } = req.params;
      try {
         const historico = await AuditoriaModel.buscarPorTombo(tombo);
         res.json({ tombo, historico });
      } catch (error) {
         console.error('Erro ao buscar histórico de auditoria (API):', error);
         res.status(500).json({ error: 'Erro ao buscar histórico de auditoria.' });
      }
   };
}

export default new EstoqueController();
