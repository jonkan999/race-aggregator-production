#!/bin/bash
set -e

COUNTRY=$1

if [ -z "$COUNTRY" ]; then
    echo "Usage: $0 <country-code>"
    echo "Example: $0 se"
    exit 1
fi

# Get domain from index.yaml
DOMAIN=$(python3 -c "
import yaml
with open('data/countries/${COUNTRY}/index.yaml', 'r', encoding='utf-8') as f:
    config = yaml.safe_load(f)
print(config.get('base_url').replace('https://', '').rstrip('/'))
")

if [ -z "$DOMAIN" ]; then
    echo "Error: Could not find base_url in data/countries/${COUNTRY}/index.yaml"
    exit 1
fi

echo "Setting up Firebase hosting for production..."
# First run the setup script with production flag
./hosting/setup-firebase-hosting.sh -e prod

echo "Deploying $COUNTRY to $DOMAIN"

# Deploy to Firebase hosting with production target
firebase deploy --only hosting:${COUNTRY}prod

# Configure custom domain if it's not already set up
#if ! firebase hosting:sites:get $DOMAIN &>/dev/null; then
#    echo "Setting up custom domain $DOMAIN..."
#    firebase hosting:sites:update $DOMAIN --project aggregatory-440306
#fi

firebase hosting:channel:deploy production --only ${COUNTRY}prod

echo "Production deployment complete for $COUNTRY at $DOMAIN"