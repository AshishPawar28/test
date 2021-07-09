var mongoose= require("mongoose");

var SubjectSchema= new mongoose.Schema({
	name: String,
	questions:[
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Question"
		}
	]
});

module.exports = mongoose.model("Subject",SubjectSchema);