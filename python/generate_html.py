import os
import yaml
import json
import shutil
from jinja2 import Environment, FileSystemLoader, select_autoescape
from build_seo_pages_county import generate_schema_data

import subprocess
from pathlib import Path

# Import the custom timeago function from jinja_functions.py
from jinja_functions import timeago, convert_date, slugify, get_display_values, map_verbose_distance, get_years, get_selected_races

# Paths
template_dir = 'templates'
output_dir = Path('build')
data_dir = Path('data/countries')
global_data_file = 'data/global.yaml'
global_config_file = 'config/config.yaml'
common_dir = 'common'  # Directory containing common files to be copied
less_dir = 'common/less'  # Directory containing LESS files
css_dir = 'common/css'  # Directory to output compiled CSS
js_dir = 'common/js'  # Directory to output compiled js

# Setup Jinja2 environment
env = Environment(
    loader=FileSystemLoader([template_dir, js_dir]),
    autoescape=select_autoescape(['html', 'xml'])
)

# Add the timeago filter to the Jinja environment
env.filters['timeago'] = timeago
env.filters['convert_date'] = convert_date
env.filters['slugify'] = slugify
env.filters['get_display_values'] = get_display_values
env.filters['get_years'] = get_years
env.filters['map_verbose_distance'] = map_verbose_distance

# Add global functions
env.globals['get_selected_races'] = get_selected_races

# Load global YAML content (used across all countries)
with open(global_data_file) as f:
    global_content = yaml.safe_load(f)

# Load config for common configurations
with open(global_config_file) as f:
    config = yaml.safe_load(f)

