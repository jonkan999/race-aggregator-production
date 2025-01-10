import yaml
from pathlib import Path
import re
from jinja_functions import slugify

def parse_template_sections(template_path: Path) -> dict:
    """Parse robots.txt template into sections based on country codes."""
    sections = {'specific': [], 'default': []}
    current_section = None
    current_countries = []
    
    with open(template_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line.startswith('['):
                # New section starts
                if line == '[*]':
                    current_section = 'default'
                    current_countries = []
                else:
                    current_section = 'specific'
                    # Parse country codes like [se,no] into list ['se', 'no']
                    current_countries = line.strip('[]').split(',')
                    current_countries = [c.strip() for c in current_countries]
            elif line and current_section:
                if current_section == 'specific':
                    sections['specific'].append((current_countries, line))
                else:
                    sections['default'].append(line)
    
    return sections

def replace_variables(template_line: str, country_config: dict, country_code: str) -> str:
    """Replace variables in a robots.txt line with values from config."""
    
    # Handle direct replacements (like race_page_folder_name)
    if '_folder_name' in template_line:
        folder_name = country_config.get('race_page_folder_name', 'race-pages')
        return template_line.replace('race_page_folder_name', folder_name)
    
    # Handle navigation.* replacements with their slugified display values
    nav_match = re.search(r'navigation\.(\w+(?:-\w+)?)', template_line)
    if nav_match:
        nav_key = nav_match.group(1)
        nav_value = country_config.get('navigation', {}).get(nav_key)
        if nav_value:
            slugified_value = slugify(nav_value, country_code)
            return template_line.replace(f'navigation.{nav_key}', slugified_value)
    
    return template_line

def generate_robots_txt(country_config: dict, template_sections: dict, country_code: str) -> str:
    """Generate robots.txt content using template sections and country config."""
    
    result_lines = []
    
    # Determine which section to use
    if any(country_code in countries for countries, _ in template_sections['specific']):
        # Use specific rules for this country
        for countries, line in template_sections['specific']:
            if country_code in countries:
                if line.startswith('Disallow:'):
                    line = replace_variables(line, country_config, country_code)
                result_lines.append(line)
    else:
        # Use default rules
        for line in template_sections['default']:
            if line.startswith('Disallow:'):
                line = replace_variables(line, country_config, country_code)
            result_lines.append(line)
    
    return '\n'.join(result_lines) + '\n'

def main():
    # Get the project root directory
    project_root = Path(__file__).parent.parent
    
    # Path to template robots.txt
    template_path = project_root / 'common' / 'robots.txt'
    
    # Parse template sections
    template_sections = parse_template_sections(template_path)
    
    # Path to countries directory
    countries_dir = project_root / 'data' / 'countries'
    
    # Create output directory for robots.txt files if it doesn't exist
    output_dir = project_root / 'build'
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Process each country
    for country_dir in countries_dir.iterdir():
        if country_dir.is_dir():
            country_code = country_dir.name
            index_yaml_path = country_dir / 'index.yaml'
            
            if index_yaml_path.exists():
                # Load country configuration
                with open(index_yaml_path, 'r', encoding='utf-8') as f:
                    country_config = yaml.safe_load(f)
                
                # Generate robots.txt content
                robots_content = generate_robots_txt(country_config, template_sections, country_code)
                
                # Write robots.txt to country-specific output directory
                country_output_dir = output_dir / country_code
                country_output_dir.mkdir(parents=True, exist_ok=True)
                
                robots_path = country_output_dir / 'robots.txt'
                with open(robots_path, 'w', encoding='utf-8') as f:
                    f.write(robots_content)
                
                print(f"Generated robots.txt for {country_code}")

if __name__ == "__main__":
    main()