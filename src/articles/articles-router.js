const path = require('path')
const express = require('express')
const xss = require('xss')
const ArticlesService = require('./articles-service')

const articlesRouter = express.Router()
const jsonParser = express.json()

const serializeArticle = article => ({
    id: article.id,
    style: article.style,
    title: xss(article.title), //sanitize title
    content: xss(article.content), //sanitize content
    date_published: article.date_published,
  })

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
                //.location() => allows location header assertion to pass
                //req.originalUrl => contains string of full request URL
                // auto adjusts to our deployed URL 
                .location(path.posix.join(req.originalUrl, `/${article.id}`)) 
                .json(serializeArticle(article))
        })
        .catch(next)
    })

articlesRouter
    .route('/:article_id')
    .all((req, res, next) => {
        ArticlesService.getById(
            req.app.get('db'),
            req.params.article_id
        )
            .then(article => {
                if (!article) {
                    return res.status(404).json({
                        error: { message: `Article doesn't exist` }
                    })
                }
                res.article = article //save the article for the next middleware
                next() //calling next so next middleware happens
            })
    })
    .get((req, res, next) => {
        res.json(serializeArticle(res.article))
    })
    .delete((req, res, next) => {
        ArticlesService.deleteArticle(
            req.app.get('db'),
            req.params.article_id
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const { title, content, style } = req.body
        const articleToUpdate = { title, content, style }

        //validation checks if article to update has any values that aren't null or undefined
        //if there are no truthy valies => error out
        const numberOfValues = Object.values(articleToUpdate).filter(Boolean).length
        if (numberOfValues === 0) {
            return res.status(400).json({
                error: { message: `Request body must contain either 'title', 'style' or 'content'`}
            })
        }

        ArticlesService.updateArticle(
            req.app.get('db'),
            req.params.article_id,
            articleToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = articlesRouter