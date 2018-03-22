var mongoose = require("mongoose");
// Schema Setup
var campgroundSchema = new mongoose.Schema({
   name: String,
   price: String,
   image: {type: String, default:"https://pikwizard.com/photos/2b2d64178b25d791bb613fbfa590ffcb-s.jpg"},
   description: String,
   location: String,
   lat: Number,
   lng: Number,
   createdAt: {type: Date, default: Date.now},
   author: {
      id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      },
      username: String
   },
   comments: [{
       type: mongoose.Schema.Types.ObjectId,
       ref: "Comment"
   }]
});

module.exports = mongoose.model("Campground", campgroundSchema);