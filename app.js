    var express         = require("express"),
        app             = express(),
        bodyParser      = require("body-parser"),
        mongoose        = require("mongoose"),
        moment          = require('moment'),
        flash           = require("connect-flash"),
        passport        = require("passport"),
        LocalStrategy   = require("passport-local"),
        Campground      = require("./models/campground"),
        Comment         = require("./models/comment"),
        User            = require("./models/user"),
        seedsDB         = require("./seeds"),
        methodOverride  = require("method-override");
        
// configure dotenv
require('dotenv').config();

    var campgroundRoutes    = require("./routes/campgrounds.js"),
        commentRoutes       = require("./routes/comments.js"),
        indexRoutes         = require("./routes/index.js");
        
     var url=process.env.DATABASEURL || '"mongodb://localhlp_cost/Yeamp_v9", {useNewUrlParser: true }';
        
        mongoose.connect(url);
       
        app.use(bodyParser.urlencoded({extended:true}));
        app.set("view engine","ejs");  
        app.use(express.static(__dirname+"/public"));
        app.use(methodOverride("_method"));
        app.use(flash());
       
// seedsDB(); //Seed The Database 
    app.locals.moment = require('moment');
    moment().format();
    //Passport Configuration
    app.use(require("express-session")({
        secret:"Alsran",
        resave:false,
        saveUninitialized: false
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    passport.use(new LocalStrategy(User.authenticate()));
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());
    
    app.use(function(req, res, next){
        res.locals.currentUser=req.user;
        res.locals.error=req.flash("error");
        res.locals.success=req.flash("success");
        next();
    });

        
    app.use("/campgrounds",campgroundRoutes);
    app.use("/campgrounds/:id/comments",commentRoutes);
    app.use("/",indexRoutes);

    app.listen(process.env.PORT,process.env.IP,function(req,res){
       console.log("YelpCamp Server is Started"); 
    });