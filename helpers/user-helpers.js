var db = require('../config/connection');
var collection = require('../config/collection');
const bcrypt = require('bcrypt');
var objectId=require('mongodb').ObjectId

module.exports = {
  doSignUp: (userData) => {
    return new Promise(async (resolve, reject) => {
        userData.Password = await bcrypt.hash(userData.Password, 10);
       const data = await db.get().collection(collection.USER_COLLECTION).insertOne(userData);
        const insertedUser = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: data.insertedId });
    resolve(insertedUser); //findOne will return all data of the id found
    //resolve(data.instertedId) // why bcz insertOne only returns id so call along insertedId
      
    });
  },
  doLogin:(userData)=>{     //userData is parameter contains details
    return new Promise(async(resolve,reject)=>{
        let loginStatus=false //loginStatus is declared but not used (optional; can be removed).
        let response={   // We'll use this to store the result and send it back
                                     //object response assigned null
        }//used response object here since we need to send more than one data ...{user and status}
        //To check if login succeeded or failed
        //To store logged-in user’s info for session and UI
        let user=await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
        if(user){
            bcrypt.compare(userData.Password,user.Password).then((status)=>{
                if(status){
                    console.log('login successful')
                    response.user=user  //user data indu // Attach full user data
                    response.status=true  // Indicate login success
                    resolve(response)   // Send the response back

                }
                else{
                    console.log('login error')
                    resolve({status:false})
                }
            })
        }
        else{
            console.log('user error')
            resolve({status:false})
        }
    })
  },
  addToCart: (proId, userId) => {
  let proObj = {
    item: new objectId(proId),
    quantity: 1
  };

  return new Promise(async (resolve, reject) => {
    let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new objectId(userId) });

    if (userCart) {
      //  Check if the product already exists
      let proExist = userCart.product.findIndex((product) => product.item.toString() === proId);
      console.log(proExist)

      if (proExist !== -1) { //if -1 prod doenst exist otherwise it will 0 measn already product exist any numbers
        //  Product exists, so increment quantity
        db.get().collection(collection.CART_COLLECTION)
          .updateOne(
            { user: new objectId(userId), "product.item": new objectId(proId) },
            { $inc: { "product.$.quantity": 1 } }
          )
          .then(() => 
            {
                resolve()
      })
            } else {
        // ✅ Product does not exist, so push new product
        db.get().collection(collection.CART_COLLECTION)
          .updateOne(
            { user: new objectId(userId) },
            { $push: { product: proObj } }
          )
          .then(() => resolve());
      }
    } else {
      // ✅ User does not have a cart yet, so create one
      let cartObj = {
        user: new objectId(userId),
        product: [proObj]
      };
      db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then(() => resolve());
    }
  });
},

 getCartProducts: (userId) => {
  return new Promise(async (resolve, reject) => {
    let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
      { $match: { user: new objectId(userId) } },
      { $unwind: "$product" },
      {
        $project: {
          item: "$product.item",
          quantity: "$product.quantity"
        }
      },
      {
        $lookup: {
          from: collection.PRODUCT_COLLECTION,
          localField: "item",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $project: {
          item: 1,
          quantity: 1,
          product: { $arrayElemAt: ["$product", 0] }
        }
      }
    ]).toArray();

    resolve(cartItems);
  });
},

getcartCount: (userId) => {
  return new Promise(async (resolve, reject) => {
    let count = 0;
    let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new objectId(userId) });
    if (cart && cart.product.length > 0) {
      count = cart.product.reduce((total, prod) => total + prod.quantity, 0);
    }
    resolve(count)
  })
},
changeProductQuantity: (details) => {
  details.count = parseInt(details.count);
  details.quantity = parseInt(details.quantity);

  return new Promise((resolve, reject) => {
    if (details.count == -1 && details.quantity == 1) {
      db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: new objectId(details.cart) },
          { $pull: { product: { item: new objectId(details.product) } } }
        )
        .then((response) => {
          resolve({ removeProduct: true });
        });
    } else {
      db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: new objectId(details.cart), "product.item": new objectId(details.product) },  // ✅ Fix here
          { $inc: { "product.$.quantity": details.count } }
        ) 
        .then((response) => {
          resolve({status:true});
        })
    }
  })
},

removeProductFromCart: (userId, productId) => {
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.CART_COLLECTION)
      .updateOne(
        { user: new objectId(userId) },
        { $pull: { product: { item: new objectId(productId) } } }
      )
      .then((response) => {
        resolve(response);
      })
      .catch((err) => reject(err));
  });
},
getTotalAmount: (userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
        { $match: { user: new objectId(userId) } },
        { $unwind: "$product" },
        {
          $project: {
            item: "$product.item",
            quantity: "$product.quantity"
          }
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: "item",
            foreignField: "_id",
            as: "product"
          }
        },
        {
          $project: {
            item: 1,
            quantity: 1,
            product: { $arrayElemAt: ["$product", 0] }
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $multiply: [
                  { $toInt: "$quantity" },
                  { $toDouble: "$product.Price" }
                ]
              }
            }
          }
        }
      ]).toArray();

      // ✅ Safely resolve even if total is empty
      if (total.length > 0 && total[0].total !== undefined) {
        resolve(total[0].total);
      } else {
        resolve(0); // 🟢 Return 0 if no items in cart
      }

    } catch (err) {
      reject(err);
    }
  });
},

getCartProductList: (userId) => {
  return new Promise(async (resolve, reject) => {
    let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new objectId(userId) });
    if (cart && cart.product) {
      resolve(cart.product);
    } else {
      resolve([]);  // ✅ return empty array if no cart or no products
    }
  })
},

placeOrder: (orderDetails, products, total) => {
  return new Promise((resolve, reject) => {
    //let status=orderDetails.payment-method==='COD'?'placed':'pending'
    let orderObj = {
      userId: new objectId(orderDetails.userId),
      deliveryDetails: {
        address: orderDetails.address,
        pincode: orderDetails.pincode,
        mobile: orderDetails.mobile
      },
      products: products,
      totalAmount: total,
      paymentMethod: orderDetails["payment-method"],
      status: orderDetails["payment-method"] === 'COD' ? 'Placed' : 'Pending',
      date: new Date()
    };

    db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((data) => {
      db.get().collection(collection.CART_COLLECTION).deleteOne({user:new objectId(orderDetails.userId)})
      resolve(data.insertedId);
    }).catch((err) => {
      reject(err);
    });
  });
},

  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let orders = await db.get().collection(collection.ORDER_COLLECTION)
          .find({ userId: new objectId(userId) }) // use `.find()` for multiple orders
          .toArray(); //  convert cursor to array

        console.log(orders); //  this will now work
        resolve(orders);     //  resolve with array of orders
      } catch (err) {
        console.error("Error fetching user orders:", err);
        reject(err);
      }
    });
  },
 getOrderProducts: (orderId) => {
  return new Promise(async (resolve, reject) => {
    let items = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
      { $match: { _id: new objectId(orderId) } },
      { $unwind: "$products" },
      {
        $project: {
          item: "$products.item",
          quantity: "$products.quantity"
        }
      },
      {
        $lookup: {
          from: collection.PRODUCT_COLLECTION,
          localField: "item",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $project: {
          item: 1,
          quantity: 1,
          product: { $arrayElemAt: ["$product", 0] }
        }
      }
    ]).toArray()
    resolve(items) 
  })
}


  }

