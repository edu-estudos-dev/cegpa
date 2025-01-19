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

      const dataDeSaida = new Date();
      const dataFormatada = dataDeSaida.toLocaleString("pt-BR", {
        timeZone: "America/Fortaleza",
      });

      // Definindo a variável doc para criar o PDF
      const doc = new jsPDF();
      doc.setFont("helvetica"); // Usar fonte com suporte UTF-8

      const header = [["Ord.", "Tombo", "Descricao"]];

      const rows = [];

      for (let i = 0; i < tombos.length; i++) {
        const tombo = tombos[i];
        const itemEstoque = await estoqueModel.getItemByTombo(tombo);
        console.log("Item obtido do estoque:", itemEstoque);

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
          observacao,
          itemEstoque.descricao // Passa a descrição do item ao criar a saída
        );

        // Atualiza a coluna "pago" na tabela estoqueatual
        await estoqueModel.markAsPaid(itemEstoque.id);

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
      res.status(200).json({
        message: "SAÍDA REGISTRADA COM SUCESSO!",
        pdfPath: `/pdfs/saida_estoque.pdf`,
      });
    } catch (error) {
      console.error("Erro ao registrar saída:", error);
      res.status(500).json({ error: "Erro ao registrar saída." });
    }
  };

  /* ********************************************************************************
                  Métodos para a Pesquisa
  *********************************************************************************/

  // Método para buscar a quantidade de itens saídos em um determinado ano
  fetchItensSaidosPorAno = async (req, res) => {
    const { qtd_itens_sairam } = req.query;
    console.log(
      "Quantidade de itens saídos recebida na requisição:",
      qtd_itens_sairam
    );

    if (!qtd_itens_sairam) {
      console.error("Quantidade de itens saídos não fornecida na requisição.");
      return res
        .status(400)
        .json({ error: "Quantidade de itens saídos não fornecida." });
    }

    try {
      const quantidadeSaidos = await estoqueModel.getItensSaidosPorAno(
        qtd_itens_sairam
      );
      console.log(
        "Quantidade de itens que saíram no ano",
        qtd_itens_sairam,
        ":",
        quantidadeSaidos
      );
      res.json({ quantidadeSaidos }); // Retorna a quantidade de itens que saíram como JSON
    } catch (error) {
      console.error("Erro ao buscar itens saídos por ano:", error);
      res.status(500).json({ error: "Erro ao buscar itens saídos por ano." });
    }
  };

  // Método para buscar a quantidade de itens entrada em um determinado ano
  fetchItensEntradaPorAno = async (req, res) => {
    const { qtd_itens_entraram } = req.query;
    console.log(
      "Quantidade de itens de entrada recebida na requisição:",
      qtd_itens_entraram
    );

    if (!qtd_itens_entraram) {
      console.error(
        "Quantidade de itens de entrada não fornecida na requisição."
      );
      return res
        .status(400)
        .json({ error: "Quantidade de itens de entrada não fornecida." });
    }

    try {
      const quantidadeEntraram = await estoqueModel.getItensEntradaPorAno(
        qtd_itens_entraram
      );
      console.log(
        "Quantidade de itens que entraram no ano",
        qtd_itens_entraram,
        ":",
        quantidadeEntraram
      );
      res.json({ quantidadeEntraram }); // Retorna a quantidade de itens que entraram como JSON
    } catch (error) {
      console.error("Erro ao buscar itens entraram por ano:", error);
      res.status(500).json({ error: "Erro ao buscar itens entraram por ano." });
    }
  };

  // Método para renderizar o formulário de pesquisa de itens saídos
  renderPesquisaForm = (_, res) => {
    res.render("pesquisaItensSaidos");
  };

  // Método para obter o relatório de entradas
  fetchRelatorioEntradas = async (_, res) => {
    try {
      const relatorio = await estoqueModel.getRelatorioEntradas();
      res.json(relatorio);
    } catch (error) {
      console.error("Erro ao buscar relatório de entradas:", error);
      res.status(500).json({ error: "Erro ao buscar relatório de entradas." });
    }
  };

  // Método para obter o relatório de saídas
  fetchRelatorioSaidas = async (_, res) => {
    try {
      const relatorio = await estoqueModel.getRelatorioSaidas();
      res.json(relatorio);
    } catch (error) {
      console.error("Erro ao buscar relatório de saídas:", error);
      res.status(500).json({ error: "Erro ao buscar relatório de saídas." });
    }
  };

  // Método para obter o histórico de movimentação
  async fetchHistoricoMovimentacao(_, res) {
    console.log("Iniciando fetchHistoricoMovimentacao");
    try {
      const movimentacaoBruta = await estoqueModel.getMovimentacaoBruta();
      console.log("Movimentação bruta obtida:", movimentacaoBruta);

      const consolidado = {};

      movimentacaoBruta.forEach((item) => {
        const dataAjustada = new Date(item.data);
        dataAjustada.setDate(dataAjustada.getDate() + 1);

        const key = `${item.tipo}_${dataAjustada.toISOString().split("T")[0]}_${
          item.descricao
        }`;
        if (!consolidado[key]) {
          consolidado[key] = {
            tipo: item.tipo,
            data: dataAjustada.toISOString().split("T")[0],
            descricao: item.descricao,
            quantidade: 0,
            dataOriginal: dataAjustada.toISOString().split("T")[0],
          };
        }
        consolidado[key].quantidade += item.quantidade;
      });

      const historico = Object.values(consolidado);

      console.log("Histórico final:", historico);
      res.json(historico);
    } catch (error) {
      console.error("Erro ao buscar histórico de movimentação:", error);
      res
        .status(500)
        .json({ error: "Erro ao buscar histórico de movimentação." });
    }
  }

  // Método para renderizar a página de relatórios
  renderRelatorios = (_, res) => {
    res.render("relatorios");
  };

  // Método para renderizar a página de histórico de movimentação
  renderHistoricoMovimentacao = (_, res) => {
    res.render("historicoMovimentacao");
  };

  // Método para pesquisa avançada no estoque, incluindo itens saídos por ano
  pesquisaAvancada = async (req, res) => {
    const filtros = req.query;
    console.log("Filtros recebidos na requisição:", filtros);

    try {
      const { resultados, quantidadeSaidos } =
        await estoqueModel.pesquisaAvancada(filtros);
      console.log("Resultados da pesquisa avançada:", resultados);
      console.log("Quantidade de itens saídos:", quantidadeSaidos);

      const quantidadeEntraram = await estoqueModel.getItensEntradaPorAno(
        filtros.qtd_itens_entraram
      );
      console.log("Quantidade de itens que entraram:", quantidadeEntraram);

      const quantidadeSaidosAno = await estoqueModel.getItensSaidosPorAno(
        filtros.qtd_itens_sairam
      );
      console.log("Quantidade de itens que saíram:", quantidadeSaidosAno);

      res.json({
        resultados,
        quantidadeSaidos,
        quantidadeEntraram,
        quantidadeSaidosAno,
      });
    } catch (error) {
      console.error("Erro na pesquisa avançada:", error);
      res.status(500).json({ error: "Erro na pesquisa avançada." });
    }
  };

  // Método para renderizar a página de pesquisa avançada
  renderPesquisaAvancada = (_, res) => {
    res.render("pesquisaAvancada");
  };

  // Método para buscar informações de saída do tombo
  getSaidaPorTombo = async (tombo) => {
    const query = `
    SELECT
      data_de_saida, doc_saida, referencia, destino, posto_graduacao,
      mat_funcional, telefone, nome_completo, observacao AS observacao_saida
    FROM itenspagos
    WHERE tombo = ?
  `;
    console.log(
      "Executando query para obter informações de saída do tombo:",
      tombo
    );

    try {
      const [results] = await connection.execute(query, [tombo]);
      console.log("Resultados da query de saída:", results);
      if (results.length === 0) {
        return null;
      }
      return results[0];
    } catch (error) {
      console.error("Erro ao buscar informações de saída do tombo:", error);
      throw error;
    }
  };

  // Método para buscar e exibir informações do tombo com logs adicionais
  fetchInfoPorTombo = async (req, res) => {
    const { tombo } = req.query;
    console.log("Tombo recebido na requisição:", tombo);

    if (!tombo) {
      console.error("Tombo não fornecido na requisição.");
      return res.status(400).json({ error: "Tombo não fornecido." });
    }

    try {
      // Verificar se o tombo está na tabela estoqueatual
      const infoTombo = await estoqueModel.getItemByTombo(tombo);
      if (infoTombo) {
        console.log("Informações de entrada do tombo:", infoTombo);

        // Verificar se o item ainda não foi pago
        if (!infoTombo.pago) {
          return res.json({
            infoTombo,
            message: "Item consta no estoque, não foi pago.",
          });
        }
      }

      // Buscar na tabela itenspagos
      const saidaTombo = await estoqueModel.getSaidaPorTombo(tombo);
      console.log("Informações de saída do tombo:", saidaTombo);

      // Se não houver registros em nenhuma das tabelas
      if (!infoTombo && !saidaTombo) {
        console.log("Nenhuma informação encontrada para o tombo:", tombo);
        return res
          .status(404)
          .json({ error: "Tombo não encontrado ou não pago." });
      }

      // Se houver registros em ambas as tabelas (item pago)
      const fullInfoTombo = { ...infoTombo, saida: saidaTombo };
      console.log("Informações completas do tombo encontradas:", fullInfoTombo);
      res.json({ infoTombo: fullInfoTombo });
    } catch (error) {
      console.error("Erro ao buscar informações do tombo:", error);
      res.status(500).json({ error: "Erro ao buscar informações do tombo." });
    }
  };
}

export default new EstoqueController();
