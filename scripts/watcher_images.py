import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileMovedEvent
import os
import subprocess

# Set the working directory to project-root
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
os.chdir(project_root)

class ImageProcessHandler(FileSystemEventHandler):
    def on_modified(self, event):
        self.process_event(event)

    def on_moved(self, event):
        self.process_event(event)

    def process_event(self, event):
        # Ignore changes in the build/ directory to prevent infinite loops
        if 'build/' in event.src_path:
            return

        # Check if the modified or moved file is in the image directories
        if event.src_path.endswith(('.png', '.jpg', '.jpeg', '.webp')):
            print(f"{event.src_path} has been modified or moved. Running image processing script...")
            subprocess.run(["python", "scripts/process_images.py"])

if __name__ == "__main__":
    # Define the paths to monitor
    image_paths = [
        'data/countries/se/images', 
        'data/countries/no/images', 
        'data/countries/de/images'
    ]

    event_handler = ImageProcessHandler()
    observer = Observer()

    for path in image_paths:
        # Check if the directory exists before scheduling
        if os.path.exists(path):
            observer.schedule(event_handler, path, recursive=True)
            print(f"Monitoring directory: {path}")
        else:
            print(f"Directory not found and will not be monitored: {path}")

    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
