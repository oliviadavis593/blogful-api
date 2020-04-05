//#1: Making a service object involves making an object that we'll export

//#2: Putting methods on this object that store our transactions 
//1st method for getting all articles => getAllArticles (service objects method for READ part of CRUD)
const ArticlesService = {
    getAllArticles(knex) {
        return knex.select('*').from('blogful_articles')
    },
    //creating a method & having it return a promise => ADDING ARTICLES
    insertArticle(knex, newArticle) {
        //return Promise.resolve({})
     return knex
         .insert(newArticle)
         .into('blogful_articles')
         .returning('*')
         .then(rows => {
             return rows[0]
         })
    },
    // GETTING AN ARTICLE BY ID 
    getById(knex, id) {
        return knex('blogful_articles').select('*').where('id', id).first();
    },
    //DELETING AN ARTICLE
    deleteArticle(knex, id) {
     return knex('blogful_articles')
          .where({ id })
          .delete()
     },
     //UPDATING AN ARTICLE
     updateArticle(knex, id, newArticleFields) {
         return knex('blogful_articles')
             .where({ id })
             .update(newArticleFields)
     }
 }
 module.exports = ArticlesService