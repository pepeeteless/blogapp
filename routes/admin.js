//Importando modulos
const express = require("express")
const mongoose = require("mongoose")

//Carregando Models
require("../models/Categoria")
const Categoria = mongoose.model("categorias")
require("../models/Postagem")
const Postagem = mongoose.model("postagens")

const {eAdmin} = require("../helpers/eAdmin")

//Configurando Router
const router = express.Router()

//Rotas do Admin

router.get("/", eAdmin, (req,res) => {
    res.render("admin/index")
})

router.get("/posts", eAdmin, (req,res) => {
    res.send("Pagina de Posts")
})

router.get("/categorias", eAdmin, (req,res) => {
    Categoria.find().sort({date: "desc"}).lean().then((categorias) => {
        res.render("admin/categorias", {categorias: categorias})
    }).catch((erro) => {
        req.session.error_msg = "Houve um erro ao listar as categorias"
        res.redirect("/admin")
    })
})

router.get('/categorias/add', eAdmin, (req,res) => {
    res.render("admin/addcategorias")
})

router.post('/categorias/nova', eAdmin, (req,res) => {
    
    var erros = []

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
        erros.push({text: "Nome inválido" })
    }

    if(!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null){
        erros.push({text: "Slug inválido"})
    }

    if(erros.length > 0){
        res.render("admin/addcategorias", {erros: erros})
    }else{
            
        const novaCategoria = {
            nome: req.body.nome,
            slug: req.body.slug
        }

        new Categoria(novaCategoria).save().then(() => {
            req.session.success_msg = "Categoria criada com sucesso!!!"
            res.redirect("/admin/categorias")
        }).catch(() => {
            req.session.error_msg = "Erro ao criar categoria!"
            res.redirect("/admin")
        })
    }
})

router.get("/categorias/edit/:id/", eAdmin, (req,res) => {
    Categoria.findOne({_id:req.params.id}).then((categoria) => {
        res.render("admin/editcategorias", {categoria: categoria.toObject()})
    }).catch((erro) => {
        req.session.error_msg = "Essa categoria não existe"
        res.redirect("/admin/categorias")
    })
    
})

router.post("/categorias/edit", eAdmin, (req,res) => {
    var erros = []

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
        erros.push({text: "Nome inválido" })
    }

    if(!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null){
        erros.push({text: "Slug inválido"})
    }

    if(erros.length > 0){
        res.render("admin/editcategorias", {erros: erros})
    }else {
        Categoria.findOne({_id: req.body.id}).then((categoria) => {
            categoria.nome = req.body.nome
            categoria.slug = req.body.slug
    
            categoria.save().then(() => {
                req.session.success_msg = "Categoria editada com sucesso!"
                res.redirect("/admin/categorias")
            }).catch((erro) => {
                req.session.error_msg = "Houve um erro interno ao salvar a edição da categoria!"
                res.redirect("/admin/categorias")
            })
    
        }).catch((erro) => {
            req.session.error_msg = "Houve um erro ao editar a categoria!"
            res.redirect("/admin/categorias")
        })
    }
})

router.post("/categorias/deletar", eAdmin, (req,res) => {
    Categoria.deleteOne({_id : req.body.id}).then(() => {
        req.session.success_msg = "Categoria deletada com sucesso!"
        res.redirect("/admin/categorias")
    }).catch((erro) => {
        req.session.error_msg = "Erro ao deletar categoria: "+ erro 
        res.redirect("/admin/categorias")
    })
})

router.get("/postagens", eAdmin, (req, res) => {
    Postagem.find().populate("categoria").sort({ data: "desc" }).then((postagens) => {
        res.render("admin/postagens", { postagens: postagens });
    }).catch((erro) => {
        req.session.error_msg = "Houve um erro ao carregar as postagens";
        res.redirect("/admin");
    });
});

router.get("/postagens/add", eAdmin, (req,res) => {
    Categoria.find().then((categorias) => {
        res.render("admin/addpostagem", {categorias: categorias})
    }).catch((erro) => {
        req.session.error_msg = "Houve um erro ao carregar o formulário"
        res.redirect("/admin")
    })
    
})

router.post("/postagens/nova", eAdmin, (req,res) => {

    var erros = []

    if(req.body.categoria == "0"){
        erros.push({texto: "Categoria inválida, registre uma categoria"})
    }

    if(erros.length > 0){
        res.render("admin/addpostagem", {erros: erros})
    }else{
        const novaPostagem = {
            titulo: req.body.titulo,
            descricao: req.body.descricao,
            conteudo: req.body.conteudo,
            categoria: req.body.categoria,
            slug: req.body.slug
        }

        new Postagem(novaPostagem).save().then(() => {
            req.session.success_msg = "Postagem criada com sucesso!"
            res.redirect("/admin/postagens")
        }).catch((erro) => {
            req.session.error_msg = "Houve eu erro durante o salvamento da postagem"
            res.redirect("/admin/postagens")
        })
    }

})

router.get("/postagens/edit/:id", eAdmin, (req,res) => {
    Postagem.findOne({_id: req.params.id}).then((postagem) => {
        Categoria.find().then((categorias) => {

            res.render("admin/editpostagens", {categorias: categorias, postagem: postagem})


        }).catch((erro) => {
            req.session.error_msg ='Houve um erro ao listar as categorias'
            res.redirect("admin/postagens")
        })
    }).catch((erro) => {
        req.session.error_msg = "Houve um erro ao editar a postagem"
        res.redirect("/admin/postagens")
    })
    
    
})

router.post("/postagens/edit", eAdmin, (req,res) => {

    Postagem.findOne({_id: req.body.id}).then((postagem) => {
        postagem.titulo = req.body.titulo
        postagem.slug = req.body.slug
        postagem.descricao = req.body.descricao
        postagem.conteudo = req.body.conteudo
        postagem.categoria = req.body.categoria

        postagem.save().then(() => {
            req.session.success_msg = 'Postagem Salva com sucesso!!!'
            res.redirect("/admin/postagens")
        }).catch((erro) => {
            req.session.error_msg = 'Erro interno'
            res.redirect("/admin/postagens")
        })

    }).catch((erro) => {
        console.log(erro)
        req.session.error_msg = " Houve um erro ao salvar a edição"
        res.redirect("/admin/postagens")
    })


})

router.get("/postagens/deletar/:id", eAdmin, (req,res) => {
    Postagem.deleteOne({_id: req.params.id}).then(() => {
        req.session.success_msg = 'Postagem deletada com sucesso!'
        res.redirect("/admin/postagens")
    }).catch((erro) => {
        req.session.error_msg = 'Houve um erro interno'
        res.redirect("/admin/postagens")
    })
})



module.exports = router