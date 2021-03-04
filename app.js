const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-Shobhit:buggatti@cluster0.vypaw.mongodb.net/mcqDB",{useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema ({
	email: String,
	password: String
});
userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

var ansArray = [];
var quesArray = [];
var c = 0;
var len = 0;
var temp = "";

const questionSchema = {
	question: String,
	choiceA: String,
	choiceB: String,
	choiceC: String,
	choiceD: String,
	answer: String,
	questionID: String
};
const Question = mongoose.model("Question",questionSchema);

app.get("/",function(req,res){
	if(req.isAuthenticated()){
		 res.redirect("home");
	}
	else
		res.render("start");
});
app.get("/signup", function(req, res){
  res.render("signup");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/about", function(req, res){
  res.render("about");
});

app.get("/newQuestion", function(req, res){
	if(req.isAuthenticated()){
		 res.render("newQuestion");
	}
	else
		res.redirect("/login");
});

app.get("/showResult",function(req,res){
	if(req.isAuthenticated()){
		res.render("showResult",{finalScore: c, total: len});
		c=0;
		len=0;
	}
	else
		res.redirect("/login");
});

app.get("/home", function(req, res){
	if(req.isAuthenticated()){
  Question.find({},function(err,questions){
		res.render("home",{
			newQuestions: questions
		});
	});
	}
	else
		res.redirect("/login");
});

app.get("/searchAndDelete",function(req,res){
	if(req.isAuthenticated()){
		Question.find({},function(err,foundQuestions){
			if(err)
				console.log(err);
			else{
				var arr = [];
				foundQuestions.forEach(function(foundQuestion){
					arr.push(foundQuestion.questionID);
				});
				res.render("searchAndDelete",{currentQuestions: arr});
				arr = [];
			}			
		});
	}
	else
		res.redirect("/login");
});

app.get("/logout",function(req,res){
	req.logout();
	res.redirect("/");
});

app.post("/newQuestion", function(req, res){
  const newQuestion = new Question({
    question: req.body.postQuestion,
    choiceA: req.body.postChoiceA,
    choiceB: req.body.postChoiceB,
    choiceC: req.body.postChoiceC,
    choiceD: req.body.postChoiceD,
    answer: req.body.postAnswer,
    questionID: req.body.uniqueID
	});
  	newQuestion.save(function(err){
    if(!err)
     res.redirect("/home");
  });
});

app.post("/home",function(req,res){
	const uniqueID = req.body.questionID;
	for( var i=0; i<uniqueID.length; i++){
		const tryy = "postAnswer"+uniqueID[i];
		const gotAnswer = req.body[tryy];
		ansArray.push(gotAnswer);
		quesArray.push(uniqueID[i]);
	}
	Question.find({},function(err,foundQuestions){
	    var fqMap = {};
	    foundQuestions.forEach(function(foundQuestion) {
	      fqMap[foundQuestion.questionID] = foundQuestion.answer;
	    });
	    res.render("result",{finalScore1: JSON.stringify(fqMap)});
	});	
});

app.post("/result",function(req,res){
	const real = JSON.parse(req.body.realAns);
	for(var i=0; i<quesArray.length; i++){
		if(real[quesArray[i]]===ansArray[i])
			c++;
	}
	len = ansArray.length;
	ansArray = [];
	quesArray = [];
	res.redirect("/showResult");
});

app.post("/searchAndDelete",function(req,res){
	const uniqueID = req.body.uniqueID;
	Question.findOne({questionID: uniqueID},function(err,foundQuestion){
		if(err)
			console.log(err);
		else{
			if(foundQuestion){
				temp = foundQuestion.questionID;
				res.render("delete",{isPresent: "",
				    question: foundQuestion.question,
				    optionA: foundQuestion.choiceA,
				    optionB: foundQuestion.choiceB,
				    optionC: foundQuestion.choiceC,
				    optionD: foundQuestion.choiceD,
				    danger: "danger",
				    Remove: "Remove"
				});
			}
			else{
				temp = "";
				res.render("delete",{isPresent: "No ",
					question: "",
				    optionA: "",
				    optionB: "",
				    optionC: "",
				    optionD: "",
				    danger: "info",
				    Remove: "Go To Home"
			});
			}
		}
	});
});

app.post("/delete",function(req,res){
	Question.deleteOne({questionID: temp},function(err,result){
		if(err)
			console.log(err);
		else
			console.log(result);
	});
	temp = "";
	res.redirect("home");
});

app.post("/signup",function(req,res){
	User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/signup");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/home");
      });
    }
  });
});

app.post("/login", function(req, res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(err){
        res.redirect("/home");
      });
    }
  });

});


app.listen(process.env.PORT||3000,function(){
	console.log("Running the server on 3000");
});