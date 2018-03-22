//Contains CAMPGROUNDS routes
var express         = require("express");
var router          = express.Router();
var Campground      = require("../models/campground");
var middleware      = require("../middleware");
var NodeGeocoder    = require("node-geocoder");
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

// ===========================
// CAMPGROUND ROUTES
// ===========================

//INDEX - show all campgrounds
router.get("/", function(req, res){
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search),"gi");
        // Get selected campgrounds based on search query string from DB
        Campground.find({name: regex}, function(err, allCampgrounds){
           if(err){
               console.log(err);
           } else {
               if(allCampgrounds.length < 1){
                   req.flash("error","No campgrounds match that query, please try again");
                   res.redirect("/campgrounds");
               }else{
                    res.render("campgrounds/index",{campgrounds: allCampgrounds, page: 'campgrounds'});
               }
           }
        });
    }else{
        // Get all campgrounds from DB
        Campground.find({}, function(err, allCampgrounds){
           if(err){
               console.log(err);
           } else {
              res.render("campgrounds/index",{campgrounds: allCampgrounds, page: 'campgrounds'});
           }
        });
    }
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, function(req, res){
  // get data from form and add to campgrounds array
  var name = req.body.name;
  var image;
  if(req.body.image){
    image = req.body.image;
  }else{
      image = "https://pikwizard.com/photos/2b2d64178b25d791bb613fbfa590ffcb-s.jpg";
  }
  var desc = req.body.description;
  var price = req.body.price;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      console.log(err);
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    var newCampground = {name: name, image: image,price: price, description: desc, author:author, location: location, lat: lat, lng: lng};
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to campgrounds page
            res.redirect("/campgrounds");
        }
    });
  });
});

//NEW - show form to create new campgrounds
router.get("/new", middleware.isLoggedIn, function(req,res){
    res.render("campgrounds/new.ejs");
});

//SHOW - shows more info about one campground
router.get("/:id",function(req,res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err || !foundCampground){
            console.log(err);
            req.flash('error', 'Sorry, that campground does not exist!');
            res.redirect('/campgrounds');
        }else{
            //render show template with that campground
            res.render("campgrounds/show", {campground : foundCampground});
        }
    });
});

//EDIT - EDIT CAMPGROUND ROUTE  
router.get("/:id/edit",middleware.checkCampGroundOwnership,function(req,res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err || !foundCampground){
            console.log(err);
            req.flash('error', 'Sorry, that campground does not exist!');
            res.redirect("/campgrounds");
        }
        res.render("campgrounds/edit", {campground:foundCampground});
    });
});

// UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampGroundOwnership, function(req, res){
  geocoder.geocode(req.body.campground.location, function (err, data) {
    if (err || !data.length) {
        console.log(err);
        req.flash('error', 'Invalid address');
        return res.redirect('back');
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    var img;
    if(req.body.campground.image){
        img = req.body.campground.image;
    }else{
        img = "https://pikwizard.com/photos/2b2d64178b25d791bb613fbfa590ffcb-s.jpg";
    }
    var newData = {name: req.body.campground.name, image: img, description: req.body.campground.description, location: location, lat: lat, lng: lng};
    Campground.findByIdAndUpdate(req.params.id, newData, function(err, campground){
        if(err){
            console.log(err);
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
  });
});

// DESTROY CAMPGROUND ROUTE  
router.delete("/:id",middleware.checkCampGroundOwnership, function(req,res){
    Campground.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/campgrounds");
        }else{
            req.flash("success","You have successfully deleted the post");
            res.redirect("/campgrounds");
        }
    });
});

function escapeRegex(text){
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");  
};

module.exports = router;