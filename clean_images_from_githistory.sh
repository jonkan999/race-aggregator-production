#!/bin/bash
set -e  # Exit on any error

# Define countries array
COUNTRIES=('se' 'no' 'fi' 'dk' 'de' 'nl' 'be')

echo "Starting cleanup of files from Git history for all countries..."

# Store the original remote URL before we start
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "https://github.com/jonkan999/race-aggregator.git")
echo "Using remote URL: ${REMOTE_URL}"

# Base directory for race pages
BASE_DIR="build"
DATA_DIR="data/countries"

# First, stash any changes
echo "Stashing any uncommitted changes..."
git stash push -u || true

# Process one country at a time
for country in "${COUNTRIES[@]}"; do
    echo "Processing ${country}..."
    
    # Track if we made any changes for this country
    CHANGES_MADE=false
    
    # Get race_page_folder_name from country's index.yaml and slugify it
    RACE_PAGES_FOLDER=$(python3 -c "
import yaml
import sys
sys.path.append('python')
from jinja_functions import slugify

with open('${DATA_DIR}/${country}/index.yaml', 'r') as f:
    data = yaml.safe_load(f)
    folder_name = data.get('race_page_folder_name', '')
    if folder_name:
        print(slugify(folder_name, '${country}'))
    else:
        print('')
")
    
    if [ -z "$RACE_PAGES_FOLDER" ]; then
        echo "Could not find race_page_folder_name for ${country}, skipping..."
    else
        COUNTRY_RACE_DIR="${BASE_DIR}/${country}/${RACE_PAGES_FOLDER}"
        echo "Checking directory: ${COUNTRY_RACE_DIR}"
        
        # Check if path exists in Git history
        if [ -n "$(git ls-files "${COUNTRY_RACE_DIR}")" ]; then
            echo "Found files in Git history for ${COUNTRY_RACE_DIR}"
            echo "Removing ${COUNTRY_RACE_DIR} from Git history..."
            git filter-repo --path "${COUNTRY_RACE_DIR}" --invert-paths --force
            CHANGES_MADE=true
            echo "Removed ${COUNTRY_RACE_DIR} from Git history"
        else
            echo "No files found in Git history for ${COUNTRY_RACE_DIR}"
        fi
    fi
    
    # Clean up final_images.json from Git history
    IMAGES_FILE="${DATA_DIR}/${country}/final_images.json"
    echo "Checking file: ${IMAGES_FILE}"
    if [ -n "$(git ls-files "${IMAGES_FILE}")" ]; then
        echo "Found ${IMAGES_FILE} in Git history"
        echo "Removing ${IMAGES_FILE} from Git history..."
        git filter-repo --path "$IMAGES_FILE" --invert-paths --force
        CHANGES_MADE=true
        echo "Removed ${IMAGES_FILE} from Git history"
    else
        echo "No ${IMAGES_FILE} found in Git history"
    fi

    # If changes were made for this country, push them
    if [ "$CHANGES_MADE" = true ]; then
        echo "Running Git garbage collection for ${country}..."
        git gc --prune=now --aggressive

        # Re-add the remote
        echo "Re-adding remote origin..."
        git remote remove origin 2>/dev/null || true
        git remote add origin "${REMOTE_URL}"

        # Push changes for this country
        echo "Pushing changes for ${country}..."
        git push origin --force --all
        
        echo "Successfully processed and pushed changes for ${country}"
    else
        echo "No changes needed for ${country}"
    fi
done

# Reset the working directory to match the new history
echo "Resetting working directory to match new history..."
git reset --hard HEAD

# Pop any stashed changes
echo "Restoring any stashed changes..."
git stash pop || true

echo "Cleanup completed successfully!"