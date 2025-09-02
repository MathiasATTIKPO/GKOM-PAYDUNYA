require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

(async () => {
  try {
    console.log('Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connecté ✅');

    const count = await Admin.countDocuments();
    console.log('Nombre d\'admins trouvés :', count);

    if (count === 0) {
      const admin = await Admin.create({
        username: 'admin',
        password: '@dMin123',
      });
      console.log('✅ Compte admin créé :', admin.username);
    } else {
      console.log('⚠️ Des admins existent déjà.');
    }

    await mongoose.connection.close();
    console.log('Connexion fermée');
  } catch (err) {
    console.error('❌ Erreur création admin:', err.message, err);
  }
})();
