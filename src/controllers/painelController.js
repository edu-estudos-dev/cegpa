class PainelController {
    renderPainel(req, res) {
        res.render('painel', {
            title: 'Painel de Controle',
            usuario: req.session.user,
        });
    }
}

export default new PainelController();
