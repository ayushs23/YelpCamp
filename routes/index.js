var express     = require("express"),
    router      = express.Router(),
    passport    = require("passport"),
    User        = require("../models/user"),
    Campground  = require("../models/campground"),
    async       = require("async"),
    nodemailer  = require("nodemailer"),
    crypto      = require("crypto");
    
var api_key = 'df553a62c5f766afd99114158fefcd7e-29b7488f-bd196486';
var domain = 'sandbox3567d60ebf534b46a75af31c2a4ae3c1.mailgun.org';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});
    
require('dotenv').config();
    // ==================================
    //Root Route
    // ==================================
    
    router.get("/",function(req, res) {
       res.render("landing"); 
    });

    // ==================================
    //Authorization Routes
    // ==================================
    
    //show register form
    router.get("/register",function(req, res) {
        res.render("register",{page:'register'});
    });
    
    //handle signUp form
   router.post("/register",function(req, res) {
        var newUser=new User({
            username:req.body.username,
            avatar:req.body.avatar,
            firstName:req.body.firstName,
            lastName:req.body.lastName,
            email:req.body.email
        });
        if(req.body.adminCode ==="adminPass"){
            newUser.isAdmin=true;
        }
        User.register(newUser,req.body.password,function(err,user){
            if(err){
                req.flash("error",err.message);
                if(err.message==='E11000 duplicate key error collection: Yelp_camp_v8.users index: email_1 dup key: { : "a.shr310@gmail.com" }'){
                    return res.render("register",{error: 'A user with similar E-mail already exists'});
                }
                return res.render("register",{error: err.message});
            }
            passport.authenticate("local")(req,res,function(){
                req.flash("success","Welcome to the YelpCamp "+user.username);
                res.redirect("/campgrounds");
            });
        });
    });
    
    //Login form
    router.get("/login",function(req, res) {
   
        res.render("login",{page:'login'});
    });
    //handling login form
    router.post("/login",passport.authenticate("local",
    {successRedirect:"/campgrounds",
     failureRedirect:"/login"    
    }),function(req,res){      
    });
    
    //Logout form
    router.get("/logout",function(req, res) {
        req.logout();
         req.flash("success","You Logged out from YelpCamp successfully");
        res.redirect("/campgrounds");
    });
    
    //User Profile
    router.get("/users/:id",function(req, res) {
        User.findById(req.params.id,function(err,foundUser){
            if(err){
                req.flash("error","Something went wrong");
                res.redirect("back");
            }
            Campground.find().where('author.id').equals(foundUser._id).exec(function(err,foundcampgrounds){
                if(err){
                    req.flash("error","Something went wrong"+err.message);
                    res.redirect("back",{error:err.message});
                }
                res.render("users/profile",{user:foundUser,campgrounds:foundcampgrounds});
            })
        })
    })
    
    //forgot password
    router.get('/forgot',function(req, res) {
        res.render("forgot",{page:'forgot'});
    });
    
  //handling forgot form sending email token
  router.post('/forgot',function(req,res){

       async.waterfall([
            function(done){
                crypto.randomBytes(20,function(err,buf){
                    var token=buf.toString('hex');
                    done(err,token);
                })    
            },
    function(token, done) {
      User.findOne({ $and: [{email:req.body.email},{username:req.body.username}]}, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 1800000; // 30 min

        user.save(function(err) {
          done(err, token, user);
        });
      });
    }
    , function(token, user, done) {
        
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'a.shr310@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'a.shr310@gmail.com',
        subject: 'YelpCamp Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });

    }
  ],function(err){
                if(err) {
                
                    req.flash("error","error "+err.message);
                    res.redirect("/campgrounds");}
                else
                res.redirect("/forgot");
            });
    });
    //To handle the token and reset the password
    router.get("/reset/:token",function(req, res) {
        User.findOne({resetPasswordToken:req.params.token,resetPasswordExpires:{$gt:Date.now()}},function(err,user){
            if(!user){
                req.flash("error","Password reset token is invalid or token is expired"+err.message);
                return res.redirect("/forgot");
            }
                res.render("reset",{token:req.params.token});
        });
    });
    //To set the new password for the account
    router.post("/reset/:token",function(req, res) {
        async.waterfall([
            function(done){
            User.findOne({resetPasswordToken:req.params.token,resetPasswordExpires:{$gt:Date.now()}},function(err, user) {
                if(!user){
                    req.flash("error","Password reset token expired or is invalid");
                    return res.redirect("/forgot");
                }
                    if(req.body.newpassword===req.body.confirmpassword){
                        user.setPassword(req.body.newpassword,function(err){
                           user.resetPasswordToken=undefined;
                           user.resetPasswordExpires=undefined;
                           
                           user.save(function(err){
                               req.logIn(function(err){
                                   done(err,user);
                               });
                           });
                        });
                    }else{
                        req.flash("error","Passwords Doesn't Match");
                        res.redirect("/back");
                    }
            });
            },function(user,done){
                
     var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'a.shr310@gmail.com',
          pass: process.env.GMAILPW
        }
      });     

      var mailOptions = {
        to: user.email,
        from: 'a.shr310@gmail.com',
        subject: 'YelpCamp Password Change Request',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });          
            }
            ],function(err){
                res.redirect("/campgrounds");
            });
    });
    

      module.exports=router;