const express=require('express');

const authController=require('../controllers/auth');
const router=express.Router();
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads'); // Destination directory for uploaded images
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Renaming the uploaded file
    }
});
const upload = multer({ storage: storage });


router.post('/register', authController.register);
router.post('/login', authController.login)
router.post('/bookNow', authController.bookNow);
router.post('/enquiry', authController.enquiry);
router.post('/myBookings', authController.myBookings);
router.post('/myEnquiries', authController.myEnquiries);
router.get('/southPackages', authController.southPackages);
router.get('/centralPackages', authController.centralPackages);
router.get('/northPackages', authController.northPackages);
router.get('/eastPackages', authController.eastPackages);
router.get('/westPackages', authController.westPackages);

router.get('/adminPackages', authController.viewPackages);
router.delete('/packages/:id', authController.deletePackage);
router.post('/adminAddPackage', upload.single('area_image'), authController.addPackage);
router.post('/add-package', upload.single('area_image'), authController.addPackage);
router.get('/adminAddPackage', (req, res) => {
    // Here you can render the page where administrators can add packages
    // For example:
    res.render('adminAddPackage', { title: 'Admin Add Package' });
});
router.get('/editPackage/:id', (req, res) => {
    const packageId = req.params.id;
    res.render('editPackage', { packageId: packageId });
});
router.post('/updatePackage/:id', upload.single('area_image'), authController.updatePackage);
router.get('/packages/:id', authController.getPackageById);


module.exports=router;