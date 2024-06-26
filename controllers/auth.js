const mysql=require('mysql');

const jwt=require('jsonwebtoken');
const bcrypt=require('bcryptjs');
const dotenv = require('dotenv');
const express = require('express');
const app = express();
const multer = require('multer');
const path = require('path');
const { Console } = require('console');

// app.use(express.static('public'));

dotenv.config();
const db = mysql.createConnection({
    host: process.env.DATABSE_HOST,
    user: process.env.DATABSE_USER,
    password: process.env.DATABSE_PASSWORD,
    database: process.env.DATABASE
    
});
exports.register=(req,res)=>{
    console.log(req.body);
    const name= req.body.name;
    const email= req.body.email;
    const password= req.body.password;
    const confirmPassword= req.body['confirm-pass'];
db.query('SELECT email FROM user WHERE email=?',[email],async(error,results)=>{
    if(error){
        console.log(error);
    }
    if(results.length > 0){
        return res.render('register',{
            msg:'Email is already taken,Please Login in!',msg_type:"error"
        })

    }
    else if(password !== confirmPassword){
        return res.render('register',{
            msg:'Password do not match',msg_type:"error"
        }) ;
    }
    


    let hashedPassword = await bcrypt.hash(password, 8);
    console.log(hashedPassword);

    db.query('INSERT INTO User SET ?', { name: name, email: email, password: hashedPassword }, (error, results) => {
        if (error) {
            console.log(error);
            
        } else {
            console.log(results);
            return res.render('register', {
                msg: '"Registration successful. Please log in to access your account."',msg_type:"good"
            });
        }
    });
});
}

