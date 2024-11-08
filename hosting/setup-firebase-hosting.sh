#!/bin/bash

# At the start of the script, define the countries array
COUNTRIES=(se no)

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

# Function to get base URL from YAML
get_base_url() {
    country_code=$1
    yaml_file="data/countries/${country_code}/index.yaml"
    
    base_url=$(python3 -c "
import yaml
with open('${yaml_file}', 'r', encoding='utf-8') as f:
    config = yaml.safe_load(f)
print(config.get('base_url', ''))
")
    echo $base_url
}

# Function to get API keys from global.yaml
get_api_keys() {
    python3 -c "
import yaml
with open('data/global.yaml', 'r', encoding='utf-8') as f:
    config = yaml.safe_load(f)
keys = config.get('API_KEYS', {}).keys()
print('\n'.join(keys))
"
}

# Get API keys as an array
API_KEYS=($(get_api_keys))

# Setup hosting for each country
allowed_origins="['http://localhost:8080'"
for country in "${COUNTRIES[@]}"; do
    site_name=$(get_site_name $country)
    base_url=$(get_base_url $country)
    
    echo "Setting up hosting for ${country}: ${site_name}"
    
    # Check if the site already exists
    if firebase hosting:sites:list | grep -q "$site_name"; then
        echo "Site ${site_name} already exists."
    else
        # Create the site if it doesn't exist
        echo "Creating site ${site_name}..."
        firebase hosting:sites:create $site_name || echo "Site already exists"
    fi
    
    # Apply the hosting target
    echo "Applying hosting target for ${country}..."
    firebase target:apply hosting $country $site_name
    
    # Add to allowed origins
    allowed_origins="${allowed_origins}, 'https://${site_name}.web.app', 'https://${site_name}.firebaseapp.com'"
    [[ ! -z "$base_url" ]] && allowed_origins="${allowed_origins}, '${base_url}'"
done
allowed_origins="${allowed_origins}]"

# Create functions directory and install dependencies
echo "Setting up Firebase Functions..."
mkdir -p functions
cd functions
npm init -y
npm install firebase-functions@latest firebase-admin@latest
cd ..

# Create the function file with dynamic API keys
echo "Creating API keys function..."
cat > functions/index.js << EOF
const { onRequest } = require("firebase-functions/v2/https");

// Specify the region for the function
exports.getApiKeys = onRequest({ 
  region: 'europe-west3', 
  secrets: [$(printf '"%s",' "${API_KEYS[@]}" | sed 's/,$//')] 
}, (request, response) => {
  try {
    // Add CORS headers for specific domains
    const allowedOrigins = ${allowed_origins};
    const origin = request.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
      response.set('Access-Control-Allow-Origin', origin);
    }
    
    response.set('Access-Control-Allow-Methods', 'GET');
    response.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (request.method === 'OPTIONS') {
      response.status(204).send('');
      return;
    }

    response.set('Cache-Control', 'no-store');
    
    // Return the API keys using process.env
    response.json({
$(for key in "${API_KEYS[@]}"; do
    echo "      ${key}: process.env.${key},"
done)
    });
  } catch (error) {
    console.error('Function error:', error);
    response.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});
EOF

# Create .firebaserc file with dynamic targets
echo "Creating .firebaserc..."
cat > .firebaserc << EOF
{
  "projects": {
    "default": "aggregatory-440306"
  },
  "targets": {
    "aggregatory-440306": {
      "hosting": {
$(for country in "${COUNTRIES[@]}"; do
    echo "        \"${country}\": [\"$(get_site_name ${country})\"]$([ "$country" != "${COUNTRIES[-1]}" ] && echo ",")"
done)
      }
    }
  }
}
EOF

# Create Firestore security rules dynamically
echo "Creating Firestore security rules..."
cat > firestore.rules << EOF
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
$(for country in "${COUNTRIES[@]}"; do
cat << COUNTRYRULES
    // Submissions collection for ${country}
    match /submissions_${country}/{raceId} {
      allow read: if true;
      allow write: if true;  // Add auth later
    }
    
    // Approved races collection for ${country}
    match /races_${country}/{raceId} {
      allow read: if true;
      allow write: if false;  // Only admin can write
    }
COUNTRYRULES
done)
  }
}
EOF

# Create Firestore indexes dynamically
echo "Creating Firestore indexes..."
cat > firestore.indexes.json << EOF
{
  "indexes": [
$(for country in "${COUNTRIES[@]}"; do
cat << COUNTRYINDEXES
    {
      "collectionGroup": "submissions_${country}",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "name", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "races_${country}",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "date", "order": "ASCENDING" }
      ]
    }$([ "$country" != "${COUNTRIES[-1]}" ] && echo ",")
COUNTRYINDEXES
done)
  ]
}
EOF

# Create firebase.json with dynamic hosting targets
echo "Creating firebase.json..."
cat > firebase.json << EOF
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions"
  },
  "hosting": [
$(for country in "${COUNTRIES[@]}"; do
cat << HOSTING
    {
      "target": "${country}",
      "public": "build/${country}",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ]
    }$([ "$country" != "${COUNTRIES[-1]}" ] && echo ",")
HOSTING
done)
  ]
}
EOF

# Deploy Firestore rules and indexes
echo "Deploying Firestore rules and indexes..."
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes

# Deploy the function
echo "Deploying Firebase Function..."
firebase deploy --only functions

echo "Firebase setup complete!"