#!/bin/bash
set -e  # Exit on any error

# Define countries array
COUNTRIES=('se' 'no' 'fi' 'dk' 'de' 'nl' 'be')

echo "Starting build process for all countries..."

# Build each country
for country in "${COUNTRIES[@]}"; do
    echo "Building for ${country}..."
    ./build_all.sh "${country}"
    
    # Check if build was successful
    if [ $? -ne 0 ]; then
        echo "Error building for ${country}"
        exit 1
    fi
done

echo "All builds completed successfully"

# Run quick commit
echo "Committing changes..."
./quick_commit.sh "Build update for all countries"

# Check if commit was successful
if [ $? -ne 0 ]; then
    echo "Error during commit"
    exit 1
fi

# Sync with production
echo "Syncing with production..."
./sync_production.sh

# Check if sync was successful
if [ $? -ne 0 ]; then
    echo "Error during production sync"
    exit 1
fi

echo "Build, commit, and sync completed successfully!"