exports.login = async(req, res) => {
    const { email, password } = req.body; // req.body ->urlencoded,parseInt framewrok of expressjs
    if (email === 'admin@gmail.com' && password === 'admin') {
        res.status(200).redirect("/admin-dashboard");
    } 
    try {
       
        db.query('SELECT * FROM user WHERE email = ?', [email], async (error, results) => {
            if (error) {
                console.error("Error while querying database:", error);
            }

            if (results.length <= 0) {
                console.log("Email not found in database");
                return res.status(400).render('login', {
                            msg: 'New to the page? Please register.',msg_type:"error"
                        })           
                     }

            const user = results[0];
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (passwordMatch) {
                console.log("Correct password");
                const id=results[0].id;    
                   const token=jwt.sign({id:id},process.env.JWT_SECRET,{
                    expiresIn:process.env.JWT_EXPIRES_IN,
                   });
                   console.log(token);  
                   const cookieOptions={
                    expires:new Date(
                        Date.now()+
                        process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
                    httpOnly:true,
                   };      
                    res.cookie("Saranya",token,cookieOptions);
                    res.status(200).redirect("/auth-home");   
            } else {
                console.log("Incorrect password");
                    return res.status(400).render('login', {
                                msg: 'Please check your password',msg_type:"error"
                            })           
                         
            }
        });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.isLoggedIn = async (req, res, next) => {
    console.log("hihello");
    if (req.cookies && req.cookies.Saranya)  {
        try {
            const decoded = jwt.verify(req.cookies.Saranya, process.env.JWT_SECRET);
            db.query('SELECT * FROM user WHERE id = ?', [decoded.id], (error, results) => {
                // req.userId=decoded.id;
                // console.log("hii",userId);
                if (!results || results.length === 0) {
                    return next();
                }
                req.user = results[0];
                
                return next();
            });
        } catch (err) {
            console.log(err);
            return next();
        }
    } else {
        next();
    }
};


exports.checkAuthenticated = (req, res, next) => {
    if (req.cookies && req.cookies.Saranya) {
        try {
            const decoded = jwt.verify(req.cookies.Saranya, process.env.JWT_SECRET);
            db.query('SELECT * FROM user WHERE id = ?', [decoded.id], (error, results) => {
                if (!results || results.length === 0) {
                    res.clearCookie('Saranya');
                    res.render('login', {
                        msg: 'Please log in to book a package.',
                        msg_type: "error"
                    });
                } else {
                    req.user = results[0];
                    next();
                }
            });
        } catch (err) {
            console.log(err);
            res.clearCookie('Saranya');
            res.render('login', {
                msg: 'Please log in to book a package.',
                msg_type: "error"
            });
        }
    } else {
        res.render('login', {
            msg: 'Please log in to book a package.',
            msg_type: "error"
        });
    }
};

exports.bookNow = (req, res) => {
    const { packageName, days, peopleCount, price, startDate, endDate, accommodation, travelFacilities, phone } = req.body;
    
    // Decode the JWT again to extract the user ID
    const token = req.cookies.Saranya;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    console.log(userId);// Ensure req.user is set by the isLoggedIn middleware

    const bookingDetails = {
        user_id: userId,
        package_name: packageName,
        duration: days,
        people_count: peopleCount,
        price: price,
        start_date: startDate,
        end_date: endDate,
        accommodation: accommodation,
        travel_facilities: travelFacilities,
        phone: phone
    };

    db.query('INSERT INTO bookings SET ?', bookingDetails, (error, results) => {
        if (error) {
            console.log(error);
        } else {
            console.log(results);
           
            res.render("bookNow",{ 
                msg: 'Your booking has been successfully submitted. Our team will contact you soon.',
                msg_type: "good"});;
        }
    });

}

exports.enquiry = (req, res) => {
    const { packageName, numPeople, startDate, endDate, accommodation, travelFacilities, name, email, phone, message } = req.body;

    let contactDetails = {
        package_name: packageName,
        num_people: numPeople,
        start_date: startDate,
        end_date: endDate,
        accommodation: accommodation,
        travel_facilities: travelFacilities,
        name: name,
        email: email,
        phone: phone,
        message: message
    };//js object creation

    const token = req.cookies.Saranya;

    if (token) {
        
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            contactDetails.user_id = decoded.id;
     
    }

    db.query('INSERT INTO ENQUIRIES SET ?', contactDetails, (error, results) => {
        if (error) {
            res.render("enquiry", { 
                msg: 'Please fill all the required details.',
                msg_type: "error"
            });
        } else {
            console.log('Enquiry saved:', results);
            res.render("enquiry", { 
                msg: 'Your query has been successfully submitted. We will contact you soon.',
                msg_type: "good"
            });
        }
    });
};

exports.myBookings = (req, res) => {
    const userId = req.user.id;  //req.user ->inbuilt passport.js middleware  of expressjs
    console.log("userid",userId );
    db.query('SELECT * FROM bookings WHERE user_id = ?', [userId], (error, results) => {
    
        console.log("userid",req.user.name );
        if (error) {
            console.log(error);
            return res.status(500).render('error', { msg: 'Error fetching bookings' });
        }
       
        res.render('myBookings', {bookings: results,
            user: {
                name: req.user.name, // Accessing the updated req.user
                email: req.user.email
            } });
    });
};

exports.myEnquiries = (req, res) => {
    const userId = req.user.id;
    db.query('SELECT * FROM enquiries WHERE user_id = ?', [userId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).render('error', { msg: 'Error fetching enquiries' });
        }
        res.render('myEnquiries', {enquiries: results,
            user: {
                name: req.user.name, // Accessing the updated req.user
                email: req.user.email
            } });
    });
};

exports.adminBookings = (req, res) => {
    db.query('SELECT * FROM bookings', (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).render('error', { msg: 'Error fetching enquiries' });
        }
        res.render('adminBookings', { bookings: results });
    });
};
exports.adminEnqueries = (req, res) => {
    db.query('SELECT * FROM enquiries', (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).render('error', { msg: 'Error fetching enquiries' });
        }
        res.render('adminEnqueries', { enquiries: results });
    });
};
exports.viewPackages = (req, res) => {
    db.query('SELECT * FROM packages', (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).render('error', { msg: 'Error fetching packages' });
        }

        console.log("Packages retrieved:", results); // Debugging

        if (results.length === 0) {
            console.log("No packages found in the database.");
            return res.status(404).render('error', { msg: 'No packages found' });
        }

        res.render('adminPackages', { packages: results });
    });
};

exports.deletePackage = (req, res) => {
    const packageId = req.params.id;

    db.query('DELETE FROM packages WHERE id = ?', [packageId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ success: false, message: 'Error deleting package' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Package not found' });
        }

        return res.status(200).json({ success: true, message: 'Package deleted successfully' });
    });
};



