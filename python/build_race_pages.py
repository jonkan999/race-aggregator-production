import json
import os
import yaml
import shutil
from jinja2 import Environment, FileSystemLoader
from PIL import Image
import base64
import io
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from datetime import datetime

# Import the custom functions from jinja_functions.py
from jinja_functions import timeago, convert_date, slugify, get_display_values, map_verbose_distance

# Import the generate_sitemap function from generate_sitemap.py
from generate_sitemap import generate_sitemap_for_country

# Paths
template_dir = 'templates'
data_dir = 'data/countries'
global_data_file = 'data/global.yaml'
global_config_file = 'config/config.yaml'
build_dir = 'build'

# Set up Jinja2 environment
env = Environment(loader=FileSystemLoader(template_dir))

# Add custom filters to the Jinja2 environment
env.filters['timeago'] = timeago
env.filters['convert_date'] = convert_date
env.filters['slugify'] = slugify
env.filters['map_verbose_distance'] = map_verbose_distance
env.globals['get_display_values'] = get_display_values

# Load global YAML content (used across all countries)
with open(global_data_file) as f:
    global_content = yaml.safe_load(f)

# Load config for common configurations
with open(global_config_file) as f:
    config = yaml.safe_load(f)

def clean_directory(directory):
    """Remove all files and subdirectories in the given directory."""
    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
        except Exception as e:
            print(f'Failed to delete {file_path}. Reason: {e}')

def find_matching_categories(distance_str, category_mapping):
    """Find all matching categories for a given distance."""
    matching_categories = set()
    try:
        # Convert distance string to number (km)
        if distance_str.lower() == "marathon":
            distance_km = 42.2
        elif distance_str.lower() == "half marathon":
            distance_km = 21.1
        else:
            # Handle different formats (5km, 5,5km, etc)
            num_str = distance_str.lower().replace('km', '').replace(',', '.')
            distance_km = float(num_str)
        
        # Find all matching categories
        for category, config in category_mapping.items():
            if isinstance(config, dict) and 'range' in config:
                min_dist, max_dist = config['range']
                if min_dist <= distance_km <= max_dist:
                    matching_categories.add(category)
            elif config == "backyard" and distance_str.lower() == "backyard":
                matching_categories.add(category)
                
        return list(matching_categories) if matching_categories else [distance_str]
    except:
        return [distance_str]  # fallback to original if parsing fails

def generate_distance_mapping(races, verbose_mapping, category_mapping):
    """Generate a complete distance mapping from all races."""
    all_distances = set()
    
    # Collect all unique distances
    for race in races:
        if race.get('distance_verbose'):
            distances = race['distance_verbose'].split(', ')
            all_distances.update(distances)
    
    # Create the mapping dictionary
    distance_mapping = {}
    categories_used = set()
    
    for distance in sorted(all_distances):
        # First check if it's in verbose_mapping
        if distance in verbose_mapping:
            mapped_distance = verbose_mapping[distance]
        else:
            mapped_distance = distance
            
        # Find all matching categories
        categories = find_matching_categories(mapped_distance, category_mapping)
        # Only include categories that are defined in category_mapping
        valid_categories = [cat for cat in categories if cat in category_mapping]
        
        if valid_categories:  # Only add to mapping if there are valid categories
            distance_mapping[distance] = valid_categories
            categories_used.update(valid_categories)
    
    # Use category_mapping keys to maintain order
    ordered_categories = [cat for cat in category_mapping.keys() if cat in categories_used]
    
    return {
        'distance_mapping': distance_mapping,
        'available_categories': ordered_categories
    }

def generate_distance_filter(country_code):
    """Generate distance filter mapping for a specific country."""
    country_dir = os.path.join(data_dir, country_code)
    
    # Load country-specific YAML content
    with open(os.path.join(country_dir, 'index.yaml')) as f:
        index_content = yaml.safe_load(f)
    
    # Load country-specific race data
    with open(os.path.join(country_dir, 'final_races.json')) as f:
        races = json.load(f)
    
    # Generate distance mapping
    mapping_data = generate_distance_mapping(
        races, 
        index_content.get('verbose_local_distance_mapping', {}),
        index_content.get('category_mapping', {})
    )
    
    # Save distance mapping to a new file
    with open(os.path.join(country_dir, 'distance_filter.yaml'), 'w', encoding='utf-8') as f:
        yaml.dump(mapping_data, f, allow_unicode=True, sort_keys=False)
    
    print(f"Distance filter generated successfully for {country_code}!")

