const express=require('express');
const router=express.Router();
const authController=require('../controllers/auth');


router.get("/",(req,res) => {
    res.render("userIndex");
});


router.get("/auth-home", authController.isLoggedIn, (req, res) => {
    res.render("userIndex", { user: req.user });
});


router.get("/login", (req, res) => {
    res.render("login");
});

router.get('/logout', (req, res) => {
    res.cookie('Saranya', '', { expires: new Date(0) }); // Clear the cookie
    res.redirect('/');
});


router.get("/register",(req,res) => {
    res.render("register");
});
router.get("/myBookings",authController.isLoggedIn, authController.myBookings,(req, res) => {
    res.render("myBookings",{ user: req.user });
});
router.get("/myEnquiries",authController.isLoggedIn,authController.myEnquiries, (req, res) => {
    res.render("myEnquiries");
});
router.get("/northPackages",(req,res) => {
    res.render("northPackages");
});
router.get("/centralPackages",(req,res) => {
    res.render("centralPackages");
});
router.get("/westPackages",(req,res) => {
    res.render("westPackages");
});
router.get("/southPackages",(req,res) => {
    res.render("southPackages");
});
router.get("/eastPackages",(req,res) => {
    res.render("eastPackages");
});
router.get("/adventure",(req,res) => {
    res.render("adventure");
});
router.get("/bookNow",authController.checkAuthenticated, (req, res) => {
    res.render("bookNow");
});
router.get("/enquiry", (req, res) => {
    res.render("enquiry");
});


router.get("/admin-dashboard", authController.isLoggedIn, (req, res) => {
    res.render("adminIndex");
});
router.get("/adminBookings", authController.adminBookings,(req, res) => {
    res.render("adminBookings");
});

router.get("/adminEnqueries", authController.adminEnqueries,(req, res) => {
    res.render("adminEnqueries");
});
router.get("/adminPackages", authController.viewPackages,(req, res) => {
    res.render("adminPackages");
});
router.get("/adminAddPackage",(req, res) => {
    res.render("adminAddPackage");
});

module.exports=router;