def clear_css_folder():
    """Remove all files in the CSS folder."""
    if os.path.exists(css_dir):
        for filename in os.listdir(css_dir):
            file_path = os.path.join(css_dir, filename)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.unlink(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                print(f'Failed to delete {file_path}. Reason: {e}')
    else:
        os.makedirs(css_dir)  # Create the CSS directory if it doesn't exist

def compile_less_to_css():
    """Compile LESS files to CSS using Node.js lessc command."""
    print("Clearing CSS folder...")
    clear_css_folder()

    print("Compiling LESS files...")

    try:
        for less_file in os.listdir(less_dir):
            if less_file.endswith('.less'):
                less_file_path = os.path.join(less_dir, less_file)
                css_file_path = os.path.join(css_dir, less_file.replace('.less', '.css'))
                
                # Run lessc command and capture output
                result = subprocess.run(
                    ['lessc', less_file_path, css_file_path],
                    capture_output=True, text=True
                )
                
                if result.returncode != 0:
                    print(f"Error compiling LESS:\n{result.stderr}")
                else:
                    print(f"Compiled {less_file_path} to {css_file_path}")
    
    except Exception as e:
        print(f"General error during LESS compilation: {e}")

def copy_json_files(country_code, country_output_dir):
    """Copy JSON files from country's json folder to build/country/json directory."""
    source_json_dir = Path(data_dir, country_code, 'json')
    dest_json_dir = Path(country_output_dir, 'json')
    
    if source_json_dir.exists():
        # Create destination directory if it doesn't exist
        os.makedirs(dest_json_dir, exist_ok=True)
        
        # Copy all JSON files
        for json_file in source_json_dir.glob('*.json'):
            shutil.copy2(json_file, dest_json_dir)
            print(f"Copied {json_file} to {dest_json_dir}")
    else:
        print(f"JSON directory for {country_code} not found at {source_json_dir}")

def generate_country(country_code):
    country_dir = os.path.join(data_dir, country_code)
    
    # Load country-specific YAML content
    with open(os.path.join(country_dir, 'index.yaml')) as f:
        index_content = yaml.safe_load(f)
        
    # Load distance filter data
    with open(os.path.join(country_dir, 'distance_filter.yaml')) as f:
        distance_filter = yaml.safe_load(f)
    
    # Load country-specific race data
    with open(os.path.join(country_dir, 'final_races.json')) as f:
        races = json.load(f)
    
    # Load country-specific forum data
    with open(os.path.join(country_dir, 'forum_posts.json')) as f:
        dummy_forum_posts = json.load(f)
    current_url = f"{index_content['base_url'].rstrip('/')}/{slugify(index_content['navigation']['race-list'], country_code)}"
    # Generate the race list schema
    with open(f'data/countries/{country_code}/distance_filter.yaml', 'r', encoding='utf-8') as f:
        verbose_mapping = yaml.safe_load(f)
    schema_data = generate_schema_data(
        index_content=index_content,
        country_code=country_code,
        filtered_races=races,
        current_url=current_url,
        navigation=index_content.get('navigation', {}),
        verbose_mapping=verbose_mapping,
        county=None,  # or provide a specific county if applicable
        race_type=None,  # or provide a specific race type if applicable
        category=None  # or provide a specific category if applicable
    )

    # Merge global content with country-specific content
    content = {
        **global_content, 
        **index_content,
        'races': races,
        'dummy_forum_posts': dummy_forum_posts,
        'race_type': index_content.get('race_type', 'Other'),
        'race_page_folder_name': index_content.get('race_page_folder_name'),
        'distance_filter': distance_filter,
        'schema_data': schema_data,  # Add the race list schema to the content
    }

    # Add responsive image sizes from config
    content['sizes'] = config['responsive_image_widths']

    # Combine navigation and auxiliary pages
    for page in ['index','race-list','add-race', 'race-page-preview', 'measure-route', 'pace-calculator','racetime-estimator', 'about-us', 'contact', 'training-plans', 'privacy']:
        # Render the index page template for the country
        page_template = env.get_template(f'{page.replace("-", "_")}.html') 
        page_html = page_template.render(content)
        
        # Output directory for the specific country
        country_output_dir = os.path.join(output_dir, country_code)
        os.makedirs(country_output_dir, exist_ok=True)
        if page != 'index' and page != 'privacy':
           all_pages = {**content['navigation'], **content['auxiliary_pages']}
           local_page_name = slugify(all_pages[page], country_code)
           local_page_dir = os.path.join(country_output_dir, local_page_name)
           os.makedirs(local_page_dir, exist_ok=True)
           with open(Path(country_output_dir, f'{local_page_name}/index.html'),  'w', encoding='utf-8') as f:
               f.write(page_html) 
        elif page == 'index':
           local_page_name = 'index'
           with open(Path(country_output_dir, f'index.html'),  'w', encoding='utf-8') as f:
               f.write(page_html) 
        if page == 'privacy':
           local_page_name = 'privacy'
           privacy_dir = os.path.join(country_output_dir, 'privacy')
           os.makedirs(privacy_dir, exist_ok=True)
           with open(Path(privacy_dir, 'index.html'),  'w', encoding='utf-8') as f:
               f.write(page_html) 


    # Generate JavaScript and JSON files
    js_output_dir = os.path.join(country_output_dir, 'js')
    os.makedirs(js_output_dir, exist_ok=True)
    for js_file in os.listdir(js_dir):
        if js_file.endswith(('.js', '.json')):  # Handle both .js and .json files
            source_path = os.path.join(js_dir, js_file)
            dest_path = os.path.join(js_output_dir, js_file)
            
            if js_file.endswith('.js'):
                # Process JS files through Jinja
                js_template = env.get_template(js_file)
                js_content = js_template.render(content)
                
                with open(dest_path, 'w', encoding='utf-8') as f:
                    f.write(js_content)
            else:
                # Simply copy JSON files
                shutil.copy2(source_path, dest_path)
                print(f"Copied {js_file} to {dest_path}")

    # Copy common files to the country output directory
    copy_common_files(country_output_dir)

    # Copy JSON files to the build directory
    copy_json_files(country_code, country_output_dir)

    # Copy race_page images
    # copy_folder(Path(data_dir, country_code, 'race-pages'), Path(output_dir, country_code, 'race-pages'))

    print(f"Index page generated and common files copied for {country_code}!")

def copy_common_files(destination_dir):
    """Copy only 'css' and 'js' subfolders from the common directory to the destination directory."""
    subfolders_to_copy = ['css', 'common_images', 'icons']  # Specify the subfolders to copy

    if os.path.exists(common_dir):
        for subfolder in subfolders_to_copy:
            s = os.path.join(common_dir, subfolder)
            d = os.path.join(destination_dir, subfolder)
            if os.path.isdir(s):
                shutil.copytree(s, d, dirs_exist_ok=True)
                print(f"Copied {s} to {d}")
            else:
                print(f"Subfolder '{subfolder}' not found in '{common_dir}'. Skipping.")
    else:
        print(f"Common directory '{common_dir}' does not exist. Skipping copy.")

def copy_folder(source_dir, destination_dir):
    # If the destination directory exists, remove it and all its contents
    print('trying to coipy')
    if os.path.exists(destination_dir):
        shutil.rmtree(destination_dir)
    
    # Copy the entire source directory to the destination directory
    shutil.copytree(source_dir, destination_dir)
    print(f"Copied all contents from {source_dir} to {destination_dir}")

def copy_ads_txt(output_dir):
    """Copy ads.txt to all country build directories."""
    source_ads = 'common/ads.txt'
    if os.path.exists(source_ads):
        for country_dir in os.listdir(output_dir):
            country_path = os.path.join(output_dir, country_dir)
            if os.path.isdir(country_path):
                dest_ads = os.path.join(country_path, 'ads.txt')
                shutil.copy2(source_ads, dest_ads)
                print(f"Copied ads.txt to {country_path}")
    else:
        print(f"Warning: ads.txt not found at {source_ads}")

if __name__ == "__main__":
    # Compile LESS to CSS before generating HTML
    compile_less_to_css()

    # List of countries to generate
    countries = ['se', 'no', 'fi', 'dk', 'de', 'nl', 'be', 'ee']
    
    for country in countries:
        generate_country(country)
    
    # Copy ads.txt to all country directories
    copy_ads_txt(output_dir)
