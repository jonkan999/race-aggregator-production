import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import subprocess
import sys
import os

def init_firebase():
    cred = credentials.Certificate('python/keys/firestore_service_account.json')
    firebase_admin.initialize_app(cred)
    return firestore.client()

def build_race_page(source_race):
    try:
        result = subprocess.run(
            ['python', 'python/build_race_pages.py', source_race],
            check=True,
            capture_output=True,
            text=True
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error building race page {source_race}: {e}")
        return False

def process_race_posts(db):
    """Process new race posts and build race pages."""
    new_race_posts_ref = db.collection('new_race_posts')
    posts = new_race_posts_ref.order_by('timestamp').get()
    
    processed_races = set()
    latest_timestamp = None
    
    for post in posts:
        post_data = post.to_dict()
        print(post_data)
        source_race = post_data['source_race']
        
        if source_race not in processed_races:
            if build_race_page(source_race):
                processed_races.add(source_race)
                latest_timestamp = post_data['timestamp']
    
    if latest_timestamp:
        old_posts = new_race_posts_ref.where('timestamp', '<=', latest_timestamp).get()
        
        batch = db.batch()
        for post in old_posts:
            batch.delete(post.reference)
        batch.commit()
    
    for race in sorted(processed_races):
        print(race)

def build_forum_page(source_forum):
    """Build the forum page for the given source."""
    try:
        result = subprocess.run(
            ['python', 'python/build_forum_pages.py', source_forum],
            check=True,
            capture_output=True,
            text=True
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error building forum page {source_forum}: {e}")
        return False

def process_new_forum_posts(db):
    """Process new forum posts and trigger rebuilds."""
    new_forum_posts_ref = db.collection('new_forum_posts')
    posts = new_forum_posts_ref.order_by('timestamp').get()
    
    processed_forums = set()
    
    for post in posts:
        post_data = post.to_dict()
        print(post_data)
        source_forum = post_data['source_forum']
        country_code = post_data.get('country', 'se')  # Default to 'se' if not specified
        
        if source_forum not in processed_forums:
            if build_forum_page(source_forum):
                processed_forums.add(source_forum)
                # Trigger the build for the country associated with the new post
                build_forum_pages(country_code)

    # Optionally, clear the processed posts if needed
    # for post in posts:
    #     db.collection('new_forum_posts').document(post.id).delete()

def build_forum_pages(country_code):
    """Build forum pages for a specific country."""
    try:
        subprocess.run(
            ['python', 'python/build_forum_pages.py', country_code],
            check=True
        )
        print(f"Successfully rebuilt forum pages for {country_code}.")
    except subprocess.CalledProcessError as e:
        print(f"Error rebuilding forum pages for {country_code}: {e}")

def main():
    db = init_firebase()
    
    # Process race posts
    process_race_posts(db)
    
    # Process new forum posts
    process_new_forum_posts(db)

if __name__ == "__main__":
    main()