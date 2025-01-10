#!/bin/bash

# delete-indexes.sh
echo "Deleting all Firestore indexes..."

# Check if project ID is provided
if [ -z "$GOOGLE_CLOUD_PROJECT" ]; then
    echo "Setting GOOGLE_CLOUD_PROJECT environment variable"
    export GOOGLE_CLOUD_PROJECT="aggregatory-440306"
fi

# Function to delete composite indexes
delete_composite_indexes() {
    echo "Fetching composite indexes..."
    indexes=$(gcloud firestore indexes composite list --format="value(name)")
    
    if [ -z "$indexes" ]; then
        echo "No composite indexes found."
    else
        echo "Deleting composite indexes..."
        while IFS= read -r index; do
            if [ ! -z "$index" ]; then
                echo "Deleting index: $index"
                gcloud firestore indexes composite delete "$index" --quiet
            fi
        done <<< "$indexes"
    fi
}

# Function to delete single field indexes
delete_field_indexes() {
    echo "Fetching collection IDs..."
    collections=$(gcloud firestore indexes fields list --collection-group="*" --format="value(collectionGroup)")
    
    if [ -z "$collections" ]; then
        echo "No collections found."
    else
        echo "Processing collections for field indexes..."
        while IFS= read -r collection; do
            if [ ! -z "$collection" ]; then
                echo "Checking indexes for collection: $collection"
                field_indexes=$(gcloud firestore indexes fields list --collection-group="$collection" --format="value(name)")
                
                while IFS= read -r field_index; do
                    if [ ! -z "$field_index" ]; then
                        echo "Deleting field index: $field_index"
                        gcloud firestore indexes fields delete "$field_index" --quiet
                    fi
                done <<< "$field_indexes"
            fi
        done <<< "$collections"
    fi
}

# Main execution
echo "Starting index deletion for project: $GOOGLE_CLOUD_PROJECT"

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo "Please authenticate with Google Cloud first:"
    gcloud auth login
    exit 1
fi

# Delete indexes
delete_composite_indexes
delete_field_indexes

echo "Index deletion complete!"