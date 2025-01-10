const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require('firebase-admin');
const { randomUUID } = require('crypto');

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.manageDailySalts = onSchedule({
  schedule: '0 0 * * *',  // Midnight UTC
  timeZone: 'UTC',
  region: 'europe-west3'
}, async (event) => {
    const db = admin.firestore();
    
    // Get UTC date string YYYY-MM-DD
    const todayDate = new Date().toISOString().slice(0, 10);
    
    try {
      // 1. Delete all existing salts
      const saltsSnapshot = await db.collection('dailySalts').get();
      const batch = db.batch();
      
      saltsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // 2. Create today's salt
      const newSalt = {
        salt: randomUUID(),
        date: todayDate,
        createdAt: new Date().toISOString()  // This will be UTC timestamp
      };
      
      const saltDoc = db.collection('dailySalts').doc(todayDate);
      batch.set(saltDoc, newSalt);

      await batch.commit();
      
      console.log();
      return { success: true };
    } catch (error) {
      console.error('Error managing daily salts:', error);
      return { success: false, error: error.message };
    }
});
