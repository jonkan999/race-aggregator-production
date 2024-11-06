from jinja2 import Environment, FileSystemLoader, Template
from datetime import datetime, timedelta
import re
import unicodedata

def timeago(value):
    """
    Convert a datetime string to a time ago format.
    """
    now = datetime.utcnow()
    past = datetime.strptime(value, '%Y-%m-%dT%H:%M:%SZ')
    diff = now - past

    seconds = diff.total_seconds()
    minutes = seconds // 60
    hours = minutes // 60
    days = hours // 24

    if seconds < 60:
        return f"{int(seconds)} seconds ago"
    elif minutes < 60:
        return f"{int(minutes)} minutes ago"
    elif hours < 24:
        return f"{int(hours)} hours ago"
    elif days < 30:
        return f"{int(days)} days ago"
    else:
        return past.strftime('%Y-%m-%d')
    
def convert_date(date_str, month_mapping_short):
    # Extract the day, month, and year from the date string
    year = date_str[:4]
    month = date_str[4:6]
    day = date_str[6:8]
    
    # Use the month_mapping_short to get the month name
    month_name = month_mapping_short.get(month, "")
    
    # Format the date
    return f"{int(day)} {month_name}"

def slugify(input_string,country_code):
    """
    Converts a Swedish string to a slugified version:
    - Converts to lowercase
    - Replaces special characters and spaces with "-"
    - Converts å, ä, and ö to a, a, and o
    
    Parameters:
    - input_string (str): The string to be converted.

    Returns:
    - str: The slugified string.
    """
    # Convert to lowercase
    input_string = input_string.lower()

    if country_code == 'se': 
        # Replace å, ä, and ö with a, a, and o
        input_string = input_string.replace('å', 'a').replace('ä', 'a').replace('ö', 'o')

    # Normalize the string to remove diacritics (accents)
    input_string = unicodedata.normalize('NFKD', input_string)
    input_string = "".join(c for c in input_string if not unicodedata.combining(c))

    # Replace any non-alphanumeric characters (excluding '-') with "-"
    input_string = re.sub(r'[^a-z0-9\s-]', '', input_string)

    # Replace spaces and hyphens with a single "-"
    input_string = re.sub(r'[\s-]+', '-', input_string)

    # Remove leading and trailing hyphens
    input_string = input_string.strip('-')

    return input_string

def get_display_values(distances, race_type, category_mapping):
    # Sort distances in ascending order
    sorted_distances = sorted(distances)
    display_values = []

    # Cap the number of displayed distances at 4
    for distance in sorted_distances[:4]:
        if race_type == 'track':
            display_values.append(f"{distance} meter")
        else:
            distance_km = distance // 1000
            found = False

            for key, value in category_mapping.items():
                if isinstance(value, str) and value == distance:
                    display_values.append(key)
                    found = True
                    break
                elif isinstance(value, dict) and 'range' in value:
                    if distance_km >= value['range'][0] and distance_km <= value['range'][1]:
                        display_values.append(key)
                        found = True
                        break
            
            if not found:
                display_values.append(f"{distance_km} km")
    
    return display_values

def map_verbose_distance(distance_str, verbose_mapping):
    """Maps verbose distance strings to their local equivalents and formats units"""
    if not distance_str:
        return verbose_mapping.get('fallback', '')
    
    # First check for verbose mappings
    for eng, local in verbose_mapping.items():
        if eng != 'fallback' and eng.lower() in distance_str.lower():
            return local
    
    # Then handle unit spacing
    distance_str = distance_str.replace('km', ' km')
    distance_str = distance_str.replace('meter', ' meter')
    
    # Remove any double spaces that might have been created
    return ' '.join(distance_str.split())


