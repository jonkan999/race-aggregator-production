#!/bin/bash

# Function to get site name from YAML
get_site_name() {
    country_code=$1
    yaml_file="data/countries/${country_code}/index.yaml"
    
    # Using Python to parse YAML and get site name
    site_name=$(python3 -c "
import yaml
with open('${yaml_file}', 'r', encoding='utf-8') as f:
    config = yaml.safe_load(f)
print(f\"{config.get('page_name').lower()}-test\")  # Using -test for development
")
    echo $site_name
}

# Setup hosting for each country
for country in se no; do
    site_name=$(get_site_name $country)
    echo "Setting up hosting for ${country}: ${site_name}"
    
    # Create the site if it doesn't exist
    echo "Creating site ${site_name}..."
    firebase hosting:sites:create $site_name || echo "Site already exists"
    
    # Apply the hosting target
    echo "Applying hosting target for ${country}..."
    firebase target:apply hosting $country $site_name
done

# Create .firebaserc file
echo "Creating .firebaserc..."
cat > .firebaserc << EOF
{
  "projects": {
    "default": "aggregatory-fcb66"
  },
  "targets": {
    "aggregatory-fcb66": {
      "hosting": {
        "se": ["$(get_site_name se)"],
        "no": ["$(get_site_name no)"]
      }
    }
  }
}
EOF

echo "Firebase hosting setup complete!"