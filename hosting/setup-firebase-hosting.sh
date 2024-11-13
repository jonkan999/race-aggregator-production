#!/bin/bash
set -e  # Exit on any error

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

# Initialize Firebase project
echo "Initializing Firebase project..."
firebase use aggregatory-440306

# Create or verify Firestore database
echo "Setting up Firestore database..."
if ! gcloud firestore databases list --project=aggregatory-440306 | grep -q "default"; then
    echo "Creating Firestore database..."
    gcloud firestore databases create --project=aggregatory-440306 --location=europe-west3 --type=firestore-native
    echo "Waiting for database creation to complete..."
    sleep 30
fi

# Get API keys as an array
API_KEYS=($(get_api_keys))

# Setup hosting for each country
allowed_origins="['http://127.0.0.1:8080'"
for country in "${COUNTRIES[@]}"; do
    site_name=$(get_site_name $country)
    base_url=$(get_base_url $country)
    
    echo "Setting up hosting for ${country}: ${site_name}"
    
    # Create the site if it doesn't exist
    if ! firebase hosting:sites:list | grep -q "$site_name"; then
        echo "Creating site ${site_name}..."
        firebase hosting:sites:create $site_name
    fi
    
    # Apply the hosting target
    echo "Applying hosting target for ${country}..."
    firebase target:apply hosting $country $site_name
    
    # Add to allowed origins
    allowed_origins="${allowed_origins}, 'https://${site_name}.web.app', 'https://${site_name}.firebaseapp.com'"
    [[ ! -z "$base_url" ]] && allowed_origins="${allowed_origins}, '${base_url}'"
done
allowed_origins="${allowed_origins}]"

# Create functions directory structure
mkdir -p functions/src/api
cd functions

# Create package.json with node-fetch dependency
cat > package.json << EOF
{
  "name": "functions",
  "description": "Cloud Functions for Firebase",
  "scripts": {
    "serve": "firebase emulators:start --only functions",
    "shell": "firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "18"
  },
  "main": "index.js",
  "dependencies": {
    "firebase-admin": "^11.11.1",
    "firebase-functions": "^4.5.0",
    "node-fetch": "^2.7.0"
  },
  "private": true,
  "version": "1.0.0"
}
EOF

# Create separate files for each function
cat > src/api/getApiKeys.js << EOF
const { onRequest } = require("firebase-functions/v2/https");

const corsHandler = (request, response, allowedOrigins) => {
  const origin = request.headers.origin;
  if (allowedOrigins.includes(origin)) {
    response.set('Access-Control-Allow-Origin', origin);
  }
  response.set('Access-Control-Allow-Methods', 'GET');
  response.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return true;
  }
  return false;
};

exports.getApiKeys = onRequest({ 
  region: 'europe-west3', 
  secrets: [$(printf '"%s",' "${API_KEYS[@]}" | sed 's/,$//')] 
}, (request, response) => {
  try {
    const allowedOrigins = ${allowed_origins};
    if (corsHandler(request, response, allowedOrigins)) return;

    response.set('Cache-Control', 'no-store');
    response.json({
$(for key in "${API_KEYS[@]}"; do
    echo "      ${key}: process.env.${key},"
done)
    });
  } catch (error) {
    console.error('Function error:', error);
    response.status(500).json({ error: 'Internal server error', message: error.message });
  }
});
EOF

cat > src/api/logAnalytics.js << EOF
const { onRequest } = require("firebase-functions/v2/https");
const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp();
}

exports.logAnalytics = onRequest({
    region: 'europe-west3',
    cors: true,
    maxInstances: 10
}, async (req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight request
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    console.log('Received analytics request:', {
        method: req.method,
        contentType: req.headers['content-type'],
        bodySize: req.rawBody?.length || 0
    });

    try {
        const { collection, data } = req.body;
        
        if (!collection || !data) {
            console.error('Missing required data:', { 
                hasCollection: !!collection, 
                hasData: !!data 
            });
            res.status(400).send('Missing required data');
            return;
        }

        console.log('Writing to collection:', collection);
        
        const docRef = await admin.firestore()
            .collection(collection)
            .add({
                ...data,
                serverTimestamp: admin.firestore.FieldValue.serverTimestamp()
            });

        console.log('Document written with ID:', docRef.id);
        res.status(200).send('Success');
    } catch (error) {
        console.error('Analytics update error:', error);
        res.status(500).send('Error');
    }
});
EOF

# Create src/api/index.js to export API functions
cat > src/api/index.js << EOF
exports.getApiKeys = require('./getApiKeys').getApiKeys;
exports.logAnalytics = require('./logAnalytics').logAnalytics;
EOF

# Create main index.js that exports the api group
cat > index.js << EOF
exports.api = require('./src/api');
EOF

cd ..
# Create configuration files
echo "Creating configuration files..."

# Create .firebaserc
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

# Create Firestore security rules
cat > firestore.rules << EOF
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
$(for country in "${COUNTRIES[@]}"; do
cat << COUNTRYRULES
    match /pageViews_${country}/{docId} {
      allow write: if true;
    }
    match /submissions_${country}/{raceId} {
      allow read: if true;
      allow write: if true;
    }
COUNTRYRULES
done)
  }
}
EOF

# Create Firestore indexes with force flag
echo "Creating Firestore indexes..."
cat > firestore.indexes.json << EOF
{
  "indexes": [],
  "fieldOverrides": [
$(for country in "${COUNTRIES[@]}"; do
cat << COUNTRYINDEXES
    {
      "collectionGroup": "submissions_${country}",
      "fieldPath": "date",
      "indexes": [
        { "order": "ASCENDING", "queryScope": "COLLECTION" }
      ]
    },
        {
      "collectionGroup": "pageViews_${country}",
      "fieldPath": "date",
      "indexes": [
        { "order": "ASCENDING", "queryScope": "COLLECTION" }
      ]
    },
    {
      "collectionGroup": "races_${country}",
      "fieldPath": "date",
      "indexes": [
        { "order": "ASCENDING", "queryScope": "COLLECTION" }
      ]
    }$([ "$country" != "${COUNTRIES[-1]}" ] && echo ",")
COUNTRYINDEXES
done)
  ]
}
EOF

# Create firebase.json
cat > firebase.json << EOF
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions",
    "codebase": "api-functions"
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
      ],
      "rewrites": [
        {
          "source": "/log-analytics",
          "function": "logAnalytics"
        }
      ]
    }$([ "$country" != "${COUNTRIES[-1]}" ] && echo ",")
HOSTING
done)
  ]
}
EOF

# Deploy everything with force flags
echo "Deploying Firebase configuration..."

echo "1. Deploying Firestore rules..."
firebase deploy --only firestore:rules -f

echo "2. Deploying Firestore indexes..."
firebase deploy --only firestore:indexes -f

echo "3. Deploying Functions..."
firebase deploy --only functions -f

echo "4. Deploying Hosting..."
firebase deploy --only hosting -f

echo "Firebase setup complete!"