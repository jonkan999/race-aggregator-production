import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from collections import defaultdict
from jinja2 import Environment, FileSystemLoader
import yaml
import json
from pathlib import Path
from jinja_functions import slugify
import argparse

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
    
    # Handle type part only if type or category is active
    if race_type or category:

        path_parts.append(slugify(
            race_type if race_type else index_content['filter_race_type'],
            country_code
        ))
        
        if category:
            # Handle category part only if active
            path_parts.append(slugify(
                category,
            country_code
        ))
    
    return '/' + '/'.join(path_parts)

def build_browse_structure(races, verbose_mapping, index_content):
    """Build the hierarchical structure for browse pages"""
    race_list_name = index_content['race_list_name']
    country_code = index_content['country_code']
    MIN_RACES_THRESHOLD = 1  # Define minimum races threshold

    # Initialize counters for types and categories
    type_counts = defaultdict(int)
    category_counts = defaultdict(int)
    county_type_counts = defaultdict(lambda: defaultdict(int))
    type_category_counts = defaultdict(lambda: defaultdict(int))
    county_type_category_counts = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))

    # First pass: count everything
    for race in races:
        county = race.get('county')
        race_type = race.get('type_local')
        
        if race_type:
            type_counts[race_type] += 1
            if county:
                county_type_counts[county][race_type] += 1

        if race.get('distance_verbose'):
            distances = race['distance_verbose'].split(', ')
            for distance in distances:
                categories = verbose_mapping['distance_mapping'].get(distance, [])
                for category in categories:
                    if category in verbose_mapping['available_categories']:
                        category_counts[category] += 1
                        if race_type:
                            type_category_counts[race_type][category] += 1
                            if county:
                                county_type_category_counts[county][race_type][category] += 1

    # Initialize structure with defaultdict as before
    structure = {
        'counties': defaultdict(lambda: {
            'name': '',
            'count': 0,
            'href': '',
            'types': defaultdict(lambda: {
                'count': 0,
                'href': '',
                'categories': defaultdict(lambda: {
                    'count': 0,
                    'href': ''
                })
            })
        }),
        'cities': defaultdict(lambda: {
            'count': 0,
            'href': '',
            'types': defaultdict(lambda: {
                'count': 0,
                'href': '',
                'categories': defaultdict(lambda: {
                    'count': 0,
                    'href': ''
                })
            })
        }),
        'types': defaultdict(lambda: {
            'count': 0,
            'href': '',
            'categories': defaultdict(lambda: {
                'count': 0,
                'href': ''
            })
        }),
        'categories': defaultdict(lambda: {
            'count': 0,
            'href': ''
        })
    }

    # Get county mapping from index_content
    county_mapping = index_content['county_mapping']
    
    # Second pass: build structure only for valid combinations
    for race in races:
        county = race.get('county')
        race_type = race.get('type_local')
        
        # Only process types that meet the threshold
        if race_type and type_counts[race_type] >= MIN_RACES_THRESHOLD:
            # Map and process county
            if county in county_mapping:
                mapped_county = county_mapping[county]
                if county_type_counts[county][race_type] >= MIN_RACES_THRESHOLD:
                    county_data = structure['counties'][mapped_county]
                    county_data['name'] = mapped_county
                    county_data['count'] += 1
                    county_data['href'] = build_href(
                        race_list_name, 
                        country_code, 
                        county=mapped_county,
                        index_content=index_content
                    )
                    
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
                        if (category in verbose_mapping['available_categories'] and 
                            category_counts[category] >= MIN_RACES_THRESHOLD):
                            if type_category_counts[race_type][category] >= MIN_RACES_THRESHOLD:
                                cat_data = structure['categories'][category]
                                cat_data['count'] = category_counts[category]
                                cat_data['href'] = build_href(
                                    race_list_name, 
                                    country_code, 
                                    category=category,
                                    index_content=index_content
                                )
                                
                                type_cat_data = type_data['categories'][category]
                                type_cat_data['count'] = type_category_counts[race_type][category]
                                type_cat_data['href'] = build_href(
                                    race_list_name, 
                                    country_code, 
                                    race_type=race_type,
                                    category=category,
                                    index_content=index_content
                                )

                                if county in county_mapping:
                                    mapped_county = county_mapping[county]
                                    if county_type_category_counts[county][race_type][category] >= MIN_RACES_THRESHOLD:
                                        county_type_cat_data = structure['counties'][mapped_county]['types'][race_type]['categories'][category]
                                        county_type_cat_data['count'] = county_type_category_counts[county][race_type][category]
                                        county_type_cat_data['href'] = build_href(
                                            race_list_name, 
                                            country_code, 
                                            county=mapped_county,
                                            race_type=race_type,
                                            category=category,
                                            index_content=index_content
                                        )

    # Process cities with the same threshold
    city_races = get_city_mapping(races)
    for city, city_specific_races in city_races.items():
        if len(city_specific_races) >= MIN_RACES_THRESHOLD:
            city_data = structure['cities'][city]
            city_data['count'] = len(city_specific_races)
            city_data['href'] = build_href(
                race_list_name, 
                country_code, 
                county=city,
                city=True,
                index_content=index_content
            )
            
            # Count races by type and category for this city
            city_type_counts = defaultdict(int)
            city_type_category_counts = defaultdict(lambda: defaultdict(int))
            
            for race in city_specific_races:
                race_type = race.get('type_local')
                if race_type:
                    city_type_counts[race_type] += 1
                    
                    if race.get('distance_verbose'):
                        distances = race['distance_verbose'].split(', ')
                        for distance in distances:
                            categories = verbose_mapping['distance_mapping'].get(distance, [])
                            for category in categories:
                                if category in verbose_mapping['available_categories']:
                                    city_type_category_counts[race_type][category] += 1
            
            # Add only valid combinations
            for race_type, type_count in city_type_counts.items():
                if type_count >= MIN_RACES_THRESHOLD:
                    type_data = city_data['types'][race_type]
                    type_data['count'] = type_count
                    type_data['href'] = build_href(
                        race_list_name, 
                        country_code, 
                        county=city,
                        city=True,
                        race_type=race_type,
                        index_content=index_content
                    )
                    
                    for category, cat_count in city_type_category_counts[race_type].items():
                        if cat_count >= MIN_RACES_THRESHOLD:
                            cat_data = type_data['categories'][category]
                            cat_data['count'] = cat_count
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
        'title': index_content['browse_overview']['title'],
        'meta_description': index_content['browse_overview']['meta_description'],
        'title_race_list': index_content['browse_overview']['title'],
        'distance_filter': verbose_mapping,
        'breadcrumbs': generate_browse_breadcrumbs(index_content),
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
        'title': index_content['browse_counties']['title'],
        'meta_description': index_content['browse_counties']['meta_description'],
        'title_race_list': index_content['browse_counties']['title'],
        'distance_filter': verbose_mapping,
        'breadcrumbs': generate_browse_breadcrumbs(index_content, 'counties'),
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
        'title': index_content['browse_cities']['title'],
        'meta_description': index_content['browse_cities']['meta_description'],
        'title_race_list': index_content['browse_cities']['title'],
        'distance_filter': verbose_mapping,
        'breadcrumbs': generate_browse_breadcrumbs(index_content, 'cities'),
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
        'title': index_content['browse_types']['title'],
        'meta_description': index_content['browse_types']['meta_description'],
        'title_race_list': index_content['browse_types']['title'],
        'distance_filter': verbose_mapping,
        'breadcrumbs': generate_browse_breadcrumbs(index_content, 'types'),
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
        'title': index_content['browse_categories']['title'],
        'meta_description': index_content['browse_categories']['meta_description'],
        'title_race_list': index_content['browse_categories']['title'],
        'distance_filter': verbose_mapping,
        'breadcrumbs': generate_browse_breadcrumbs(index_content, 'categories'),
        **base_context
    }
    
    with open(browse_dir / 'categories.html', 'w', encoding='utf-8') as f:
        f.write(template.render(context))

