var express = require("express");
var routeur = express.Router();
const twig = require("twig");
const livreSchema = require("./models/livres.modele");
const mongoose = require ("mongoose");
mongoose.set('strictQuery', false);
const multer = require("multer");
const fs = require("fs");

//Définition du stockage des images:
const storage = multer.diskStorage({
    destination: (requete, file, cb) => {
        cb(null, './public/images'); // dossier de destination
    },
    filename: (requete, file, cb) => {
        var date = new Date().toLocaleDateString(); // date du jour
        cb(null, date + "-" + Math.round(Math.random() * 10000) + "-" + file.originalname); // nom du fichier
    }
});

//Filtre pour les images par rapport leur format:
const fileFilter = (requete, file, cb) => { 
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true); // accepter le fichier
    } else {
        cb(null, false); // refuser le fichier
    }
}

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5, // taille maximale du fichier
    },
    fileFilter: fileFilter // filtre pour les images
});

routeur.get("/", (requete, reponse) =>{
    reponse.render("accueil.html.twig")
})

routeur.get("/livres", (requete, reponse) =>{
    livreSchema.find()
    .exec()
    .then(livres => {
         reponse.render("livres/liste.html.twig", {liste : livres, message : reponse.locals.message})
})
.catch(); 
    
})

routeur.post("/livres", upload.single("image"), (requete, reponse) => {
    const livre = new livreSchema({ // création d'un nouveau livre
        _id: new mongoose.Types.ObjectId(),
        nom: requete.body.titre,
        auteur: requete.body.auteur,
        pages: requete.body.pages,
        description: requete.body.description,
        image: requete.file.path.substring(14) // permet de ne garder que le nom du fichier
});
livre.save()
.then(resultat => {
    console.log(resultat); // permet de voir le résultat dans la console
    reponse.redirect("/livres"); // permet de rediriger vers la page /livres
})
.catch(error => { // permet de voir l'erreur dans la console
    console.log(error);
})
}) 

//Modification d'un livre (formulaire)
routeur.get("/livres/modification/:id", (requete, reponse) => {
    livreSchema.findById(requete.params.id)
    .exec()
    .then(livre => {
        reponse.render("livres/livre.html.twig",{livre:livre, isModification: true})
    })
    .catch(error => {
        console.log(error);
    })
})

//Message de confirmation de suppression
routeur.post("/livres/delete/:id", (requete, reponse) => {
    livreSchema.findById(requete.params.id)
    .select("image")
    .exec()
    .then(livre => {
        fs.unlink("./public/images/" + livre.image, (error) => {
            console.log(error);
        })
     livreSchema.remove({_id:requete.params.id})
     .exec()
     .then(resultat => {
         requete.session.message = {
             type : "success",
             contenu : "Le livre a bien été supprimé",
         }
         reponse.redirect("/livres");
     })
     .catch(error => {
         console.log(error);
     })
})
.catch(error => {
    console.log(error);
})
})

//Affichage détaillé d'un livre
routeur.get("/livres/:id", (requete, reponse) => {
livreSchema.findById(requete.params.id)
.exec()
.then(livre => {
    reponse.render("livres/livre.html.twig",{livre:livre, isModification: false})
})
.catch(error => {
    console.log(error);
})
})

//Modification d'un livre (enregistrement)
routeur.post("/livres/modificationServer", (requete, reponse) => {
    const livreUpdate = {
        nom: requete.body.titre,
        auteur: requete.body.auteur,
        pages: requete.body.pages,
        description: requete.body.description
    }
    livreSchema.update({_id:requete.body.identifiant}, livreUpdate)
    .exec()
    .then(resultat => {
        if(resultat.nModified < 1) {
            throw new Error("Aucune modification n'a été effectuée");
        }
        requete.session.message = {
            type : "success",
            contenu : "Le livre a bien été modifié",
        }
        reponse.redirect("/livres");
    })
    .catch(error => {
        console.log(error);
        requete.session.message = {
            type : "danger",
            contenu : error.message,
        }
        reponse.redirect("/livres");
    })
})

routeur.post("/livres/updateImage", upload.single("image"), (requete, reponse) => {
    // Suppression de l'ancienne image
    var livre = livreSchema.findById(requete.body.identifiant)
    .select("image")
    .exec()
    .then(livre => {
        fs.unlink("./public/images/" + livre.image, (error) => {
            console.log(error);
        })
    // Enregistrement de la nouvelle image
         const livreUpdate = {
        image: requete.file.path.substring(14)
    }
    livreSchema.update({_id:requete.body.identifiant}, livreUpdate)
    .exec()
    .then(resultat => {
        reponse.redirect("/livres/modification/" + requete.body.identifiant)
    })
    .catch(error => {
        console.log(error);
    })
        });
    
})


// Gestion l'erreur 404
routeur.use((requete,reponse,suite) => {
    const error = new Error("Page non trouvée");
    error.status= 404;
    suite(error); //  suite(error) permet de passer à la fonction de gestion des erreurs (voir plus bas)
})

// Gestion des erreurs
routeur.use((error,requete,reponse) => {
    reponse.status(error.status || 500);
    reponse.end(error.message);
})

module.exports = routeur;


// Requete = permet de récupérer les éléments recus par le client
// Reponse = permet de préparer les éléments à envoyer au client
// reponse. end = permet d'envoyer les éléments au client
// get = permet de récupérer les éléments
// post = permet d'envoyer des éléments