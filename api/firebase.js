const admin = require('firebase-admin');

const serviceAccount = require('../api/functions/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gs://file-uploader-storage.appspot.com',
});

const storage = admin.storage();
const bucket = storage.bucket();

module.exports = { bucket };
