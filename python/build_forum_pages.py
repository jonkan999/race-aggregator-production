from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore
from jinja_functions import slugify
import yaml
import os
import sys
from jinja2 import Environment, FileSystemLoader
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

def build_forum_pages(country_code, output_dir, jinja_env):
    """Build all forum pages for a specific country."""
    
    # Initialize Firebase if not already initialized
    if not firebase_admin._apps:
        cred = credentials.Certificate('python/keys/firestore_service_account.json')
        firebase_admin.initialize_app(cred)
    
    db = firestore.client()
    
    # Load index configuration
    with open(f'data/countries/{country_code}/index.yaml', 'r', encoding='utf-8') as f:
        index_content = yaml.safe_load(f)
    
    # Create base context
    base_context = create_base_context(index_content, country_code)
    
    # Get the localized forum slug
    forum_slug = slugify(base_context['navigation']['forum'], country_code)
    
    # Build forum index page
    build_forum_index(country_code, output_dir, jinja_env, base_context, db)
    
    # Build category pages
    for category in index_content['forum']['categories']:
        build_category_page(country_code, output_dir, jinja_env, category, base_context, db)
        build_thread_pages(country_code, output_dir, jinja_env, category, base_context, db)

def format_timestamp(timestamp):
    """Format timestamp to YYYY-MM-DD HH:mm"""
    if isinstance(timestamp, datetime):
        return timestamp.strftime('%Y-%m-%d %H:%M')
    return timestamp  # Return as-is if not a datetime object

