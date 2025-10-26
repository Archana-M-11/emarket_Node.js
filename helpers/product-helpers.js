var db = require('../config/connection');
var collection = require('../config/collection');
var ObjectId = require('mongodb').ObjectId; // Capital "O"
const bcrypt = require('bcrypt');

module.exports = {
  

  // Add product
  addproduct: (product) => {
    return new Promise(async (resolve, reject) => {
      const result = await db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product);
      resolve(result.insertedId);
    });
  },

  // Get all products
  getAllproduct: () => {
    return new Promise(async (resolve, reject) => {
      const products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray();
      resolve(products);
    });
  },

  // Delete product
  deleteproduct: (proId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION)
        .deleteOne({ _id: new ObjectId(proId) }) // ✅ FIXED
        .then((response) => {
          resolve(response);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getProductDetails: (proId) => {
  return new Promise((resolve, reject) => {
    db.get().collection(collection.PRODUCT_COLLECTION)
      .findOne({ _id: new ObjectId(proId) })
      .then((product) => {
        resolve(product);
      })
      
  })
},
updateProduct:(proId,proDetails)=>{
  return new Promise((resolve,reject)=>{
    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id: new ObjectId(proId)},{
      $set :{
        Name:proDetails.Name,
        Description:proDetails.Description,
        Price:proDetails.Price,
        Category:proDetails.Category
      }
    }).then(()=>{
      resolve()
    })
  })
}

}
