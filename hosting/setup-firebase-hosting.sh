#!/bin/bash
set -e  # Exit on any error

# Parse environment argument
ENVIRONMENT="dev"
while getopts "e:" opt; do
  case $opt in
    e) ENVIRONMENT="$OPTARG";;
    *) echo "Invalid option: -$OPTARG" >&2; exit 1;;
  esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
    echo "Environment must be either 'dev' or 'prod'"
    exit 1
fi

# At the start of the script, define the countries array
COUNTRIES=(se no)

# At the start of your script, after the environment validation
# Add authentication check/setup
echo "Checking authentication..."
if ! firebase login:list | grep -q "No users signed in"; then
    echo "Firebase authentication OK"
else
    echo "Please authenticate with Firebase first:"
    firebase login
fi

if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo "Please authenticate with Google Cloud first:"
    gcloud auth login
fi

# Function to get site name from YAML
get_site_name() {
    environment=$1
    country_code=$2
    yaml_file="data/countries/${country_code}/index.yaml"
    
    if [[ "$environment" == "prod" ]]; then
        # For production, use the base_url from YAML but sanitize it
        site_name=$(python3 -c "
import yaml
with open('${yaml_file}', 'r', encoding='utf-8') as f:
    config = yaml.safe_load(f)
domain = config.get('base_url').replace('https://', '').replace('http://', '').rstrip('/')
print(domain.replace('.', '-').replace('/', '-'))
")
    else
        # For development, use the -dev suffix
        site_name=$(python3 -c "
import yaml
with open('${yaml_file}', 'r', encoding='utf-8') as f:
    config = yaml.safe_load(f)
print(f\"{config.get('page_name').lower()}-dev\")
")
    fi
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
    site_name=$(get_site_name $ENVIRONMENT $country)
    base_url=$(get_base_url $country)
    
    echo "Setting up hosting for ${country}: ${site_name}"
    
    # Create the site if it doesn't exist
    if ! firebase hosting:sites:list | grep -q "$site_name"; then
        echo "Creating site ${site_name}..."
        firebase hosting:sites:create $site_name
    fi
    
    # Apply the hosting target
    target_name="${country}${ENVIRONMENT}" 
    echo "Applying hosting target ${target_name}..."
    firebase target:apply hosting $target_name $site_name
    
    # Add to allowed origins
    if [[ "$ENVIRONMENT" == "prod" ]]; then
        allowed_origins="${allowed_origins}, 'https://${site_name}'"
    else
        allowed_origins="${allowed_origins}, 'https://${site_name}.web.app', 'https://${site_name}.firebaseapp.com'"
    fi
    [[ ! -z "$base_url" ]] && allowed_origins="${allowed_origins}, '${base_url}'"
done
allowed_origins="${allowed_origins}]"

# Create functions directory structure
mkdir -p functions/src/api
mkdir -p functions/src/scheduled
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
    "node": "20"
  },
  "main": "index.js",
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.1.0",
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


# Create the daily salt manager function
cat > src/scheduled/dailySaltManager.js << EOF
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
      
      console.log(`Created new salt for ${todayDate} UTC`);
      return { success: true };
    } catch (error) {
      console.error('Error managing daily salts:', error);
      return { success: false, error: error.message };
    }
});
EOF

# Create src/api/index.js to export API functions
cat > src/api/index.js << EOF
exports.getApiKeys = require('./getApiKeys').getApiKeys;
EOF

# Create main index.js that exports the api group
cat > index.js << EOF
exports.api = require('./src/api');
exports.scheduled = require('./src/scheduled/dailySaltManager');
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
    echo "        \"${country}dev\": [\"$(get_site_name dev ${country})\"],"
    echo "        \"${country}prod\": [\"$(get_site_name prod ${country})\"]$([ "$country" != "${COUNTRIES[-1]}" ] && echo ",")"
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
    match /dailySalts/{saltId} {
      allow read: if true;
      allow write: if false;
    }
$(for country in "${COUNTRIES[@]}"; do
cat << COUNTRYRULES
    match /pageViews_${country}/{docId} {
      allow write: if true;
    }
    match /submissions_${country}/{raceId} {
      allow read: if true;
      allow write: if true;
    }
    match /forum_posts_${country}/{postId} {
      // Anyone can read posts
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
  "indexes": [
$(for country in "${COUNTRIES[@]}"; do
cat << COUNTRYINDEXES
    {
      "collectionGroup": "forum_posts_${country}",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "source_race", "mode": "ASCENDING" },
        { "fieldPath": "createdAt", "mode": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "forum_posts_${country}",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "source_race", "mode": "ASCENDING" },
        { "fieldPath": "createdAt", "mode": "DESCENDING" },
        { "fieldPath": "__name__", "mode": "DESCENDING" }
      ]
    }$([ "$country" != "${COUNTRIES[-1]}" ] && echo ",")
COUNTRYINDEXES
done)
  ],
  "fieldOverrides": [
    {
      "collectionGroup": "dailySalts",
      "fieldPath": "expiresAt",
      "indexes": [
        { "order": "ASCENDING", "queryScope": "COLLECTION" }
      ]
    },
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
      "collectionGroup": "forum_posts_${country}",
      "fieldPath": "createdAt",
      "indexes": [
        { "order": "DESCENDING", "queryScope": "COLLECTION" }
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
      "target": "${country}dev",
      "public": "build/${country}",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ]
    },
    {
      "target": "${country}prod",
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

# Deploy everything with force flags
echo "Deploying Firebase configuration..."

echo "1. Deploying Firestore rules..."
firebase deploy --only firestore:rules -f

echo "2. Deploying Firestore indexes..."
# Simply deploy the indexes we created in firestore.indexes.json
firebase deploy --only firestore:indexes || {
    echo "Some indexes may require manual creation. Check the Firebase console if you see any errors."
}

echo "3. Deploying Functions..."
firebase deploy --only functions -f

echo "4. Deploying Hosting..."
firebase deploy --only hosting -f

echo "Firebase setup complete!"