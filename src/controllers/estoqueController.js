import { jsPDF } from "jspdf";
import "jspdf-autotable";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import estoqueModel from "../models/estoqueModel.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EstoqueController {
  /* ********************************************************************************
                  Métodos para a ENTRADA de itens no Estoque
  *********************************************************************************/

  // Método para listar todo o estoque
  index = async (_, res) => {
    try {
      const estoque = await estoqueModel.getAllEstoque();
      res.status(200).json(estoque); // Retorna todos os itens do estoque como JSON
    } catch (error) {
      console.error("Erro ao carregar o estoque:", error);
      res.status(500).send("Erro ao carregar o estoque.");
    }
  };

  // Método para renderizar o formulário de cadastro de estoque
  renderEntradaForm = (_, res) => {
    res.render("cadastrarEstoque"); // Renderiza a view de cadastro de estoque
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

    console.log("Dados recebidos no controller:", req.body);

    // Verificações de campos obrigatórios
    if (!data_de_entrada) {
      console.log("Erro: A data de entrada é obrigatória.");
      return res
        .status(400)
        .json({ error: "A data de entrada é obrigatória." });
    }
    if (!quantidade || quantidade <= 0) {
      console.log("Erro: A quantidade deve ser maior que zero.");
      return res
        .status(400)
        .json({ error: "A quantidade deve ser maior que zero." });
    }
    if (!subgrupo || subgrupo === "Selecione...") {
      console.log("Erro: O subgrupo é obrigatório.");
      return res.status(400).json({ error: "O subgrupo é obrigatório." });
    }
    if (!categoria || categoria === "Escolha uma opção...") {
      console.log("Erro: A categoria é obrigatória.");
      return res.status(400).json({ error: "A categoria é obrigatória." });
    }
    if (!descricao) {
      console.log("Erro: A descrição é obrigatória.");
      return res.status(400).json({ error: "A descrição é obrigatória." });
    }
    if (!conta_contabil || conta_contabil === "Escolha uma opção...") {
      console.log("Erro: A conta contábil é obrigatória.");
      return res.status(400).json({ error: "A conta contábil é obrigatória." });
    }
    if (!estoque || estoque === "Escolha uma opção...") {
      console.log("Erro: O estoque é obrigatório.");
      return res.status(400).json({ error: "O estoque é obrigatório." });
    }
    if (!doc_origem || doc_origem === "Escolha uma opção...") {
      console.log("Erro: O Documento de Origem é obrigatório.");
      return res
        .status(400)
        .json({ error: "O Documento de Origem é obrigatório." });
    }
    if (!valor || valor === "Escolha uma opção...") {
      console.log("Erro: O valor é obrigatório.");
      return res.status(400).json({ error: "O valor é obrigatório." });
    }
    if (!situacao || situacao === "Escolha uma opção...") {
      console.log("Erro: A Situação é obrigatória.");
      return res.status(400).json({ error: "A Situação é obrigatória." });
    }

    console.log("Todos os campos obrigatórios foram preenchidos");

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

    console.log("Dados processados para inserção:", safeData);

    try {
      const ano = new Date(safeData.data_de_entrada)
        .getUTCFullYear()
        .toString();
      const ultimoTombo = await estoqueModel.getUltimoTombo(
        ano,
        safeData.subgrupo
      );
      let sequencia = (ultimoTombo + 1).toString().padStart(6, "0");
      console.log("Sequência inicial:", sequencia);

      for (let i = 0; i < safeData.quantidade; i++) {
        const tomboUnico = `37${ano}${safeData.subgrupo}${sequencia}`.substring(
          0,
          13
        ); // Garantir 13 caracteres

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

        sequencia = (parseInt(sequencia) + 1).toString().padStart(6, "0");
      }

      const todosEstoque = await estoqueModel.getAllEstoque(); // Obtém todos os itens do estoque
      res.render("tabelaEstoque", { estoque: todosEstoque }); // Renderiza a view de tabela de estoque
    } catch (error) {
      console.error("Erro ao inserir dados no estoque:", error);
      res.status(500).json({ error: "Erro ao inserir dados no estoque." });
    }
  };

  // Método para obter o último tombo de um subgrupo em um ano específico
  fetchUltimoTombo = async (req, res) => {
    const { ano, subgrupo } = req.query;

    try {
      const ultimoTombo = await estoqueModel.getUltimoTombo(ano, subgrupo);
      res.json({ ultimoTombo }); // Retorna o último tombo como JSON
    } catch (error) {
      console.error("Erro ao obter o último tombo:", error);
      res.status(500).json({ error: "Erro ao obter o último tombo" });
    }
  };

  // Método para mostrar todo o estoque atual
  getAllEstoque = async (req, res) => {
    try {
      const estoque = await estoqueModel.getAllEstoque();
      res.render("tabelaEstoque", { estoque }); // Renderiza a view de tabela de estoque com itens não pagos
    } catch (error) {
      console.error("Erro ao carregar o estoque:", error);
      res.status(500).send("Erro ao carregar o estoque.");
    }
  };

  /* ********************************************************************************
                  Métodos para a SAÍDA de itens no Estoque
  *********************************************************************************/

  // Método para Renderiza a view de SAÍDA de estoque
  renderSaidaForm = (_, res) => {
    res.render("saidaEstoque");
  };

  fetchItensDisponiveis = async (_, res) => {
    try {
      const itens = await estoqueModel.getItensDisponiveis();
      res.json(itens); // Retorna os itens disponíveis como JSON
    } catch (error) {
      console.error("Erro ao buscar itens disponíveis:", error);
      res.status(500).json({ error: "Erro ao buscar itens disponíveis." });
    }
  };

  
  // Método para registrar a saída de itens e gerar o PDF
  registrarSaida = async (req, res) => {
    console.log("FUNÇÃO REGISTRARSAIDA CHAMADA");

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

    console.log("DADOS RECEBIDOS NO CONTROLADOR:", req.body);

    // Verificações de campos obrigatórios
    if (!tombos || !tombos.length) {
      console.log("Erro: Nenhum tombo selecionado.");
      return res.status(400).json({ error: "Nenhum tombo selecionado." });
    }
    if (!doc_saida) {
      console.log("Erro: O termo de responsabilidade é obrigatório.");
      return res
        .status(400)
        .json({ error: "O termo de responsabilidade é obrigatório." });
    }
    if (!referencia) {
      console.log("Erro: A referência é obrigatória.");
      return res.status(400).json({ error: "A referência é obrigatória." });
    }
    if (!destino) {
      console.log("Erro: O destino é obrigatório.");
      return res.status(400).json({ error: "O destino é obrigatório." });
    }
    if (!postoGrad || postoGrad === "Selecione") {
      console.log("Erro: O posto/graduação é obrigatório.");
      return res
        .status(400)
        .json({ error: "O posto/graduação é obrigatório." });
    }
    if (!mf_recebedor) {
      console.log("Erro: A matrícula funcional é obrigatória.");
      return res
        .status(400)
        .json({ error: "A matrícula funcional é obrigatória." });
    }
    if (!tel_recebedor) {
      console.log("Erro: O telefone é obrigatório.");
      return res.status(400).json({ error: "O telefone é obrigatório." });
    }
    if (!nome_do_recebedor) {
      console.log("Erro: O nome do recebedor é obrigatório.");
      return res
        .status(400)
        .json({ error: "O nome do recebedor é obrigatório." });
    }

    console.log("Todos os campos obrigatórios foram preenchidos");

    try {
      console.log("Registrando saída e marcando itens como 'saído'...");
      await estoqueModel.markItensAsOut(tombos); // Marca os itens como "saído"

      // Criar documento PDF
      const doc = new jsPDF();
      doc.setFont("helvetica"); // Usar fonte com suporte UTF-8

      const dataDeSaida = new Date();
      const dataFormatada = dataDeSaida.toLocaleString("pt-BR", {
        timeZone: "America/Fortaleza",
      });

      const header = [["Ord.", "Tombo", "Descricao"]];

      const rows = [];

      for (let i = 0; i < tombos.length; i++) {
        const tombo = tombos[i];
        const itemEstoque = await estoqueModel.getItemByTombo(tombo);
        await estoqueModel.createSaida(
          itemEstoque.id,
          doc_saida,
          dataDeSaida,
          1, // Supondo que a quantidade é sempre 1
          referencia,
          destino,
          postoGrad,
          mf_recebedor,
          tel_recebedor,
          nome_do_recebedor,
          observacao
        );

        rows.push([
          (i + 1).toString(),
          tombo,
          itemEstoque.descricao.toUpperCase(),
        ]);
      }

      // Ajuste do título centralizado
      doc.setFontSize(18);
      doc.text("Termo de Entrega", 105, 15, { align: "center" });
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
      doc.text("Itens entregues", 105, 90, { align: "center" });

      doc.autoTable({
        startY: 95,
        head: header,
        body: rows,
        styles: { fontSize: 8, halign: "center" },
        headStyles: { fillColor: [53, 110, 0] },
        footStyles: { fillColor: [20, 128, 185] },
        theme: "grid",
        columnStyles: {
          0: { cellWidth: 10 }, // Largura da coluna "Ord."
          1: { cellWidth: 30 }, // Largura da coluna "Tombo"
          2: { cellWidth: "auto" }, // Largura da coluna "Descricao" ajustada automaticamente
        },
      });

      const pdfPath = path.join(__dirname, "../../pdfs/saida_estoque.pdf");
      fs.writeFileSync(pdfPath, doc.output());

      console.log("SAÍDA REGISTRADA COM SUCESSO.");
      res
        .status(200)
        .json({
          message: "SAÍDA REGISTRADA COM SUCESSO!",
          pdfPath: `/pdfs/saida_estoque.pdf`,
        });
    } catch (error) {
      console.error("Erro ao registrar saída:", error);
      res.status(500).json({ error: "Erro ao registrar saída." });
    }
  };

  markItensAsOut = async (tombos) => {
    const query = `UPDATE estoqueAtual SET pago = TRUE WHERE tombo IN (${tombos
      .map(() => "?")
      .join(", ")})`;
    try {
      await connection.execute(query, tombos);
    } catch (error) {
      console.error("Erro ao marcar itens como saído:", error);
      throw error;
    }
  };
}

export default new EstoqueController();