def generate_browse_breadcrumbs(index_content, active_tab=None):
    """Generate breadcrumb structure for browse pages"""
    breadcrumbs = [
        {
            "@type": "ListItem",
            "position": 1,
            "name": index_content['navigation']['race-list'],
            "item": f"/{slugify(index_content['navigation']['race-list'], index_content['country_code'])}"
        },
        {
            "@type": "ListItem",
            "position": 2,
            "name": index_content['browse_by_category']['button'],
            "item": f"/{slugify(index_content['navigation']['race-list'], index_content['country_code'])}/{slugify(index_content['browse_by_category']['button'], index_content['country_code'])}"
        }
    ]
    
    if active_tab and active_tab != 'all':
        tab_mapping = {
            'counties': index_content['browse_by_category']['counties'],
            'cities': index_content['browse_by_category']['cities'],
            'types': index_content['browse_by_category']['types'],
            'categories': index_content['browse_by_category']['categories']
        }
        
        breadcrumbs.append({
            "@type": "ListItem",
            "position": 3,
            "name": tab_mapping[active_tab],
            "item": f"/{slugify(index_content['navigation']['race-list'], index_content['country_code'])}/{slugify(index_content['browse_by_category']['button'], index_content['country_code'])}/{active_tab}.html"
        })
    
    return breadcrumbs

def main():
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description='Generate race list browse pages.')
    parser.add_argument('--country', type=str, default='se', help='Country code for the races')
    args = parser.parse_args()

    # Load races
    with open(f'data/countries/{args.country}/final_races.json', 'r', encoding='utf-8') as f:
        races = json.load(f)
    
    # Load verbose mapping
    with open(f'data/countries/{args.country}/distance_filter.yaml', 'r', encoding='utf-8') as f:
        verbose_mapping = yaml.safe_load(f)
    
    template_dir = 'templates'
    output_dir = f'build/{args.country}'
    country_code = args.country
    
    generate_browse_pages(races, template_dir, output_dir, verbose_mapping, country_code)

if __name__ == "__main__":
    main()