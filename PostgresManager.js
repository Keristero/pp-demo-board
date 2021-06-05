const pgp = require('pg-promise')()
const config = require('./environment.js')

class PostgresManagerSingleton{
    constructor(){
        this.schema = config.TIMESCALE_MASTER_SCHEMA
        this.db = pgp({
            user: config.TIMESCALE_MASTER_USER,
            host: config.TIMESCALE_MASTER_ADDRESS,
            database: config.TIMESCALE_MASTER_DATABASE,
            password: config.TIMESCALE_MASTER_PASSWORD,
            port: config.TIMESCALE_MASTER_PORT,
            ssl:false,
            schema: config.TIMESCALE_MASTER_SCHEMA,
            dialect: 'postgres',
        })
    }
    /**
     * 
     * @param {string} queryText INSERT INTO users(name, email) VALUES($1, $2) RETURNING *'
     * @param {Array<string>} queryValues ['brianc', 'brian.m.carlson@gmail.com']
     */
    async Query(queryText,queryValues){
        try {
            const res = await this.db.any(queryText, queryValues)
            return res
        } catch (err) {
            console.log(err.stack)
        }
    }
    
}

module.exports = new PostgresManagerSingleton()