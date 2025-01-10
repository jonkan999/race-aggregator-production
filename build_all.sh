#!/bin/bash

# Set error handling
set -e  # Exit on any error
set -u  # Exit on undefined variable

# Check if country code is provided
if [ $# -ne 1 ]; then
    echo "Usage: $0 <country_code>"
    echo "Example: $0 se"
    exit 1
fi

COUNTRY_CODE="$1"

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Define log file
LOG_FILE="build_log/build_${COUNTRY_CODE}_$(date +%Y%m%d_%H%M%S).log"

# Function to log messages
log_message() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} - ${message}" | tee -a "$LOG_FILE"
}

# Function to run a Python script with direct country code argument
run_script_direct() {
    local script="$1"
    local args="${2:-}"  # Optional arguments
    
    log_message "${BLUE}Starting: ${script}${NC}"
    
    if [ -n "$args" ]; then
        if python3 "python/${script}.py" "$COUNTRY_CODE" $args >> "$LOG_FILE" 2>&1; then
            log_message "${GREEN}Successfully completed: ${script}${NC}"
        else
            log_message "${RED}Failed: ${script}${NC}"
            exit 1
        fi
    else
        if python3 "python/${script}.py" "$COUNTRY_CODE" >> "$LOG_FILE" 2>&1; then
            log_message "${GREEN}Successfully completed: ${script}${NC}"
        else
            log_message "${RED}Failed: ${script}${NC}"
            exit 1
        fi
    fi
}

# Function to run a Python script with --country flag
run_script_flag() {
    local script="$1"
    local args="${2:-}"  # Optional arguments
    
    log_message "${BLUE}Starting: ${script}${NC} with ${args}"
    
    if [ -n "$args" ]; then
        if python3 "python/${script}.py" --country "$COUNTRY_CODE" $args >> "$LOG_FILE" 2>&1; then
            log_message "${GREEN}Successfully completed: ${script}${NC}"
        else
            log_message "${RED}Failed: ${script}${NC}"
            exit 1
        fi
    else
        if python3 "python/${script}.py" --country "$COUNTRY_CODE" >> "$LOG_FILE" 2>&1; then
            log_message "${GREEN}Successfully completed: ${script}${NC}"
        else
            log_message "${RED}Failed: ${script}${NC}"
            exit 1
        fi
    fi
}

# Main build process
log_message "Starting build process for country: ${COUNTRY_CODE}"

# Scripts that process all countries
run_script_flag "build_race_pages" --filter
run_script_direct "process_images"
run_script_direct "generate_html"
run_script_direct "build_robots_txt"

# Scripts that use --country flag
run_script_flag "build_race_pages"
run_script_flag "build_seo_pages_county"
run_script_flag "build_seo_pages_city"
run_script_flag "build_race_list_browse_structure"
run_script_flag "build_forum_pages"

# Generate HTML again since seo overwrites race pages
run_script_direct "generate_html"

# Generate sitemap index (all countries)
run_script_direct "generate_sitemap"

log_message "${GREEN}Build process completed successfully for country: ${COUNTRY_CODE}!${NC}"