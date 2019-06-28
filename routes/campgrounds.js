 var express     = require("express"),
     router      = express.Router(),
     Campground  = require("../models/campground"),
     middleware  = require("../middleware");
     
var  multer      = require('multer');
var  storage     = multer.diskStorage({
      filename: function(req, file, callback) {
      callback(null, Date.now() + file.originalname);
      }
     });
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'ayush23', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
}); 
    // ==================================
    //INDEX-show all campgrounds
    // ==================================
    
    router.get("/",function(req,res){
          var noMatch=null;
        if(req.query.search){
            const regex = new RegExp(escapeRegex(req.query.search), 'gi');
                //Get searched campgrounds
    Campground.find({name:regex},function(err,foundCampgrounds){
        if(err){
                console.log("Campground couldn't be retrieved from database There is some error: "+err);
            }else{
              
                if(foundCampgrounds.length<1){
                    noMatch="No Campground found, Please Try again";
                }
                res.render("campgrounds/index",{campground:foundCampgrounds,noMatch:noMatch, page:"campgrounds"});
            }
    });
        }else{
            //Get all campgrounds
            Campground.find({},function(err,all_campgrounds){
                if(err){
                        console.log("Campground couldn't be retrieved from database There is some error: "+err);
                    }else{
               
                        res.render("campgrounds/index",{campground:all_campgrounds,noMatch:noMatch, page:"campgrounds"});
                    }
            });
         }
    });
    
    
    // ==================================
    //CREATE-add new campground to DB
    // ==================================
    
    
 router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
     
    
     cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
        if(err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
  // add cloudinary url for the image to the campground object under image property
  req.body.image = result.secure_url;
// add image's public_id to campground object
      req.body.imageId = result.public_id;
       console.log(req.body.imageId);
      //get data from form to array
        var name=req.body.name;
        var image=req.body.image;
        var imageId=req.body.imageId;
        var price=req.body.price;
        var desc=req.body.description;
        var author = {
            id: req.user._id,
            username:req.user.username
        }

    var newCampground={name:name,price:price,image:image,imageId:imageId,description:desc,author:author}
    
  Campground.create(newCampground, function(err, campground) {
    if (err) {
      req.flash('error', err.message);
      return res.redirect('back');
    }
    res.redirect('/campgrounds/' + campground.id);
  });
});
    });
    
    
    // ==================================
    //NEW- show form to create new campground
    // ==================================
    
    
       router.get("/new",middleware.isLoggedIn,function(req,res){
        res.render("campgrounds/new");
        
    });
    
    // ==================================
    //SHOW-show info about one campground
    // ==================================
    
    
       router.get("/:id",function(req, res) {
      //find the campground with provided ID
      Campground.findById(req.params.id).populate("comments").exec(function(err,foundCampground){
         if(err)
         console.log(err);
         else{
             
             //render show template with that campground
             res.render("campgrounds/show",{campground:foundCampground});
         }
      });
    });
    
    // ==================================
    //EDIT-edit one campground
    // ==================================
    
    router.get("/:id/edit",middleware.checkCampgroundOwnership,function(req, res) {
      Campground.findById(req.params.id,function(err,foundCampground){
          if(err){
          console.log("EDIT CAMPGROUND :"+err);
          res.redirect("/campgrounds");}
          else
           res.render("campgrounds/edit",{campground:foundCampground});
      });
    });
    
    // ==================================
    //UPDATE-update a particular campground
    // ==================================
    
    router.put("/:id",middleware.checkCampgroundOwnership,upload.single('image'),function(req,res){
        //find the campground 
        Campground.findById(req.params.id, async function(err, foundCampground) {
            if(err){
               req.flash("error",err.message);
             return  res.redirect("back");
            }else{
                if(req.file){
                    try{
                        await cloudinary.v2.uploader.destroy(foundCampground.imageId);
                        var result= await cloudinary.v2.uploader.upload(req.file.path);
                        foundCampground.imageId=result.public_id;
                        foundCampground.image=result.secure_url;
                        
                    }catch(err){
                         console.log(foundCampground.imageId);
                        req.flash("error",err.message);
                        res.redirect("back");
                    }}
                    foundCampground.name=req.body.name;
                    foundCampground.price=req.body.price;
                    foundCampground.description=req.body.description;
                    foundCampground.save();
                    req.flash("success","Successfully Updated!");
            //redirect to show page
                    res.redirect("/campgrounds/"+req.params.id);
                }

        });
    });
    
    // ==================================
    //DESTROY-delete a particular campground
    // ==================================
    
    router.delete("/:id",middleware.checkCampgroundOwnership,function(req,res){
        Campground.findById(req.params.id,async function(err,foundCampground){
            if(err){
                req.flash("error",err.message);
                res.redirect("back");
            }
            try{
                await cloudinary.v2.uploader.destroy(foundCampground.imageId);
                foundCampground.remove();
                req.flash("success","Campground Successfully deleted");
                 res.redirect("/campgrounds");
            }catch(err){
                if(err){
                    req.flash("error",err.message);
                    return res.redirect("back");
                }
            }
        
        });
    });
    
    function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


      module.exports=router;