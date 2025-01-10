import sys
import os
import argparse
import html  # Add at the top with other imports

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

# Configuration constants
MIN_RACES_THRESHOLD = 2  # Minimum number of races required to create a page
TOP_N_SUBCATEGORIES = 20  # Number of top subcategories to consider


def get_city_mapping(races):
    """Create a mapping of cities to races."""
    city_races = defaultdict(list)
    for race in races:
        cities = race.get('nearby_cities', [])
        if not cities and race.get('nearest_city'):
            cities = [race['nearest_city']]
        
        for city in cities:
            city_races[city].append(race)
    
    return city_races

def get_top_subcategories(city_races, key):
    """Get the top N subcategories based on number of races."""
    subcategory_count = defaultdict(int)
    for race in city_races:
        value = race.get(key)
        if value:
            subcategory_count[value] += 1
    
    # Sort by count and return top N
    return [k for k, v in sorted(subcategory_count.items(), 
                               key=lambda x: x[1], 
                               reverse=True)[:TOP_N_SUBCATEGORIES]]

def cleanup_empty_seo_pages(output_dir, navigation, country_code, seo_cities_folder_name):
    """Remove all city SEO pages directory."""
    city_pages_path = os.path.join(
        output_dir,
        slugify(navigation['race-list'], country_code),
        seo_cities_folder_name
    )
    
    if os.path.exists(city_pages_path):
        shutil.rmtree(city_pages_path)
        print(f"Cleaned up city pages directory: {city_pages_path}")

def generate_breadcrumbs(index_content, navigation, country_code, city=None, race_type=None, category=None):
    """Generate breadcrumb structure for both visual display and JSON-LD"""
    domain = index_content['base_url'].rstrip('/')
    current_path = f"/{slugify(navigation['race-list'], country_code)}"
    
    # For visual display
    visual_breadcrumbs = [{
        "name": navigation['race-list'],
        "href": current_path
    }]
    
    # For JSON-LD schema (keep the full structure for SEO)
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
    
    # Add city level with combined cities folder name
    if city:
        # Build the full path for the href
        current_path += f"/{slugify(index_content['seo_cities_folder_name'], country_code)}/{slugify(city, country_code)}"
        # Add combined cities+city name for visual display
        visual_breadcrumbs.append({
            "name": f"{index_content['seo_cities_folder_name']}: {city}",
            "href": current_path
        })
        
        # Keep full structure for schema
        schema_breadcrumbs["itemListElement"].extend([
            {
                "@type": "ListItem",
                "position": position,
                "item": {
                    "@type": "WebPage",
                    "@id": f"{domain}/{slugify(navigation['race-list'], country_code)}/{slugify(index_content['seo_cities_folder_name'], country_code)}",
                    "name": index_content['seo_cities_folder_name']
                }
            },
            {
                "@type": "ListItem",
                "position": position + 1,
                "item": {
                    "@type": "WebPage",
                    "@id": f"{domain}{current_path}",
                    "name": city
                }
            }
        ])
        position += 2
    
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

