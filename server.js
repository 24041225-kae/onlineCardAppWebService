const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();
const port = 3000;

//database config info
const dbConfig = {
    //get these details from the env varaibles that set on host server
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections : true,
    connectionLimit: 100,
    queueLimit: 0,
};

//initialise express app
const app = express();
//helps app to read JSON
app.use(express.json());

//start server
app.listen(port, ()=>{
    console.log('Server running on port', port);
});


const cors = require("cors");
const allowedOrigins = [
    "http://localhost:3000",
// "https://YOUR-frontend.vercel.app", // add later
// "https://YOUR-frontend.onrender.com" // add later
];
app.use(
    cors({
        origin: function (origin, callback) {
// allow requests with no origin (Postman/server-to-server)
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error("Not allowed by CORS"));
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: false,
    })
);

//route: GET all cards
app.get('/allcards', async (req, res) => {
    try{
        let connection = await mysql.createConnection(dbConfig); //connects aiven database server
        const [rows] = await connection.execute('SELECT * FROM defaultdb.cards'); //executes mysql query to get rows from cards table
        res.json(rows); //displays retrieved data in JSON
    } catch (err){
        //displays if server got error
        console.log(err);
        res.status(500).json({message: 'Server error for allcards'});
    }
});

//route: create a new card
app.post('/addcard', async (req, res)=>{
    const {card_name, card_pic} = req.body;
    try{
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute('INSERT INTO cards (card_name, card_pic) VALUES (?,?)', [card_name, card_pic]); //adds new row
        res.status(201).json({message: 'Card ' +card_name+' added successfully'}); //display msg
    } catch(err){
        console.log(err);
        res.status(500).json({message: 'Server error - could not find card '+card_name});
    }
});