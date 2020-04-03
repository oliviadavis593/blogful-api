require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config') 
const ArticlesSerivce = require('./articles-service')

const app = express()

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())

app.get('/articles', (req, res, next) => {
    const knexInstance = req.app.get('db')
    //we want to use ArticlesService.getAllArticles inside endpoint => to populate response
   ArticlesSerivce.getAllArticles(knexInstance)
    .then(articles => {
        res.json(articles)
    })
     //passing next into .catch from promise chain so that any error get 
     //handled by our error handler middleware
    .catch(next)
})

app.get('/', (req, res) => {
    res.send('Hello, world!')
})


app.use((error, req, res, next) => {
    let response

    if (NODE_ENV === 'production') {
        response = { error: { message: 'server error '}}
    } else {
        console.error(error)
        response = { error }
    }
    res.status(500).json(response)
})

module.exports = app; 