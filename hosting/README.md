# Firebase Project Setup and Configuration

## Overview

This project uses Firebase Hosting, Cloud Functions, and Firestore to manage race submissions across multiple countries. The setup includes secure API key management through Google Cloud Secret Manager and country-specific hosting configurations.

## Initial Setup

1. Firebase Project Creation

   - Create a new Firebase project in the Firebase Console
   - Enable Firestore Database (Native mode)
   - Enable Firebase Hosting
   - Enable Cloud Functions

2. Local Development Setup
   - Install Firebase CLI: `npm install -g firebase-tools`
   - Install Google Cloud CLI: `curl https://sdk.cloud.google.com | bash`
   - Login to Firebase: `firebase login`
   - Login to Google Cloud: `gcloud auth login`
   - Set project: `gcloud config set project YOUR_PROJECT_ID`

## API Key Management

1. Enable Secret Manager

```bash
gcloud services enable secretmanager.googleapis.com
```

2. Configure API Keys
   - Add keys to data/global.yaml:

```yaml
api_keys:
  MAPBOX_API_KEY:
  ANOTHER_API_KEY:
```

3. Store Keys in Secret Manager

```bash
# Store Mapbox key
echo -n "your_mapbox_key" | gcloud secrets create MAPBOX_API_KEY --data-file=-

# Store other keys
echo -n "api key" | gcloud secrets create FIREBASE_API_KEY --data-file=-
```

re recreate:

# Add a new version to the existing secret

echo -n "new key" | gcloud secrets versions add FIREBASE_API_KEY --data-file=-

# Verify the new version

gcloud secrets versions list FIREBASE_API_KEY

# Access the latest version to confirm

gcloud secrets versions access "latest" --secret="FIREBASE_API_KEY"

4. Grant Function Access

```bash
PROJECT_ID=$(gcloud config get-value project)

# Grant access to each key
gcloud secrets add-iam-policy-binding FIREBASE_API_KEY \
  --member="serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Project Structure

- `hosting/setup-firebase-hosting.sh`: Main setup script
- `data/countries/{country}/index.yaml`: Country-specific configurations
- `data/global.yaml`: Global configurations and API keys
- `firestore.rules`: Database security rules
- `firestore.indexes.json`: Database indexes
- `functions/`: Cloud Functions code

## Deployment

1. Run the setup script:

```bash
./hosting/setup-firebase-hosting.sh
```

This script:

- Creates country-specific hosting targets
- Sets up Firestore rules and indexes
- Deploys Cloud Functions for API key management
- Configures CORS for each domain

## Adding a New Country

1. Add country code to COUNTRIES array in setup script
2. Create country configuration in data/countries/{country}/index.yaml
3. Run setup script again

## Adding New API Keys

1. Add key to data/global.yaml
2. Store key in Secret Manager
3. Grant function access
4. Run setup script to update function configuration

## Architecture

- Each country has its own hosting target (e.g., loppkartan-dev.web.app)
- API keys are served through a secure Cloud Function
- Firestore collections are prefixed with country codes (e.g., submissions_se)
- Single-field indexes for date-based queries
- CORS configured for all official domains

## Security

- API keys never exposed in client code
- Firestore rules control access per collection
- Cloud Function validates request origins
- Secrets managed through Google Cloud Secret Manager

## Usage

### Mapbox Integration

- Frontend requests API key from Cloud Function
- Key used for map rendering and geocoding

### Firestore Collections

- submissions\_{country}: User-submitted races
- races\_{country}: Approved/verified races

### API Key Access

- Frontend makes authenticated requests to Cloud Function
- Function returns only necessary keys based on origin

## Development Workflow

1. Local Development

   - Use Firebase Emulators
   - Test with development API keys

2. Deployment
   - Update configurations if needed
   - Run setup script
   - Verify deployments

## Troubleshooting

- Check Firebase Console for function logs
- Verify Secret Manager permissions
- Ensure correct project configuration
- Check CORS settings if API requests fail

Remember to never commit API keys or sensitive credentials to the repository.
