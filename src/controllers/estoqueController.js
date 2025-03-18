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
         res.status(200).render('tabelaEstoque', { estoque });
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
      const {
         data_de_entrada,
         descricao,
         quantidade,
         categoria,
         conta_contabil,
         doc_origem,
         estoque,
         valor,
         situacao,
         observacao,
      } = req.body;

      // Verificações de campos obrigatórios
      if (!data_de_entrada) {
         console.log('Erro: A data de entrada é obrigatória.');
         return res
            .status(400)
            .json({ error: 'A data de entrada é obrigatória.' });
      }
      if (!quantidade || quantidade <= 0) {
         console.log('Erro: A quantidade deve ser maior que zero.');
         return res
            .status(400)
            .json({ error: 'A quantidade deve ser maior que zero.' });
      }
      if (!categoria || categoria === 'Selecione...') {
         console.log('Erro: A categoria é obrigatória.');
         return res.status(400).json({ error: 'A categoria é obrigatória.' });
      }
      if (!descricao) {
         console.log('Erro: A descrição é obrigatória.');
         return res.status(400).json({ error: 'A descrição é obrigatória.' });
      }
      if (!conta_contabil || conta_contabil === 'Escolha uma opção...') {
         console.log('Erro: A conta contábil é obrigatória.');
         return res
            .status(400)
            .json({ error: 'A conta contábil é obrigatória.' });
      }
      if (!estoque || estoque === 'Escolha uma opção...') {
         console.log('Erro: O estoque é obrigatório.');
         return res.status(400).json({ error: 'O estoque é obrigatório.' });
      }
      if (!doc_origem) {
         console.log('Erro: O Documento de Origem é obrigatória.');
         return res
            .status(400)
            .json({ error: 'O Documento de Origem é obrigatória.' });
      }
      if (!valor || valor <= 0) {
         console.log('Erro: O valor é obrigatório e deve ser maior que zero.');
         return res.status(400).json({
            error: 'O valor é obrigatório e deve ser maior que zero.',
         });
      }
      if (!situacao || situacao === 'Escolha uma opção...') {
         console.log('Erro: A Situação é obrigatória.');
         return res.status(400).json({ error: 'A Situação é obrigatória.' });
      }

      const safeData = {
         data_de_entrada: data_de_entrada || null,
         descricao: descricao ? descricao.toUpperCase() : null,
         quantidade: quantidade || null,
         categoria: categoria ? categoria.toUpperCase() : null,
         conta_contabil: conta_contabil ? conta_contabil.toUpperCase() : null,
         doc_origem: doc_origem ? doc_origem.toUpperCase() : null,
         estoque: estoque ? estoque.toUpperCase() : null,
         valor: valor || null,
         situacao: situacao ? situacao.toUpperCase() : null,
         observacao: observacao ? observacao.toUpperCase() : null,
      };

      try {
         const ultimoTombo = await estoqueModel.getUltimoTombo();
         console.log('Tombo inicial antes do incremento:', ultimoTombo);
         let tomboInicial = ultimoTombo;

         for (let i = 0; i < safeData.quantidade; i++) {
            const tomboUnico = tomboInicial + i + 1;
            console.log('Tombo gerado:', tomboUnico);

            await estoqueModel.createEstoque(
               safeData.data_de_entrada,
               safeData.descricao,
               tomboUnico,
               1,
               safeData.categoria,
               safeData.conta_contabil,
               safeData.doc_origem,
               safeData.estoque,
               safeData.valor,
               safeData.situacao,
               safeData.observacao
            );
         }

         const todosEstoque = await estoqueModel.getAllEstoque();
         res.status(200).render('tabelaEstoque', { estoque: todosEstoque });
      } catch (error) {
         console.error(
            'Erro ao inserir dados no estoque:',
            error.message,
            error.stack
         );
         res.status(500).json({
            error: `Erro ao inserir dados no estoque: ${error.message}`,
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
         if (item) {
            res.json(item);
         } else {
            res.status(404).json({
               msg: 'Item não encontrado',
            });
         }
      } catch (error) {
         console.error('Erro ao buscar informações do item:', error);
         res.status(500).json({
            msg: 'Erro ao buscar informações do item',
            details: error.message,
         });
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

   // Método para Gerar PDF da Tabela Geral
   generatePDF = async (req, res) => {
      try {
         const estoque = await estoqueModel.getAllEstoque();
         this._generatePDF(res, estoque, 'Relatório de Estoque Geral');
      } catch (error) {
         console.error('Erro ao gerar PDF:', error);
         res.status(500).json({ error: 'Erro ao gerar relatório em PDF' });
      }
   };

   // Método para Gerar PDF de Itens Novos
   generatePDFNovos = async (req, res) => {
      try {
         const novos = await estoqueModel.getAllItensNovos();
         this._generatePDF(res, novos, 'Relatório de Itens Novos');
      } catch (error) {
         console.error('Erro ao gerar PDF:', error);
         res.status(500).json({ error: 'Erro ao gerar relatório em PDF' });
      }
   };

   // Método para Gerar PDF de Itens Usados
   generatePDFUsados = async (req, res) => {
      try {
         const usados = await estoqueModel.getAllItensUsados();
         this._generatePDF(res, usados, 'Relatório de Itens Usados');
      } catch (error) {
         console.error('Erro ao gerar PDF:', error);
         res.status(500).json({ error: 'Erro ao gerar relatório em PDF' });
      }
   };

   // Método privado para geração do PDF
   _generatePDF = (res, data, title) => {
      try {
         const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
         });
   
         const columns = [
            { header: 'ID', dataKey: 'id', width: 12 },
            { header: 'Entrada', dataKey: 'data_entrada', width: 20 },
            { header: 'Descrição', dataKey: 'descricao', width: 80 },
            { header: 'Tombo', dataKey: 'tombo', width: 20 },
            { header: 'Categoria', dataKey: 'categoria', width: 35 },
            { header: 'Estoque', dataKey: 'estoque', width: 30 },
            { header: 'Situação', dataKey: 'situacao', width: 30 },
            { header: 'Valor', dataKey: 'valor', width: 30 },
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
               ? parseFloat(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
               : 'N/A',
            doc_origem: item.doc_origem ? item.doc_origem.toUpperCase() : 'N/A',
         }));
   
         doc.setFontSize(16);
         doc.text(title, 10, 15);
         doc.setFontSize(10);
         doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 10, 22);
   
         doc.autoTable({
            startY: 30,
            margin: { left: 5, right: 5 }, // Margens reduzidas para 5mm
            head: [columns.map((col) => col.header)],
            body: rows.map((row) => columns.map((col) => row[col.dataKey])),
            styles: {
               fontSize: 8,
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
         });
   
         const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
         res.setHeader('Content-Type', 'application/pdf');
         res.setHeader(
            'Content-Disposition',
            `attachment; filename=${title.replace(/ /g, '_')}.pdf`
         );
         res.send(pdfBuffer);
      } catch (error) {
         console.error('Erro na geração do PDF:', error);
         res.status(500).json({ error: 'Erro interno na geração do PDF' });
      }
   };

   // Método para Gerar PDF de Itens Pagos
   generatePDFItensPagos = async (req, res) => {
      try {
         const itensPagos = await estoqueModel.getItensPagosForPDF();
         this._generatePDFItensPagos(res, itensPagos, 'Relatório de Itens Pagos');
      } catch (error) {
         console.error('Erro ao gerar PDF:', error);
         res.status(500).json({ error: 'Erro ao gerar relatório em PDF' });
      }
   };

   // Método privado para geração do PDF de Itens Pagos
   _generatePDFItensPagos = (res, data, title) => {
      try {
         const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
         });

         const columns = [
            { header: 'ID', dataKey: 'id', width: 10 }, // Diminuída de 15mm para 10mm
            { header: 'Saída', dataKey: 'data_de_saida', width: 20 }, // Diminuída de 25mm para 20mm
            { header: 'Descrição', dataKey: 'descricao', width: 65 }, // Ajustada para equilibrar
            { header: 'Tombo', dataKey: 'tombo_estoqueatual', width: 25 },
            { header: 'Destino', dataKey: 'destino', width: 30 },
            { header: 'NUP (Suite)', dataKey: 'referencia', width: 50 }, // Aumentada de 35mm para 50mm
            { header: 'Doc Saída', dataKey: 'doc_saida', width: 25 },
            { header: 'Doc Origem', dataKey: 'doc_origem', width: 30 },
            { header: 'Valor', dataKey: 'valor', width: 22 },
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
               ? parseFloat(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
               : 'N/A',
         }));

         doc.setFontSize(16);
         doc.text(title, 10, 15);
         doc.setFontSize(10);
         doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 10, 22);

         doc.autoTable({
            startY: 30,
            margin: { left: 10, right: 10 },
            head: [columns.map((col) => col.header)],
            body: rows.map((row) => columns.map((col) => row[col.dataKey])),
            styles: {
               fontSize: 8,
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
         });

         const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
         res.setHeader('Content-Type', 'application/pdf');
         res.setHeader(
            'Content-Disposition',
            `attachment; filename=${title.replace(/ /g, '_')}.pdf`
         );
         res.send(pdfBuffer);
      } catch (error) {
         console.error('Erro na geração do PDF:', error);
         res.status(500).json({ error: 'Erro interno na geração do PDF' });
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
   async registrarSaida(req, res) {
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

         const dataDeSaida = new Date();
         const doc = new jsPDF();

         console.log('Iniciando geração do PDF...');
         // Borda externa em todas as páginas (5mm de margem)
         doc.setDrawColor(0);
         doc.setLineWidth(0.5);
         doc.rect(
            5,
            5,
            doc.internal.pageSize.width - 10,
            doc.internal.pageSize.height - 10
         );

         // Cabeçalho
         doc.setFontSize(11);
         doc.text('TERMO DE RECEBIMENTO E RESPONSABILIDADE - CEGPA/COLOG', 105, 20, {
            align: 'center',
         });
         doc.setFontSize(10);

         // Informações do termo
         const headerYStart = 30;
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

         // Tabela de itens
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
            return res.status(400).json({ error: 'Nenhum item válido encontrado para gerar o termo.' });
         }

         // Configuração da tabela e assinaturas
         doc.autoTable({
            startY: 70,
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
               // Redesenha borda para páginas subsequentes
               doc.rect(
                  5,
                  5,
                  doc.internal.pageSize.width - 10,
                  doc.internal.pageSize.height - 10
               );

               const pageHeight = doc.internal.pageSize.height;
               const pageWidth = doc.internal.pageSize.width;

               // Assinaturas 30mm da borda inferior
               const signatureY = pageHeight - 25;
               const lineMargin = 15;
               const lineLength = 80;

               // Linhas de assinatura
               doc.setLineWidth(0.5);

               // Recebedor (esquerda)
               doc.line(
                  lineMargin,
                  signatureY,
                  lineMargin + lineLength,
                  signatureY
               );

               // Responsável (direita)
               doc.line(
                  pageWidth - lineMargin - lineLength,
                  signatureY,
                  pageWidth - lineMargin,
                  signatureY
               );

               // Textos centralizados
               doc.setFontSize(9);

               // Recebedor
               doc.text(
                  `${nome_do_recebedor.toUpperCase()}\nMF: ${mf_recebedor}`,
                  lineMargin + lineLength / 2,
                  signatureY + 5,
                  { align: 'center' }
               );
               doc.text(
                  '(Recebedor)',
                  lineMargin + lineLength / 2,
                  signatureY + 12,
                  { align: 'center', fontSize: 8 }
               );

               // Responsável
               doc.text(
                  'Cap. Ewandro Sales\nMF: 301.125-34',
                  pageWidth - lineMargin - lineLength / 2,
                  signatureY + 5,
                  { align: 'center' }
               );
               doc.text(
                  '(Responsável pela entrega)',
                  pageWidth - lineMargin - lineLength / 2,
                  signatureY + 12,
                  { align: 'center', fontSize: 8 }
               );
            },
         });

         console.log('Salvando PDF...');
         // Salvar PDF
         const fileName = `Termo_${doc_saida.replace(/\//g, '-')}.pdf`;
         const pdfPath = path.join(__dirname, '../../pdfs', fileName);

         if (!fs.existsSync(path.dirname(pdfPath))) {
            fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
         }

         doc.save(pdfPath);

         console.log('Atualizando sequência...');
         // Atualizar sequência
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
   }

   // Método para visualizar um item pago específico
   visualizarItemPago = async (req, res) => {
      const { id } = req.params;
      try {
         const item = await estoqueModel.getItemPagoDetalhes(id);
         console.log('Item retornado:', item); // Adicione este log para inspecionar
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
            // Buscar informações de saída, se existirem
            const infoSaida = await estoqueModel.getSaidaByEstoqueatualId(infoTombo.id);
            res.json({ infoTombo, infoSaida });
         } else {
            console.log(`Tombo ${tombo} não encontrado.`);
            res.json({ infoTombo: null, infoSaida: null });
         }
      } catch (error) {
         console.error('Erro ao buscar informações do tombo:', error);
         res.status(500).json({ error: 'Erro ao buscar informações do tombo.' });
      }
   };
}

export default new EstoqueController();