#!/bin/bash

# Set error handling
set -e  # Exit on any error
set -u  # Exit on undefined variable

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Define log file
LOG_FILE="build_$(date +%Y%m%d_%H%M%S).log"

# Function to log messages
log_message() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} - ${message}" | tee -a "$LOG_FILE"
}

# Function to run a Python script
run_script() {
    local script="$1"
    local args="${2:-}"  # Optional arguments
    
    log_message "${BLUE}Starting: ${script}${NC}"
    
    if [ -n "$args" ]; then
        if python3 "python/${script}.py" $args >> "$LOG_FILE" 2>&1; then
            log_message "${GREEN}Successfully completed: ${script}${NC}"
        else
            log_message "${RED}Failed: ${script}${NC}"
            exit 1
        fi
    else
        if python3 "python/${script}.py" >> "$LOG_FILE" 2>&1; then
            log_message "${GREEN}Successfully completed: ${script}${NC}"
        else
            log_message "${RED}Failed: ${script}${NC}"
            exit 1
        fi
    fi
}

# Main build process
log_message "Starting build process"

# Define country codes (add more as needed)
COUNTRIES=("se")

# Process images
run_script "process_images"

# Generate HTML
run_script "generate_html"

# Build race pages
run_script "build_race_pages"

# Build SEO pages (county)
run_script "build_seo_pages_county"

# Build SEO pages (city)
run_script "build_seo_pages_city"

# Build race list browse structure
run_script "build_race_list_browse_structure"

# Build forum pages
run_script "build_forum_pages"

# Generate sitemaps for each country
for country in "${COUNTRIES[@]}"; do
    run_script "generate_sitemap" "$country"
done

log_message "${GREEN}Build process completed successfully!${NC}"