//npm init
//npm install express nodemon
//write the script for nodemon in package.json
//npm install mongoose




var express=require("express");
var app=express();
var bodyparser=require("body-parser");

//mongoose is useful package for mongoDB 
var mongoose=require("mongoose");
var passport=require("passport");
var LocalStrategy=require("passport-local");


  //MODELs

var User=require("./models/user");
var Test=require("./models/test");
var Subject=require("./models/subject"); 
var Question=require("./models/question"); 
var marks=0;
var negative=0;
var wrongID=[];

 
//connect to DB
  mongoose.connect("mongodb://localhost/Test_App",{useNewUrlParser:true,useUnifiedTopology: true});
// app.use are all middlewares
app.use(bodyparser.urlencoded({extended: true}));
app.set("view engine","ejs");

//Used to public folder a static folder
//Use is a method we use when we wanna write a middleware
app.use(express.static(__dirname+"/public"));

//this is middleware for checking the authentication every time 
app.use(require("express-session")({
	secret: "this is authetication for test app",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(function( req, res, next){
	res.locals.currentUser = req.user;
	next();
});




app.get("/",function(req,res){
	res.render("login");
});

app.get("/register",function(req,res){
	res.render("register");
});

app.post("/register",function(req,res){
	var newUser = new User({username: req.body.username,mobileno: req.body.mobileno});
	User.register(newUser,req.body.password,function(err,user){
		if(err){
			console.log(err);
			return res.render("register");
		}
		passport.authenticate("local")(req, res, function(){
			res.redirect("/home");
		});
	});
});

app.post("/login",passport.authenticate("local",
	{
		successRedirect: "/home",
		failureRedirect: "/login"
	}),function(req,res){

});

app.get("/home",isLoggedIn,function(req,res){
	var resIndex=[];
	var mo=req.user.mobileno;
	var currentUser=req.user;
	Test.find({},function(err,test){
		if(err){
			console.log(err);
		}else{

			for(var i=0;i<(test.length);i++){
				for(var j=0;j<currentUser.result.length;j++){
					if(String(test[i]._id)==String(currentUser.result[j].testId)){
						resIndex.push(i);
						break;					}	
				}
				
			}
			console.log(resIndex);
			console.log(resIndex.length);
			res.render("home",{mo:mo,currentUser:currentUser,test:test,resIndex});	
		}
	});
	
});

app.get("/logout",function(req,res){
	req.logout();
	res.redirect("/");
});

app.get("/testcreate",function(req,res){
	res.render("testcreate");
});

app.post("/testcreate",function(req,res){
	var test={
		name: req.body.testname
	};
	var subject=req.body.subject;
	var subarray=[];
	for(var i=0;i<subject.length;i++){
		subarray.push({name:subject[i]});
	}
	
	Test.create(test,function(err,test){
		if(err){
			console.log(err);
		}else{
			console.log(subarray);
			Subject.create(subarray,function(err,subarray){
				if(err){
					console.log(err);
				}else{
					console.log(subarray);
					test.subject=subarray;
					test.save();
					res.render("noque",{subarray:subarray,test:test});
				}
			});

					}


				
			
			
		
	});

});

app.get("/noque/:testID",function(req,res){
	Test.findById(req.params.testID).populate("subject").exec(function(err,test){
		if(err){
			console.log(err);
		}else{
			res.render("noque",{subarray:test.subject,test:test});
		}
	});
});

app.get("/test/:testID/:subjectID",function(req,res){
	Test.findById(req.params.testID,function(err,test){
		if(err){
			console.log(err);
		}else{
			Subject.findById(req.params.subjectID).populate("questions").exec(function(err,subject){
			if(err){
			console.log(err);
			}else{
				console.log(subject);
				var questions=subject
			res.render("quecreate",{subject:subject,test:test});
				}
			});
		}
	});
	
	
});

app.post("/test/:testID/:subjectID",function(req,res){
	Subject.findById(req.params.subjectID,function(err,subject){
		if(err){
			console.log(err);
		}else{
			var question={
				que:req.body.que,
				options:req.body.options,
				realans:req.body.realans
			};
			console.log(req.body.options);
			console.log(question.options);
			Question.create(question,function(err,question){
				if(err){
					console.log(err);
				}else{
					subject.questions.push(question);
					subject.save();
					console.log(question.option);
					console.log(question);
					res.redirect("/test/"+req.params.testID+"/"+req.params.subjectID);
				}
			});	
		}
	});
	
});

app.get("/export/:testID",isComplete,function(req,res){
	res.redirect("/testcreate");
});




app.get("/instructions/:testID",function(req,res){
	res.render("instruction",{testID:req.params.testID});
});

app.get("/exam/:testID",function(req,res){
	Test.findById(req.params.testID).populate("subject").populate({path:"subject.questions"}).exec(function(err,test){
		if(err){
			console.log(err);
		}else{
			console.log(test);
			var currentUser=req.user;
			var index=currentUser.answers.length;

			var ansObj={
				testId : req.params.testID,
				choices:[]
				}

			currentUser.answers.push(ansObj);
			console.log(test._id);
			console.log(req.params.testID);

			currentUser.save();
			
			res.redirect("/exam/"+test._id+"/"+test.subject[0]._id+"/0");
		}
	});
	
});

app.get("/exam/:testID/:subjectID/:queno",function(req,res){

	var currUser=req.user;

	var status=0;
	var indexForChoice;
	var queno=Number(req.params.queno);

	

	Test.findById(req.params.testID).populate("subject").exec(function(err,test){
		if(err){
			console.log(err);
		}else{
			Subject.findById(req.params.subjectID).populate("questions").exec(function(err,subject){
				if(err){
					console.log(err);
				}else{
					//res.render("exam",{subject:subject})
					

					for(var x=0;x<(currUser.answers[currUser.answers.length-1].choices.length);x++){
	 if(String(currUser.answers[currUser.answers.length-1].choices[x].queId)==String(subject.questions[queno]._id)){
		for(var i=0;i<(subject.questions[queno].options.length);i++){ 
	
 		 if(currUser.answers[currUser.answers.length-1].choices[x].choice==String(i+1)){
 		 	status=i+1;
 		 	indexForChoice=x;
 		
		 }else{ 
				continue;
		} 
	}
	break;
	
	}else{ 
		continue;
	
 	} 

	 }

					res.render("exam",{test:test,subject:subject,queno:Number(req.params.queno),currUser:currUser,status:status,indexForChoice:indexForChoice});
				}
			});
		}
	});
});

app.post("/exam/:testID/:subjectID/:questionID/:queno",function(req,res){
	var currentUser=req.user;
	var currTestIndex=currentUser.answers.length-1;
	
	var response={queId:req.params.questionID,choice:req.body.userChoice};
	var m=0;
	console.log(req.body.userChoice);

	if(!req.body.userChoice){
		res.redirect("/exam/"+req.params.testID+"/"+req.params.subjectID+"/"+req.params.queno);
	}else{

		for(var i=0;i<currentUser.answers[currTestIndex].choices.length;i++){
		if(String(currentUser.answers[currTestIndex].choices[i].queId)==String(req.params.questionID)){
			currentUser.answers[currTestIndex].choices[i].choice=req.body.userChoice;
			currentUser.save();	
			m++;
			break;
		}
	}
	
	if(m==0){

		currentUser.answers[currTestIndex].choices.push(response);
	
		currentUser.save();

	}
	if(m==0||m==1){
		var questionno=Number(req.params.queno)+1;

		Test.findById(req.params.testID,function(err,test){
			if(err){
				console.log(err);
			}else{
				Subject.findById(req.params.subjectID,function(err,subject){
					if(err){
						console.log(err);
					}else{

						if((Number(req.params.queno)==Number(subject.questions.length-1))&&(String(test.subject[test.subject.length-1]._id)==String(req.params.subjectID))){
								res.redirect("/exam/"+test._id+"/"+test.subject[0]._id+"/0");
						}
						else if(Number(req.params.queno)==Number(subject.questions.length-1)){
								for(var i=0;i<(test.subject.length);i++){
									if(String(subject._id)==String(test.subject[i]._id)){
										res.redirect("/exam/"+test._id+"/"+test.subject[i+1]._id+"/0");
										break;
									}
								}
						
						}

						else{
							
							res.redirect("/exam/"+req.params.testID+"/"+req.params.subjectID+"/"+questionno);		
						}
					}
				});
				
			}
		});

					

		
	}

	}

	


});


app.get("/result/:testID/:subjectID/:index",function(req,res){
	var currentUser=req.user;
	var testIndex=currentUser.answers.length-1;

	
	
	var index=Number(req.params.index);
	var newIndex=index+1;

	//make an array of IDs


	//New Checking Procedure

	Question.findById(currentUser.answers[testIndex].choices[index].queId,function(err,question){
		if(err){
			console.log(err);
		}else{
			console.log(currentUser);
			console.log(currentUser.answers[testIndex].choices[index].queId);
			console.log(currentUser.answers[testIndex].choices[0]._queId);
			console.log(currentUser.answers[testIndex]);
			console.log(question);
			if((index+1)==currentUser.answers[testIndex].choices.length){
				if(question.realans==currentUser.answers[testIndex].choices[index].choice){
					console.log("Right Response");
					marks=marks+4;
				}else{
					console.log("Wrong Response");
					negative=negative-1;
					marks=marks-1;
					wrongID.push(question._id);
				}
				var result={
			testId: req.params.testID,
			marks: marks,
			negative: negative,
			wrongID: wrongID	
	};

	console.log(negative);


	currentUser.result.push(result);
	currentUser.save();

	res.send(currentUser.result);
			}
			else{
				console.log(question);
				if(question.realans==currentUser.answers[testIndex].choices[index].choice){
					console.log("Right Response");
					marks=marks+4;
				}else{
					console.log("Wrong Response");
					negative=negative-1;
					marks=marks-1;
					wrongID.push(question._id);
					currentUser.save();
				}
				res.redirect("/result/"+req.params.testID+"/"+req.params.subjectID+"/"+newIndex);
			}
		}
	});


	//end

	

});


app.get("/result/:testID",function(req,res){
	var testID=req.params.testID;
	var currUser=req.user;
	for(var i=0;i<currUser.result.length;i++){
		if(String(testID)==String(currUser.result[i].testId)){
			Test.findById(testID,function(err,test){
				if(err){
					console.log(err);
				}else{
					console.log(currUser.result[i])
					res.render("result",{i:i,test:test,currUser:currUser});	
					
				}
			});
			break;
			
		}
	}
});

function isComplete(req, res, next){

	Test.findById(req.params.testID).populate("subject").exec(function(err,test){
		if(err){
			console.log(err);
		}else{
			for(var i=0;i<test.subject.length;i++){
				if(test.subject[i].questions.length!=0){
					return next();

				}
					
					res.redirect("/noque/"+req.params.testID);
					break;
				
			}
		}
	});

}

function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect("/login");
}


app.listen(1300,function(){
	console.log("The server has started !!!");
});