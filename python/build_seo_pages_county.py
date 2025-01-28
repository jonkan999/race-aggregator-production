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
from jinja_functions import slugify, convert_date, map_verbose_distance,get_image_path  # Import the function
import yaml
import json
from datetime import datetime
from generate_sitemap import generate_sitemap_for_country
import html


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
    """Generate breadcrumb structure for both visual display and JSON-LD"""
    domain = index_content['base_url'].rstrip('/')
    current_path = f"/{slugify(navigation['race-list'], country_code)}"
    
    # For visual display
    visual_breadcrumbs = [{
        "name": navigation['race-list'],
        "href": current_path
    }]
    
    # For JSON-LD schema
    schema_breadcrumbs = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [{
            "@type": "ListItem",
            "position": 1,
            "item": {
                "@type": "WebPage",
                "@id": f"{domain}{current_path}",
                "name": navigation['race-list']
            }
        }]
    }
    position = 2
    
    # Add county level
    if county:
        current_path += f"/{slugify(county, country_code)}"
        visual_breadcrumbs.append({
            "name": county,
            "href": current_path
        })
        schema_breadcrumbs["itemListElement"].append({
            "@type": "ListItem",
            "position": position,
            "item": {
                "@type": "WebPage",
                "@id": f"{domain}{current_path}",
                "name": county
            }
        })
        position += 1
    
    # Add race type level
    if race_type:
        current_path += f"/{slugify(race_type, country_code)}"
        visual_breadcrumbs.append({
            "name": race_type,
            "href": current_path
        })
        schema_breadcrumbs["itemListElement"].append({
            "@type": "ListItem",
            "position": position,
            "item": {
                "@type": "WebPage",
                "@id": f"{domain}{current_path}",
                "name": race_type
            }
        })
        position += 1
    
    # Add category level
    if category:
        current_path += f"/{slugify(category, country_code)}"
        visual_breadcrumbs.append({
            "name": category,
            "href": current_path
        })
        schema_breadcrumbs["itemListElement"].append({
            "@type": "ListItem",
            "position": position,
            "item": {
                "@type": "WebPage",
                "@id": f"{domain}{current_path}",
                "name": category
            }
        })
    
    return {
        "visual": visual_breadcrumbs,
        "schema": schema_breadcrumbs
    }


def generate_navigation_schema(index_content, filtered_races, current_url, country_code, verbose_mapping, county=None, race_type=None, category=None):
    """Generate schema.org SiteNavigationElement for race filters"""
    if category is not None:
        return None # We don't need navigation for categories as its at the bottom of the hierarchy
    nav_items = []
    county_mapping = index_content.get('county_mapping', {})
    
    # Limit available categories to the first 6
    limited_categories = set(verbose_mapping['available_categories'][:6])
    
    # Build the base URL path
    base_url = current_url
    if county:
        base_url += f"/{slugify(county, country_code)}"
    else:
        # If no county specified, use the default "alla-lan"
        base_url += f"/{slugify(index_content['seo_county_folder_name'], country_code)}"
    
    # If we're at a race type level, only show categories
    if race_type:
        categories = defaultdict(int)
        for race in filtered_races:
            mapped_county = county_mapping.get(race['county'], race['county'])
            if (not county or mapped_county == county) and race['type_local'] == race_type and race.get('distance_verbose'):
                for distance in race['distance_verbose'].split(', '):
                    for cat in verbose_mapping['distance_mapping'].get(distance, []):
                        if cat in limited_categories:
                            categories[cat] += 1
        
        # Only show categories with 2+ races
        valid_items = {item: count for item, count in categories.items() if count >= 2}
        top_items = sorted(valid_items.items(), key=lambda item: item[1], reverse=True)[:5]
    
    # If we're at county level or root level, show both race types and categories
    else:
        combined_items = defaultdict(int)
        for race in filtered_races:
            mapped_county = county_mapping.get(race['county'], race['county'])
            if not county or mapped_county == county:
                # Count race types
                combined_items[race['type_local']] += 1
                
                # Count categories
                if race.get('distance_verbose'):
                    for distance in race['distance_verbose'].split(', '):
                        for cat in verbose_mapping['distance_mapping'].get(distance, []):
                            if cat in limited_categories:
                                combined_items[cat] += 1
        
        # Only show items with 2+ races
        valid_items = {item: count for item, count in combined_items.items() if count >= 2}
        top_items = sorted(valid_items.items(), key=lambda item: item[1], reverse=True)[:5]
    
    # Add the navigation items
    if top_items:
        nav_items.extend([{
            "@type": "SiteNavigationElement",
            "name": item,
            "url": base_url + (
                # If it's a category, include race_type or the default race type in the path
                f"/{slugify(race_type if race_type else index_content['filter_race_type'], country_code)}/{slugify(item, country_code)}"
                if item in limited_categories  # Check if the item is a category
                else f"/{slugify(item, country_code)}"
            ),
            "description": f"{index_content['show_local']} {count} {item.lower()} {index_content['race_local']}",
            "numberOfItems": count
        } for item, count in top_items])

    return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": nav_items,
        "numberOfItems": len(nav_items)
    }

