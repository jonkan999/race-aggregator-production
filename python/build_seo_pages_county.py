import sys
import os

# Add the parent directory to the system path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from python.gemini_response import SEOContentGenerator

from collections import defaultdict
from itertools import product
import os
import shutil
from jinja2 import Environment, FileSystemLoader
from pathlib import Path
from jinja_functions import slugify, convert_date, map_verbose_distance  # Import the function
import yaml
import json
from datetime import datetime
from generate_sitemap import generate_sitemap_for_country


def get_valid_combinations(races, verbose_mapping):
    """Get all valid filter combinations that have races."""
    valid_combinations = defaultdict(set)
    valid_category_combinations = defaultdict(lambda: defaultdict(set))

    for race in races:
        county = race['county']
        race_type = race['type_local']
        
        valid_combinations['counties'].add(county)
        valid_combinations['types'].add(race_type)

        # Check if 'distance_verbose' is present and not None
        if 'distance_verbose' in race and race['distance_verbose']:
            distances = race['distance_verbose'].split(', ')  # Split by ', '
            for distance in distances:
                # Map the distance to its categories
                categories = verbose_mapping['distance_mapping'].get(distance)
                
                # Add valid categories to valid_combinations and track which categories exist for each county/type
                if categories:
                    for cat in categories:
                        if cat in verbose_mapping['available_categories']:
                            valid_combinations['categories'].add(cat)
                            valid_category_combinations[county][race_type].add(cat)

    return valid_combinations, valid_category_combinations

def cleanup_empty_seo_pages(output_dir, navigation, country_code, seo_cities_folder_name, browse_categories_folder_name):
    """Remove all SEO pages except the cities directory."""
    race_list_path = os.path.join(output_dir, slugify(navigation['race-list'], country_code))
    
    if os.path.exists(race_list_path):
        # Get all items in the directory
        items = os.listdir(race_list_path)
        
        # Remove everything except the cities folder
        for item in items:
            item_path = os.path.join(race_list_path, item)
            if item != slugify(seo_cities_folder_name, country_code) and item != slugify(browse_categories_folder_name, country_code):  # Keep the cities folder
                if os.path.isdir(item_path):
                    shutil.rmtree(item_path)
                else:
                    os.remove(item_path)
        
        print(f"Cleaned up SEO pages directory (kept {seo_cities_folder_name})")

def generate_breadcrumbs(index_content, navigation, country_code, county=None, race_type=None, category=None):
    """Generate breadcrumb structure for JSON-LD and navigation."""
    domain = index_content['base_url'].rstrip('/')
    current_path = f"/{slugify(navigation['race-list'], country_code)}"
    
    # For JSON-LD schema, we need absolute URLs
    breadcrumbs = [{
        "@type": "ListItem",
        "position": 1,
        "name": navigation['race-list'],
        "item": f"{domain}{current_path}",  # Absolute URL for schema
        "href": current_path  # Relative URL for navigation
    }]
    position = 2
    
    # For alla-lan, link to root loppkalender
    if not county or county == index_content['seo_county_folder_name']:
        breadcrumbs.append({
            "@type": "ListItem",
            "position": position,
            "name": index_content['seo_county_folder_name'],
            "item": f"{domain}{current_path}",  # Absolute URL for schema
            "href": current_path  # Relative URL for navigation
        })
        current_path += f"/{slugify(index_content['seo_county_folder_name'], country_code)}"
    else:
        current_path += f"/{slugify(county, country_code)}"
        breadcrumbs.append({
            "@type": "ListItem",
            "position": position,
            "name": county,
            "item": f"{domain}{current_path}",  # Absolute URL for schema
            "href": current_path  # Relative URL for navigation
        })
    position += 1
    
    # Add race type level (or alla-loppstyper)
    if race_type or category:
        if not race_type:
            # For default race type, link behavior depends on if we're in alla-lan
            if not county or county == index_content['seo_county_folder_name']:
                # If we're in alla-lan, link to root
                breadcrumbs.append({
                    "@type": "ListItem",
                    "position": position,
                    "name": index_content['filter_race_type'],
                    "item": f"{domain}/{current_path.split('/')[1]}",  # Link to root
                    "href": f"/{current_path.split('/')[1]}"
                })
            else:
                # If we're in a specific county, link to county
                breadcrumbs.append({
                    "@type": "ListItem",
                    "position": position,
                    "name": index_content['filter_race_type'],
                    "item": f"{domain}{current_path}",  # Absolute URL for schema
                    "href": current_path  # Relative URL for navigation
                })
            current_path += f"/{slugify(index_content['filter_race_type'], country_code)}"
        else:
            current_path += f"/{slugify(race_type, country_code)}"
            breadcrumbs.append({
                "@type": "ListItem",
                "position": position,
                "name": race_type,
                "item": f"{domain}{current_path}",  # Absolute URL for schema
                "href": current_path  # Relative URL for navigation
            })
        position += 1
    
    # Add category if present
    if category:
        current_path += f"/{slugify(category, country_code)}"
        breadcrumbs.append({
            "@type": "ListItem",
            "position": position,
            "name": category,
            "item": f"{domain}{current_path}",  # Absolute URL for schema
            "href": current_path  # Relative URL for navigation
        })
    
    return breadcrumbs

