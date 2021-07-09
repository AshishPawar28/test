var mongoose=require("mongoose");
var passportLocalMongoose=require("passport-local-mongoose");

var UserSchema= new mongoose.Schema({
	username: {type : String},
	password: {type : String}
	answers :[{
				testId : String,
				choices:[{	queId: String,
						    choice: String	}]
				}
				],
	result:[{
			testId:mongoose.Schema.Types.ObjectId,
			marks: Number,
			negative: Number,
			wrongID:[]
			}],
	mobileno: String	
});


UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User",UserSchema);