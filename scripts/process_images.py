import os
import yaml
from PIL import Image
import shutil

# Paths
data_dir = 'data/countries'
output_dir = 'build'

# Load configuration from YAML
config_path = 'config/config.yaml'

with open(config_path, 'r') as file:
    config = yaml.safe_load(file)

# Use the loaded config for image sizes
sizes = config['responsive_image_widths']

# Max file size in KB
max_file_size = config['max_image_size']

def clear_country_output_folder(country_code):
    """Wipe out the 'images' folder within the output folder for the specific country to ensure it is a fresh reflection of the source folder."""
    country_output_dir = os.path.join(output_dir, country_code, 'images')
    
    if os.path.exists(country_output_dir):
        shutil.rmtree(country_output_dir)
        print(f"Images folder '{country_output_dir}' has been cleared.")
    else:
        print(f"Images folder '{country_output_dir}' does not exist and will be created.")

    # Ensure the 'images' directory is recreated after deletion
    os.makedirs(country_output_dir, exist_ok=True)

def process_image(country_code, image_file):
    country_dir = os.path.join(data_dir, country_code, 'images')
    output_country_dir = os.path.join(output_dir, country_code, 'images')
    
    # Ensure the output directory exists
    os.makedirs(output_country_dir, exist_ok=True)
    
    with Image.open(os.path.join(country_dir, image_file)) as img:
        original_width, original_height = img.size

        # First, create the xlarge image
        img_resized = img.copy()
        img_resized.thumbnail((sizes['xlarge'], int(sizes['xlarge'] * (original_height / original_width))), Image.Resampling.LANCZOS)
        output_file = os.path.join(output_country_dir, f'{os.path.splitext(image_file)[0]}_xlarge.webp')
        img_resized.save(output_file, 'WEBP', quality=85)  # High-quality xlarge image

        # Now, crop horizontally for smaller sizes based on the xlarge image
        for label in ['large', 'medium', 'small']:
            width = sizes[label]
            
            # Calculate cropping area (focus on reducing width while keeping the height)
            left = (sizes['xlarge'] - width) / 2
            right = (sizes['xlarge'] + width) / 2
            img_cropped = img_resized.crop((left, 0, right, img_resized.height))
            
            output_file = os.path.join(output_country_dir, f'{os.path.splitext(image_file)[0]}_{label}.webp')
            img_cropped.save(output_file, 'WEBP', quality=85)  # Maintain quality for all sizes
    
    print(f"Processed image: {image_file} for {country_code}")

def process_country_images(country_code):
    country_dir = os.path.join(data_dir, country_code, 'images')
    
    if not os.path.exists(country_dir):
        print(f"No images found for country {country_code}. Skipping.")
        return
    
    clear_country_output_folder(country_code)  # Clear output folder for the specific country

    for image_file in os.listdir(country_dir):
        if image_file.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
            process_image(country_code, image_file)

if __name__ == "__main__":

    # List of countries to process
    countries = ['se', 'no', 'de']
    
    for country in countries:
        process_country_images(country)
