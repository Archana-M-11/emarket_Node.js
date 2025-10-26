const db = require('../config/connection');
const collection = require('../config/collection');
const bcrypt = require('bcrypt');

module.exports = {
  doAdminLogin: async (adminData) => {
    try {
      const dbClient = db.get();
      const admin = await dbClient.collection(collection.ADMIN_COLLECTION).findOne({ Email: adminData.Email });

      if (admin) {
        const passwordMatch = await bcrypt.compare(adminData.Password, admin.Password);
        if (passwordMatch) {
          return { status: true, admin };
        } else {
          return { status: false, message: 'Invalid password' };
        }
      } else {
        return { status: false, message: 'Admin not found' };
      }
    } catch (err) {
      console.error("Login error:", err);
      return { status: false, message: 'Something went wrong' };
    }
  }
};
