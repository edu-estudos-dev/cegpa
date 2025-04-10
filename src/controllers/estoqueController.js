import ExcelJS from 'exceljs';
import fs from 'fs';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import path from 'path';
import { fileURLToPath } from 'url';
import estoqueModel from '../models/estoqueModel.js';
import sequenciaModel from '../models/sequenciaModel.js';

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
   showItensNovos = async (_req, res) => {
      try {
         const itensNovos = await estoqueModel.getAllItensNovos();
         res.render('tabelaItensNovos', { novos: itensNovos });
      } catch (error) {
         console.error('Erro ao carregar os itens novos:', error);
         res.status(500).json({ error: 'Erro ao carregar os itens novos.' });
      }
   };

   // Método para listar todos os itens NOVOS no estoque
   getItensNovos = async (req, res) => {
      try {
         const itensNovos = await estoqueModel.getAllItensNovos();
         res.status(200).render('tabelaItensNovos', {
            novos: itensNovos,
         });
      } catch (error) {
         console.error('Erro ao carregar o estoque:', error);
         res.status(500).json({ error: 'Erro ao carregar o estoque.' });
      }
   };

   // Método para renderizar a tabela com os itens Usados
   showItensUsados = async (_req, res) => {
      try {
         const itensUsados = await estoqueModel.getAllItensUsados();
         res.render('tabelaItensUsados', {
            usados: itensUsados,
         });
      } catch (error) {
         console.error('Erro ao carregar os itens Usados:', error);
         res.status(500).json({ error: 'Erro ao carregar os itens Usados.' });
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
          userRole: req.session.user.role
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
              return res.status(400).json({ error: 'A data de entrada é obrigatória.' });
          if (!quantidade || Number(quantidade) <= 0)
              return res.status(400).json({ error: 'A quantidade deve ser maior que zero.' });
          if (!tipo_tombo)
              return res.status(400).json({ error: 'O tipo de tombo é obrigatório.' });
          if (!categoria || categoria === 'Selecione...')
              return res.status(400).json({ error: 'A categoria é obrigatória.' });
          if (!doc_origem)
              return res.status(400).json({ error: 'O documento de origem é obrigatório.' });
          if (!valor || Number(valor) <= 0)
              return res.status(400).json({ error: 'O valor deve ser maior que zero.' });
          if (!descricao)
              return res.status(400).json({ error: 'A descrição é obrigatória.' });
          if (!situacao || situacao === 'Escolha uma opção...')
              return res.status(400).json({ error: 'A situação é obrigatória.' });
          if (!conta_contabil || conta_contabil === 'Escolha uma opção...')
              return res.status(400).json({ error: 'A conta contábil é obrigatória.' });
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
                  return res.status(400).json({ error: 'A lista de tombos do lote é obrigatória.' });
              tombos = JSON.parse(tombo_lote_manual);
              if (tombos.length !== safeData.quantidade)
                  return res.status(400).json({
                      error: 'A quantidade de tombos não corresponde à quantidade informada.',
                  });
  
              // Verificar duplicatas no banco
              for (const tombo of tombos) {
                  const tomboExistente = await estoqueModel.getInfoByTombo(tombo);
                  if (tomboExistente)
                      return res.status(400).json({ error: `O tombo ${tombo} já existe no sistema.` });
              }
          } else if (safeData.tipo_tombo === 'LOTE') {
              if (!tombo_inicial || !tombo_final) {
                  return res.status(400).json({ error: 'Tombo inicial e final são obrigatórios para o tipo LOTE.' });
              }
  
              const inicio = Number(tombo_inicial);
              const fim = Number(tombo_final);
  
              if (inicio >= fim) {
                  return res.status(400).json({ error: 'O tombo inicial deve ser menor que o tombo final.' });
              }
  
              if ((fim - inicio + 1) !== safeData.quantidade) {
                  return res.status(400).json({
                      error: 'A quantidade informada não corresponde ao intervalo de tombos.'
                  });
              }
  
              // Verificar duplicatas no banco
              for (let tombo = inicio; tombo <= fim; tombo++) {
                  const tomboExistente = await estoqueModel.getInfoByTombo(tombo);
                  if (tomboExistente) {
                      return res.status(400).json({ error: `O tombo ${tombo} já existe no sistema.` });
                  }
                  tombos.push(tombo);
              }
          }
  
          // Preparar os itens para inserção em lote
          const itens = tombos.map(tombo => ({
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
              tipo_tombo: safeData.tipo_tombo
          }));
  
          // Inserir todos os itens de uma vez usando createEstoqueLote
          await estoqueModel.createEstoqueLote(itens);
  
          res.status(200).json({ message: 'Entrada registrada com sucesso!' });
      } catch (error) {
          console.error('Erro ao registrar entrada:', error.message, error.stack);
          res.status(500).json({
              error: 'Erro interno ao registrar a entrada.',
          });
      }
  };
   
   // Método para obter o último tombo (endpoint para o frontend)
   fetchUltimoTombo = async (req, res) => {
      try {
         const ultimoTombo = await estoqueModel.getUltimoTombo();
         console.log('Tombo retornado para o frontend:', ultimoTombo);
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
         const result = await estoqueModel.delete(id);
         if (result > 0) {
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
            'Relatório de Estoque Geral',
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
   _generateReport = async (res, data, title, formato) => {
      const columns = [
         { header: 'ID', dataKey: 'id', width: 10 },
         { header: 'Entrada', dataKey: 'data_entrada', width: 18 },
         { header: 'Descrição', dataKey: 'descricao', width: 120 },
         { header: 'Tombo', dataKey: 'tombo', width: 20 },
         { header: 'Categoria', dataKey: 'categoria', width: 30 },
         { header: 'Estoque', dataKey: 'estoque', width: 20 },
         { header: 'Situação', dataKey: 'situacao', width: 20 },
         { header: 'Valor', dataKey: 'valor', width: 20 },
         { header: 'Doc Origem', dataKey: 'doc_origem', width: 30 },
      ];
   
      const rows = data.map((item) => ({
         id: item.id,
         data_entrada: new Date(item.data_de_entrada).toLocaleDateString('pt-BR'),
         descricao: item.descricao,
         tombo: item.tombo,
         categoria: item.categoria,
         estoque: item.estoque,
         situacao: item.situacao,
         valor: item.valor
            ? parseFloat(item.valor).toLocaleString('pt-BR', {
               style: 'currency',
               currency: 'BRL',
            })
            : 'N/A',
         doc_origem: item.doc_origem ? item.doc_origem.toUpperCase() : 'N/A',
      }));
   
      if (formato === 'pdf') {
         const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
         });
   
         // Definir o título do relatório
         doc.setFontSize(16);
         doc.text(title, 10, 15);
         doc.setFontSize(10);
   
         // Texto "Gerado em" e número da página na mesma linha (apenas na primeira página inicialmente)
         const generatedText = `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`;
         const pageNumberText = `Página 1`;
         doc.text(generatedText, 10, 22);
         doc.text(pageNumberText, doc.internal.pageSize.width - 10, 22, { align: 'right' });
   
         doc.autoTable({
            startY: 25, // Início da tabela na primeira página
            margin: { left: 5, right: 5, top: 25 }, // Reservar espaço no topo de todas as páginas
            head: [columns.map((col) => col.header)],
            body: rows.map((row) => columns.map((col) => row[col.dataKey])),
            styles: {
               fontSize: 7,
               cellPadding: 2,
               halign: 'center',
               overflow: 'linebreak',
            },
            headStyles: {
               fillColor: [34, 139, 34],
               textColor: 255,
               fontStyle: 'bold',
            },
            columnStyles: columns.reduce((acc, col, index) => {
               acc[index] = { cellWidth: col.width };
               return acc;
            }, {}),
            didDrawPage: function (data) {
               // Reimprimir o título e o texto "Gerado em" em todas as páginas
               doc.setFontSize(16);
               doc.text(title, 10, 15);
               doc.setFontSize(10);
               const pageStr = `Página ${data.pageNumber}`;
               doc.text(generatedText, 10, 22);
               doc.text(pageStr, doc.internal.pageSize.width - 10, 22, { align: 'right' });
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
         const titleRow = worksheet.addRow([title]);
         worksheet.mergeCells(`A1:I1`);
         worksheet.getCell('A1').alignment = { horizontal: 'center' };
         worksheet.getCell('A1').font = { size: 16, bold: true };
   
         // Adicionar a data de geração
         worksheet.addRow([`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`]);
   
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
   
         // Ajustar a largura das colunas
         worksheet.columns = columns.map((col) => ({ width: col.width / 6 }));
   
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
   
   // Método para Gerar Relatório de Itens Pagos (PDF ou Excel)
   generatePDFItensPagos = async (req, res) => {
      try {
         const { formato = 'pdf' } = req.query;
         const itensPagos = await estoqueModel.getItensPagosForPDF();
         await this._generatePDFItensPagos(
            res,
            itensPagos,
            'Relatório de Itens Pagos',
            formato
         );
      } catch (error) {
         console.error('Erro ao gerar relatório:', error);
         res.status(500).json({ error: 'Erro ao gerar relatório' });
      }
   };

   // Método privado para geração de relatórios de itens pagos (PDF ou Excel)
   _generatePDFItensPagos = async (res, data, title, formato) => {
   const columns = [
      { header: 'ID', dataKey: 'id', width: 10 },
      { header: 'Saída', dataKey: 'data_de_saida', width: 18 },
      { header: 'Descrição', dataKey: 'descricao', width: 111 },
      { header: 'Tombo', dataKey: 'tombo_estoqueatual', width: 17 },
      { header: 'Destino', dataKey: 'destino', width: 28 },
      { header: 'NUP (Suite)', dataKey: 'referencia', width: 22 },
      { header: 'Doc Saída', dataKey: 'doc_saida', width: 20 },
      { header: 'Doc Origem', dataKey: 'doc_origem', width: 35 },
      { header: 'Valor', dataKey: 'valor', width: 20 },
   ];

   const rows = data.map((item) => ({
      id: item.id,
      data_de_saida: new Date(item.data_de_saida).toLocaleDateString('pt-BR'),
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

   if (formato === 'pdf') {
      const doc = new jsPDF({
         orientation: 'landscape',
         unit: 'mm',
         format: 'a4',
      });

      // Definir o título do relatório
      doc.setFontSize(15);
      doc.text(title, 10, 15);
      doc.setFontSize(9);

      // Texto "Gerado em" e número da página na mesma linha (apenas na primeira página inicialmente)
      const generatedText = `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`;
      const pageNumberText = `Página 1`;
      doc.text(generatedText, 10, 22);
      doc.text(pageNumberText, doc.internal.pageSize.width - 10, 22, { align: 'right' });

      doc.autoTable({
         startY: 25, // Início da tabela na primeira página
         margin: { left: 8, right: 8, top: 25 }, // Reservar espaço no topo de todas as páginas
         head: [columns.map((col) => col.header)],
         body: rows.map((row) => columns.map((col) => row[col.dataKey])),
         styles: {
            fontSize: 7,
            cellPadding: 2,
            halign: 'center',
            overflow: 'linebreak',
         },
         headStyles: {
            fillColor: [34, 139, 34],
            textColor: 255,
            fontStyle: 'bold',
         },
         columnStyles: columns.reduce((acc, col, index) => {
            acc[index] = { cellWidth: col.width };
            return acc;
         }, {}),
         didDrawPage: function (data) {
            // Reimprimir o título e o texto "Gerado em" em todas as páginas
            doc.setFontSize(15);
            doc.text(title, 10, 15);
            doc.setFontSize(9);
            const pageStr = `Página ${data.pageNumber}`;
            doc.text(generatedText, 10, 22);
            doc.text(pageStr, doc.internal.pageSize.width - 10, 22, { align: 'right' });
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
      const titleRow = worksheet.addRow([title]);
      worksheet.mergeCells('A1:I1');
      worksheet.getCell('A1').alignment = { horizontal: 'center' };
      worksheet.getCell('A1').font = { size: 16, bold: true };

      // Adicionar a data de geração
      worksheet.addRow([`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`]);

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

      // Ajustar a largura das colunas
      worksheet.columns = columns.map((col) => ({ width: col.width / 6 }));

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
   getAllItensPagos = async (_, res) => {
      try {
         const itensPagos = await estoqueModel.getItensPagos();
         res.render('tabelaSaidaEstoque', { itensPagos });
      } catch (error) {
         console.error('Erro ao carregar os itens pagos:', error);
         res.status(500).json({ error: 'Erro ao carregar os itens pagos.' });
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
         const headerData = [
            `Nº Termo: ${doc_saida}`,
            `Data: ${dataDeSaida.toLocaleDateString('pt-BR')}`,
            `Destino: ${destino.toUpperCase()}`,
            `Responsável: ${postoGrad} ${nome_do_recebedor.toUpperCase()}`,
            `MF: ${mf_recebedor}`,
            `Contato: ${tel_recebedor}`,
            `Referência: ${referencia}`,
            `Observações: ${(observacao || 'Nenhuma').toUpperCase()}`,
         ];

         headerData.forEach((line, index) => {
            doc.text(line, 14, headerYStart + index * 5);
         });

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
         let finalY = 60 + imgProps.height;
         doc.autoTable({
            startY: finalY,
            head: [['ORD.', 'TOMBO', 'DESCRIÇÃO', 'SITUAÇÃO']],
            body: items,
            styles: {
               fontSize: 8,
               halign: 'center',
               cellPadding: 1.5,
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
            margin: { left: 13, right: 7 },
            tableWidth: 'wrap',
            didDrawPage: (data) => {
               doc.rect(
                  5,
                  5,
                  doc.internal.pageSize.width - 10,
                  doc.internal.pageSize.height - 10
               );
            },
         });

         finalY = doc.lastAutoTable.finalY || finalY;

         const totalPages = doc.internal.getNumberOfPages();
         doc.setPage(totalPages);

         const pageHeight = doc.internal.pageSize.height;
         const signatureY = Math.max(finalY + 20, pageHeight - 20);
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

         console.log('Atualizando sequência...');
         await sequenciaModel.incrementarSequencia(new Date().getFullYear());

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
}

export default new EstoqueController();
