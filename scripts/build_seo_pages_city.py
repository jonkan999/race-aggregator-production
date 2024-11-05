from collections import defaultdict
from itertools import product
import os
import shutil
from jinja2 import Environment, FileSystemLoader
from pathlib import Path
from jinja_functions import slugify, convert_date, map_verbose_distance
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

def generate_seo_content(city, race_type=None, category=None):
    """Generate SEO-friendly title and paragraph based on filters."""
    parts = []
    if category:
        parts.append(f"{category} lopp")
    if race_type:
        parts.append(race_type.lower())
    if city:
        parts.append(f"i {city}")
    
    title = " ".join(parts).capitalize() if parts else "Alla lopp"

    # Paragraph generation
    para_parts = []
    if category and race_type:
        para_parts.append(f"Hitta {category.lower()} {race_type.lower()}lopp i {city}.")
    elif category:
        para_parts.append(f"Upptäck {category.lower()} lopp i {city}.")
    elif race_type:
        para_parts.append(f"Se alla {race_type.lower()}lopp i {city}.")
    else:
        para_parts.append(f"Se alla typer av lopp i {city}.")
    
    para_parts.append("Här hittar du datum, distanser och all information du behöver för att planera ditt nästa lopp.")
    
    return title, " ".join(para_parts)

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

def generate_seo_pages(races, template_dir, output_dir, verbose_mapping, country_code):
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

        # Generate combinations for this city
        combinations = [(None, None)] + list(product(
            [None] + top_race_types,
            [None] + top_categories
        ))

        for race_type, category in combinations:
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

            # Generate folder path
            path_parts = [
                index_content['seo_cities_folder_name'],
                slugify(city, country_code)
            ]
            if race_type:
                path_parts.append(slugify(race_type, country_code))
            if category:
                path_parts.append(slugify(category, country_code))

            # Generate SEO content
            seo_title, seo_paragraph = generate_seo_content(city, race_type, category)

            folder_path = os.path.join(output_dir, slugify(navigation['race-list'], country_code), *path_parts)
            os.makedirs(folder_path, exist_ok=True)

            # Prepare context
            context = {
                'seo_title': seo_title,
                'seo_paragraph': seo_paragraph,
                'races': filtered_races,
                'preselected_filters': {
                    'county': city,  # Use city as county for filtering
                    'race_type': race_type,
                    'category': category,
                    'city': city
                },
                'title_race_list': seo_title,
                'distance_filter': verbose_mapping,
                'navigation': navigation,
                'month_mapping': month_mapping,
                **index_content
            }

            # Write file
            output_path = os.path.join(folder_path, 'index.html')
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(template.render(context))
            print(f"Generated page for {city} - {race_type} - {category}")

    generate_sitemap_for_country(country_code)

def main():
    with open('data/countries/se/final_races.json', 'r', encoding='utf-8') as f:
        races = json.load(f)
    
    with open('data/countries/se/distance_filter.yaml', 'r', encoding='utf-8') as f:
        verbose_mapping = yaml.safe_load(f)
    
    template_dir = 'templates'
    output_dir = 'build/se'
    country_code = 'se'
    
    generate_seo_pages(races, template_dir, output_dir, verbose_mapping, country_code)

if __name__ == "__main__":
    main()