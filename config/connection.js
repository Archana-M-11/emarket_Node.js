const  MongoClient  = require('mongodb').MongoClient

const state = { 
    db: null 

}

module.exports.connect = async function (done) {
  const url = 'mongodb://localhost:27017';
  const dbname='shopping'

    const data = await MongoClient.connect(url);  // removed options
    state.db = data.db(dbname); // or specify db name if needed 
    done();
}

module.exports.get = () => 
    {
        return state.db;
    }