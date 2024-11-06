import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from collections import defaultdict
from jinja2 import Environment, FileSystemLoader
import yaml
import json
from pathlib import Path
from jinja_functions import slugify

def create_base_context(index_content, country_code):
    """Create the base context for rendering templates."""
    
    # Extract the entire navigation structure
    navigation = {}
    if isinstance(index_content, dict) and 'navigation' in index_content:
        if isinstance(index_content['navigation'], dict):
            navigation = index_content['navigation']  # Include the whole navigation

    browse_by_category = index_content.get('browse_by_category', {})
    return {
        'navigation': navigation,
        'country_code': country_code,
        'browse_by_category': browse_by_category,
        **index_content
    }
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

def build_browse_structure(races, verbose_mapping, index_content):
    """Build the hierarchical structure for browse pages"""
    structure = {
        'counties': defaultdict(lambda: {
            'name': '',  # Store the name of the county
            'count': 0,
            'types': defaultdict(lambda: {
                'count': 0,
                'categories': defaultdict(int)
            })
        }),
        'cities': defaultdict(lambda: {
            'count': 0,
            'types': defaultdict(lambda: {
                'count': 0,
                'categories': defaultdict(int)
            })
        }),
        'types': defaultdict(lambda: {
            'count': 0,
            'categories': defaultdict(int)
        }),
        'categories': defaultdict(int)
    }
    
    # Get county mapping from index_content
    county_mapping = index_content.get('county_mapping', {})

    # Get city mapping first
    city_races = get_city_mapping(races)
    
    # Process each race for county and type statistics
    for race in races:
        county = race.get('county')
        race_type = race.get('type_local')
        
        # Map the county using the county_mapping
        if county in county_mapping:
            mapped_county = county_mapping[county]
            structure['counties'][mapped_county]['name'] = mapped_county
            structure['counties'][mapped_county]['count'] += 1
            
            # Update race types within county
            if race_type:
                structure['counties'][mapped_county]['types'][race_type]['count'] += 1
        
        # Update overall race type stats
        if race_type:
            structure['types'][race_type]['count'] += 1
        
        # Handle categories from distance_verbose
        if race.get('distance_verbose'):
            distances = race['distance_verbose'].split(', ')
            for distance in distances:
                categories = verbose_mapping['distance_mapping'].get(distance, [])
                for category in categories:
                    if category in verbose_mapping['available_categories']:
                        # Update category counts at all levels
                        structure['categories'][category] += 1
                        if race_type:
                            structure['types'][race_type]['categories'][category] += 1
                        if county in county_mapping:
                            mapped_county = county_mapping[county]
                            structure['counties'][mapped_county]['types'][race_type]['categories'][category] += 1

    # Process cities separately using the city mapping
    for city, city_specific_races in city_races.items():
        # Only include cities with at least 2 races (MIN_RACES_THRESHOLD)
        if len(city_specific_races) >= 2:
            structure['cities'][city]['count'] = len(city_specific_races)
            
            # Process race types within city
            for race in city_specific_races:
                race_type = race.get('type_local')
                if race_type:
                    structure['cities'][city]['types'][race_type]['count'] += 1
                
                # Handle categories for city
                if race.get('distance_verbose'):
                    distances = race['distance_verbose'].split(', ')
                    for distance in distances:
                        categories = verbose_mapping['distance_mapping'].get(distance, [])
                        for category in categories:
                            if category in verbose_mapping['available_categories']:
                                if race_type:
                                    structure['cities'][city]['types'][race_type]['categories'][category] += 1

    return structure

def generate_browse_pages(races, template_dir, output_dir, verbose_mapping, country_code):
    """Generate all browse pages"""
    env = Environment(loader=FileSystemLoader(template_dir))
    env.filters['slugify'] = slugify
    
    # Load index content
    with open(f'data/countries/{country_code}/index.yaml', 'r', encoding='utf-8') as f:
        index_content = yaml.safe_load(f)
    
    # Build the browse structure
    structure = build_browse_structure(races, verbose_mapping, index_content)
    
    # Create browse directory
    browse_dir = Path(output_dir) / slugify(index_content['race_list_name'], country_code) / slugify(index_content['browse_by_category']['button'], country_code)
    browse_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate overview page
    template = env.get_template('browse/browse_overview.html')
    base_context = create_base_context(index_content, country_code)
    context = {
        'active_tab': 'all',
        'structure': structure,
        'title': 'Bläddra bland alla lopp',
        'meta_description': 'Hitta lopp efter län, typ eller kategori',
        'title_race_list': 'Bläddra bland alla lopp',
        **base_context
    }
    with open(browse_dir / 'index.html', 'w', encoding='utf-8') as f:
        f.write(template.render(context))
    
    # Generate county browse page
    template = env.get_template('browse/browse_counties.html')
    base_context = create_base_context(index_content, country_code)
    context = {
        'active_tab': 'counties',
        'structure': structure,
        'title': 'Bläddra efter län',
        'meta_description': 'Hitta lopp i ditt län',
        'title_race_list': 'Bläddra efter län',
        **base_context
    }
    
    with open(browse_dir / 'counties.html', 'w', encoding='utf-8') as f:
        f.write(template.render(context))

    # Generate cities browse page
    template = env.get_template('browse/browse_cities.html')
    base_context = create_base_context(index_content, country_code)
    context = {
        'active_tab': 'cities',
        'structure': structure,
        'title': 'Bläddra efter stad',
        'meta_description': 'Hitta lopp i din stad',
        'title_race_list': 'Bläddra efter stad',
        **base_context
    }
    
    with open(browse_dir / 'cities.html', 'w', encoding='utf-8') as f:
        f.write(template.render(context))
    
    # Generate types browse page
    template = env.get_template('browse/browse_types.html')
    base_context = create_base_context(index_content, country_code)
    context = {
        'active_tab': 'types',
        'structure': structure,
        'title': 'Bläddra efter lopptyp',
        'meta_description': 'Hitta lopp efter typ av lopp',
        'title_race_list': 'Bläddra bland alla lopp',
        **base_context
    }
    
    with open(browse_dir / 'types.html', 'w', encoding='utf-8') as f:
        f.write(template.render(context))
    
    # Generate categories browse page
    template = env.get_template('browse/browse_categories.html')
    base_context = create_base_context(index_content, country_code)
    context = {
        'active_tab': 'categories',
        'structure': structure,
        'title': 'Bläddra efter kategori',
        'meta_description': 'Hitta lopp efter distans och kategori',
        'title_race_list': 'Bläddra bland alla lopp',
        **base_context
    }
    
    with open(browse_dir / 'categories.html', 'w', encoding='utf-8') as f:
        f.write(template.render(context))

def main():
    # Load races
    with open('data/countries/se/final_races.json', 'r', encoding='utf-8') as f:
        races = json.load(f)
    
    # Load verbose mapping
    with open('data/countries/se/distance_filter.yaml', 'r', encoding='utf-8') as f:
        verbose_mapping = yaml.safe_load(f)
    
    template_dir = 'templates'
    output_dir = 'build/se'
    country_code = 'se'
    
    generate_browse_pages(races, template_dir, output_dir, verbose_mapping, country_code)

if __name__ == "__main__":
    main()