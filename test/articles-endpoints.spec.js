const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')

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

    context('Given there are articles in the database', () => {
        const testArticles = [
            {
                id: 1, 
                date_published: '2029-01-22T16:28:32.615Z',
                title: 'First test post!',
                style: 'How-to',
                content: 'Lorem ipsum dolor sit amet'
            },
            {
                id: 2, 
                date_published: '2100-05-22T16:28:32.615Z',
                title: 'Second test post!',
                style: 'News',
                content: 'Lorem ipsum dolor sit amet' 
            },
            {
                id: 3, 
                date_published: '1919-12-22T16:28:32.615Z',
                title: 'Third test post!',
                style: 'Listicle',
                content: 'Lorem ipsum dolor sit amet'
            },
        ];

        beforeEach('insert articles', () => {
            return db 
                .into('blogful_articles')
                .insert(testArticles)
        })

        it('GET /articles response with 200 and all of the articles', () => {
            return supertest(app)
                .get('/articles')
                .expect(200)
                .expect(200, testArticles)
        })
    })
})