def generate_race_list_schema(index_content, country_code, filtered_races, race_page_folder_name, max_races=5):
    """Generate schema.org ItemList for race listing"""
    
    # Get today's date in YYYYMMDD format
    today = datetime.now().strftime('%Y%m%d')
    
    # Filter out past races and races with missing required fields
    valid_races = [
        race for race in filtered_races
        if race['date'] >= today and all([
            race.get('name'),
            race.get('date'),
            race.get('location'),
            race.get('county'),
            race.get('type_local'),
            race.get('domain_name'),
            race.get('description')
        ])
    ]

    # Sort races: premier races (with supplied_ids) first, then by date
    valid_races.sort(
        key=lambda x: (
            not bool(x.get('supplied_ids')),  # Premier races first (False sorts before True)
            x['date']  # Then sort by date
        )
    )

    return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": i + 1,
                "item": {
                    "@type": "SportsEvent",
                    "name": race['name'],
                    "startDate": race['date'],
                    "location": {
                        "@type": "Place",
                        "name": race['location'],
                        "address": {
                            "@type": "PostalAddress",
                            "addressLocality": race['location'],
                            "addressRegion": race['county'],
                            "addressCountry": country_code
                        }
                    },
                    "sport": f"{index_content['running_local']}, {race['type_local']}",
                    "distance": race.get('distance_verbose', ''),
                    "identifier": race['domain_name'],  # Add identifier field
                    "image": f"/{race_page_folder_name}/{race['domain_name']}/{race['domain_name']}_1.webp",
                    "description": race['description'][:160],
                    "eventStatus": "Premier" if race.get('supplied_ids') else "Standard"
                }
            }
            for i, race in enumerate(valid_races[:max_races])
        ],
        "numberOfItems": min(len(valid_races), max_races)
    }
def generate_schema_data(index_content, country_code, filtered_races, current_url, navigation, verbose_mapping, county=None, race_type=None, category=None):
    return {
            'breadcrumbs': generate_breadcrumbs(
                index_content=index_content,
                navigation=navigation,
                country_code=country_code,
                county=county,
                race_type=race_type,
                category=category
            ),
            'navigation': generate_navigation_schema(
                index_content,
                filtered_races,
                current_url=current_url,
                country_code=country_code,
                verbose_mapping=verbose_mapping,
                county=county,
                race_type=race_type,
                category=category
            ) if filtered_races else None,  # Only generate if we have races
            'raceList': generate_race_list_schema(index_content, country_code, filtered_races, index_content['race_page_folder_name']) if filtered_races else None
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
    
    # First, add the default combinations to all_combinations
    all_combinations = []
    
    # Add "alla-lan" combinations
    all_combinations.append((None, None, None))  # Base page
    all_combinations.extend([(None, None, category) for category in valid_combinations['categories']])
    
    # Add race type combinations for "alla-lan"
    for race_type in valid_combinations['types']:
        all_combinations.append((None, race_type, None))
        # Add categories for this race type
        all_combinations.extend([(None, race_type, category) for category in valid_combinations['categories']])
    
    # Then add county-specific combinations
    for county in mapped_counties:
        # Add county-only
        all_combinations.append((county, None, None))
        
        # Add county + race type combinations
        for race_type in valid_combinations['types']:
            all_combinations.append((county, race_type, None))
            
            # Add county + race type + category combinations
            original_county = next(c for c in valid_combinations['counties'] 
                                if county_mapping.get(c, c) == county)
            valid_cats = valid_category_combinations[original_county][race_type]
            for category in valid_cats:
                all_combinations.append((county, race_type, category))
        
        # Add county + category combinations (without race type)
        valid_cats = set().union(*[cats for cats in valid_category_combinations[original_county].values()])
        for category in valid_cats:
            all_combinations.append((county, None, category))

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
        current_url = f"{index_content['base_url'].rstrip('/')}/{slugify(navigation['race-list'], country_code)}"
        
        # Ensure all schema components are defined
        schema_data = generate_schema_data(index_content, country_code, filtered_races, current_url, navigation, verbose_mapping, county, race_type, category)

        print(schema_data)
        # Before setting the context, encode the preselected filters properly
        import json
        import html

        # Prepare preselected filters
        preselected_filters = {
            'category': category,
            'county': county,
            'race_type': race_type
        }

        # Properly encode the JSON for HTML attribute
        encoded_filters = html.escape(json.dumps(preselected_filters))

        context = {
            **index_content,
            'title_race_list': seo_content['title'],
            'meta_description': seo_content['meta_description'],
            'seo_h1': seo_content['h1'],
            'seo_paragraph': seo_content['paragraph'],
            'races': filtered_races,
            'preselected_filters': encoded_filters,  # Use the encoded version
            'distance_filter': verbose_mapping,
            'navigation': navigation,
            'month_mapping': month_mapping,
            'breadcrumbs': schema_data['breadcrumbs'],
            'schema_data': schema_data,
            'get_image_path': get_image_path
        }
        
        # Write file
        output = template.render(context)
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