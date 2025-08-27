import PesquisaModel from '../models/pesquisaModel.js';

class PesquisaController {

    // Método para obter o relatório de entradas
    fetchRelatorioEntradas = async (_, res) => {
        try {
            const relatorio = await PesquisaModel.getRelatorioEntradas();
            res.json(relatorio);
        } catch (error) {
            console.error('Erro ao buscar relatório de entradas:', error);
            res.status(500).json({
                error: 'Erro ao buscar relatório de entradas.',
            });
        }
    };

    // Método para obter o relatório de saídas
    fetchRelatorioSaidas = async (_, res) => {
        try {
            const relatorio = await PesquisaModel.getRelatorioSaidas();
            res.json(relatorio);
        } catch (error) {
            console.error('Erro ao buscar relatório de saídas:', error);
            res.status(500).json({
                error: 'Erro ao buscar relatório de saídas.',
            });
        }
    };

    // Método para obter o histórico de movimentação
    async fetchHistoricoMovimentacao(_, res) {
        try {
            const movimentacaoBruta =
                await PesquisaModel.getMovimentacaoBruta();
            const consolidado = {};

            movimentacaoBruta.forEach((item) => {
                const dataAjustada = new Date(item.data);
                dataAjustada.setDate(dataAjustada.getDate() + 1);

                const key = `${item.tipo}_${
                    dataAjustada.toISOString().split('T')[0]
                }_${item.descricao}`;
                if (!consolidado[key]) {
                    consolidado[key] = {
                        tipo: item.tipo,
                        data: dataAjustada.toISOString().split('T')[0],
                        descricao: item.descricao,
                        quantidade: 0,
                        dataOriginal: dataAjustada.toISOString().split('T')[0],
                    };
                }
                consolidado[key].quantidade += item.quantidade;
            });

            const historico = Object.values(consolidado);

            res.json(historico);
        } catch (error) {
            console.error('Erro ao buscar histórico de movimentação:', error);
            res.status(500).json({
                error: 'Erro ao buscar histórico de movimentação.',
            });
        }
    }

    // Método para renderizar a página de relatórios
    renderRelatorios = (_, res) => {
        res.render('relatorios');
    };

    // Método para renderizar a página de histórico de movimentação
    renderHistoricoMovimentacao = (_, res) => {
        res.render('historicoMovimentacao');
    };

    // Método para pesquisa avançada no estoque, incluindo itens saídos por ano
    async pesquisaAvancada(req, res) {
        const { data: ano } = req.query;
        console.log('Ano recebido na requisição:', ano);

        try {
            const { quantidadeEntraram, quantidadeSaidos } =
                await PesquisaModel.pesquisaAvancada(ano);
            console.log('Quantidade de itens que saíram:', quantidadeSaidos);

            res.json({ quantidadeEntraram, quantidadeSaidos });
        } catch (error) {
            console.error('Erro na pesquisa avançada:', error);
            res.status(500).json({ error: 'Erro na pesquisa avançada.' });
        }
    }

    // Método para renderizar a página de pesquisa avançada
    renderPesquisaAvancada = (req, res) => {
        const userRole = req.session.user ? req.session.user.role : 'user';
        res.render('pesquisaAvancada', { userRole });
    };

    // Método para buscar e exibir informações do tombo com logs adicionais
    fetchInfoPorTombo = async (req, res) => {
        const { tombo } = req.query;

        if (!tombo) {
            console.error('Tombo não fornecido na requisição.');
            return res.status(400).json({ error: 'Tombo não fornecido.' });
        }

        try {
            // Verificar se o tombo está na tabela estoqueatual
            const infoTombo = await PesquisaModel.getItemByTombo(tombo);
            if (infoTombo) {
                // Verificar se o item ainda não foi pago
                if (!infoTombo.pago) {
                    return res.json({
                        infoTombo,
                        message: 'Item consta no estoque, ainda não foi pago.',
                    });
                }
            }

            // Buscar na tabela itenspagos
            const saidaTombo = await PesquisaModel.getSaidaPorTombo(tombo);
            console.log('Informações de saída do tombo:', saidaTombo);

            // Se não houver registros em nenhuma das tabelas
            if (!infoTombo && !saidaTombo) {
                console.log(
                    'Nenhuma informação encontrada para o tombo:',
                    tombo
                );
                return res
                    .status(404)
                    .json({ error: 'Tombo não encontrado ou não pago.' });
            }

            // Se houver registros em ambas as tabelas (item pago)
            const fullInfoTombo = { ...infoTombo, saida: saidaTombo };
            console.log(
                'Informações completas do tombo encontradas:',
                fullInfoTombo
            );
            res.json({ infoTombo: fullInfoTombo });
        } catch (error) {
            console.error('Erro ao buscar informações do tombo:', error);
            res.status(500).json({
                error: 'Erro ao buscar informações do tombo.',
            });
        }
    };
}

export default new PesquisaController();
