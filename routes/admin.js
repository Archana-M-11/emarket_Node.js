var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers');
const path = require('path');
const adminHelpers = require('../helpers/admin-helpers');

// ✅ Middleware to check if admin is logged in
const verifyAdminLogin = (req, res, next) => {
  if (req.session.admin && req.session.admin.loggedIn) {
    next();
  } else {
    res.redirect('/admin/login');
  }
};

// ✅ ADMIN LOGIN (GET)
router.get('/login', (req, res) => {
  if (req.session.admin && req.session.admin.loggedIn) {
    res.redirect('/admin');
  } else {
    res.render('admin/login', { 
      loginErr: req.session.adminLoginErr,
      admin: true
    });
    req.session.adminLoginErr = false;
  }
});


// ✅ ADMIN LOGIN (POST)
router.post('/login',(req, res) => {
  adminHelpers.doAdminLogin(req.body).then((response) => {
    if (response.status) {
      req.session.admin = {
        loggedIn: true,
        user: response.admin
      };
      res.redirect('/admin/');
    } else {
      req.session.adminLoginErr = "Invalid email or password";
      res.redirect('/admin/login');
    }
  });
});

// ✅ ADMIN LOGOUT
// router.get('/logout', (req, res) => {
//   req.session.admin.destroy()
//   res.redirect('/admin/login');
// });

// ✅ VIEW ALL PRODUCTS
router.get('/', verifyAdminLogin, (req, res, next) => {
  productHelpers.getAllproduct()
    .then((products) => {
      res.render('admin/view-product', { admin: true, products });
    })
    .catch(next);
});

// ✅ GET ADD PRODUCT PAGE
router.get('/add-product', verifyAdminLogin, (req, res) => {
  res.render('admin/add-product',{admin:true});
});

// ✅ POST ADD PRODUCT
router.post('/add-product', verifyAdminLogin, (req, res, next) => {
  productHelpers.addproduct(req.body)
    .then((id) => {
      let image = req.files.image;
      const imagePath = path.join(__dirname, '../public/product-images/', `${id}.jpg`);
      
      image.mv(imagePath, (err) => {
        if (err) {
          console.error('Image upload failed:', err);
          return next(err);
        }
        res.render('admin/add-product',{admin:true});
      });
    })
    .catch(next);
});

// ✅ DELETE PRODUCT
router.get('/delete-product/:id', verifyAdminLogin,(req, res) => {
  const proId = req.params.id;
  productHelpers.deleteproduct(proId).then(() => {
    res.redirect('/admin');
  });
});

// ✅ GET EDIT PRODUCT PAGE
router.get('/edit-product/:id', verifyAdminLogin, async (req, res, next) => {
  try {
    const proId = req.params.id;
    const product = await productHelpers.getProductDetails(proId);
    res.render('admin/edit-product', { product ,admin:true});
  } catch (err) {
    next(err);
  }
});

// ✅ POST EDIT PRODUCT
router.post('/edit-product/:id', verifyAdminLogin, (req, res, next) => {
  productHelpers.updateProduct(req.params.id, req.body)
    .then(() => {
      if (req.files?.image) {
        let image = req.files.image;
        const imagePath = path.join(__dirname, '../public/product-images/', `${req.params.id}.jpg`);
        image.mv(imagePath, (err) => {
          if (err) {
            console.error('Image update failed:', err);
            return next(err);
          }
        });
      }
      res.redirect('/admin');
    })
    .catch(next);
});

module.exports = router;
