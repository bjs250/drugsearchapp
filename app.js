var express = require("express");
var app = express();
var http = require('http').Server(app);

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

var mongoose = require("mongoose");
var io = require('socket.io')(http);

// connect to database
mongoose.connect("mongodb://localhost/drug_app")

app.set("view engine", "ejs");

// define Drug schema
var drugSchema = new mongoose.Schema({
  name: String,
  mechanism: String
});

var Drug = mongoose.model("Drug", drugSchema);

// define Mech schema
var mechSchema = new mongoose.Schema({
  name: String,
  drug: String
});

var Mech = mongoose.model("Mech", mechSchema);

// render root page
app.get("/", function(req,res){
  res.render("home");
});

// for the socket
io.on('connection', function(socket) {

   console.log('user has connected');

   // activates when end user types in the searchbar
   socket.on("find",function(queryString){
     // create JSON like query object for Mongo's find function
     console.log(queryString)
     var query = {};
     query["name"]=new RegExp(String(queryString));
     Drug.find(query, function(err, drugs){
       if(err){
         console.log("find drug failed")
       } else {
         // report back results to the front end
         console.log("drug found!")
         socket.emit('found_drugs', drugs);
       };
     });

     Mech.find(query, function(err, mechs){
       if(err){
         console.log("find mech failed")
       } else {
         console.log("mech found!")
         socket.emit('found_mechs', mechs);
       };
     });

   });

   socket.on('disconnect', function () {
      console.log('user has disconnected');
   });

});

// these next 4 functions are essentially for my developer each of use. Not intended end user functionality

app.post("/drugs", function(req, res){
  var name = req.body.name;
  var mechanism = req.body.mechanism;
  var drug = {name: name, mechanism: mechanism};
  Drug.create(drug, function(err, newlyCreated){
    if(err){
      console.log(err)
    } else {
      res.redirect("/");
    }
  });
});

app.post("/mechs", function(req, res){
  var name = req.body.name;
  var drug = req.body.drug;
  var mech = {name: name, drug: drug};
  Mech.create(mech, function(err, newlyCreated){
    if(err){
      console.log(err)
    } else {
      res.redirect("/");
    }
  });
});

app.get("/drugs/new", function(req, res){
  res.render("new_drug");
});

app.get("/mechs/new", function(req, res){
  res.render("new_mech");
});

// display individual drug info
app.get("/drugs/:id", function(req,res){
  Drug.findById(req.params.id, function(err, foundDrug){
    if(err){
      console.log(err)
    } else {
      res.render("show_drug", {drug: foundDrug});
    }
  });
});

// display individual mech info
app.get("/mechs/:id", function(req,res){
  Mech.findById(req.params.id, function(err, foundMech){
    if(err){
      console.log(err)
    } else {
      res.render("show_mech", {mech: foundMech});
    }
  });
});

http.listen(3000, function() {
   console.log('listening on *:3000');
});