def build_forum_index(country_code, output_dir, jinja_env, base_context, db):
    """Build the main forum index page."""
    
    # Enhance categories with Firebase data
    for category in base_context['forum']['categories']:
        # Query posts for this category
        posts_ref = db.collection(f'forum_posts_{country_code}')
        
        # Initialize default values
        category['thread_count'] = 0
        category['post_count'] = 0
        category['latest_thread'] = None
        
        try:
            # Get threads for this category
            thread_query = posts_ref.where('categorySlug', '==', category['slug']).where('type', '==', 'thread')
            threads = thread_query.get()
            category['thread_count'] = len(threads)
            
            # Get all posts (threads + replies) for this category
            all_posts_query = posts_ref.where('categorySlug', '==', category['slug'])
            all_posts = all_posts_query.get()
            category['post_count'] = len(all_posts)
            
            # Find latest thread
            latest_thread = None
            latest_timestamp = None
            
            for thread in threads:
                thread_data = thread.to_dict()
                # Format createdAt for the latest thread
                if 'createdAt' in thread_data:
                    thread_data['createdAt'] = thread_data['createdAt'].strftime('%Y-%m-%d %H:%M')
                
                if latest_timestamp is None or thread_data['createdAt'] > latest_timestamp:
                    latest_timestamp = thread_data['createdAt']
                    latest_thread = {
                        'title': thread_data['title'],
                        'threadId': thread_data['threadId'],
                        'authorName': thread_data['authorName'],  # Ensure this field is included
                        'createdAt': thread_data['createdAt'],  # Ensure this field is included
                        'content': thread_data['content'],  # Ensure this field is included
                        'replyCount': str(thread_data.get('replyCount', 0))  # Ensure replyCount is included
                    }
            category['latest_thread'] = latest_thread
            
        except Exception as e:
            print(f"Error processing category {category['slug']}: {str(e)}")
            continue
    
    # Render index template
    template = jinja_env.get_template('forum/forum_index.html')
    output = template.render(
        forum_categories=base_context['forum']['categories'],
        breadcrumbs=generate_forum_breadcrumbs(country_code, base_context['navigation']),
        **base_context
    )
    
    # Write to file in forum directory using localized slug
    forum_dir = os.path.join(output_dir, slugify(base_context['navigation']['forum'], country_code))
    os.makedirs(forum_dir, exist_ok=True)
    with open(os.path.join(forum_dir, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(output)

def build_category_page(country_code, output_dir, jinja_env, category, base_context, db):
    """Build a forum category page."""
    
    threads = []
    posts_ref = db.collection(f'forum_posts_{country_code}')
    
    try:
        # Get all threads for this category
        thread_query = posts_ref.where('categorySlug', '==', category['slug']).where('type', '==', 'thread')
        thread_docs = thread_query.get()
        
        for thread_doc in thread_docs:
            thread_data = thread_doc.to_dict()
            thread_data['slug'] = thread_data['threadId']
            
            # Get reply count for this thread
            reply_query = posts_ref.where('threadId', '==', thread_data['threadId']).where('type', '==', 'reply')
            replies = reply_query.get()
            thread_data['replyCount'] = str(len(replies))  # Convert to string
            
            # Ensure createdAt and updatedAt are formatted as strings
            if 'createdAt' in thread_data:
                thread_data['createdAt'] = thread_data['createdAt'].strftime('%Y-%m-%d %H:%M')
            
            if 'updatedAt' in thread_data:
                thread_data['updatedAt'] = thread_data['updatedAt'].strftime('%Y-%m-%d %H:%M')
            
            threads.append(thread_data)
        
        # Sort threads by updatedAt (latest activity) in descending order
        threads.sort(key=lambda x: x.get('updatedAt', x.get('createdAt')), reverse=True)
        
        # Add thread count information
        thread_count = {
            'visible': '3',
            'total': str(len(threads))  # Convert to string
        }
        
    except Exception as e:
        print(f"Error getting threads for category {category['slug']}: {str(e)}")
        thread_count = {'visible': '0', 'total': '0'}
    
    # Render category template with threads included in the context
    template = jinja_env.get_template('forum/forum_category.html')
    output = template.render(
        category=category,
        threads=threads,  # Pass the threads directly
        thread_count=thread_count,
        breadcrumbs=generate_forum_breadcrumbs(country_code, base_context['navigation'], category),
        **base_context
    )
    
    # Create output directory and write file using localized slug
    category_dir = os.path.join(output_dir, slugify(base_context['navigation']['forum'], country_code), category['slug'])
    os.makedirs(category_dir, exist_ok=True)
    with open(os.path.join(category_dir, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(output)

def build_thread_pages(country_code, output_dir, jinja_env, category, base_context, db):
    """Build thread pages for a category."""
    
    posts_ref = db.collection(f'forum_posts_{country_code}')
    
    try:
        # Get all threads for this category
        thread_query = posts_ref.where('categorySlug', '==', category['slug']).where('type', '==', 'thread')
        thread_docs = thread_query.get()

        for thread_doc in thread_docs:
            thread_data = thread_doc.to_dict()
            thread_data['slug'] = thread_data['threadId']
            
            # Get all replies for this thread - simplified query
            reply_query = posts_ref.where('threadId', '==', thread_data['threadId'])
            replies = [post.to_dict() for post in reply_query.get() 
                      if post.to_dict().get('type') == 'reply']
            
            # Sort replies in Python instead of Firestore
            replies.sort(key=lambda x: x.get('createdAt', datetime.min))
            
            # Format timestamps for all posts
            for post in [thread_data] + replies:
                if 'createdAt' in post:
                    post['createdAt'] = post['createdAt'].strftime('%Y-%m-%d %H:%M')
            
            # Render thread template
            template = jinja_env.get_template('forum/forum_thread.html')

            output = template.render(
                category=category,
                thread=thread_data,
                posts=[thread_data] + replies,
                breadcrumbs=generate_forum_breadcrumbs(country_code, base_context['navigation'], category, thread_data),
                **base_context
            )
            
            # Write to file
            thread_dir = os.path.join(output_dir, slugify(base_context['navigation']['forum'], country_code), category['slug'], thread_data['threadId'])
            os.makedirs(thread_dir, exist_ok=True)
            with open(os.path.join(thread_dir, 'index.html'), 'w', encoding='utf-8') as f:
                f.write(output)
                
    except Exception as e:
        print(f"Error building thread pages for category {category['slug']}: {str(e)}")

def generate_forum_breadcrumbs(country_code, navigation, category=None, thread=None):
    """Generate breadcrumb structure for forum pages"""
    breadcrumbs = [
        {
            "name": navigation['forum'],
            "item": f"/{slugify(navigation['forum'], country_code)}",
            "position": 1
        }
    ]
    
    if category:
        breadcrumbs.append({
            "name": category['name'],
            "item": f"/{slugify(navigation['forum'], country_code)}/{category['slug']}",
            "position": 2
        })
        
        if thread:
            breadcrumbs.append({
                "name": thread['title'],
                "item": f"/{slugify(navigation['forum'], country_code)}/{category['slug']}/{thread['threadId']}",
                "position": 3
            })
    
    return breadcrumbs

def main():
    """Main function to build forum pages."""
    try:
        # Setup argument parser
        parser = argparse.ArgumentParser(description='Build forum pages for specified country')
        parser.add_argument('--country', type=str, help='Country code (e.g., se, no, de)')
        args = parser.parse_args()

        # Setup Jinja environment
        env = Environment(
            loader=FileSystemLoader('templates'),
            trim_blocks=True,
            lstrip_blocks=True
        )
        
        # Add custom filters
        env.filters['slugify'] = slugify
        
        # Get list of countries from config
        countries_dir = 'data/countries'
        available_countries = [d for d in os.listdir(countries_dir) 
                    if os.path.isdir(os.path.join(countries_dir, d))]
        
        print(f"Building forum pages for {len(available_countries)} countries")
        
        # Check if a specific country code is provided
        if args.country:
            if args.country not in available_countries:
                print(f"Invalid country code: {args.country}. Available codes: {available_countries}")
                return 1
            countries = [args.country]  # Only process the specified country
        else:
            countries = available_countries  # Process all countries
        
        # Process each country
        for country_code in countries:
            try:
                print(f"\nProcessing {country_code}...")
                
                # Check if index.yaml exists
                forum_config_path = f'data/countries/{country_code}/index.yaml'
                if not os.path.exists(forum_config_path):
                    print(f"Skipping {country_code} - No index.yaml found")
                    continue
                
                # Set output directory
                output_dir = f'build/{country_code}'
                
                # Build forum pages
                build_forum_pages(country_code, output_dir, env)
                
                print(f"✓ Successfully built forum pages for {country_code}")
                
            except Exception as e:
                print(f"Error processing {country_code}: {str(e)}")
                continue
        
        print("\nForum build completed!")
        return 0
        
    except Exception as e:
        print(f"Error building forum: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())