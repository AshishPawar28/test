var mongoose=require("mongoose");

var QuestionSchema= new mongoose.Schema({
	que: String,
	options: [],
	realans: String 
});

module.exports = mongoose.model("Question",QuestionSchema);
