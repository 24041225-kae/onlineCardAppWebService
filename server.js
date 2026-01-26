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

const DEMO_USER = {
  id: 1,
  username:"admin",
  password:"admin123"
}

const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to protect routes
function requireAuth(req, res, next) {
  const header = req.headers.authorization; // "Bearer TOKEN"

  if (!header) {
    return res.status(401).json({ error: "Authorization header required" });
  }

  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Invalid authorization format" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // attach user info to request
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

app.post("/login", async (req,res)=>{
  const {username,password} = req.body;
  if (username===DEMO_USER.username||password !==DEMO_USER.password){
    return res.status(401).json({message:"Invalid credentials"});
  //create token using JWT secret
  const token=jwt.sign(
    {id:DEMO_USER.id, username:DEMO_USER.username},
    JWT_SECRET,
    {expiresIn:"1h"},
  );
res.json({token});
}}
);

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
"https://onlinecardappwebservice-y40v.onrender.com/"
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
app.post('/addcard', requireAuth, async (req, res)=>{
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

// Example Route: Update a card
app.put('/updatecard/:id', async (req, res) => {
    const { id } = req.params;
    const { card_name, card_pic } = req.body;
    if (!card_name || !card_pic) {
    return res
      .status(400)
      .json({ error: "card_name and card_pic are required" });
  }
    try{
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute('UPDATE cards SET card_name=?, card_pic=? WHERE id=?', [card_name, card_pic, id]);
        res.status(201).json({ message: 'Card ' + id + ' updated successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error - could not update card ' + id });
    }
});

// Example Route: Delete a card
app.delete('/deletecard/:id', async (req, res) => {
    const { id } = req.params;
    try{
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM cards WHERE id=?', [id]);
        res.status(201).json({ message: 'Card ' + id + ' deleted successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error - could not delete card ' + id });
    }
});

