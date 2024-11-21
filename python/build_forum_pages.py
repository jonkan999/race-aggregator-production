from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore
from jinja_functions import slugify
import yaml
import os
from jinja2 import Environment, FileSystemLoader

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
    
    # Build forum index page
    build_forum_index(country_code, output_dir, jinja_env, base_context, db)
    
    # Build category pages
    for category in index_content['forum']['categories']:
        build_category_page(country_code, output_dir, jinja_env, category, base_context, db)
        build_thread_pages(country_code, output_dir, jinja_env, category, base_context, db)

def build_forum_index(country_code, output_dir, jinja_env, base_context, db):
    """Build the main forum index page."""
    
    # Enhance categories with Firebase data
    for category in base_context['forum']['categories']:
        category_ref = db.collection(f'forum_posts_{country_code}').document(category['slug'])
        
        # Initialize default values
        category['thread_count'] = 0
        category['post_count'] = 0
        category['latest_thread'] = None
        
        try:
            # Get thread count
            threads = category_ref.collections()
            
            for thread in threads:
                category['thread_count'] += 1
                # Get post count and latest post
                posts = thread.order_by('createdAt', direction=firestore.Query.DESCENDING).limit(1).get()
                thread_posts = thread.get()
                category['post_count'] += len(thread_posts)
                
                for post in posts:  # Will only run once due to limit(1)
                    post_data = post.to_dict()
                    if category['latest_thread'] is None or post_data['createdAt'] > category['latest_thread']['created_at']:
                        thread_doc = thread.parent.get()
                        thread_data = thread_doc.to_dict()
                        category['latest_thread'] = {
                            'title': thread_data['title'],
                            'slug': thread_doc.id,
                            'author': post_data['authorName'],
                            'created_at': post_data['createdAt'].strftime('%Y-%m-%d %H:%M')
                        }
        except Exception as e:
            print(f"Error processing category {category['slug']}: {str(e)}")
            # Continue with default values if there's an error
            continue
    
    # Render index template
    template = jinja_env.get_template('forum/forum_index.html')
    output = template.render(
        forum_categories=base_context['forum']['categories'],
        **base_context
    )
    
    # Write to file in forum directory
    forum_dir = os.path.join(output_dir, 'forum')
    os.makedirs(forum_dir, exist_ok=True)
    with open(os.path.join(forum_dir, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(output)

def build_category_page(country_code, output_dir, jinja_env, category, base_context, db):
    """Build a category page with its threads."""
    
    category_ref = db.collection(f'forum_posts_{country_code}').document(category['slug'])
    threads = []
    
    # Get all threads in category
    for thread_ref in category_ref.collections():
        thread_doc = thread_ref.document('thread_info').get()
        if thread_doc.exists:
            thread_data = thread_doc.to_dict()
            
            # Get post count and latest post
            posts = thread_ref.order_by('createdAt', direction=firestore.Query.DESCENDING).limit(1).get()
            post_count = len(thread_ref.get())
            
            for post in posts:  # Will only run once
                post_data = post.to_dict()
                thread_data.update({
                    'slug': thread_ref.id,
                    'post_count': post_count,
                    'last_post_date': post_data['createdAt'].strftime('%Y-%m-%d %H:%M'),
                    'last_post_author': post_data['authorName']
                })
                threads.append(thread_data)
    
    # Sort threads by latest post
    threads.sort(key=lambda x: x['last_post_date'], reverse=True)
    category['threads'] = threads
    
    # Render category template
    template = jinja_env.get_template('forum/forum_category.html')
    context = {
        'category': category,
        **base_context
    }
    output = template.render(**context)
    
    # Write to file in category directory
    category_dir = os.path.join(output_dir, 'forum', category['slug'])
    os.makedirs(category_dir, exist_ok=True)
    with open(os.path.join(category_dir, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(output)

def build_thread_pages(country_code, output_dir, jinja_env, category, base_context, db):
    """Build individual thread pages."""
    
    category_ref = db.collection(f'forum_posts_{country_code}').document(category['slug'])
    
    for thread_ref in category_ref.collections():
        thread_doc = thread_ref.document('thread_info').get()
        if thread_doc.exists:
            thread_data = thread_doc.to_dict()
            thread_data['slug'] = thread_ref.id
            
            # Get all posts in thread
            posts = thread_ref.order_by('createdAt').get()
            forum_posts = []
            
            for post in posts:
                if post.id != 'thread_info':  # Skip the thread info document
                    post_data = post.to_dict()
                    post_data['createdAt'] = post_data['createdAt'].strftime('%Y-%m-%d %H:%M')
                    forum_posts.append(post_data)
            
            # Render thread template
            template = jinja_env.get_template('forum/forum_thread.html')
            context = {
                'category': category,
                'thread': thread_data,
                'forum_posts': forum_posts,
                **base_context
            }
            output = template.render(**context)
            
            # Write to file in thread directory
            thread_dir = os.path.join(output_dir, 'forum', category['slug'], thread_data['slug'])
            os.makedirs(thread_dir, exist_ok=True)
            with open(os.path.join(thread_dir, 'index.html'), 'w', encoding='utf-8') as f:
                f.write(output)

def main():
    """Main function to build forum pages."""
    try:
        # Setup Jinja environment
        env = Environment(
            loader=FileSystemLoader('templates'),
            trim_blocks=True,
            lstrip_blocks=True
        )
        
        # Add custom filters - Fix the slugify filter to handle country_code
        def slugify_filter(text, country_code=None):
            if country_code is None:
                return slugify(text)
            return slugify(text, country_code)
            
        env.filters['slugify'] = slugify_filter
        
        # Get list of countries from config
        countries_dir = 'data/countries'
        countries = [d for d in os.listdir(countries_dir) 
                    if os.path.isdir(os.path.join(countries_dir, d))]
        
        print(f"Building forum pages for {len(countries)} countries")
        
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
    import sys
    sys.exit(main())