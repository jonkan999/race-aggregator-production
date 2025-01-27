const { getStorage } = require('firebase-admin/storage');
const { onCall } = require('firebase-functions/v2/https');

exports.getUploadUrl = onCall({ 
  region: 'europe-west3',
  maxInstances: 10
}, async (request) => {
  const { country, domain, imageNumber } = request.data;
  
  if (!request.auth) {
    throw new Error('Unauthorized');
  }

  const fileName = `${domain}_${imageNumber}.webp`;
  const filePath = `race-images/${country}/${domain}/${fileName}`;
  
  const bucket = getStorage().bucket();
  const file = bucket.file(filePath);
  
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType: 'image/webp',
  });

  return { url, filePath };
});

exports.updateAssessmentCache = onCall({ 
  region: 'europe-west3',
  maxInstances: 10
}, async (request) => {
  const { country, assessments } = request.data;
  
  if (!request.auth) {
    throw new Error('Unauthorized');
  }

  const bucket = getStorage().bucket();
  const file = bucket.file(`image-cache/${country}/assessments.json`);
  
  await file.save(JSON.stringify(assessments), {
    contentType: 'application/json',
    metadata: {
      cacheControl: 'public, max-age=3600'
    }
  });

  return { success: true };
});
