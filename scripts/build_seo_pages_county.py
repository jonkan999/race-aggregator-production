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

def generate_seo_content(county=None, race_type=None, category=None):
    """Generate SEO-friendly title and paragraph based on filters."""
    # Title generation
    parts = []
    if category:
        parts.append(f"{category} lopp")
    if race_type:
        parts.append(race_type.lower())
    if county:
        parts.append(f"i {county}")
    
    title = " ".join(parts).capitalize() if parts else "Alla lopp"

    # Paragraph generation
    para_parts = []
    if category and race_type and county:
        para_parts.append(f"Hitta {category.lower()} {race_type.lower()}lopp i {county}.")
    elif category and race_type:
        para_parts.append(f"Utforska {category.lower()} {race_type.lower()}lopp i hela Sverige.")
    elif category and county:
        para_parts.append(f"Upptäck {category.lower()} lopp i {county}.")
    elif race_type and county:
        para_parts.append(f"Se alla {race_type.lower()}lopp i {county}.")
    elif category:
        para_parts.append(f"Hitta {category.lower()} lopp över hela Sverige.")
    elif race_type:
        para_parts.append(f"Utforska {race_type.lower()}lopp i alla regioner.")
    elif county:
        para_parts.append(f"Se alla typer av lopp i {county}.")
    
    para_parts.append("Här hittar du datum, distanser och all information du behöver för att planera ditt nästa lopp.")
    
    return title, " ".join(para_parts)

def get_valid_combinations(races, verbose_mapping):
    """Get all valid filter combinations that have races."""
    valid_combinations = defaultdict(set)

    for race in races:
        valid_combinations['counties'].add(race['county'])
        valid_combinations['types'].add(race['type_local'])

        # Check if 'distance_verbose' is present and not None
        if 'distance_verbose' in race and race['distance_verbose']:
            distances = race['distance_verbose'].split(', ')  # Split by ', '
            for distance in distances:
                # Map the distance to its categories
                categories = verbose_mapping['distance_mapping'].get(distance)
                
                # Add valid categories to valid_combinations
                if categories:
                    valid_combinations['categories'].update(
                        cat for cat in categories if cat in verbose_mapping['available_categories']
                    )

    return valid_combinations

def cleanup_empty_seo_pages(output_dir, navigation, country_code, seo_cities_folder_name):
    """Remove all SEO pages except the cities directory."""
    race_list_path = os.path.join(output_dir, slugify(navigation['race-list'], country_code))
    
    if os.path.exists(race_list_path):
        # Get all items in the directory
        items = os.listdir(race_list_path)
        
        # Remove everything except the cities folder
        for item in items:
            item_path = os.path.join(race_list_path, item)
            if item != seo_cities_folder_name:  # Keep the cities folder
                if os.path.isdir(item_path):
                    shutil.rmtree(item_path)
                else:
                    os.remove(item_path)
        
        print(f"Cleaned up SEO pages directory (kept {seo_cities_folder_name})")

def generate_seo_pages(races, template_dir, output_dir, verbose_mapping, country_code):

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

    # Extract necessary data from index_content
    navigation = index_content.get('navigation', {})
    month_mapping = index_content.get('month_mapping', {})
    county_mapping = index_content.get('county_mapping', {})  # Load county mapping
    
    # Cleanup before generating
    cleanup_empty_seo_pages(output_dir, navigation, country_code, index_content['seo_cities_folder_name'])

    # Get valid combinations
    valid_combinations = get_valid_combinations(races, verbose_mapping)
    
    # Map counties using county_mapping
    mapped_counties = {county_mapping.get(county, county) for county in valid_combinations['counties']}
    
    # Generate all possible combinations
    combinations = product(
        [None] + list(mapped_counties),
        [None] + list(valid_combinations['types']),
        [None] + list(valid_combinations['categories'])
    )
    
    # Keep track of valid paths for sitemap
    valid_paths = set()
    
    # Filter out invalid combinations and generate pages
    for county, race_type, category in combinations:
        # Skip if all filters are None (that's the main page)
        if not any([county, race_type, category]):
            continue
            
        # Check if this combination has at least 2 races
        filtered_races = [
            race for race in races
            if (not county or county_mapping.get(race['county'], race['county']) == county) and
               (not race_type or race['type_local'] == race_type) and
               (not category or any(
                   cat in verbose_mapping['available_categories'] for distance in (race.get('distance_verbose', '').split(', ') if race.get('distance_verbose') else [])
                   for cat in verbose_mapping['distance_mapping'].get(distance.strip(), [])
               ))
        ]
        
        if len(filtered_races) < 2:  # Only create pages with at least 2 races
            continue
            
        # Generate folder path
        path_parts = []
        if county:
            path_parts.append(slugify(county, country_code))
        if race_type:
            path_parts.append(slugify(race_type, country_code))
        if category:
            path_parts.append(slugify(category, country_code))

        # Generate SEO content
        seo_title, seo_paragraph = generate_seo_content(county, race_type, category)
        
        folder_path = os.path.join(output_dir, slugify(navigation['race-list'], country_code), *path_parts)
        os.makedirs(folder_path, exist_ok=True)
        valid_paths.add(folder_path)  # Track valid paths

        # Prepare context for rendering
        context = {
            'seo_title': seo_title,
            'seo_paragraph': seo_paragraph,
            'races': filtered_races,
            'preselected_filters': {
                'county': county,
                'race_type': race_type,
                'category': category
            },
            'title_race_list': seo_title,
            'distance_filter': verbose_mapping,
            'navigation': navigation,  # Add navigation to the context
            'month_mapping': month_mapping,  # Add month_mapping to the context
            **index_content  # Unpack the entire index_content into the context
        }
        
        output = template.render(context)
        
        # Write file
        output_path = os.path.join(folder_path, 'index.html')
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(output)

    # Update sitemap
    generate_sitemap_for_country(country_code)  # Call to generate the sitemap

def main():
    # Example usage
    # Load races from your data source
    with open('data/countries/se/final_races.json', 'r', encoding='utf-8') as f:
        races = json.load(f)
    
    # Load your verbose mapping
    with open('data/countries/se/distance_filter.yaml', 'r', encoding='utf-8') as f:
        verbose_mapping = yaml.safe_load(f)
    
    # Set up paths
    template_dir = 'templates'
    output_dir = 'build/se'
    
    # Define country code (you can set this based on your context)
    country_code = 'se'  # Example country code
    
    # Generate pages
    generate_seo_pages(races, template_dir, output_dir, verbose_mapping, country_code)

if __name__ == "__main__":
    main()