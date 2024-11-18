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

def main():
    db = init_firebase()
    
    # Get all new posts, ordered by timestamp
    new_posts_ref = db.collection('new_posts')
    posts = new_posts_ref.order_by('timestamp').get()
    
    # Track which races we've processed
    processed_races = set()
    latest_timestamp = None
    
    # Process each post
    for post in posts:
        post_data = post.to_dict()
        source_race = post_data['source_race']
        
        if source_race not in processed_races:
            if build_race_page(source_race):
                processed_races.add(source_race)
                latest_timestamp = post_data['timestamp']
    
    # If we processed any races successfully, delete processed posts
    if latest_timestamp:
        old_posts = new_posts_ref.where(
            'timestamp', '<=', latest_timestamp
        ).get()
        
        # Delete in batches
        batch = db.batch()
        for post in old_posts:
            batch.delete(post.reference)
        batch.commit()
    
    # Print processed races for the commit message
    for race in sorted(processed_races):
        print(race)

if __name__ == "__main__":
    main()