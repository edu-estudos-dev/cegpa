import ExcelJS from 'exceljs';
import fs from 'fs';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import path from 'path';
import { fileURLToPath } from 'url';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import estoqueModelInstance from '../models/estoqueModel.js';
import { EstoqueModel } from '../models/estoqueModel.js';
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
         const item = await estoqueModelInstance.getInfoByID(id);
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
         const affectedRows = await estoqueModelInstance.updateEstoque(
            id,
            safeData
         );
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
            detalhes: { novos_dados: safeData },
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

   // Método para listar todos os itens no estoque
   getAllEstoque = async (req, res) => {
      try {
         const estoque = await estoqueModelInstance.getAllEstoque();
         estoque.forEach((item) => {
            if (item.data_de_entrada) {
               const d = new Date(item.data_de_entrada);
               item.data_de_entrada = isNaN(d.getTime())
                  ? null
                  : d.toISOString().split('T')[0];
               item.data_de_entrada_formatada = isNaN(d.getTime())
                  ? 'N/A'
                  : d.toLocaleDateString('pt-BR');
            } else {
               item.data_de_entrada = null;
               item.data_de_entrada_formatada = 'N/A';
            }
         });
         res.status(200).render('tabelaEstoque', {
            estoque,
            userRole: req.user ? req.user.role : 'user',
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

   // Método para criar um novo item no estoque ou registro de tombamento
   create = async (req, res) => {

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
            destino_dados,
         } = req.body;

         // Validação dos campos obrigatórios
         if (!data_de_entrada) {
            console.log('Erro: data_de_entrada não encontrado em req.body');
            return res
               .status(400)
               .json({ error: 'A data de entrada é obrigatória.' });
         }
         if (!quantidade || Number(quantidade) <= 0) {
            return res
               .status(400)
               .json({ error: 'A quantidade deve ser maior que zero.' });
         }
         if (!tipo_tombo) {
            return res
               .status(400)
               .json({ error: 'O tipo de tombo é obrigatório.' });
         }
         if (
            !categoria ||
            categoria.toUpperCase() === 'SELECIONE UMA CATEGORIA...'
         ) {
            return res
               .status(400)
               .json({ error: 'A categoria é obrigatória.' });
         }
         if (!doc_origem) {
            return res
               .status(400)
               .json({ error: 'O documento de origem é obrigatório.' });
         }
         if (!valor || Number(valor) <= 0) {
            return res
               .status(400)
               .json({ error: 'O valor deve ser maior que zero.' });
         }
         if (!descricao) {
            return res
               .status(400)
               .json({ error: 'A descrição é obrigatória.' });
         }
         if (!situacao || situacao.toUpperCase() === 'ESCOLHA UMA OPÇÃO...') {
            return res.status(400).json({ error: 'A situação é obrigatória.' });
         }
         if (
            !conta_contabil ||
            conta_contabil.toUpperCase() === 'ESCOLHA UMA OPÇÃO...'
         ) {
            return res
               .status(400)
               .json({ error: 'A conta contábil é obrigatória.' });
         }
         if (!estoque || estoque.toUpperCase() === 'ESCOLHA UMA OPÇÃO...') {
            return res.status(400).json({ error: 'O estoque é obrigatório.' });
         }
         if (
            !destino_dados ||
            !['estoqueatual', 'registrodetombamento'].includes(destino_dados)
         ) {
            return res
               .status(400)
               .json({ error: 'Destino dos dados inválido.' });
         }

         // Preparação dos dados seguros
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

         // Geração ou validação dos tombos
         let tombos = [];
         if (safeData.tipo_tombo === 'AUTO') {
            const ultimoTombo = await EstoqueModel.getUltimoTombo();
            const tomboInicial = ultimoTombo;
            for (let i = 0; i < safeData.quantidade; i++) {
               const novoTombo = tomboInicial + 1 + i;
               const tomboExistenteEstoque =
                  await estoqueModelInstance.getInfoByTombo(novoTombo);
               const tomboExistenteTombamento =
                  await estoqueModelInstance.getInfoByTomboTombamento(
                     novoTombo
                  );
               if (tomboExistenteEstoque || tomboExistenteTombamento) {
                  return res.status(400).json({
                     error: `O tombo ${novoTombo} já existe no sistema.`,
                  });
               }
               tombos.push(novoTombo);
            }
         } else if (safeData.tipo_tombo === 'LOTE_MANUAL') {
            if (!tombo_lote_manual) {
               return res
                  .status(400)
                  .json({ error: 'A lista de tombos do lote é obrigatória.' });
            }
            try {
               tombos = JSON.parse(tombo_lote_manual);
               if (
                  !Array.isArray(tombos) ||
                  tombos.length !== safeData.quantidade
               ) {
                  return res.status(400).json({
                     error: 'A quantidade de tombos não corresponde à quantidade informada ou a lista é inválida.',
                  });
               }
               for (const tombo of tombos) {
                  if (!Number.isInteger(Number(tombo)) || Number(tombo) <= 0) {
                     return res.status(400).json({
                        error: `O tombo ${tombo} deve ser um número inteiro positivo.`,
                     });
                  }
                  const tomboExistenteEstoque =
                     await estoqueModelInstance.getInfoByTombo(tombo);
                  const tomboExistenteTombamento =
                     await estoqueModelInstance.getInfoByTomboTombamento(tombo);
                  if (tomboExistenteEstoque || tomboExistenteTombamento) {
                     return res.status(400).json({
                        error: `O tombo ${tombo} já existe no sistema.`,
                     });
                  }
               }
            } catch (error) {
               return res.status(400).json({
                  error: 'Erro ao processar a lista de tombos manuais.',
               });
            }
         } else if (safeData.tipo_tombo === 'LOTE') {
            if (!tombo_inicial || !tombo_final) {
               return res.status(400).json({
                  error: 'Tombo inicial e final são obrigatórios para o tipo LOTE.',
               });
            }
            const inicio = Number(tombo_inicial);
            const fim = Number(tombo_final);
            if (
               !Number.isInteger(inicio) ||
               !Number.isInteger(fim) ||
               inicio <= 0 ||
               fim <= 0
            ) {
               return res.status(400).json({
                  error: 'Tombo inicial e final devem ser números inteiros positivos.',
               });
            }
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
            for (let tombo = inicio; tombo <= fim; tombo++) {
               const tomboExistenteEstoque =
                  await estoqueModelInstance.getInfoByTombo(tombo);
               const tomboExistenteTombamento =
                  await estoqueModelInstance.getInfoByTomboTombamento(tombo);
               if (tomboExistenteEstoque || tomboExistenteTombamento) {
                  return res
                     .status(400)
                     .json({ error: `O tombo ${tombo} já existe no sistema.` });
               }
               tombos.push(tombo);
            }
         }

         // Preparação dos itens para inserção em lote
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

         // Inserção na tabela correta e registro de auditoria
         let id_registro;
         const insertedIds = [];
         if (destino_dados === 'estoqueatual') {
            const result = await estoqueModelInstance.createEstoqueLote(itens);
            id_registro = result.insertId;
            for (let i = 0; i < itens.length; i++) {
               const item = itens[i];
               const currentId = id_registro + i;
               insertedIds.push(currentId);
               await AuditoriaModel.registrarLog({
                  usuario: req.user?.nome_completo || 'desconhecido',
                  acao: 'ENTRADA',
                  tabela_afetada: 'estoqueatual',
                  id_registro: currentId,
                  tombo: item.tombo,
                  detalhes: { dados: item },
               });
               if (req.file) {
                  const pdfData = {
                     filename: req.file.filename,
                     file_path: req.file.path,
                     uploaded_by: req.user?.nome_completo || 'desconhecido',
                     upload_date: new Date()
                        .toISOString()
                        .slice(0, 19)
                        .replace('T', ' '),
                     id_registro: currentId,
                     tombo: item.tombo,
                  };
                  await estoqueModelInstance.savePDFData(pdfData);
               }
            }
         } else {
            const result = await estoqueModelInstance.createTombamentoLote(
               itens
            );
            id_registro = result.insertId;
            for (let i = 0; i < itens.length; i++) {
               const item = itens[i];
               const currentId = id_registro + i;
               insertedIds.push(currentId);
               await AuditoriaModel.registrarLog({
                  usuario: req.user?.nome_completo || 'desconhecido',
                  acao: 'TOMBAMENTO',
                  tabela_afetada: 'registrodetombamento',
                  id_registro: currentId,
                  tombo: item.tombo,
                  detalhes: { dados: item },
               });
               if (req.file) {
                  const pdfData = {
                     filename: req.file.filename,
                     file_path: req.file.path,
                     uploaded_by: req.user?.nome_completo || 'desconhecido',
                     upload_date: new Date()
                        .toISOString()
                        .slice(0, 19)
                        .replace('T', ' '),
                     id_registro: currentId,
                     tombo: item.tombo,
                  };
                  await estoqueModelInstance.savePDFData(pdfData);
               }
            }
         }

         // Registro de auditoria para o PDF (mantido para compatibilidade)
         if (req.file) {
            await AuditoriaModel.registrarLog({
               usuario: req.user?.nome_completo || 'desconhecido',
               acao: 'UPLOAD_PDF',
               tabela_afetada: 'pdfs',
               id_registro: insertedIds[0],
               tombo: tombos[0],
               detalhes: {
                  filename: req.file.filename,
                  file_path: req.file.path,
               },
            });
         }

         // Resposta de sucesso
         res.status(200).json({
            message: 'Entrada registrada com sucesso!',
            id_registro: insertedIds[0],
            tombo: tombo_inicial || tombos[0],
         });
      } catch (error) {
         console.error(
            '[EstoqueController.create] Erro ao registrar entrada:',
            error.message,
            error.stack
         );
         res.status(500).json({
            error: 'Erro interno ao registrar a entrada.',
         });
      }
   };

   // Método para obter o último número de tombo registrado
   getUltimoTombo = async (req, res) => {
      try {
         const ultimoTombo = await EstoqueModel.getUltimoTombo();
         res.json({ ultimoTombo });
      } catch (error) {
         console.error('Erro ao obter último tombo:', error);
         res.status(500).json({ error: 'Erro ao obter último tombo.' });
      }
   };

   // Método para obter o último tombo (endpoint para o frontend)
   async fetchUltimoTombo(req, res) {
      try {
         const ultimoTombo = await EstoqueModel.getUltimoTombo();
         res.json({ ultimoTombo });
      } catch (error) {
         console.error('Erro ao obter o último tombo:', error);
         res.status(500).json({ error: 'Erro ao obter o último tombo' });
      }
   }

   // Método para visualizar um item
   visualizarItem = async (req, res) => {
      try {
         const { id } = req.params;
         const item = await estoqueModelInstance.getInfoByID(id);

         if (!item)
            return res.status(404).json({ error: 'Item não encontrado' });

         // Garante que data_de_entrada seja string ISO (ou null)
         if (item.data_de_entrada) {
            const d = new Date(item.data_de_entrada);
            item.data_de_entrada = isNaN(d.getTime()) ? null : d.toISOString();
         } else {
            item.data_de_entrada = null;
         }
         // Valor formatado pode ser útil, mas mantenha o valor original também
         item.valor_formatado = item.valor
            ? Number(item.valor).toLocaleString('pt-BR', {
                 style: 'currency',
                 currency: 'BRL',
              })
            : 'N/A';

         res.json(item);
      } catch (error) {
         console.error('Erro:', error);
         res.status(500).json({ error: 'Erro interno no servidor' });
      }
   };

   // Método para mostrar quantidade de itens únicos no estoque
   getQtdeUnicaEstoque = async (_, res) => {
      try {
         const estoque = await estoqueModelInstance.getQtdeUnicaEstoque();
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
         const item = await estoqueModelInstance.getInfoByID(id);
         const result = await estoqueModelInstance.delete(id);
         if (result > 0) {
            // Registrar log de auditoria (exclusão)
            await AuditoriaModel.registrarLog({
               usuario: req.user?.nome_completo || 'desconhecido',
               acao: 'EXCLUSÃO',
               tabela_afetada: 'estoqueatual',
               id_registro: id,
               tombo: item?.tombo || null,
               detalhes: { dados: item },
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
         const estoque = await estoqueModelInstance.getAllEstoque();
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
         const novos = await estoqueModelInstance.getAllItensNovos();
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

   // Método privado para geração de relatórios gerais (PDF ou Excel)
   _generateReport = async (
      res,
      data,
      title,
      formato,
      customColumns = null
   ) => {
      const columns = customColumns || [
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
            orientation: 'landscape',
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
            startY: 25,
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
               drawHeader(data.pageNumber);
               if (data.pageNumber < doc.internal.getNumberOfPages()) {
                  doc.autoTable.previous.finalY = 30;
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
         const workbook = new ExcelJS.Workbook();
         const worksheet = workbook.addWorksheet(title);
         worksheet.mergeCells(
            `A1:${String.fromCharCode(65 + columns.length - 1)}1`
         );
         worksheet.getCell('A1').value = title;
         worksheet.getCell('A1').alignment = { horizontal: 'center' };
         worksheet.getCell('A1').font = { size: 16, bold: true };
         worksheet.addRow([
            `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`,
         ]);
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
         const estoque = await estoqueModelInstance.getQtdeUnicaEstoque();
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
            width: 100,
            halign: 'left',
         },
         { header: 'Tombo', dataKey: 'tombo_estoqueatual', width: 15 },
         { header: 'Destino', dataKey: 'destino', width: 30 },
         { header: 'NUP (Suite)', dataKey: 'referencia', width: 32 },
         { header: 'Doc. Saída', dataKey: 'doc_saida', width: 18 },
         { header: 'Estado de Conservação', dataKey: 'situacao', width: 20 },
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
         situacao: item.situacao ? item.situacao.toUpperCase() : 'N/A',
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
         doc.text(title, 10, 15);
         const dateRangeText = `de ${data_inicial} a ${data_final}`;
         doc.setFontSize(6);
         const dateRangeWidth = doc.getTextWidth(dateRangeText);
         doc.text(dateRangeText, pageWidth - dateRangeWidth - 10, 15);

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
               [
                  {
                     content: `Total Itens Pagos: ${totalItensPagos}`,
                     colSpan: 9,
                     styles: {
                        halign: 'center',
                        fontStyle: 'bold',
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
               doc.text(title, 10, 15);
               const dateRangeText = `de ${data_inicial} a ${data_final}`;
               doc.setFontSize(6);
               const dateRangeWidth = doc.getTextWidth(dateRangeText);
               doc.text(dateRangeText, pageWidth - dateRangeWidth - 10, 15);

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
         worksheet.mergeCells(`A${worksheet.rowCount}:I${worksheet.rowCount}`);
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
         const itensDisponiveis =
            await estoqueModelInstance.getItensDisponiveis();
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
         const itensPagos = await estoqueModelInstance.getAllItensPagos(
            data_inicial,
            data_final
         );
         // Verificar se há PDF associado para cada item
         for (let item of itensPagos) {
            const pdfData = await estoqueModelInstance.getPDFByTombo(
               item.tombo_estoqueatual
            );
            item.has_pdf = !!pdfData; // Adiciona a propriedade has_pdf (true/false)
         }
         const userRole = req.user?.role || 'user';
         res.render('tabelaSaidaEstoque', {
            itensPagos: itensPagos,
            userRole,
            data_inicial: data_inicial || '',
            data_final: data_final || '',
         });
      } catch (error) {
         console.error('Erro no servidor:', error);
         res.status(500).render('tabelaSaidaEstoque', {
            itensPagos: [],
            userRole: req.user?.role || 'user',
            data_inicial: '',
            data_final: '',
            error: 'Erro ao carregar os itens pagos.',
         });
      }
   };

   // Método para mostrar os itens que foram pagos na tabela
   fetchItensDisponiveis = async (_, res) => {
      try {
         const itens = await estoqueModelInstance.getItensDisponiveis();
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
   async registrarSaida(req, res) {
      const {
         tombos,
         referencia,
         destino,
         postoGrad,
         mf_recebedor,
         tel_recebedor,
         nome_do_recebedor,
         observacao,
         modoDocSaida,
         doc_saida,
      } = req.body;

      const usuarioLogado = req.user;
      const nomeResponsavel = usuarioLogado?.nome_completo || 'Desconhecido';
      const mfResponsavel = usuarioLogado?.matricula || 'N/A';
      const postoGradResponsavel = usuarioLogado?.posto_grad || 'N/A';

      try {
         // Validações
         if (!tombos || tombos.length === 0) {
            return res
               .status(400)
               .json({ error: 'Selecione pelo menos um tombo.' });
         }
         if (
            !referencia ||
            !destino ||
            !postoGrad ||
            !mf_recebedor ||
            !tel_recebedor ||
            !nome_do_recebedor ||
            !doc_saida
         ) {
            return res
               .status(400)
               .json({ error: 'Todos os campos são obrigatórios.' });
         }

         // Validação do formato do termo
         if (!/^\d{1,5}\/\d{4}$/.test(doc_saida)) {
            return res.status(400).json({
               error: 'Formato de termo inválido. Use o formato N/AAAA ou NN/AAAA ou NNN/AAAA ou NNNN/AAAA ou NNNNN/AAAA (ex.: 5/2025 ou 00001/2025).',
            });
         }

         // Padronizar o número do termo com 5 dígitos para consistência
         const [num, ano] = doc_saida.split('/');
         const docSaidaFormatado = `${num.padStart(5, '0')}/${ano}`;

         // Validação para modo AUTO
         const anoAtual = new Date().getFullYear();
         if (modoDocSaida === 'AUTO') {
            const sequenciaAtual = await sequenciaModel.getSequenciaAtual(
               anoAtual
            );
            const expectedDocSaida = `${sequenciaAtual
               .toString()
               .padStart(5, '0')}/${anoAtual}`;
            if (docSaidaFormatado !== expectedDocSaida) {
               return res.status(400).json({
                  error: `Número do termo inválido para o modo AUTO. Esperado: ${expectedDocSaida}.`,
               });
            }
         }

         // Verifica se os tombos são válidos e estão disponíveis
         const tombosIndisponiveis = [];
         for (const tombo of tombos) {
            const item = await estoqueModelInstance.getInfoByTombo(tombo);
            if (!item || item.pago) {
               tombosIndisponiveis.push(tombo);
            }
         }
         if (tombosIndisponiveis.length > 0) {
            return res.status(400).json({
               error: `Tombos já em saída: ${tombosIndisponiveis.join(', ')}`,
            });
         }

         // Verifica se o PDF já existe
         const pdfPath = path.join(
            __dirname,
            '../../pdfs',
            `Termo_${docSaidaFormatado.replace(/\//g, '-')}.pdf`
         );
         if (fs.existsSync(pdfPath)) {
            return res.status(400).json({
               error: `O número do termo ${doc_saida} já foi utilizado. Escolha outro número.`,
            });
         }

         // Gera o PDF com jsPDF
         const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
         });

         // Caminho da imagem
         const imagePath = path.join(
            __dirname,
            '../../public/images/cabeçalho pmce.png'
         );
         const imageData = fs.readFileSync(imagePath).toString('base64');

         // Desenha a borda
         doc.setDrawColor(0);
         doc.setLineWidth(0.5);
         doc.rect(
            5,
            5,
            doc.internal.pageSize.width - 10,
            doc.internal.pageSize.height - 10
         );

         // Adiciona a imagem
         doc.addImage(imageData, 'PNG', 67.5, 8, 70, 15);

         // Título e cabeçalho
         doc.setFontSize(10);
         doc.text(
            'TERMO DE RECEBIMENTO E RESPONSABILIDADE - CEGPA/COLOG',
            105,
            28,
            { align: 'center' }
         );

         const headerYStart = 35;
         const headerData = [
            `Nº Termo: ${docSaidaFormatado}`,
            `Data: ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}`,
            `Destino: ${destino.toUpperCase()}`,
            `Responsável: ${postoGrad.toUpperCase()} ${nome_do_recebedor.toUpperCase()}`,
            `MF: ${mf_recebedor}`,
            `Contato: ${tel_recebedor}`,
            `Referência: ${referencia.toUpperCase()}`,
         ];
         let headerYOffset = 0;
         headerData.forEach((line, index) => {
            if (line.startsWith('Nº Termo')) {
               doc.setFont('helvetica', 'bold');
               doc.setFontSize(12);
               doc.text(line, 14, headerYStart + headerYOffset);
               doc.setFont('helvetica', 'normal');
               doc.setFontSize(10);
            } else {
               doc.text(line, 14, headerYStart + headerYOffset);
            }
            headerYOffset += 5;
         });

         // Observações
         const obsText = (observacao || 'Nenhuma').toUpperCase();
         const obsLines = doc.splitTextToSize(`Observações: ${obsText}`, 170);
         obsLines.forEach((obsLine) => {
            doc.text(obsLine, 14, headerYStart + headerYOffset);
            headerYOffset += 5;
         });

         // Tabela de tombos
         const tableStartY = headerYStart + headerYOffset + 2;
         const items = [];
         let ordem = 1;
         const tombosInfo = await estoqueModelInstance.getTombosInfo(tombos);
         for (const tombo of tombosInfo) {
            const descricao = tombo.descricao
               ? tombo.descricao
                    .toUpperCase()
                    .replace('RETAINGLIAR', 'RETANGULAR')
               : 'N/A';
            items.push([
               ordem++,
               tombo.tombo || 'N/A',
               descricao,
               tombo.situacao || 'N/A', // Inclui a coluna Situação
            ]);
         }

         doc.autoTable({
            startY: tableStartY,
            head: [['ORD.', 'TOMBO', 'DESCRIÇÃO', 'SITUAÇÃO']], // Inclui SITUAÇÃO no cabeçalho
            body: items,
            styles: {
               fontSize: 8,
               halign: 'center',
               cellPadding: 1.5,
               overflow: 'linebreak',
            },
            headStyles: {
               fillColor: [34, 139, 34],
               textColor: 255,
               fontStyle: 'bold',
            },
            columnStyles: {
               0: { cellWidth: 15 },
               1: { cellWidth: 35 },
               2: { cellWidth: 100, halign: 'left' }, // Ajusta largura para DESCRIÇÃO
               3: { cellWidth: 30 }, // Largura para SITUAÇÃO
            },
            margin: { left: 13, right: 7, bottom: 10 },
            tableWidth: 'wrap',
            pageBreak: 'auto',
            didDrawPage: (data) => {
               doc.rect(
                  5,
                  5,
                  doc.internal.pageSize.width - 10,
                  doc.internal.pageSize.height - 10
               );
            },
         });

         // Assinaturas na parte inferior
         const pageHeight = doc.internal.pageSize.height;
         const totalPages = doc.internal.getNumberOfPages();
         doc.setPage(totalPages);

         const signatureY = pageHeight - 20;
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
         doc.text('(Recebedor)', leftPos, signatureY + 8.5, {
            align: 'center',
         });

         doc.text(
            'TEN. CEL. ALLAN KARDEK\nMF: 135.907-1-0',
            centerPos,
            signatureY + 4,
            { align: 'center' }
         );
         doc.text('Comandante CEGPA', centerPos, signatureY + 8.5, {
            align: 'center',
         });

         doc.text(
            `${postoGradResponsavel.toUpperCase()} ${nomeResponsavel.toUpperCase()}\nMF: ${mfResponsavel}`,
            rightPos,
            signatureY + 4,
            { align: 'center' }
         );
         doc.text('(Responsável pela entrega)', rightPos, signatureY + 8.5, {
            align: 'center',
         });

         // Salva o PDF
         const pdfDir = path.dirname(pdfPath);
         if (!fs.existsSync(pdfDir)) {
            fs.mkdirSync(pdfDir, { recursive: true });
         }
         doc.save(pdfPath);

         // Registra a saída
         const dataSaida = new Date()
            .toISOString()
            .slice(0, 19)
            .replace('T', ' ');
         await estoqueModelInstance.registrarSaida(
            tombos,
            docSaidaFormatado,
            referencia,
            destino,
            postoGrad,
            mf_recebedor,
            tel_recebedor,
            nome_do_recebedor,
            observacao,
            dataSaida
         );

         // Incrementa a sequência após o registro
         if (modoDocSaida === 'AUTO') {
            await sequenciaModel.incrementarSequencia(anoAtual);
         }

         res.status(200).json({
            success: true,
            pdfPath: `/pdfs/Termo_${docSaidaFormatado.replace(/\//g, '-')}.pdf`,
            message: 'Saída registrada com sucesso!',
         });
      } catch (error) {
         console.error('Erro ao registrar saída:', error);
         res.status(500).json({
            success: false,
            error: 'Erro interno no servidor.',
            details: error.message,
         });
      }
   }

   // Método para visualizar um item pago específico
   visualizarItemPago = async (req, res) => {
      const { id } = req.params;
      try {
         const item = await estoqueModelInstance.getItemPagoDetalhes(id);
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
            return res.status(400).json({
               existe: false,
               error: 'Número do termo não informado.',
            });
         }
         // Extrair ano do termo (últimos 4 dígitos)
         const match = numero.match(/-(\d{4})$/);
         if (!match) {
            return res
               .status(400)
               .json({ existe: false, error: 'Formato do termo inválido.' });
         }
         const ano = match[1];
         // Montar o caminho da pasta do ano
         const pastaAno = `G:/Meu Drive/SERVIDOR_CEGPA/2. NUCPA/TERMOS RESPONSABILIDADE/${ano} TR SISTEMA NOVO`;
         // Procurar arquivos que começam com 'Termo_<numero>' e terminam com '.pdf'
         let existe = false;
         if (fs.existsSync(pastaAno)) {
            const arquivos = fs.readdirSync(pastaAno);
            existe = arquivos.some(
               (nome) =>
                  nome.startsWith(`Termo_${numero}`) && nome.endsWith('.pdf')
            );
         }
         return res.json({ existe });
      } catch (error) {
         return res
            .status(500)
            .json({ existe: false, error: 'Erro ao verificar termo.' });
      }
   };

   // Método para buscar informações de um tombo (restaurado para Pesquisa Avançada)
   fetchInfoTombo = async (req, res) => {
      const { tombo } = req.query;
      try {
         const infoTombo = await estoqueModelInstance.getInfoByTombo(tombo);
         if (infoTombo) {
            console.log(`Tombo ${tombo} encontrado:`, infoTombo);
            const infoSaida =
               await estoqueModelInstance.getSaidaByEstoqueatualId(
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
         `[EstoqueController] Usuário autenticado: ${JSON.stringify(req.user)}`
      );
      const { id } = req.params;
      try {
         const item = await estoqueModelInstance.getItemPagoByID(id);
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
         await estoqueModelInstance.reverterSaida(id, item.estoqueatual_id);
         // Registrar log de auditoria (reversão)
         await AuditoriaModel.registrarLog({
            usuario: req.user?.nome_completo || 'desconhecido',
            acao: 'REVERSÃO',
            tabela_afetada: 'itenspagos',
            id_registro: id,
            tombo: item.tombo,
            detalhes: {
               motivo: 'Reversão de saída',
               id_estoqueatual: item.estoqueatual_id,
            },
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
   async historicoAuditoriaTomboAPI(req, res) {
      console.log(
         '[estoqueController.historicoAuditoriaTomboAPI] Iniciando busca de auditoria para tombo:',
         req.params.tombo
      );
      try {
         const tombo = req.params.tombo;
         const historico = await AuditoriaModel.buscarPorTombo(tombo);
         console.log(
            '[estoqueController.historicoAuditoriaTomboAPI] Histórico retornado:',
            {
               tombo,
               historicoCount: historico.length,
               historico: historico.map((log) => ({
                  id: log.id,
                  usuario: log.usuario,
                  acao: log.acao,
                  data_hora: log.data_hora,
               })),
            }
         );
         res.status(200).json({ historico });
      } catch (error) {
         console.error(
            '[estoqueController.historicoAuditoriaTomboAPI] Erro ao buscar histórico:',
            {
               tombo: req.params.tombo,
               error: error.message,
            }
         );
         res.status(500).json({
            message: 'Erro ao buscar histórico de auditoria',
            error: error.message,
         });
      }
   }

   // Método para renderizar a página de histórico de auditoria
   renderHistoricoAuditoria = async (req, res) => {
      try {
         const { tombo } = req.query;
         let historico = [];
         if (tombo) {
            historico = await AuditoriaModel.getHistoricoByTombo(tombo);
         }
         res.render('historicoAuditoria', {
            historico,
            tomboPesquisado: tombo || '',
            userRole: req.user?.role || 'user',
         });
      } catch (error) {
         console.error('Erro ao renderizar histórico de auditoria:', error);
         res.status(500).json({
            error: 'Erro ao carregar histórico de auditoria.',
         });
      }
   };

   // Método para baixar o PDF associado a um tombo
   downloadPDF = async (req, res) => {
      const { tombo } = req.params;
      try {
         const pdfData = await estoqueModelInstance.getPDFByTombo(tombo);
         if (!pdfData || !pdfData.file_path) {
            return res.status(404).json({ error: 'PDF não encontrado.' });
         }

         const pdfPath = path.resolve(pdfData.file_path);
         if (!fs.existsSync(pdfPath)) {
            return res
               .status(404)
               .json({ error: 'Arquivo PDF não encontrado no servidor.' });
         }

         res.download(pdfPath, pdfData.filename, (err) => {
            if (err) {
               console.error('Erro ao baixar o PDF:', err);
               res.status(500).json({ error: 'Erro ao baixar o PDF.' });
            }
         });
      } catch (error) {
         console.error('Erro ao buscar PDF:', error);
         res.status(500).json({ error: 'Erro ao buscar PDF.' });
      }
   };

   // Método para baixar o PDF de saída associado a um tombo
   downloadPDFSaida = async (req, res) => {
      const { doc_saida } = req.params;
      try {
         const formattedDocSaida = doc_saida.replace('-', '/');
         const pdfPath = path.join(
            __dirname,
            '../../pdfs',
            `Termo_${doc_saida}.pdf`
         );

         if (!fs.existsSync(pdfPath)) {
            return res
               .status(404)
               .json({ error: 'Arquivo PDF de saída não encontrado.' });
         }

         res.download(pdfPath, `Termo_${doc_saida}.pdf`, (err) => {
            if (err) {
               console.error('Erro ao baixar o PDF de saída:', err);
               res.status(500).json({ error: 'Erro ao baixar o PDF.' });
            }
         });
      } catch (error) {
         console.error('Erro ao buscar PDF de saída:', error);
         res.status(500).json({ error: 'Erro ao buscar PDF de saída.' });
      }
   };

   // Método para obter o próximo número de sequência para o ano atual
   getProximoNumeroSequencia = async (req, res) => {
      try {
         const anoAtual = new Date().getFullYear();
         const sequencia = await sequenciaModel.getSequenciaAtual(anoAtual);
         const proximoNumero = sequencia.toString().padStart(5, '0');
         res.json({ proximoNumero: `${proximoNumero}/${anoAtual}` });
      } catch (error) {
         console.error('Erro ao obter próximo número de sequência:', error);
         res.status(500).json({
            error: 'Erro ao obter próximo número de sequência.',
         });
      }
   };

   // Método para obter o último número de tombo registrado
   getUltimoTombo = async (req, res) => {
      try {
         const ultimoTombo = await EstoqueModel.getUltimoTombo();
         res.json({ ultimoTombo });
      } catch (error) {
         console.error('Erro ao obter último tombo:', error);
         res.status(500).json({ error: 'Erro ao obter último tombo.' });
      }
   };

   // Método para registrar uma reserva de item
   async registrarReserva(req, res) {
      const { itemId, destino } = req.body;
      const usuarioLogado = req.user;
      const nomeResponsavel = usuarioLogado?.nome_completo || 'Desconhecido';

      try {
         // Validação dos campos
         if (!itemId || !destino) {
            console.log(
               '[registrarReserva] Validação falhou: itemId ou destino ausentes'
            );
            return res
               .status(400)
               .json({ error: 'ID do item e destino são obrigatórios.' });
         }

         // Registrar a reserva usando o modelo
         const result = await estoqueModelInstance.createReserva(
            itemId,
            destino,
            nomeResponsavel
         );

         if (!result) {
            console.log(
               '[registrarReserva] Resultado inválido retornado por createReserva'
            );
            return res
               .status(400)
               .json({ error: 'Não foi possível realizar a reserva.' });
         }

         // Registrar log de auditoria
         const item = await estoqueModelInstance.getInfoByID(itemId);
         if (!item) {
            console.log(
               '[registrarReserva] Item não encontrado para ID:',
               itemId
            );
            return res.status(404).json({ error: 'Item não encontrado.' });
         }
         console.log('[registrarReserva] Item encontrado:', {
            id: item.id,
            tombo: item.tombo,
         });

         await AuditoriaModel.registrarLog({
            usuario: nomeResponsavel,
            acao: 'RESERVA',
            tabela_afetada: 'reservas',
            id_registro: result.insertId,
            tombo: item.tombo,
            detalhes: { itemId, destino },
         });

         console.log(
            '[registrarReserva] Reserva registrada com sucesso, ID:',
            result.insertId
         );
         return res
            .status(200)
            .json({ message: 'Reserva realizada com sucesso!' });
      } catch (error) {
         console.error(
            '[registrarReserva] Erro ao registrar reserva:',
            error.message,
            error.stack
         );
         return res.status(500).json({
            error: 'Erro interno ao realizar a reserva.',
            details: error.message,
         });
      }
   }

   async showReservas(req, res) {
      try {
         const reservas = await estoqueModelInstance.getAllReservas();
         res.render('tabelaItensReservados', {
            reservas,
            userRole: req.user ? req.user.role : 'user',
         });
      } catch (error) {
         console.error('Erro ao carregar reservas:', error);
         res.status(500).json({
            error: 'Erro ao carregar a lista de reservas',
         });
      }
   }

   async cancelarReserva(req, res) {
      const { id } = req.params;
      try {
         const { affectedRows, tombo } =
            await estoqueModelInstance.desativarReserva(id);
         if (affectedRows === 0) {
            return res
               .status(404)
               .json({ error: 'Reserva não encontrada ou já cancelada.' });
         }

         // Registrar log de auditoria
         await AuditoriaModel.registrarLog({
            usuario: req.user?.nome_completo || 'desconhecido',
            acao: 'CANCELAMENTO_RESERVA',
            tabela_afetada: 'reservas',
            id_registro: id,
            tombo,
            detalhes: { motivo: 'Cancelamento de reserva' },
         });

         res.status(200).json({
            message:
               'Reserva cancelada com sucesso! O item retornou ao estoque atual.',
         });
      } catch (error) {
         console.error('Erro ao cancelar reserva:', error);
         res.status(500).json({
            error: 'Erro ao cancelar reserva.',
            details: error.message,
         });
      }
   }
}

// Exporta a instância da classe EstoqueController
export default new EstoqueController();
