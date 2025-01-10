#!/bin/bash
set -e  # Exit on any error

# Function to get site name from YAML
get_site_name() {
    country_code=$1
    yaml_file="data/countries/${country_code}/index.yaml"
    site_name=$(python3 -c "
import yaml
with open('${yaml_file}', 'r', encoding='utf-8') as f:
    config = yaml.safe_load(f)
print(f\"{config.get('page_name').lower()}-dev\")
")
    echo $site_name
}

# New function to get domain suffix from YAML
get_domain_suffix() {
    country_code=$1
    yaml_file="data/countries/${country_code}/index.yaml"
    domain_suffix=$(python3 -c "
import yaml
with open('${yaml_file}', 'r', encoding='utf-8') as f:
    config = yaml.safe_load(f)
domain = config.get('base_url', '').rstrip('/').split('.')[-1]  # Remove trailing slash before splitting
print(domain)
")
    echo $domain_suffix
}

# Function to get base URL from YAML
get_base_url() {
    country_code=$1
    yaml_file="data/countries/${country_code}/index.yaml"
    base_url=$(python3 -c "
import yaml
with open('${yaml_file}', 'r', encoding='utf-8') as f:
    config = yaml.safe_load(f)
base_url = config.get('base_url', '').rstrip('/')  # Remove trailing slash
print(base_url)
")
    echo $base_url
}

# Define the countries array
COUNTRIES=('se' 'no' 'fi' 'dk' 'de' 'nl' 'be' 'ee')

# Build allowed origins array
allowed_origins="["
for country in "${COUNTRIES[@]}"; do
    site_name=$(get_site_name $country)
    base_url=$(get_base_url $country)
    domain_suffix=$(get_domain_suffix $country)
    
    # Strip -dev and add both -dev and -domain versions
    base_site_name=${site_name%-dev}
    dev_site_name="${base_site_name}-dev"
    domain_site_name="${base_site_name}-${domain_suffix}"
    
    echo "Processing country: $country"
    echo "Dev site name: $dev_site_name"
    echo "Domain site name: $domain_site_name"
    echo "Base URL: $base_url"
    
    # Add to allowed origins with /* at the end
    if [ "$country" = "${COUNTRIES[0]}" ]; then
        allowed_origins="${allowed_origins}'https://${dev_site_name}.web.app/*', 'https://${dev_site_name}.firebaseapp.com/*', 'https://${domain_site_name}.web.app/*', 'https://${domain_site_name}.firebaseapp.com/*'"
    else
        allowed_origins="${allowed_origins}, 'https://${dev_site_name}.web.app/*', 'https://${dev_site_name}.firebaseapp.com/*', 'https://${domain_site_name}.web.app/*', 'https://${domain_site_name}.firebaseapp.com/*'"
    fi
    [[ ! -z "$base_url" ]] && allowed_origins="${allowed_origins}, '${base_url}/*'"
done
allowed_origins="${allowed_origins}]"

echo "Full allowed origins: $allowed_origins"

# Import Mapbox secret token from YAML
echo "Reading Mapbox credentials..."
MAPBOX_SECRET_TOKEN=$(python3 -c "
import yaml
import sys
try:
    with open('python/keys/mapbox_secret.yaml', 'r') as f:
        config = yaml.safe_load(f)
        token = config.get('aggregatory_create_tokens')
        if token is None:
            print('Error: aggregatory_create_tokens not found in config', file=sys.stderr)
            sys.exit(1)
        print(token)
except Exception as e:
    print(f'Error: {str(e)}', file=sys.stderr)
    sys.exit(1)
")

# Check if we got the token
if [ -z "$MAPBOX_SECRET_TOKEN" ]; then
    echo "Failed to get Mapbox token from YAML"
    exit 1
fi

echo "Token retrieved successfully: ${MAPBOX_SECRET_TOKEN:0:10}..."

# Get Mapbox username
MAPBOX_USERNAME=$(python3 -c "
import yaml
import sys
try:
    with open('python/keys/mapbox_secret.yaml', 'r') as f:
        config = yaml.safe_load(f)
        username = config.get('account_name')
        if username is None:
            print('Error: account_name not found in config', file=sys.stderr)
            sys.exit(1)
        print(username)
except Exception as e:
    print(f'Error: {str(e)}', file=sys.stderr)
    sys.exit(1)
")

# Check if we got the username
if [ -z "$MAPBOX_USERNAME" ]; then
    echo "Failed to get Mapbox username from YAML"
    exit 1
fi

echo "Username retrieved successfully: $MAPBOX_USERNAME"

# Format the allowed URLs for Mapbox
mapbox_allowed_urls=$(echo $allowed_origins | sed 's/\[//g' | sed 's/\]//g' | tr "'" '"')

# First, list and delete existing auto-generated tokens
echo "1. Removing existing auto-generated tokens..."
echo "Listing existing tokens..."
EXISTING_TOKENS=$(curl -s -X GET \
  "https://api.mapbox.com/tokens/v2/${MAPBOX_USERNAME}?access_token=${MAPBOX_SECRET_TOKEN}")

echo "Finding and deleting auto-generated tokens..."
echo "$EXISTING_TOKENS" | jq -c '.[]' | while read -r token; do
    note=$(echo "$token" | jq -r '.note')
    if [[ "$note" == "Auto-generated"* ]]; then
        token_id=$(echo "$token" | jq -r '.id')
        echo "Deleting token: $token_id"
        curl -s -X DELETE \
            "https://api.mapbox.com/tokens/v2/${MAPBOX_USERNAME}/${token_id}?access_token=${MAPBOX_SECRET_TOKEN}"
    fi
done

# Add a small delay to ensure deletions are processed
sleep 2

# Now create new token
echo "2. Creating new Mapbox token with allowed URLs..." 

curl_command="curl -v -X POST \
-H \"Content-Type: application/json\" \
-d '{ \"note\": \"Auto-generated token for ${COUNTRIES[*]} sites\", \"scopes\": [\"styles:read\", \"styles:tiles\", \"fonts:read\", \"datasets:read\"], \"allowedUrls\": [${mapbox_allowed_urls}] }' \
\"https://api.mapbox.com/tokens/v2/${MAPBOX_USERNAME}?access_token=${MAPBOX_SECRET_TOKEN}\""
echo "Curl command:"
echo "$curl_command"

# Execute the curl command and capture response 
MAPBOX_TOKEN_RESPONSE=$(eval "$curl_command")
echo "Mapbox API Response: $MAPBOX_TOKEN_RESPONSE"

# Check if the response contains an error message
if echo "$MAPBOX_TOKEN_RESPONSE" | grep -q "message"; then
    echo "Failed to create Mapbox token. Response: $MAPBOX_TOKEN_RESPONSE"
    exit 1
fi

# Extract the token from the response
NEW_MAPBOX_TOKEN=$(echo $MAPBOX_TOKEN_RESPONSE | jq -r '.token')
if [ -n "$NEW_MAPBOX_TOKEN" ]; then
    echo "Successfully created new Mapbox token"
    # Store the new token in Secret Manager
    echo "Storing token in Secret Manager..."
    echo -n "$NEW_MAPBOX_TOKEN" | gcloud secrets versions add MAPBOX_API_KEY --data-file=- || \
    (echo "Creating new secret..." && \
    echo -n "$NEW_MAPBOX_TOKEN" | gcloud secrets create MAPBOX_API_KEY --data-file=-)
    # Grant access to the Cloud Functions service account
    echo "Granting access to Cloud Functions service account..."
    PROJECT_ID=$(gcloud config get-value project)
    gcloud secrets add-iam-policy-binding MAPBOX_API_KEY \
    --member="serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
    echo "Mapbox token successfully created and stored in Secret Manager"
else
    echo "Failed to create Mapbox token. Response: $MAPBOX_TOKEN_RESPONSE"
    exit 1
fi

echo "3. Redeploying Functions to pick up new secret versions..."
firebase deploy --only functions -f

echo "Mapbox token setup complete!"
