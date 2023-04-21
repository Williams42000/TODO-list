var express = require("express"); //1. importation du module express
var server = express(); //2. création d'un serveur express
var morgan = require("morgan"); // importation du module morgan
var router = require("./routeur") // importation du module routeur
const mongoose = require("mongoose"); //1. importation du module mongoose
const bodyParser = require("body-parser");
const session = require("express-session");

server.use(
  session({
    secret: "keyboard cat", //c'est la clé de cryptage
    resave: true, //c'est  sauvgerder la session meme si elle n'a pas changé
    saveUninitialized: true, //c'est pour sauvegarder la session meme si elle est vide
    cookie: { maxAge: 60000 }, // 1 minute
  })
);

mongoose.connect("mongodb://localhost/biblio", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}); //2. connexion à la base de données

server.use(express.static("public")); // utilisation du module express.static (pour servir des fichiers statiques)
server.use(morgan("dev")); // utilisation du module morgan
server.use(bodyParser.urlencoded({ extended: false })); // utilisation du module body-parser
server.set("trust proxy", 1); // cela apermet de garder la session

server.use((requete, reponse, suite) => {
  reponse.locals.message = requete.session.message;
  delete requete.session.message;
  suite();
});

server.use("/", router); // utilisation du module routeur

server.listen(3000); //3. écoute du serveur sur le port 3000

// le 1,2,3 sont liée a l'installtion de express ou de mongoose

//Liste pour installer les modules:
//npm install express => express est un framework pour créer des serveurs web
//npm install morgan => morgan est un module qui permet de logger les requêtes
//(nous donne des informations sur les requêtes, le chemin, le temps de réponse, etc.)
//npm install twig => twig est un moteur de template
//npm install nodemon => nodemon est un module qui permet de relancer le serveur à chaque modification du code
