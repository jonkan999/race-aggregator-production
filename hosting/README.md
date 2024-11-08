Firebase Hosting and Functions Setup
Setting up API Keys

1. Enable Secret Manager
   First, enable the Secret Manager API in your project:

   gcloud services enable secretmanager.googleapis.com

2. Add New API Keys
   Add the API key name to data/global.yaml:

   ```yaml
   api_keys:
     MAPBOX_API_KEY:
   ```

   Create secrets in Google Cloud Secret Manager:

   # For Mapbox API key

   echo -n "your_mapbox_key" | gcloud secrets create MAPBOX_API_KEY --data-file=-

   # For any other API key

   echo -n "your_api_key" | gcloud secrets create ANOTHER_API_KEY --data-file=-

3. Grant Access to Functions

   # Get your project ID

   PROJECT_ID=$(gcloud config get-value project)

   # Grant access for each secret

   gcloud secrets add-iam-policy-binding MAPBOX_API_KEY \
    --member="serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

   gcloud secrets add-iam-policy-binding ANOTHER_API_KEY \
    --member="serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
