import fs from 'fs';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import path from 'path';
import { fileURLToPath } from 'url';
import estoqueModel from '../models/estoqueModel.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EstoqueController {
   /* ********************************************************************************
                  Métodos para a ENTRADA de itens no Estoque
  *********************************************************************************/

   // Método para renderizar a tabela com os itens novos
   showItensNovos = async (_req, res) => {
      try {
         const itensNovos = await estoqueModel.getAllItensNovos(); // Obtém os itens novos
         res.render('tabelaItensNovos', { novos: itensNovos }); // Passa os itens novos para o template
      } catch (error) {
         console.error('Erro ao carregar os itens novos:', error);
         res.status(500).send('Erro ao carregar os itens novos.');
      }
   };

   // Método para listar todos os itens NOVOS no estoque
   getItensNovos = async (req, res) => {
      try {
         const itensNovos = await estoqueModel.getAllItensNovos(); // Obtém os itens novos
         res.status(200).render('tabelaItensNovos', {
            novos: itensNovos,
         }); // Renderiza a tabela dos itens novos
      } catch (error) {
         console.error('Erro ao carregar o estoque:', error);
         res.status(500).send('Erro ao carregar o estoque.');
      }
   };

   // Método para renderizar a tabela com os itens Usados
   showItensUsados = async (_req, res) => {
      try {
         const itensUsados = await estoqueModel.getAllItensUsados(); // Obtém os itens Usados
         res.render('tabelaItensUsados', {
            usados: itensUsados,
         }); // Passa os itens Usados para o template
      } catch (error) {
         console.error('Erro ao carregar os itens Usados:', error);
         res.status(500).send('Erro ao carregar os itens Usados.');
      }
   };

   // Método para listar todos os itens Usados no estoque
   getItensUsados = async (req, res) => {
      try {
         const itensUsados = await estoqueModel.getAllItensUsados(); // Obtém os itens Usados
         res.status(200).render('tabelaItensUsados', {
            usados: itensUsados,
         }); // Renderiza a tabela dos itens Usados
      } catch (error) {
         console.error('Erro ao carregar o estoque:', error);
         res.status(500).send('Erro ao carregar o estoque.');
      }
   };

   // Método para renderizar o formulário de cadastro de estoque
   renderEntradaForm = (_, res) => {
      res.render('cadastrarEstoque'); // Renderiza a view de cadastro de estoque
   };

   // Método para criar um novo item no estoque
   create = async (req, res) => {
      const {
         data_de_entrada,
         descricao,
         quantidade,
         subgrupo,
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
         return res.status(400).json({
            error: 'A data de entrada é obrigatória.',
         });
      }
      if (!quantidade || quantidade <= 0) {
         console.log('Erro: A quantidade deve ser maior que zero.');
         return res.status(400).json({
            error: 'A quantidade deve ser maior que zero.',
         });
      }
      if (!subgrupo || subgrupo === 'Selecione...') {
         console.log('Erro: O subgrupo é obrigatório.');
         return res.status(400).json({ error: 'O subgrupo é obrigatório.' });
      }
      if (!categoria || categoria === 'Escolha uma opção...') {
         console.log('Erro: A categoria é obrigatória.');
         return res.status(400).json({ error: 'A categoria é obrigatória.' });
      }
      if (!descricao) {
         console.log('Erro: A descrição é obrigatória.');
         return res.status(400).json({ error: 'A descrição é obrigatória.' });
      }
      if (!conta_contabil || conta_contabil === 'Escolha uma opção...') {
         console.log('Erro: A conta contábil é obrigatória.');
         return res.status(400).json({
            error: 'A conta contábil é obrigatória.',
         });
      }
      if (!estoque || estoque === 'Escolha uma opção...') {
         console.log('Erro: O estoque é obrigatório.');
         return res.status(400).json({ error: 'O estoque é obrigatório.' });
      }
      if (!doc_origem || doc_origem === 'Escolha uma opção...') {
         console.log('Erro: O Documento de Origem é obrigatório.');
         return res.status(400).json({
            error: 'O Documento de Origem é obrigatório.',
         });
      }
      if (!valor || valor === 'Escolha uma opção...') {
         console.log('Erro: O valor é obrigatório.');
         return res.status(400).json({ error: 'O valor é obrigatório.' });
      }
      if (!situacao || situacao === 'Escolha uma opção...') {
         console.log('Erro: A Situação é obrigatória.');
         return res.status(400).json({ error: 'A Situação é obrigatória.' });
      }

      const safeData = {
         data_de_entrada: data_de_entrada || null,
         descricao: descricao ? descricao.toUpperCase() : null,
         quantidade: quantidade || null,
         subgrupo: subgrupo ? subgrupo.toUpperCase() : null,
         categoria: categoria ? categoria.toUpperCase() : null,
         conta_contabil: conta_contabil ? conta_contabil.toUpperCase() : null,
         doc_origem: doc_origem ? doc_origem.toUpperCase() : null,
         estoque: estoque ? estoque.toUpperCase() : null,
         valor: valor || null,
         situacao: situacao ? situacao.toUpperCase() : null,
         observacao: observacao ? observacao.toUpperCase() : null,
      };

      try {
         const ano = new Date(safeData.data_de_entrada)
            .getUTCFullYear()
            .toString();
         const ultimoTombo = await estoqueModel.getUltimoTombo(
            ano,
            safeData.subgrupo
         );
         let sequencia = (ultimoTombo + 1).toString().padStart(6, '0');
         console.log('Sequência inicial:', sequencia);

         for (let i = 0; i < safeData.quantidade; i++) {
            const tomboUnico =
               `37${ano}${safeData.subgrupo}${sequencia}`.substring(0, 13); // Garantir 13 caracteres

            await estoqueModel.createEstoque(
               safeData.data_de_entrada,
               safeData.descricao,
               tomboUnico,
               1,
               safeData.subgrupo,
               safeData.categoria,
               safeData.conta_contabil,
               safeData.doc_origem,
               safeData.estoque,
               safeData.valor,
               safeData.situacao,
               safeData.observacao
            );

            sequencia = (parseInt(sequencia) + 1).toString().padStart(6, '0');
         }

         const todosEstoque = await estoqueModel.getAllEstoque(); // Obtém todos os itens do estoque
         res.status(200).render('tabelaEstoque', {
            estoque: todosEstoque,
         }); // Renderiza a view de tabela de estoque
         console.log(todosEstoque);
      } catch (error) {
         console.error('Erro ao inserir dados no estoque:', error);
         res.status(500).json({
            error: 'Erro ao inserir dados no estoque.',
         });
      }
   };

   // Método para obter o último tombo de um subgrupo em um ano específico
   fetchUltimoTombo = async (req, res) => {
      const { ano, subgrupo } = req.query;

      try {
         const ultimoTombo = await estoqueModel.getUltimoTombo(ano, subgrupo);
         res.json({ ultimoTombo }); // Retorna o último tombo como JSON
      } catch (error) {
         console.error('Erro ao obter o último tombo:', error);
         res.status(500).json({
            error: 'Erro ao obter o último tombo',
         });
      }
   };

   // Método para trazer toso os itens do estoque
   getAllEstoque = async (req, res) => {
      try {
         const estoque = await estoqueModel.getAllEstoque();
         res.render('tabelaEstoque', { estoque });
      } catch (error) {
         console.error('Erro ao carregar o estoque:', error);
         res.status(500).send('Erro ao carregar o estoque.');
      }
   };

   // Método para vizuaçizar um item
   visualizarItem = async (req, res) => {
      try {
         const { id } = req.params;
         const item = await estoqueModel.getInfoByID(id);
         if (item) {
            res.json(item); // Retorne JSON
         } else {
            res.status(404).send({
               msg: 'Item não encontrado',
            });
         }
      } catch (error) {
         console.error('Erro ao buscar informações do item:', error);
         res.status(500).send({
            msg: 'Erro ao buscar informações do item',
         });
      }
   };

   // Método para mostrar quantidade de itens únicos no estoque
   getQtdeUnicaEstoque = async (_, res) => {
      try {
         const estoque = await estoqueModel.getQtdeUnicaEstoque();
         res.render('qtde_disponivel_por_item', { estoque }); // Renderiza a view com a quantidade de itens únicos
      } catch (error) {
         console.error(
            'Erro ao carregar quantidade única de itens no estoque:',
            error
         );
         res.status(500).send(
            'Erro ao carregar quantidade única de itens no estoque.'
         );
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
         return res.status(500).json({ msg: 'Erro ao excluir o item' });
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
      res.render('tabelaSaidaEstoque', { itensPagos: [] }); // Render padrão com valor vazio
   };

   // Método para mostrar todos os itens pagos
   getAllItensPagos = async (_, res) => {
      try {
         const itensPagos = await estoqueModel.getItensPagos();
         for (const item of itensPagos) {
            const detalhes = await estoqueModel.getItemPagoDetalhes(item.id);
            item.tombo_estoqueatual = detalhes
               ? detalhes.tombo_estoqueatual
               : null;
         }
         res.render('tabelaSaidaEstoque', { itensPagos });
      } catch (error) {
         console.error('Erro ao carregar o estoque:', error);
         res.status(500).send('Erro ao carregar os itens pagos.');
      }
   };

   // Método para mostrar os itens que foram pagos na tabela
   fetchItensDisponiveis = async (_, res) => {
      try {
         const itens = await estoqueModel.getItensDisponiveis();
         res.json(itens); // Retorna os itens disponíveis como JSON
      } catch (error) {
         console.error('Erro ao buscar itens disponíveis:', error);
         res.status(500).json({
            error: 'Erro ao buscar itens disponíveis.',
         });
      }
   };

   // Método para registrar a saída de itens e gerar o PDF
   registrarSaida = async (req, res) => {
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

      // Verificações de campos obrigatórios
      if (!tombos || !tombos.length) {
         console.log('Erro: Nenhum tombo selecionado.');
         return res.status(400).json({ error: 'Nenhum tombo selecionado.' });
      }
      if (!doc_saida) {
         console.log('Erro: O termo de responsabilidade é obrigatório.');
         return res.status(400).json({
            error: 'O termo de responsabilidade é obrigatório.',
         });
      }
      if (!referencia) {
         console.log('Erro: A referência é obrigatória.');
         return res.status(400).json({ error: 'A referência é obrigatória.' });
      }
      if (!destino) {
         console.log('Erro: O destino é obrigatório.');
         return res.status(400).json({ error: 'O destino é obrigatório.' });
      }
      if (!postoGrad || postoGrad === 'Selecione') {
         console.log('Erro: O posto/graduação é obrigatório.');
         return res.status(400).json({
            error: 'O posto/graduação é obrigatório.',
         });
      }
      if (!mf_recebedor) {
         console.log('Erro: A matrícula funcional é obrigatória.');
         return res.status(400).json({
            error: 'A matrícula funcional é obrigatória.',
         });
      }
      if (!tel_recebedor) {
         console.log('Erro: O telefone é obrigatório.');
         return res.status(400).json({ error: 'O telefone é obrigatório.' });
      }
      if (!nome_do_recebedor) {
         console.log('Erro: O nome do recebedor é obrigatório.');
         return res.status(400).json({
            error: 'O nome do recebedor é obrigatório.',
         });
      }

      try {
         const dataDeSaida = new Date();
         const dataFormatada = dataDeSaida.toLocaleString('pt-BR', {
            timeZone: 'America/Fortaleza',
         });

         // Definindo a variável doc para criar o PDF
         const doc = new jsPDF();
         doc.setFont('helvetica');
         const header = [['Ord.', 'Tombo', 'Descricao', 'Situacao']];

         const rows = [];

         for (let i = 0; i < tombos.length; i++) {
            const tombo = tombos[i];
            const itemEstoque = await estoqueModel.getItemByTombo(tombo);
            console.log('Item obtido do estoque:', itemEstoque);

            const saidaId = await estoqueModel.createSaida(
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

            console.log('ID da saída registrada:', saidaId);

            // Atualiza a coluna "pago" na tabela estoqueatual
            await estoqueModel.markAsPaid(itemEstoque.id);

            rows.push([
               (i + 1).toString(),
               tombo,
               itemEstoque.descricao.toUpperCase(),
               itemEstoque.situacao.toUpperCase(), // Obtém a situação do item do banco de dados
            ]);
         }

         doc.setFontSize(18);
         doc.text('Termo de Entrega', 105, 15, {
            align: 'center',
         });
         doc.setFontSize(12);
         doc.text(`Termo de Responsabilidade: ${doc_saida}`, 14, 25);
         doc.text(`Referencia: ${referencia}`, 14, 32);
         doc.text(`Destino: ${destino}`, 14, 39);
         doc.text(`Posto/Graduacao: ${postoGrad}`, 14, 46);
         doc.text(`Mat. Funcional: ${mf_recebedor}`, 14, 53);
         doc.text(`Telefone: ${tel_recebedor}`, 14, 60);
         doc.text(`Nome do Recebedor: ${nome_do_recebedor}`, 14, 67);
         doc.text(`Data da Saida: ${dataFormatada}`, 14, 74);
         doc.text(`Observacao: ${observacao}`, 14, 81);
         doc.setFontSize(14);
         doc.text('Itens entregues', 105, 90, {
            align: 'center',
         });

         doc.autoTable({
            startY: 95,
            head: header,
            body: rows,
            styles: { fontSize: 8, halign: 'center' },
            headStyles: { fillColor: [53, 110, 0] },
            footStyles: { fillColor: [20, 128, 185] },
            theme: 'grid',
            columnStyles: {
               0: { cellWidth: 10 }, // Largura da coluna "Ord."
               1: { cellWidth: 30 }, // Largura da coluna "Tombo"
               2: { cellWidth: 'auto' }, // Largura da coluna "Descricao" ajustada automaticamente
               3: { cellWidth: 30 }, // Largura da coluna "Situacao"
            },
         });

         const pdfPath = path.join(
            __dirname,
            '../../pdfs/termo_de_entrega.pdf'
         );
         fs.writeFileSync(pdfPath, doc.output());

         console.log('SAÍDA REGISTRADA COM SUCESSO.');
         res.status(200).json({
            message: 'SAÍDA REGISTRADA COM SUCESSO!',
            pdfPath: `/pdfs/termo_de_entrega.pdf`,
         });
      } catch (error) {
         console.error('Erro ao registrar saída:', error);
         res.status(500).json({
            error: 'Erro ao registrar saída.',
         });
      }
   };

   // Método para visualizar um item pago específico
   visualizarItemPago = async (req, res) => {
      const { id } = req.params;
      try {
         const item = await estoqueModel.getItemPagoDetalhes(id);
         res.json(item);
      } catch (error) {
         console.error('Erro ao buscar item pago pelo ID:', error);
         res.status(500).send('Erro ao buscar item pago.');
      }
   };
}

export default new EstoqueController();