def generate_seo_pages(races, template_dir, output_dir, verbose_mapping, country_code, free_tier=True):
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template('race_list_seo.html')

    # Register filters
    env.filters['slugify'] = slugify
    env.filters['convert_date'] = convert_date
    env.filters['map_verbose_distance'] = map_verbose_distance
    
    # Load country data
    country_dir = os.path.join('data', 'countries', country_code)
    with open(os.path.join(country_dir, 'index.yaml'), 'r', encoding='utf-8') as f:
        index_content = yaml.safe_load(f)

    navigation = index_content.get('navigation', {})
    month_mapping = index_content.get('month_mapping', {})

    # Initialize the SEO content generator
    seo_generator = SEOContentGenerator(
        country_code=country_code,
        language=index_content['country_language'],
        free_tier=free_tier
    )

    # Clean up existing city pages
    cleanup_empty_seo_pages(
        output_dir, 
        navigation, 
        country_code, 
        index_content['seo_cities_folder_name']
    )

    # Get city mapping
    city_races = get_city_mapping(races)
    
    # Process each city
    for city, city_specific_races in city_races.items():

        # Skip cities with insufficient races
        if len(city_specific_races) < MIN_RACES_THRESHOLD:
            print(f"Skipping {city}: insufficient races ({len(city_specific_races)} < {MIN_RACES_THRESHOLD})")
            continue

        # First generate the city index page
        path_parts = [
            slugify(index_content['seo_cities_folder_name'], country_code),
            slugify(city, country_code)
        ]
        
        folder_path = os.path.join(output_dir, slugify(navigation['race-list'], country_code), *path_parts)
        os.makedirs(folder_path, exist_ok=True)

        # Generate SEO content for city index
        seo_content = seo_generator.generate_seo_content(
            index_content=index_content,
            county=city,
            important_keywords=index_content['important_keywords_racelist'],
            county_options=index_content['county_mapping'],
            type_options=index_content['type_options'],
            available_categories=verbose_mapping['available_categories']
        )

        current_url = f"{index_content['base_url'].rstrip('/')}/{slugify(navigation['race-list'], country_code)}"
        
        # Generate schema data for city index
        schema_data = {
            'breadcrumbs': generate_breadcrumbs(
                index_content=index_content,
                navigation=navigation,
                country_code=country_code,
                city=city
            ),
            'navigation': generate_navigation_schema(
                index_content=index_content,
                filtered_races=city_specific_races,
                current_url=current_url,
                country_code=country_code,
                verbose_mapping=verbose_mapping,
                city=city
            ),
            'raceList': generate_race_list_schema(
                index_content=index_content,
                country_code=country_code,
                filtered_races=city_specific_races,
                race_page_folder_name=index_content['race_page_folder_name']
            )
        }

        # Create context for city index
        preselected_filters = {
            'county': city
        }
        encoded_filters = html.escape(json.dumps(preselected_filters))

        context = {
            **index_content,
            'title_race_list': seo_content['title'],
            'meta_description': seo_content['meta_description'],
            'seo_h1': seo_content['h1'],
            'seo_paragraph': seo_content['paragraph'],
            'races': city_specific_races,
            'preselected_filters': encoded_filters,  # Use encoded version
            'distance_filter': verbose_mapping,
            'navigation': navigation,
            'month_mapping': month_mapping,
            'breadcrumbs': schema_data['breadcrumbs'],
            'schema_data': schema_data
        }

        # Write city index file
        output_path = os.path.join(folder_path, 'index.html')
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(template.render(context))
        print(f"Generated index page for {city}")

        # Get top N race types and categories for this city
        top_race_types = get_top_subcategories(city_specific_races, 'type_local')
        
        # Get top categories
        top_categories = []
        for race in city_specific_races:
            if race.get('distance_verbose'):
                for distance in race['distance_verbose'].split(', '):
                    categories = verbose_mapping['distance_mapping'].get(distance, [])
                    top_categories.extend(categories)
        top_categories = list(set(top_categories))[:TOP_N_SUBCATEGORIES]

        # Generate combinations for this city (excluding the None, None case as we already handled it)
        valid_combinations = [
            (race_type, category) for race_type, category in product([None] + top_race_types, [None] + top_categories)
            if any(
                race for race in city_specific_races
                if (not race_type or race['type_local'] == race_type) and
                   (not category or any(
                       cat in verbose_mapping['available_categories']
                       for distance in (race.get('distance_verbose', '').split(', ') if race.get('distance_verbose') else [])
                       for cat in verbose_mapping['distance_mapping'].get(distance.strip(), [])
                   ))
            )
        ]

        for race_type, category in valid_combinations:
            if not any([race_type, category]):
                continue

            # Filter races based on combination
            filtered_races = [
                race for race in city_specific_races
                if (not race_type or race['type_local'] == race_type) and
                (not category or any(
                    cat in verbose_mapping['available_categories']
                    for distance in (race.get('distance_verbose', '').split(', ') if race.get('distance_verbose') else [])
                    for cat in verbose_mapping['distance_mapping'].get(distance.strip(), [])
                ))
            ]

            if len(filtered_races) < MIN_RACES_THRESHOLD:
                print(f"Skipping {city} - {race_type} - {category}: insufficient filtered races ({len(filtered_races)} < {MIN_RACES_THRESHOLD})")
                continue

            # Generate folder path with conditional parts
            path_parts = [
                slugify(index_content['seo_cities_folder_name'], country_code),
                slugify(city, country_code)
            ]
            
            # Only add type and category if they are active
            if race_type or category:
                path_parts.append(slugify(
                    race_type if race_type else index_content['filter_race_type'],
                    country_code
                ))
                
                if category:
                    path_parts.append(slugify(category, country_code))

            folder_path = os.path.join(output_dir, slugify(navigation['race-list'], country_code), *path_parts)

            # Generate SEO content
            seo_content = seo_generator.generate_seo_content(
                index_content=index_content,
                county=city, #use city instead of county
                race_type=race_type,
                category=category,
                important_keywords=index_content['important_keywords_racelist'],
                county_options=index_content['county_mapping'],
                type_options=index_content['type_options'],
                available_categories=verbose_mapping['available_categories']
            )
            os.makedirs(folder_path, exist_ok=True)

            # Prepare context for filtered pages
            schema_data = {
                'breadcrumbs': generate_breadcrumbs(
                    index_content=index_content,
                    navigation=navigation,
                    country_code=country_code,
                    city=city,
                    race_type=race_type,
                    category=category
                ),
                'navigation': generate_navigation_schema(
                    index_content=index_content,
                    filtered_races=filtered_races,
                    current_url=current_url,
                    country_code=country_code,
                    verbose_mapping=verbose_mapping,
                    city=city,
                    race_type=race_type,
                    category=category
                ) if filtered_races else None,
                'raceList': generate_race_list_schema(
                    index_content=index_content,
                    country_code=country_code,
                    filtered_races=filtered_races,
                    race_page_folder_name=index_content['race_page_folder_name']
                ) if filtered_races else None
            }

            preselected_filters = {
                'county': city,
                'race_type': race_type,
                'category': category
            }
            encoded_filters = html.escape(json.dumps(preselected_filters))

            context = {
                **index_content,
                'title_race_list': seo_content['title'],
                'meta_description': seo_content['meta_description'],
                'seo_h1': seo_content['h1'],
                'seo_paragraph': seo_content['paragraph'],
                'races': filtered_races,
                'preselected_filters': encoded_filters,  # Use encoded version
                'distance_filter': verbose_mapping,
                'navigation': navigation,
                'month_mapping': month_mapping,
                'breadcrumbs': schema_data['breadcrumbs'],
                'schema_data': schema_data
            }

            # Write file
            output_path = os.path.join(folder_path, 'index.html')
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(template.render(context))
            print(f"Generated page for {city} - {race_type} - {category}")

    generate_sitemap_for_country(country_code)
