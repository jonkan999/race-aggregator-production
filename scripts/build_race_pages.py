import json
import os
import yaml
import shutil
from jinja2 import Environment, FileSystemLoader
from PIL import Image
import base64
import io

# Import the custom functions from jinja_functions.py
from jinja_functions import timeago, convert_date, slugify, get_display_values

# Paths
template_dir = 'project-root/templates'
data_dir = 'project-root/data/countries'
global_data_file = 'project-root/data/global.yaml'
global_config_file = 'project-root/config/config.yaml'
build_dir = 'project-root/build'

# Set up Jinja2 environment
env = Environment(loader=FileSystemLoader(template_dir))

# Add custom filters to the Jinja2 environment
env.filters['timeago'] = timeago
env.filters['convert_date'] = convert_date
env.filters['slugify'] = slugify
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

def generate_race_pages(country_code):
    country_dir = os.path.join(data_dir, country_code)
    
    # Load country-specific YAML content
    with open(os.path.join(country_dir, 'index.yaml')) as f:
        index_content = yaml.safe_load(f)
    
    # Load country-specific race data
    with open(os.path.join(country_dir, 'temporary_races.json')) as f:
        races = json.load(f)
    
    # Load image data (assuming it exists)
    try:
        with open(os.path.join(country_dir, 'temporary_images.json')) as f:
            images = json.load(f)
    except FileNotFoundError:
        images = []

    # Merge global content with country-specific content
    content = {**global_content, **index_content}

    # Create build directory
    country_build_dir = os.path.join(build_dir, country_code, 'loppsidor')
    os.makedirs(country_build_dir, exist_ok=True)

    # Clean the build directory before generating new content
    clean_directory(country_build_dir)

    # Load templates
    race_page = env.get_template('race_page.html')
    race_page_content = env.get_template('sections/race-page-content.html')

    for race in races:
        # Create race-specific directory
        race_slug = slugify(race['name'], country_code)
        race_dir = os.path.join(country_build_dir, race_slug)
        os.makedirs(race_dir, exist_ok=True)

        # Clean the race-specific directory
        clean_directory(race_dir)

        # Process and save images
        race_images = []
        for i, image_data in enumerate(images):
            if image_data['id'].startswith(race['id']):
                image_filename = f"{race_slug}_{i+1}.webp"
                image_path = os.path.join(race_dir, image_filename)
                
                # Decode base64 image data
                image_binary = base64.b64decode(image_data['data'].split(',')[1])
                image = Image.open(io.BytesIO(image_binary))
                
                # Save as WebP
                image.save(image_path, 'WEBP')
                race_images.append({
                    'filename': image_filename,
                    'alt': f"{content['race_page_alt_prefix']} {race['name']} - Bild {i+1}"
                })

        # Prepare the context for rendering
        context = {
            **content,
            'race': race,
            'images': race_images,
            'css_path': '/css',
            'js_path': '/js',
            'race_date': convert_date(race['date'], content['month_mapping_short']),
            'mapbox_zoom': content['mapbox_zoom'],
        }

        # Render the race page content
        race_content = race_page_content.render(context)

        # Render the full page
        full_page = race_page.render({**context, 'race_content': race_content})

        # Save the rendered HTML
        with open(os.path.join(race_dir, 'index.html'), 'w', encoding='utf-8') as f:
            f.write(full_page)

    print(f"Race pages generated successfully for {country_code}!")

if __name__ == "__main__":
    # List of countries to generate
    countries = ['se']
    
    for country in countries:
        generate_race_pages(country)