import os
import subprocess
import yaml
from pathlib import Path
from urllib.parse import urlparse

def get_site_name(country_code):
    """Get site name from country's index.yaml base_url or page_name"""
    yaml_path = f"data/countries/{country_code}/index.yaml"
    
    with open(yaml_path, 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
    
    # Use first page_name to create site name
    #return config.get('page_name') #change this when we are live with the domain
    return "curious-queijadas-2762d5"


def deploy_country(country_code):
    build_dir = f"build/{country_code}"
    site_name = get_site_name(country_code)
    
    print(f"Deploying {country_code} to {site_name}")
    
    # Create netlify.toml for this country
    netlify_config = f"""
[build]
  publish = "build/{country_code}"
  
[build.environment]
  COUNTRY_CODE = "{country_code}"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
"""
    
    with open("netlify.toml", "w") as f:
        f.write(netlify_config)
    
    # Check if site exists
    result = subprocess.run(["netlify", "sites:list"], capture_output=True, text=True)
    site_exists = site_name in result.stdout
    print(f"Site name: {site_name}")
    print(f"Std output: {result.stdout}")
    if not site_exists:
        # Create new site
        subprocess.run(["netlify", "sites:create", "--name", site_name])
    
    # Deploy
    subprocess.run([
        "netlify", "deploy",
        "--dir", build_dir,
        "--site", site_name,
        "--prod"
    ])

def main():
    # Deploy each country
    countries = ["se"]  # Add your country codes
    for country in countries:
        if os.path.exists(f"build/{country}"):
            print(f"Deploying {country}...")
            deploy_country(country)
        else:
            print(f"No build directory found for {country}")

if __name__ == "__main__":
    main()