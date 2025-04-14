module.exports = {
    eAdmin: function(req,res,next){
        if(req.isAuthenticated() && req.user.eAdmin == 1){
            return next()
        }

        req.session.error_msg = "Você precisa ser um Administrador!"
        res.redirect("/")

    }
}