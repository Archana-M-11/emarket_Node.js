var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers');
var userHelpers = require('../helpers/user-helpers');

// ✅ Middleware to check if user is logged in
const verifyLogin = (req, res, next) => {
  if (req.session.user && req.session.user.loggedIn) {
    next();
  } else {
    res.redirect('/login');
  }
};


/* ✅ Home Page */
router.get('/', async function (req, res) {
  let user = req.session.user;
  let cartCount = null;

  if (user && user.loggedIn) {
    cartCount = await userHelpers.getcartCount(user._id);
  } else {
    user = null;
  }

  productHelpers.getAllproduct().then((products) => {
    res.render('user/view-product', { products, user, cartCount });
  });
});

/* ✅ Login Page */
router.get('/login', (req, res) => {
  if (req.session.user) {
    res.redirect('/');
  } else {
    res.render('user/login', { loginErr: req.session.userLoginErr });
    req.session.userLoginErr = false;
  }
});

/* ✅ Signup Page */
router.get('/signup', (req, res) => {
  res.render('user/signup');
});

/* ✅ Signup POST */
router.post('/signup', (req, res) => {
  userHelpers.doSignUp(req.body).then(() => {
    res.redirect('/login');
  });
});

/* ✅ Login POST */
router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.user;
      req.session.user.loggedIn = true;
      req.session.userLoggedIn = true; // ✅ Important fix!
      res.redirect('/');
    } else {
      req.session.userLoginErr = "Invalid username or password";
      res.redirect('/login');
    }
  });
});

/* ✅ Logout */
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      res.redirect('/');
    } else {
      res.redirect('/login');
    }
  });
});


/* ✅ View Cart */
router.get('/cart', verifyLogin, async (req, res) => {
  let user = req.session.user;
  let product = await userHelpers.getCartProducts(user._id);
  let totalValue = await userHelpers.getTotalAmount(user._id);
  res.render('user/cart', { user, product, totalValue });
});

/* ✅ Add to Cart */
router.get('/add-to-cart/:id', verifyLogin, (req, res) => {
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true });
  });
});

/* ✅ Change Quantity */
router.post('/change-product-quantity', async (req, res) => {
  try {
    const response = await userHelpers.changeProductQuantity(req.body);
    const total = await userHelpers.getTotalAmount(req.body.user);
    response.total = total;
    res.json(response);
  } catch (error) {
    console.error("Quantity change failed:", error);
    res.status(500).json({ status: false });
  }
});

/* ✅ Remove Product from Cart */
router.post('/remove-product-from-cart', async (req, res) => {
  const productId = req.body.productId;
  const userId = req.session.user._id;

  try {
    await userHelpers.removeProductFromCart(userId, productId);
    let newTotal = await userHelpers.getTotalAmount(userId);
    res.json({ status: true, total: newTotal });
  } catch (err) {
    console.error("Failed to remove product:", err);
    res.json({ status: false });
  }
});

/* ✅ Place Order */
router.get('/place-order', verifyLogin, async (req, res) => {
  let total = await userHelpers.getTotalAmount(req.session.user._id);
  res.render('user/place-order', { total, user: req.session.user });
});

router.post('/place-order', async (req, res) => {
  try {
    let products = await userHelpers.getCartProductList(req.body.userId);
    let totalPrice = await userHelpers.getTotalAmount(req.body.userId);
    const orderId = await userHelpers.placeOrder(req.body, products, totalPrice);
    res.json({ status: true, orderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, message: "Order placement failed" });
  }
});

/* ✅ Order Success Page */
router.get('/order-success', verifyLogin, (req, res) => {
  res.render('user/order-success', { user: req.session.user });
});

/* ✅ View All Orders */
router.get('/orders', verifyLogin, async (req, res) => {
  let orders = await userHelpers.getUserOrders(req.session.user._id);
  res.render('user/orders', { user: req.session.user, orders });
});

/* ✅ View Products in Order */
router.get('/view-order-products/:id', verifyLogin, async (req, res) => {
  let products = await userHelpers.getOrderProducts(req.params.id);
  res.render('user/view-order-products', { user: req.session.user, products });
});

module.exports = router;
