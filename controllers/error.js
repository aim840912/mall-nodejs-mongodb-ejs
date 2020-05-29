exports.get404 = (req, res, next) => {
	res.status(404).render('404', { docTitle: '頁面未找到', isAuthenicated: req.session.isLoggedIn });
};
