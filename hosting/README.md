# Firebase Project Setup and Configuration

## Overview

This project uses Firebase Hosting, Cloud Functions, and Firestore to manage race submissions across multiple countries. The setup includes secure API key management through Google Cloud Secret Manager and country-specific hosting configurations for both development and production environments.

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

## Deployment Workflows

### Development Workflow

1. Push to master branch triggers automatic deployment to development environment
2. Development sites are hosted on Firebase subdomains (e.g., loppkartan-dev.web.app)
3. Configured through `.github/workflows/deploy.yml`

### Production Workflow

1. Production deployments can be triggered in two ways:

   - Automatically after successful master deployment
   - Manually through GitHub Actions interface

2. Deploy specific country to production:

   ```bash
   ./hosting/deploy-production.sh se
   ```

   This will:

   - Deploy to production domain (e.g., www.loppkartan.se)
   - Configure custom domain settings
   - Set up production-specific Firebase hosting

3. Manual production deployment via GitHub CLI:
   ```bash
   gh workflow run deploy-production.yml -f environment=production -f countries=se
   ```

## Environment Configuration

### Development (-e dev)

- Uses Firebase subdomains
- Allows testing and staging
- Automatically deployed from master branch

### Production (-e prod)

- Uses custom domains
- Requires manual approval
- Stricter security rules
- Production-ready configurations

## API Key Management

[Previous API key management section remains the same...]

## Project Structure

- `hosting/setup-firebase-hosting.sh`: Main setup script (supports dev/prod)
- `hosting/deploy-production.sh`: Production deployment script
- `.github/workflows/`
  - `deploy.yml`: Development deployment workflow
  - `deploy-production.yml`: Production deployment workflow
- `data/countries/{country}/index.yaml`: Country-specific configurations
- `data/global.yaml`: Global configurations and API keys
- `firestore.rules`: Database security rules
- `firestore.indexes.json`: Database indexes
- `functions/`: Cloud Functions code

## Adding a New Country

1. Add country code to COUNTRIES array in setup script
2. Create country configuration in data/countries/{country}/index.yaml
3. Configure base_url for production domain
4. Run setup script for both environments:
   ```bash
   ./setup-firebase-hosting.sh -e dev
   ./setup-firebase-hosting.sh -e prod
   ```

## Security

- API keys never exposed in client code
- Firestore rules control access per collection
- Cloud Function validates request origins
- Secrets managed through Google Cloud Secret Manager
- Production deployments require manual approval
- Branch protection rules for master and production

## Development Workflow

1. Local Development

   - Use Firebase Emulators
   - Test with development API keys

2. Development Deployment

   - Push to master
   - Automatic deployment to dev environment

3. Production Deployment
   - Manual trigger or automatic from master
   - Deploys to custom domains
   - Environment-specific configurations

## Troubleshooting

- Check Firebase Console for function logs
- Verify Secret Manager permissions
- Ensure correct project configuration
- Check CORS settings if API requests fail
- Verify custom domain DNS settings
- Check deployment logs in GitHub Actions

Remember:

- Never commit API keys or sensitive credentials
- Always test in development before production
- Use appropriate environment flags
- Monitor production deployments
