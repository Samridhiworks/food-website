const express= require('express')
const addFood = require('../controllers/FoodController')
const multer = require ('multer')

const foodRouter = express.Router(); //bcz of router we can create get post and many other method


foodRouter.post('/add',addFood)


export {foodRouter}