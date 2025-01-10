import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import os
import subprocess
from pathlib import Path

# Set the working directory to project-root
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
os.chdir(project_root)

# Define ignored directories and watched extensions
IGNORED_DIRS = {
    'build',
    'functions',
    '.git',
    'node_modules',
    '__pycache__',
    '.pytest_cache',
    'venv',
    'env'
}

WATCHED_EXTENSIONS = {'.html', '.yaml', '.json', '.less', '.js'}

def count_watched_files():
    """Count files that would be watched based on extension and directory filters."""
    watched_files = []
    total_files = 0
    
    for path in Path(project_root).rglob('*'):
        total_files += 1
        # Skip ignored directories
        if any(ignored in path.parts for ignored in IGNORED_DIRS):
            continue
        
        # Only include files with watched extensions
        if path.is_file() and path.suffix in WATCHED_EXTENSIONS:
            watched_files.append(path)
    
    print(f"\nWatching {len(watched_files)} files out of {total_files} total files")
    print("\nWatched files:")
    for file in watched_files:
        print(f"- {file.relative_to(project_root)}")
    return watched_files

class GenerateHandler(FileSystemEventHandler):
    def on_modified(self, event):
        # Skip directories
        if not event.is_directory:
            # Skip ignored directories
            if any(ignored in event.src_path for ignored in IGNORED_DIRS):
                return

            # Only process watched extensions
            if Path(event.src_path).suffix in WATCHED_EXTENSIONS:
                print(f"\n{event.src_path} has been modified. Regenerating HTML for all countries...")
                try:
                    result = subprocess.run(
                        ["python", "python/generate_html.py"],
                        capture_output=True,
                        text=True
                    )
                    
                    if result.returncode != 0:
                        print(f"Error in generate_html.py:\n{result.stderr}")
                    else:
                        print(f"generate_html.py output:\n{result.stdout}")
                
                except Exception as e:
                    print(f"Error running script: {e}")

if __name__ == "__main__":
    print("Analyzing files to watch...")
    watched_files = count_watched_files()
    
    path = "."
    event_handler = GenerateHandler()
    observer = Observer()
    
    print(f"\nMonitoring path: {path}")
    observer.schedule(event_handler, path, recursive=True)
    observer.start()

    print("Observer started and watching for changes...")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        print("Observer stopped.")
    observer.join()