exports.addPackage = (req, res) => {
    const { package_name, region, description, duration, people_count, price } = req.body;
    const imagePath = `uploads/${req.file.filename}`.replace(/\\/g, '/');
   
    const packageData = {
        package_name: package_name,
        region: region,
        description: description,
        days: duration,
        people_count: people_count,
        price: price,
        image_path: imagePath
    };

    db.query('INSERT INTO packages SET ?', packageData, (error, results) => {
        if (error) {
            console.log(error);
            return res.status(200).render('adminAddPackage', {
                msg: 'Fill the correct details ', msg_type: "error"
            });
        } else {
            return res.status(200).render('adminAddPackage', {
                msg: 'Package added successfully', msg_type: "success"
            });
        }
    });
};
exports.southPackages = (req, res) => {
    db.query("SELECT * FROM packages WHERE region = 'south'", (err, results) => {
        if (err) {
            console.error('Error fetching data: ', err);
            return res.status(500).send('Server error');
        }
        res.render('southPackages', { packages: results });
    });
};
exports.centralPackages = (req, res) => {
    db.query("SELECT * FROM packages WHERE region = 'Central'", (err, results) => {
        if (err) {
            console.error('Error fetching data: ', err);
            return res.status(500).send('Server error');
        }
        res.render('centralPackages', { packages: results });
    });
};
exports.westPackages = (req, res) => {
    db.query("SELECT * FROM packages WHERE region = 'West'", (err, results) => {
        if (err) {
            console.error('Error fetching data: ', err);
            return res.status(500).send('Server error');
        }
        res.render('westPackages', { packages: results });
    });
};
exports.eastPackages = (req, res) => {
    db.query("SELECT * FROM packages WHERE region = 'East'", (err, results) => {
        if (err) {
            console.error('Error fetching data: ', err);
            return res.status(500).send('Server error');
        }
        res.render('eastPackages', { packages: results });
    });
};
exports.northPackages = (req, res) => {
    db.query("SELECT * FROM packages WHERE region = 'North'", (err, results) => {
        if (err) {
            console.error('Error fetching data: ', err);
            return res.status(500).send('Server error');
        }
        res.render('northPackages', { packages: results });
    });
};

exports.getPackageById = (req, res) => {
    const packageId = req.params.id;

    db.query('SELECT * FROM packages WHERE id = ?', [packageId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ success: false, message: 'Error fetching package' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Package not found' });
        }

        res.status(200).json(results[0]);
    });
};
exports.editPackage = (req, res) => {
    const packageId = req.params.id;

    db.query('SELECT * FROM packages WHERE id = ?', [packageId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ success: false, message: 'Error fetching package' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Package not found' });
        }

        // Render the editPackage view and pass the package data to it
        res.render('editPackage', { package: results[0], packageId: packageId });
    });
};


// Update package in the database
// exports.updatePackage = (req, res) => {
//     const packageId = req.params.id;
//     const { package_name, region, description, duration, people_count, price } = req.body;
//     const imagePath = `uploads/${req.file.filename}`.replace(/\\/g, '/');

//     const packageData = {
//         package_name: package_name,
//         region: region,
//         description: description,
//         days: duration,
//         people_count: people_count,
//         price: price,
//         image_path: imagePath
//     };

//     db.query('UPDATE packages SET ? WHERE id = ?', [packageData, packageId], (error, results) => {
//         if (error) {
//             console.log(error);
//             return res.status(500).json({ success: false, message: 'Error updating package' });
//         } else {
//             return res.status(200).json({ success: true, message: 'Package updated successfully' });
//         }
//     });
// };
exports.updatePackage = (req, res) => {
    const packageId = req.params.id;
    const { package_name, region, description, duration, people_count, price } = req.body;
    let imagePath = req.body.existing_image_path; // Use the existing image path by default

    // Check if a new file was uploaded
    if (req.file) {
        imagePath = `uploads/${req.file.filename}`.replace(/\\/g, '/');
    } 

    const packageData = {
        package_name: package_name,
        region: region,
        description: description,
        days: duration,
        people_count: people_count,
        price: price,
        image_path: imagePath
    };

    db.query('UPDATE packages SET ? WHERE id = ?', [packageData, packageId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(400).render('editPackage', {
                msg: 'Error updating package', msg_type: "error"
            });
        } else {
            return res.status(200).render('editPackage', {
                msg: 'Package updated successfully', msg_type: "success"
            });
        }
    });
};
