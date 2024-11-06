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

def build_href(race_list_name, country_code, county=None, city=False, race_type=None, category=None, index_content=None):
    """Build href path with proper slugification"""
    path_parts = [slugify(race_list_name, country_code)]
    
    # Handle location part (county, city, or all)
    if city and county:
        # City pages: /loppkalender/stader/stockholm/...
        path_parts.extend([
            slugify(index_content['browse_by_category']['cities'], country_code),
            slugify(county, country_code)
        ])
    elif county:
        # County pages: /loppkalender/blekinge/...
        path_parts.append(slugify(county, country_code))
    else:
        # Default location for type/category pages: /loppkalender/alla-lan/...
        path_parts.append(slugify(index_content['seo_county_folder_name'], country_code))
    
    # Handle type part
    path_parts.append(slugify(
        race_type if race_type else index_content['filter_race_type'],
        country_code
    ))
    
    # Handle category part
    path_parts.append(slugify(
        category if category else index_content['filter_categories'],
        country_code
    ))
    
    return '/' + '/'.join(path_parts)

def build_browse_structure(races, verbose_mapping, index_content):
    """Build the hierarchical structure for browse pages"""
    race_list_name = index_content['race_list_name']
    country_code = index_content['country_code']

    structure = {
        'counties': defaultdict(lambda: {
            'name': '',
            'count': 0,
            'href': '',  # Will store the county's href
            'types': defaultdict(lambda: {
                'count': 0,
                'href': '',  # Will store the type's href within county
                'categories': defaultdict(lambda: {
                    'count': 0,
                    'href': ''  # Will store the category's href within county/type
                })
            })
        }),
        'cities': defaultdict(lambda: {
            'count': 0,
            'href': '',  # Will store the city's href
            'types': defaultdict(lambda: {
                'count': 0,
                'href': '',  # Will store the type's href within city
                'categories': defaultdict(lambda: {
                    'count': 0,
                    'href': ''  # Will store the category's href within city/type
                })
            })
        }),
        'types': defaultdict(lambda: {
            'count': 0,
            'href': '',  # Will store the type's href
            'categories': defaultdict(lambda: {
                'count': 0,
                'href': ''  # Will store the category's href within type
            })
        }),
        'categories': defaultdict(lambda: {
            'count': 0,
            'href': ''  # Will store the category's href
        })
    }
    
    # Get county mapping from index_content
    county_mapping = index_content['county_mapping']
    
    # Process each race
    for race in races:
        county = race.get('county')
        race_type = race.get('type_local')
        
        # Map and process county
        if county in county_mapping:
            mapped_county = county_mapping[county]
            county_data = structure['counties'][mapped_county]
            county_data['name'] = mapped_county
            county_data['count'] += 1
            county_data['href'] = build_href(
                race_list_name, 
                country_code, 
                county=mapped_county,
                index_content=index_content
            )
            
            if race_type:
                type_data = county_data['types'][race_type]
                type_data['count'] += 1
                type_data['href'] = build_href(
                    race_list_name, 
                    country_code, 
                    county=mapped_county,
                    race_type=race_type,
                    index_content=index_content
                )
        
        # Process type
        if race_type:
            type_data = structure['types'][race_type]
            type_data['count'] += 1
            type_data['href'] = build_href(
                race_list_name, 
                country_code, 
                race_type=race_type,
                index_content=index_content
            )
        
        # Process categories
        if race.get('distance_verbose'):
            distances = race['distance_verbose'].split(', ')
            for distance in distances:
                categories = verbose_mapping['distance_mapping'].get(distance, [])
                for category in categories:
                    if category in verbose_mapping['available_categories']:
                        # Update category counts and hrefs at all levels
                        cat_data = structure['categories'][category]
                        cat_data['count'] += 1
                        cat_data['href'] = build_href(
                            race_list_name, 
                            country_code, 
                            category=category,
                            index_content=index_content
                        )
                        
                        if race_type:
                            type_cat_data = structure['types'][race_type]['categories'][category]
                            type_cat_data['count'] += 1
                            type_cat_data['href'] = build_href(
                                race_list_name, 
                                country_code, 
                                race_type=race_type,
                                category=category,
                                index_content=index_content
                            )
                            
                            if county in county_mapping:
                                mapped_county = county_mapping[county]
                                county_type_cat_data = structure['counties'][mapped_county]['types'][race_type]['categories'][category]
                                county_type_cat_data['count'] += 1
                                county_type_cat_data['href'] = build_href(
                                    race_list_name, 
                                    country_code, 
                                    county=mapped_county,
                                    race_type=race_type,
                                    category=category,
                                    index_content=index_content
                                )

    # Process cities separately
    city_races = get_city_mapping(races)
    for city, city_specific_races in city_races.items():
        if len(city_specific_races) >= 2:  # MIN_RACES_THRESHOLD
            city_data = structure['cities'][city]
            city_data['count'] = len(city_specific_races)
            city_data['href'] = build_href(
                race_list_name, 
                country_code, 
                county=city,
                city=True,
                index_content=index_content
            )
            
            for race in city_specific_races:
                race_type = race.get('type_local')
                if race_type:
                    type_data = city_data['types'][race_type]
                    type_data['count'] += 1
                    type_data['href'] = build_href(
                        race_list_name, 
                        country_code, 
                        county=city,
                        city=True,
                        race_type=race_type,
                        index_content=index_content
                    )
                    
                    if race.get('distance_verbose'):
                        distances = race['distance_verbose'].split(', ')
                        for distance in distances:
                            categories = verbose_mapping['distance_mapping'].get(distance, [])
                            for category in categories:
                                if category in verbose_mapping['available_categories']:
                                    cat_data = type_data['categories'][category]
                                    cat_data['count'] += 1
                                    cat_data['href'] = build_href(
                                        race_list_name, 
                                        country_code, 
                                        county=city,
                                        city=True,
                                        race_type=race_type,
                                        category=category,
                                        index_content=index_content
                                    )

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