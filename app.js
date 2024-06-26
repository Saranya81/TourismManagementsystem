const express=require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const path= require('path');
const dotenv = require('dotenv');
dotenv.config({ path:'./.env'});
const cookieParser=require("cookie-parser");
const hbs = require('hbs');
const auth = require('./routes/auth'); 

const app=express();

const db = mysql.createConnection({
    host: process.env.DATABSE_HOST,
    user: process.env.DATABSE_USER,
    password: process.env.DATABSE_PASSWORD,
    database: process.env.DATABASE
    
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));
app.use(cookieParser());

// Registerthe helper =>to make it use in our handlebars template
hbs.registerHelper('formatDate', function (dateString) {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-US', { timeZone: 'UTC' });
    return formattedDate;
});

app.use(auth);


app.set('view engine','hbs');

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err);
        return;
    }
    console.log('Connected to MySQL database!');
});

app.use('/',require('./routes/pages'));
app.use('/auth',require('./routes/auth'));
app.listen(3000, () => {
    console.log("Server is running on port  5000");
});