def generate_navigation_schema(index_content, filtered_races, current_url, country_code, verbose_mapping, city=None, race_type=None, category=None):
    if category is not None:
        return None
    """Generate schema.org SiteNavigationElement for race filters"""
    nav_items = []
    
    # Limit available categories to the first 6
    limited_categories = set(verbose_mapping['available_categories'][:6])
        # If we're at a race type level, only show categories
    if race_type:
        categories = defaultdict(int)
        for race in filtered_races:
            if race['type_local'] == race_type and race.get('distance_verbose'):
                for distance in race['distance_verbose'].split(', '):
                    for cat in verbose_mapping['distance_mapping'].get(distance, []):
                        if cat in limited_categories:
                            categories[cat] += 1
        
        # Only show categories with 2+ races
        valid_items = {item: count for item, count in categories.items() if count >= 2}
        top_items = sorted(valid_items.items(), key=lambda item: item[1], reverse=True)[:5]

    # If we're at city level or root level, show both race types and categories
    else:
        combined_items = defaultdict(int)
        for race in filtered_races:
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
    
    # Build the base URL path including city and cities folder if present
    base_url = current_url
    if city:
        base_url += f"/{slugify(index_content['seo_cities_folder_name'], country_code)}/{slugify(city, country_code)}"

    # Add the navigation items
    if top_items:
        nav_items.extend([{
            "@type": "SiteNavigationElement",
            "name": item,
            "url": base_url + (
                # If it's a category, include race_type or default race type in the path
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
                    "identifier": race['domain_name'],
                    "image": f"/{race_page_folder_name}/{race['domain_name']}/{race['domain_name']}_1.webp",
                    "description": race['description'][:160],
                    "eventStatus": "Premier" if race.get('supplied_ids') else "Standard"
                }
            }
            for i, race in enumerate(valid_races[:max_races])
        ],
        "numberOfItems": min(len(valid_races), max_races)
    }

def main():
    parser = argparse.ArgumentParser(description='Generate SEO pages for cities')
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