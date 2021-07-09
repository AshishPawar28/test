var mongoose=require("mongoose");

var TestSchema= new mongoose.Schema({
	name: String,
	subject:[{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Subject"
	}],
	questions:[{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Question"
	}]
});

module.exports = mongoose.model("Test",TestSchema);