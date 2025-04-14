//Importando Modulos
const express = require("express")
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const passport = require("passport")

//Configurando Roteador
const router = express.Router()

//Carregando Modulos
require("../models/Usuario")
const Usuario = mongoose.model("usuarios")

router.get("/registro", (req, res) => {
    res.render("usuarios/registro")
})

router.post("/registro", (req, res) => {
    var erros = []

    if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({ texto: "Nome inválido" })
    }
    if (!req.body.email || typeof req.body.email == undefined || req.body.email == null) {
        erros.push({ texto: "Email inválido" })
    } if (!req.body.senha || typeof req.body.senha == undefined || req.body.senha == null) {
        erros.push({ texto: "Senha inválida" })
    }
    if(req.body.senha.length < 4){
        erros.push({texto: "Senha muito curta"})
    }
    if(req.body.senha != req.body.senha2){
        erros.push({texto: "As senhas não coincidem, tente novamente!"})
    }

    if(erros.length > 0){

        res.render("usuarios/registro", {erros: erros})

    }else{
        Usuario.findOne({email: req.body.email}).lean().then((usuario) => {
            if(usuario){
                req.session.error_msg = 'Já existe uma conta com esse e-mail'
                res.redirect("/usuarios/registro")
            }else{

                const novoUsuario = new Usuario({
                    nome: req.body.nome,
                    email: req.body.email,
                    senha: req.body.senha,
                })

                bcrypt.genSalt(10, (erro,salt) => {
                    bcrypt.hash(novoUsuario.senha,salt, (erro, hash) => {
                        if(erro){
                            req.session.error_msg = "Houve um erro durante o salvamento do Usuário!"
                            res.redirect("/")
                        }else{
                            novoUsuario.senha = hash

                            novoUsuario.save().then(() => {
                                req.session.success_msg = "Usuário criado com sucesso!"
                                res.redirect("/")
                            }).catch((erro) => {
                                req.session.error_msg = "Houve um erro ao criar o usuário, tente novamente!"
                                res.redirect("/usuarios/registro")
                            })
                        }
                    })
                })

            }
        }).catch((erro) => {
            req.session.error_msg = 'Houve um erro interno'
            res.redirect('/')
        })
    }
})

router.get("/login", (req,res) => {
    res.render("usuarios/login")
})

router.post("/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) {
            req.session.error_msg = "Erro interno no login"
            return res.redirect("/usuarios/login")
        }

        if (!user) {
            req.session.error_msg = info.message 
            return res.redirect("/usuarios/login")
        }

        req.logIn(user, (err) => {
            if (err) {
                req.session.error_msg = "Erro ao logar o usuário"
                return res.redirect("/usuarios/login")
            }

            req.session.success_msg = "Login realizado com sucesso!"
            return res.redirect("/")
        })
    })(req, res, next)
})

router.get("/logout", (req,res,next) => {
    req.logout((erro) => {
        if(erro){
            return next(erro)
        }
        req.session.success_msg = 'Deslogado com sucesso!'
        res.redirect("/")
    })
    
})

module.exports = router