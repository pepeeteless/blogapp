//Carregando modulos
const express = require("express")
const handlebars = require("express-handlebars")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const session = require("express-session")
const passport = require("passport")
require("./config/auth")(passport)


//Carregando Models mongoose
require("./models/Postagem")
const Postagem = mongoose.model("postagens")

require("./models/Categoria")
const Categoria = mongoose.model("categorias")

//Manipulando Diretórios
const path = require("path")

//Importando Rotas do Admin
const admin = require("./routes/admin")
const usuarios = require("./routes/usuario")
//Express
    const app = express()

//Configurações
//Sessao
app.use(session({
    secret: "cursodenode",
    resave: true,
    saveUninitialized: true
}))

app.use(passport.initialize())
app.use(passport.session())
//MiddleWare próprio de mensagens flash
    app.use((req, res, next) => {
        res.locals.success_msg = req.session.success_msg || null;
        res.locals.error_msg = req.session.error_msg || null;
        res.locals.error = req.session.error || null
        res.locals.user = req.user || null
    
        // limpa após enviar
        req.session.success_msg = null;
        req.session.error_msg = null;
        req.session.error = null
    
        next();
    });

    //BodyParser
        app.use(bodyParser.urlencoded({extended: true}))
        app.use(bodyParser.json())
    //HandleBars
    app.engine('handlebars', handlebars.engine({
        defaultLayout: "main",
        runtimeOptions: {
            allowProtoPropertiesByDefault: true,
            allowProtoMethodsByDefault: true,
        }
    }))
    
        app.set('view engine', 'handlebars')
    //Mongoose
        mongoose.Promise = global.Promise
        mongoose.connect("mongodb://localhost/blogapp").then(() => {
            console.log("Conectado ao MongoDB")
        }).catch((erro) => {
            console.log("Erro ao se conectar ao MongoDB"+erro)
        })
        
        
    //Public (Onde fica todos os arquivos estáticos)
        app.use(express.static(path.join(__dirname,"public")))

//Rotas
    app.get("/", (req,res) => {
        Postagem.find().populate('categoria').sort({data: "desc"}).lean().then((postagens) => {
            res.render("index", {postagens: postagens})
        }).catch((erro) => {
            req.session.error_msg = 'Houve um erro interno'
            res.redirect("/404")
        })
        
    })

    app.get("/postagem/:slug", (req,res) => {
        Postagem.findOne({slug: req.params.slug}).then((postagem) => {
            if(postagem){
                res.render("postagem/index", {postagem: postagem})
            }else{
                req.session.error_msg = 'Esta postagem não existe'
                res.redirect("/")
            }
        }).catch((erro) => {
            req.session.error_msg = 'Houve um erro interno'
            res.redirect("/")
        })
    })

    app.get("/categorias", (req,res) => {
        Categoria.find().then((categorias) => {
            res.render("categorias/index", {categorias: categorias})
        }).catch((erro) => {
            req.session.error_msg = 'Houve um erro interno ao listar as categorias'
            res.redirect("/")
        })
    })

    app.get("/categorias/:slug", (req,res) => {
        Categoria.findOne({slug: req.params.slug}).then((categoria) => {
            if(categoria){

                Postagem.find({categoria: categoria._id}).then((postagens) => {
                    res.render("categorias/postagens", {postagens: postagens, categoria: categoria})
                }).catch((erro) => {
                    req.session.error_msg ='Houve um erro ao listar as postagens'
                })

            }else{
                req.session.error_msg = 'Esta categoria não existe'
                res.redirect("/")
            }
        }).catch((erro) => {
            req.session.error_msg = 'Houve um erro interno ao carregar a pagina desta categoria'
        }) 
    })

    app.get("/404", (req,res) => {
        res.send("Erro 404!")
    })

    
    app.use('/admin', admin)
    app.use("/usuarios", usuarios)
//Outros
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log("Servidor rodando na url: http://localhost:"+PORT)
})