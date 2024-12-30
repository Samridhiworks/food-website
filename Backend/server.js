const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const multer = require('multer');
const session = require('express-session');
const crypto = require('crypto')
const token = require('jsonwebtoken')
const Food = require('./models/foodModel'); // importing food schema

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For form submissions
app.use(cors());
//serving images folder-- TO SEE IMAGES on browser
app.use("/images",express.static('uploads'))
app.use(express.static(path.join(__dirname,'public')))

//serve react files
const reactBuildPath = path.join(__dirname, 'Components'); // Correctly defined here
app.use(express.static(reactBuildPath));

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Default Route
app.get('/', (req, res) => {
   res.sendFile(path.join(__dirname,'index.html'))
});

// Image Upload Configuration
let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads/')); // Corrected typo
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Add timestamp for unique filenames
    }
});

let upload = multer({ storage: storage });

// MongoDB Connection
mongoose.connect(process.env.URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('Error in connecting to MongoDB:', error);
});

// Serve the Form
app.get('/add', (req, res) => {
    res.sendFile(path.join(__dirname, 'public','add.html'));
});

// API Endpoint to Add Data
app.post('/add', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send(`<h1>Image is required</h1><a href="/add">Go Back</a>`);
        }

        const newFood = new Food({
            name: req.body.name,
            description: req.body.description,
            category: req.body.category,
            price: req.body.price,
            image: req.file.filename, // Save the filename
        });

        await newFood.save();
        console.log('Data saved successfully');
        res.send(`<h1>Data Saved Successfully</h1><a href="/">Go Back</a>`);
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).send(`<h1>Error Saving Data</h1><p>${error.message}</p>`);
    }
});


//to show or find the database
app.get('/list',async(req,res)=>{
    try{
        const foods = await Food.find({});
        res.json({success:true,data:foods})
    }catch(error){
        console.log('errror in fetching data.....')
        res.json({success:false,message:"error in fetching data"})
    }
})

app.get('/delete', async (req, res) => {
    try {
        const id = req.query.id;
        if (!id) {
            return res.status(400).send('ID is required');
        }

        const deleteFood = await Food.deleteOne({ _id: id });

        console.log('Food item deleted successfully');
        res.send('Deleted successfully');
    } catch (error) {
        console.error('Error deleting food item:', error);
        res.status(500).send('Error deleting food item');
    }
});


app.get('/orders',(req,res)=>{
    res.sendFile(path.join(__dirname,'public','Orders.html'))
})




app.get('/api/food', async (req, res) => {
    try {
      const foodItems = await Food.find(); 
      res.json({ success: true, data: foodItems });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch food items." });
    }
  });

  //user authentication code starts here
  const userdetails={
     username : 'admin',
     password : 'admin'
  }

  //creating session
  app.use(
    session({
        secret:process.env.SECRET,
        resave:false,
        saveUninitialized:false
    })
  )

  //creating cryptoId
  const cryptoId = () =>{
    return crypto.randomBytes(16).toString('hex')
  }


  app.get('/login',(req,res)=>{
    res.sendFile(path.join(__dirname,'public','login.html'))
  })
  
  app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === userdetails.username && password === userdetails.password) {
      const user = { id: cryptoId(), username: 'admin' };
      console.log(user);
      req.session.user = user; // Store user in session
      res.redirect('/'); // Redirect to home/dashboard
    } else {
      res.send(`
        <script>
          alert('Invalid user details');
          window.location.href = '/login';
        </script>
      `);
    }
  });

  //creating middleware for userauthentication
  const checkauth =(req,res,next)=>{
    if(req.session.user){
        next();
    }else{
        res.redirect('/login')
    }
  }

  app.get('/logout',(req,res)=>{
    req.session.destroy(()=>{
        console.log('session ended')
    })
    res.redirect('/login')
  })
  
// Start the Server
app.listen(process.env.PORT, () => {
    console.log(`Server started running on http://localhost:${process.env.PORT}`);
});
