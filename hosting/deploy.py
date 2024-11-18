import os
import json
import yaml
from pathlib import Path

def get_race_list_name(country_code):
    """Get race_list_name from country's index.yaml"""
    yaml_path = f"data/countries/{country_code}/index.yaml"
    
    with open(yaml_path, 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
    
    return config.get('race_list_name').lower()

def generate_firebase_config(country_codes):
    """Generate Firebase config with dynamic redirects based on race_list_name"""
    config = {
        "hosting": [],
        "functions": {
            "source": "functions",
            "codebase": "api-functions"
        },
        "firestore": {
            "rules": "firestore.rules",
            "indexes": "firestore.indexes.json"
        }
    }
    
    for country_code in country_codes:
        race_list_name = get_race_list_name(country_code)
        
        # Create dev target config
        dev_hosting_config = {
            "target": f"{country_code}dev",  # Changed to match .firebaserc
            "public": f"build/{country_code}",
            "ignore": [
                "firebase.json",
                "**/.*",
                "**/node_modules/**"
            ],
            "rewrites": [
                {
                    "source": f"/{race_list_name}/**",
                    "destination": f"/{race_list_name}/index.html"
                },
                {
                    "source": "**",
                    "destination": "/index.html"
                }
            ]
        }
        
        # Create prod target config
        prod_hosting_config = {
            "target": f"{country_code}prod",  # Changed to match .firebaserc
            "public": f"build/{country_code}",
            "ignore": [
                "firebase.json",
                "**/.*",
                "**/node_modules/**"
            ],
            "rewrites": [
                {
                    "source": f"/{race_list_name}/**",
                    "destination": f"/{race_list_name}/index.html"
                },
                {
                    "source": "**",
                    "destination": "/index.html"
                }
            ]
        }
        
        config["hosting"].extend([dev_hosting_config, prod_hosting_config])
    
    # Write the config to firebase.json
    with open('firebase.json', 'w') as f:
        json.dump(config, f, indent=2)

def deploy(country_code):
    """Generate Firebase config for deployment"""
    if not os.path.exists(f"build/{country_code}"):
        print(f"No build directory found for {country_code}")
        return
    
    print(f"Generating Firebase config for {country_code}...")
    generate_firebase_config(['se'])  # Include all countries in config
    print(f"Firebase config generated successfully")

def main():
    # Deploy each country
    countries = ["se"]  # Add your country codes
    for country in countries:
        deploy(country)

if __name__ == "__main__":
    main()