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
print(f\"{config.get('page_name').lower()}-dev\")
")
    echo $site_name
}

# Setup hosting targets for each country
for country in se no; do
    site_name=$(get_site_name $country)
    echo "Setting up hosting target for ${country}: ${site_name}"
    firebase target:apply hosting $country $site_name
done