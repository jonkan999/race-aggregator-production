import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import os
import subprocess

# Set the working directory to project-root
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
os.chdir(project_root)

class GenerateHandler(FileSystemEventHandler):
    def on_modified(self, event):
        #print(f"Detected modification event: {event}")

        if 'build/' in event.src_path or 'functions/' in event.src_path:
            #print(f"Ignored modification in build or functions directory: {event.src_path}")
            return

        #print(f"File modified: {event.src_path}")

        if event.src_path.endswith(('.html', '.yaml', '.json', '.less', '.js')):
            print(f"{event.src_path} has been modified. Regenerating HTML for all countries...")
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
    path = "."
    event_handler = GenerateHandler()
    observer = Observer()
    
    print(f"Monitoring path: {path}")

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
