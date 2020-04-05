require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config') 
const ArticlesSerivce = require('./articles/articles-service')

const app = express()
const jsonParser = express.json()

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

app.get('/articles/:article_id', (req, res, next) => {
    const knexInstance = req.app.get('db')
    ArticlesSerivce.getById(knexInstance, req.params.article_id)
        .then(article => {
            if (!article) {
                return res.status(404).json({
                    error: { message: `Article doesn't exist` }
                })
            }
            res.json(article)
        })
        .catch(next)
})

app.get('/', (req, res) => {
    res.send('Hello, world!')
})

//to make post test pass we don't need to insert into the db table 
//we can read the body w. JSON body parser 
//then send a JSON response w. any numeric ID value
app.post('/articles', jsonParser, (req, res, next) => {
    /*res.status(201).json({
        ...req.body,
        id: 12,
    }) */

    //this allows our POST test to pass 
    //creating the article in the db 
    const { title, content, style } = req.body
    const newArticle = { title, content, style }
    ArticlesSerivce.insertArticle(
        req.app.get('db'),
        newArticle
    )
        .then(article => {
            res
                .status(201)
                .location(`/articles/${article.id}`) //allows location header assertion to pass
                .json(article)
        })
        .catch(next)
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