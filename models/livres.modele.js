const mongoose = require("mongoose"); //1. importation du module mongoose

const livreSchema = mongoose.Schema ({ 
    _id : mongoose.Schema.Types.ObjectId,
    nom: String,
    auteur: String,
    pages: Number,
    description : String,
    image: String,
}) 

module.exports = mongoose.model("Livre",livreSchema) 