class PainelController {
    renderPainel(req, res) {
        // Verificar se o usuário está autenticado
        if (!req.session.user) {
            console.log('Usuário não autenticado, redirecionando para /login');
            return res.status(401).redirect('/login');
        }

        // Capturar a mensagem de sucesso da query string
        const successMessage = req.query.success || null;
        res.render('painel', {
            title: 'Painel de Controle',
            usuario: req.session.user,
            success: successMessage // Passar a mensagem de sucesso para o template
        });
    }
}

export default new PainelController();