def fetch_forum_posts(country_code, domain_name):
    """Fetch forum posts for a specific race."""
    # Initialize Firebase Admin if not already initialized
    if not firebase_admin._apps:
        cred = credentials.Certificate('python/keys/firestore_service_account.json')
        firebase_admin.initialize_app(cred)
    
    db = firestore.client()
    
    # Query posts for this specific race
    posts = (db.collection(f'forum_posts_{country_code}')
             .where('source_race', '==', domain_name)
             .order_by('createdAt', direction=firestore.Query.DESCENDING)
             .get())
    
    # Convert to list of dicts and format dates
    formatted_posts = []
    for post in posts:
        post_dict = post.to_dict()
        # Convert Firestore Timestamp to string
        if 'createdAt' in post_dict:
            post_dict['createdAt'] = post_dict['createdAt'].strftime('%Y-%m-%d %H:%M')
        formatted_posts.append(post_dict)
    
    return formatted_posts

def generate_race_pages(country_code, domain_name=None):
    """
    Generate race pages for a country. If domain_name is provided,
    only generate the page for that specific race.
    """
    # First generate the distance filter (only if building all races)
    if not domain_name:
        generate_distance_filter(country_code)
    
    country_dir = os.path.join(data_dir, country_code)
    
    # Load country-specific YAML content
    with open(os.path.join(country_dir, 'index.yaml')) as f:
        index_content = yaml.safe_load(f)
    
    # Load country-specific race data
    with open(os.path.join(country_dir, 'final_races.json')) as f:
        all_races = json.load(f)
        
    # Filter races if domain_name is provided
    races = [race for race in all_races if race['domain_name'] == domain_name] if domain_name else all_races
    
    if domain_name and not races:
        print(f"No race found with domain name: {domain_name}")
        return

    # Load image data (assuming it exists)
    try:
        with open(os.path.join(country_dir, 'final_images.json')) as f:
            images_data = json.load(f)
    except FileNotFoundError:
        images_data = {}

    # Merge global content with country-specific content
    content = {**global_content, **index_content}

    # Create build directory
    country_build_dir = os.path.join(build_dir, country_code, content['race_page_folder_name'])
    os.makedirs(country_build_dir, exist_ok=True)

    # Clean the build directory before generating new content
    clean_directory(country_build_dir)

    # Load templates
    race_page = env.get_template('race_page.html')
    race_page_content = env.get_template('sections/race-page-content.html')

    for race in races:
        print(f"\n############ race: {race['name']} ############")
        # Create race-specific directory
        race_dir = os.path.join(country_build_dir, race['domain_name'])
        os.makedirs(race_dir, exist_ok=True)

        # Clean the race-specific directory
        clean_directory(race_dir)

        # Process and save images
        race_images = []
        if race['domain_name'] in images_data:
            race_image_data = images_data[race['domain_name']]
            for image_data in race_image_data['images'][:4]:
                image_filename = f"{race['domain_name']}_{image_data['number']}.webp"
                image_path = os.path.join(race_dir, image_filename)
                
                # Decode base64 image data
                image_binary = base64.b64decode(image_data['base64'])
                img = Image.open(io.BytesIO(image_binary))
                
                # Save as WebP
                img.save(image_path, 'WEBP')
                race_images.append({
                    'filename': image_filename,
                    'alt': image_data['alt_text']
                })
        
        # Fetch forum posts for this race
        forum_posts = fetch_forum_posts(country_code, race['domain_name'])
        
        # Prepare the context for rendering
        context = {
            **content,
            'race': race,
            'images': race_images,
            'css_path': '/css',
            'js_path': '/js',
            'race_date': convert_date(race['date'], content['month_mapping_short']),
            'mapbox_zoom': content['mapbox_zoom'],
            'forum_posts': forum_posts,  # Add forum posts to context
        }

        # Render the race page content
        race_content = race_page_content.render(context)

        # Render the full page
        full_page = race_page.render({**context, 'race_content': race_content})

        # Save the rendered HTML
        with open(os.path.join(race_dir, 'index.html'), 'w', encoding='utf-8') as f:
            f.write(full_page)

    print(f"Race pages generated successfully for {country_code}!")

    # Generate sitemap after race pages are created
    generate_sitemap_for_country(country_code)  # Call to generate the sitemap

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "distance-filter":
            # If running with "distance-filter" argument, only generate the filter
            countries = sys.argv[2:] if len(sys.argv) > 2 else ['se']
            for country in countries:
                generate_distance_filter(country)
        else:
            # Assume first argument is domain_name
            domain_name = sys.argv[1]
            countries = ['se']  # or could be passed as additional argument
            for country in countries:
                generate_race_pages(country, domain_name)
    else:
        # Default behavior: generate everything
        countries = ['se']
        for country in countries:
            generate_race_pages(country)