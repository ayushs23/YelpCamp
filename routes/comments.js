 var express     = require("express"),
     router      = express.Router({mergeParams: true}),
     Campground  = require("../models/campground"),
     Comment     = require("../models/comment"),
     middleware  = require("../middleware");
     
    // ==================================
    //Comments Routes
    // ==================================
    
    // ==================================
    //NEW- show form to create new comment
    // ==================================
    
      router.get("/new",middleware.isLoggedIn ,function(req, res) {
      
      //Find one campground by id
      
        Campground.findById(req.params.id,function(err,campground){
            if(err)
            console.log(err);
            else{
                //Add comment to it
                res.render("campgrounds/show",{campground:campground});
            }
        });
        
    });
    
    // ==================================
    //CREATE-add new comment to DB
    // ==================================
    
      router.post("/",middleware.isLoggedIn,function(req,res){
        //lookup campground by id
        
        Campground.findById(req.params.id,function(err, campground) {
            if(err){
                console.log(err);
                res.redirect("/campgrounds");
            }else{
                //Create the comment which user typed through new
                Comment.create(req.body.comment,function(err,comment){
                    if(err){
                     req.flash("error","Something went wrong");
                    console.log(err);}
                    else{
                        //add username and id to comment
                        comment.author.id = req.user._id;
                        comment.author.username = req.user.username;
                        //save Comment
                        comment.save();
                        //connect new comment to campground
                        campground.comments.push(comment);
                        campground.save();
                        req.flash("success","Comment Added");
                        //redirect campground to show page
                        res.redirect("/campgrounds/"+campground._id);
                    }
                });
            }
        });
        
    });
    // ========================
    //EDIT-edit a comment 
    // ========================
    
    router.get("/:comment_id/edit",middleware.checkCommentOwnership,function(req,res){
         Campground.findById(req.params.id).populate("comments").exec(function(err, foundcampground) {
            if(err){
                console.log(err);
                res.redirect("/campgrounds");
            }else{
      
        Comment.findById(req.params.comment_id,function(err, foundComment) {
            if(err)
            res.redirect("back");
            else{
                res.render("campgrounds/show",{campground: foundcampground,comment:foundComment});
            }
        });
            }
    
    });
    });
    
    // ==================================
    //UPDATE-update a particular comment
    // ==================================
    
        router.put("/:comment_id",middleware.checkCommentOwnership,function(req,res){
        //find the campground and correct it
        Comment.findByIdAndUpdate(req.params.comment_id,req.body.comment,{new:true},function(err,updatedComment){
            if(err){
                console.log("UPDATE COMMENT :"+err);
                res.redirect("/campgrounds"+req.params.id);
            }else
           /* //redirect to show page
            res.redirect("/campgrounds/"+req.params.id);*/
            res.json(updatedComment);
        });
    });
    
    // ==================================
    //DESTROY-delete a particular comment
    // ==================================
    
    router.delete("/:comment_id",middleware.checkCommentOwnership,function(req,res){
       Comment.findByIdAndRemove(req.params.comment_id,function(err){
            if(err){
                console.log("DELETE COMMENT :"+err);
                res.redirect("back");
            }else{
                 req.flash("success","Comment Deleted");
                 res.redirect("/campgrounds/"+req.params.id);
            }
       
            
        });
    });
    

    
    module.exports=router;