const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeArticlesArray } = require('./articles.fixtures')

describe.only('Articles Endpoints', function() {
    let db 

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('blogful_articles').truncate())

    afterEach('cleanup', () => db('blogful_articles').truncate())

    describe(`GET /articles`, () => {
        context(`Given no articles`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/articles')
                    .expect(200, [])
            })
        })

        context('Given there are articles in the database', () => {
            const testArticles = makeArticlesArray()

            beforeEach('insert articles', () => {
                return db
                    .into('blogful_articles')
                    .insert(testArticles)
            })

            it('responds with 200 and all of the articles', () => {
                return supertest(app)
                    .get('/articles')
                    .expect(200, testArticles)
            })
        }) 
    })

    describe(`GET /articles/:article_id`, () => {
        context(`Given no articles`, () => {
            it(`responds with 404`, () => {
                const articleId = 123456
                return supertest(app)
                    .get(`/articles/${articleId}`)
                    .expect(404, { error: { message: `Article doesn't exist` } })
            })
        })
        context('Given there are articles in the database', () => {
            const testArticles = makeArticlesArray()

            beforeEach('insert articles', () => {
                return db
                    .into('blogful_articles')
                    .insert(testArticles)
            })

            it('GET /articles/:article_id responds with 200 and the specified article', () => {
                const articleId = 2
                const expectedArticle = testArticles[articleId - 1]
                return supertest(app)
                    .get(`/articles/${articleId}`)
                    .expect(200, expectedArticle)
            })
         //TO DO:  NOT WORKING PROPERLY (time exceeded 2000ms)
        })
    })

    //POST /articles
    describe(`POST /articles`, () => {
        it(`creates an article, responding with 201 and the new article`, function() {
            this.retries(3) //
            const newArticle = {
                title: 'Test new article',
                style: 'Listicle',
                content: 'Test new article content...'
            }
            //implementation to ensure that article is being created 
            return supertest(app)
                .post('/articles')
                .send(newArticle)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(newArticle.title)
                    expect(res.body.style).to.eql(newArticle.style)
                    expect(res.body.content).to.eql(newArticle.content)
                    expect(res.body).to.have.property('id')
                    //adding 1st assertion to test => response should contain location header for new article
                    expect(res.headers.location).to.eql(`/articles/${res.body.id}`)
                    //2nd assertion => generate current d-t using new Date() w. no args
                    //.toLocaleString => fixes milisecond difference that makes test fail 
                    const expected = new Date().toLocaleString()
                    const actual = new Date(res.body.date_published).toLocaleString()
                    expect(actual).to.eql(expected)
                })
                //utlizing working GET endpoints to validate that POST adds article to the db
                //chained .then block off supertest request
                //2nd req is for GET /article/:article_id => validates that both response bodies
                //.. (POST & GET response body) match
                //used impplicit return inside .then => Mocha knows to wait for both requests to resolve
                .then(res => 
                    supertest(app)
                        .get(`/articles/${res.body.id}`)
                        .expect(res.body)    
                )
        })
    })
})

