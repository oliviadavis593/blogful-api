const express = require('express')
const ArticlesService = require('./articles-service')

const articlesRouter = express.Router()
const jsonParser = express.json()

articlesRouter 
    .route('/')
    .get((req, res, next) => {
        ArticlesService.getAllArticles(
            req.app.get('db')
        )
            .then(articles => {
                res.json(articles)
            })
            .catch(next)
    })
    //to make post test pass we don't need to insert into the db table 
    //we can read the body w. JSON body parser 
    //then send a JSON response w. any numeric ID value
    .post(jsonParser, (req, res, next) => {
        //this allows our POST test to pass 
        //creating the article in the db 
        const { title, content, style } = req.body
        const newArticle = { title, content, style }

        /*
        //makes POST validation test pass (title)
        if (!title) {
            return res.status(400).json({
                error: { message: `Missing 'title' in request body`}
            })
        }

        //makes POST validation test pass (content)
        if (!content) {
            return res.status(400).json({
                error: { message: `Missing 'content' in request body` }
            })
        }

        Note: Style doesn't need an if statement as the refactoring below takes care of it 
        */

        /*Refactored code for POST validation title, content & style */
        for (const [key, value] of Object.entries(newArticle)) {
            if (value == null) {
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body`}
                })
            }
        }

        ArticlesService.insertArticle(
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

articlesRouter
    .route('/:article_id')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        ArticlesService.getById(knexInstance, req.params.article_id)
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

module.exports = articlesRouter