import os
import xml.etree.ElementTree as ET
from datetime import datetime
import sys
import yaml

def load_context(country_code):
    """Load the base URL from the index.yaml file for the specified country."""
    country_dir = os.path.join('data', 'countries', country_code)
    index_path = os.path.join(country_dir, 'index.yaml')
    
    with open(index_path, 'r', encoding='utf-8') as f:
        index_context = yaml.safe_load(f)
    
    return index_context

def convert_path_to_url(path, base_url, country_code):
    """Convert a file path to a URL using the base URL."""
    relative_path = os.path.relpath(path, start=os.path.join('build', country_code))
    return base_url + relative_path.replace(os.sep, '/').replace('index.html', '')

def generate_sitemap_for_country(country_code):
    """Generate a sitemap for a specific country."""
    index_context = load_context(country_code)
    base_url = index_context['base_url']
    
    # Use correct namespace
    sitemap = ET.Element('urlset', xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")
    
    country_dir = os.path.join('build', country_code)
    for root, dirs, files in os.walk(country_dir):
        for file in files:
            if file.endswith('.html'):
                file_path = os.path.join(root, file)
                url = convert_path_to_url(file_path, base_url, country_code)
                
                url_element = ET.SubElement(sitemap, 'url')
                
                # Add location
                loc = ET.SubElement(url_element, 'loc')
                loc.text = url
                
                # Add last modified date
                lastmod = ET.SubElement(url_element, 'lastmod')
                lastmod.text = datetime.now().strftime('%Y-%m-%d')
                
                # Add change frequency
                changefreq = ET.SubElement(url_element, 'changefreq')
                # Determine change frequency based on path
                if index_context['navigation']['race-list'].lower() in url:
                    changefreq.text = 'daily'  # Race pages change more frequently
                else:
                    changefreq.text = 'weekly'  # Static pages change less frequently
                
                # Add priority
                priority = ET.SubElement(url_element, 'priority')
                if f"{index_context['navigation']['race-list'].lower()}.html" in url:  # Main race calendar page
                    priority.text = '1.0'
                elif index_context['base_url'] == url: # Main page
                    priority.text = '0.9'
                elif f"{index_context['race_page_folder_name'].lower()}" in url:  # Race pages
                    priority.text = '0.85'
                elif index_context['navigation']['race-list'].lower() in url:  # Race calendar SEO page
                    priority.text = '0.7'
                else:  # Other pages
                    priority.text = '0.5'

    # Pretty print the XML
    from xml.dom import minidom
    xml_str = minidom.parseString(ET.tostring(sitemap)).toprettyxml(indent="   ")
    
    # Write the sitemap to an XML file
    sitemap_path = os.path.join(country_dir, 'sitemap.xml')
    with open(sitemap_path, 'w', encoding='utf-8') as f:
        f.write(xml_str)

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 generate_sitemap.py <country_code>")
        sys.exit(1)

    country_code = sys.argv[1]  # Get the country code from command line argument
    generate_sitemap_for_country(country_code)
    print(f"Sitemap generated for country: {country_code}")
if __name__ == "__main__":
    main()
