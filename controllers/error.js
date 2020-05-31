exports.get404 = (req, res, next) => {
	res.status(404).render('404', { docTitle: '頁面未找到', isAuthenicated: req.session.isLoggedIn });
};

exports.get500 = (req, res, next) => {
	res.status(500).render('500', { docTitle: '服務器出錯', isAuthenicated: req.session.isLoggedIn });
};

