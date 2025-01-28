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
    Converts a string to a slugified version:
    - Converts to lowercase
    - Replaces special characters and spaces with "-"
    - Handles special characters for different countries
    
    Parameters:
    - input_string (str): The string to be converted.
    - country_code (str): Country code to determine which replacements to use.

    Returns:
    - str: The slugified string.
    """
    # Convert to lowercase
    input_string = input_string.lower()

    if country_code == 'se': 
        # Replace å, ä, and ö with a, a, and o
        input_string = input_string.replace('å', 'a').replace('ä', 'a').replace('ö', 'o')
    if country_code == 'no': 
        # Replace å, æ, and ø with a, a, and o
        input_string = input_string.replace('å', 'a').replace('æ', 'a').replace('ø', 'o')
    if country_code == 'fi': 
        # Replace å, ä, and ö with a, a, and o
        input_string = input_string.replace('å', 'a').replace('ä', 'a').replace('ö', 'o')
    if country_code == 'dk': 
        # Replace å, æ, and ø with a, a, and o
        input_string = input_string.replace('å', 'a').replace('æ', 'a').replace('ø', 'o')
    if country_code == 'de': 
        # Replace all german special characters
        input_string = input_string.replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue').replace('ß', 'ss')
    if country_code == 'ee':
        # Handle Estonian special characters
        estonian_replacements = {
            # Vowels with diacritics
            'õ': 'o',  # Estonian specific letter
            'ä': 'a',
            'ö': 'o',
            'ü': 'u',
            'š': 's',  # Used in loanwords
            'ž': 'z',  # Used in loanwords
            'č': 'c',  # Used in loanwords
            'ļ': 'l',  # Used in loanwords
            'ķ': 'k',  # Used in loanwords
            'ņ': 'n',  # Used in loanwords
            'ū': 'u',  # Used in loanwords
        }
        for old, new in estonian_replacements.items():
            input_string = input_string.replace(old, new)
    if country_code == 'nl' or country_code == 'be': 
        # Handle Dutch special characters
        dutch_replacements = {
            # Common vowels with diacritics
            'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
            'ï': 'i', 'í': 'i', 'ì': 'i', 'î': 'i',
            'ö': 'o', 'ó': 'o', 'ò': 'o', 'ô': 'o',
            'ü': 'u', 'ú': 'u', 'ù': 'u', 'û': 'u',
            'ä': 'a', 'á': 'a', 'à': 'a', 'â': 'a',
            
            # Additional Dutch characters
            'ĳ': 'ij',  # Dutch digraph
            'Ĳ': 'ij',  # Uppercase Dutch digraph
            'ÿ': 'y',   # Sometimes used in borrowed words
            'ñ': 'n',   # Used in borrowed words
            'ç': 'c',   # Used in borrowed words
        }
        for old, new in dutch_replacements.items():
            input_string = input_string.replace(old, new)

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

def get_years(dummy_input):
    current_date = datetime.now()
    future_date = current_date + timedelta(days=120)  # roughly 4 months
    
    if current_date.year == future_date.year:
        return str(current_date.year)
    else:
        return f"{current_date.year}-{future_date.year}"

def get_selected_races(races):
    """

    ONLY SELECTS STATIC LIST THAT HAVE SUPPLIED IDS. IN FUTURE WE WILL NEED TO ADD A DYNAMIC LIST THAT ALSO HAVE SUPPLIED IDS.
    MAYBE ONE LIST PER COUNTY AND THEN WE PICK THE LIST BASED ON WHICH COUNTY THE USER IS ON, AND A DEFAULT FALLBACK. WE SHOULD HAVE MORE THAN 5 RACES IN EACH LIST. AND THEN FILTER OUT TOP 5 ON THE CLIENT SIDE AND ALSO APPLY FILTERS TO THIS LIST.

    Filter and sort races that have supplied_ids
    
    Args:
        races: List of all race objects
        country_code: Country code to filter races (default: 'se')
    
    Returns:
        List of selected race objects sorted by date
    """
    # Filter races that have non-empty supplied_ids
    selected_races = [
        race for race in races 
        if race.get('supplied_ids') and len(race.get('supplied_ids', [])) > 0
    ]
    
    # Sort by date (assuming date is in format YYYYMMDD)
    selected_races.sort(key=lambda x: x.get('date', '99999999'))
    
    return selected_races

def get_image_path(country_code, domain_name, image_num=1):
    """Generate the correct image path with cache busting."""
    base_url = f"https://storage.googleapis.com/aggregatory-440306.firebasestorage.app/race-images/{country_code}/{domain_name}/{domain_name}_{image_num}.webp"
    return f"{base_url}?v=1"  # Add version parameter for cache control