def generate_category_schema(race_types, city=None):
    """Generate schema.org ItemList for race categories/types"""
    items = []
    for i, race_type in enumerate(race_types, 1):
        base_url = f"/loppkalender/stader/{slugify(city, 'se')}" if city else "/loppkalender"
        
        item = {
            "@type": "ListItem",
            "position": i,
            "item": {
                "@type": "CollectionPage",
                "name": race_type['name'],
                "url": f"{base_url}/{slugify(race_type['name'], 'se')}",
                "description": f"Hitta {race_type['name'].lower()} löplopp och löpartävlingar{' i ' + city if city else ''}",
                "numberOfItems": race_type['count']
            }
        }
        items.append(item)

    return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": items,
        "numberOfItems": len(items),
        "description": f"Bläddra efter lopptyp{' i ' + city if city else ''}"
    }

def generate_seo_pages(races, template_dir, output_dir, verbose_mapping, country_code, free_tier=True):

    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template('race_list_seo.html')

    # Register the slugify function as a filter
    env.filters['slugify'] = slugify
    env.filters['convert_date'] = convert_date
    env.filters['map_verbose_distance'] = map_verbose_distance
    
    # Load everything from index.yaml
    country_dir = os.path.join('data', 'countries', country_code)
    with open(os.path.join(country_dir, 'index.yaml'), 'r', encoding='utf-8') as f:
        index_content = yaml.safe_load(f)

        # Initialize the SEO content generator
    seo_generator = SEOContentGenerator(
        country_code=country_code,
        language=index_content['country_language'],
        free_tier=free_tier
    )

    # Extract necessary data from index_content
    navigation = index_content.get('navigation', {})
    month_mapping = index_content.get('month_mapping', {})
    county_mapping = index_content.get('county_mapping', {})  # Load county mapping
    
    # Cleanup before generating
    cleanup_empty_seo_pages(output_dir, navigation, country_code, index_content['seo_cities_folder_name'], index_content['browse_by_category']['button'])

    # Get valid combinations
    valid_combinations, valid_category_combinations = get_valid_combinations(races, verbose_mapping)
    
    # Map counties using county_mapping
    mapped_counties = {county_mapping.get(county, county) for county in valid_combinations['counties']}
    
    # First generate county-only and county+type combinations
    base_combinations = product(
        [None] + list(mapped_counties),
        [None] + list(valid_combinations['types']),
        [None]  # No categories yet
    )
    
    # Generate category combinations separately for each county+type combination
    all_combinations = []
    for county, race_type, _ in base_combinations:
        # Add the base combination (without category)
        if any([county, race_type]):  # Skip if both are None
            all_combinations.append((county, race_type, None))
        
        # Add valid category combinations for this county+type
        if county and race_type:
            original_county = next(c for c in valid_combinations['counties'] 
                                 if county_mapping.get(c, c) == county)
            valid_cats = valid_category_combinations[original_county][race_type]
            for category in valid_cats:
                all_combinations.append((county, race_type, category))
        elif county:  # County-only with categories
            original_county = next(c for c in valid_combinations['counties'] 
                                 if county_mapping.get(c, c) == county)
            valid_cats = set().union(*[cats for cats in valid_category_combinations[original_county].values()])
            for category in valid_cats:
                all_combinations.append((county, None, category))
        elif race_type:  # Race-type-only with categories
            valid_cats = set().union(*[
                type_cats 
                for county_cats in valid_category_combinations.values()
                for type_cats in [county_cats.get(race_type, set())]
                if type_cats
            ])
            for category in valid_cats:
                all_combinations.append((None, race_type, category))

    # Define root path for race list pages
    root_path = os.path.join(output_dir, slugify(navigation['race-list'], country_code))
    os.makedirs(root_path, exist_ok=True)

    # Then process all valid combinations
    for county, race_type, category in all_combinations:
        # Skip if all filters are None (that's the main page)
        if not any([county, race_type, category]):
            continue
            
        # Check if this combination has at least 2 races BEFORE creating directories
        filtered_races = [
            race for race in races
            if (not county or county_mapping.get(race['county'], race['county']) == county) and
               (not race_type or race['type_local'] == race_type) and
               (not category or any(
                   cat in verbose_mapping['available_categories'] for distance in (race.get('distance_verbose', '').split(', ') if race.get('distance_verbose') else [])
                   for cat in verbose_mapping['distance_mapping'].get(distance.strip(), [])
               ))
        ]
        
        if len(filtered_races) < 1:  # Only proceed if we have at least 2 races
            continue
            
        # Build the folder path only for valid combinations
        path_parts = []
        
        # Add county part (or alla-lan)
        path_parts.append(slugify(county if county else index_content['seo_county_folder_name'], country_code))
        
        # Add race type part (or alla-loppstyper) only if we have race_type or category
        if race_type or category:
            path_parts.append(slugify(race_type if race_type else index_content['filter_race_type'], country_code))
            
        # Add category if specified
        if category:
            path_parts.append(slugify(category, country_code))

        # Create the full path
        folder_path = os.path.join(root_path, *path_parts)
        os.makedirs(folder_path, exist_ok=True)

        # Generate SEO content
        seo_content = seo_generator.generate_seo_content(
            index_content=index_content,
            county=county,
            race_type=race_type,
            category=category,
            important_keywords=index_content['important_keywords_racelist'],
            county_options=index_content['county_mapping'],
            type_options=index_content['type_options'],
            available_categories=verbose_mapping['available_categories']
        )
        
        # Prepare context for rendering
        context = {
            **index_content,
            'title_race_list': seo_content['title'],
            'meta_description': seo_content['meta_description'],
            'seo_h1': seo_content['h1'],
            'seo_paragraph': seo_content['paragraph'],
            'races': filtered_races,
            'preselected_filters': {
                'county': county,
                'race_type': race_type,
                'category': category
            },
            'distance_filter': verbose_mapping,
            'navigation': navigation,
            'month_mapping': month_mapping,
            'breadcrumbs': generate_breadcrumbs(
                index_content=index_content,
                navigation=navigation,
                country_code=country_code,
                county=county,
                race_type=race_type,
                category=category
            )
        }
        
        output = template.render(context)
        
        # Write file
        output_path = os.path.join(folder_path, 'index.html')
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(output)

    # Update sitemap
    generate_sitemap_for_country(country_code)  # Call to generate the sitemap

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate SEO pages for counties')
    parser.add_argument('--country', '-c', type=str, default='se', help='Country code (default: se)')
    parser.add_argument('--free-tier', '-f', action='store_true', default=True, help='Use free tier rate limiting (default: True)')
    parser.add_argument('--paid', '-p', action='store_true', help='Disable rate limiting for paid tier')
    
    args = parser.parse_args()
    
    # If --paid is specified, override free_tier to False
    free_tier = False if args.paid else args.free_tier
    country_code = args.country.lower()
    
    with open(f'data/countries/{country_code}/final_races.json', 'r', encoding='utf-8') as f:
        races = json.load(f)
    
    with open(f'data/countries/{country_code}/distance_filter.yaml', 'r', encoding='utf-8') as f:
        verbose_mapping = yaml.safe_load(f)
    
    template_dir = 'templates'
    output_dir = f'build/{country_code}'
    
    generate_seo_pages(races, template_dir, output_dir, verbose_mapping, country_code, free_tier=free_tier)

if __name__ == "__main__":
    main()

""" # Examples of usage:
# Default: Swedish site with rate limiting
python build_seo_pages_county.py

# Norwegian site with rate limiting
python build_seo_pages_county.py --country no

# Swedish site without rate limiting (paid tier)
python build_seo_pages_county.py --paid

# Norwegian site without rate limiting (paid tier)
python build_seo_pages_county.py --country no --paid
# or
python build_seo_pages_county.py -c no -p
"""