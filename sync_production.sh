#!/bin/bash

# Navigate to the project root directory
cd /race-aggregator/project-root || exit

# Add production remote if it doesn't exist
if ! git remote | grep -q 'production'; then
    git remote add production https://github.com/jonkan999/race-aggregator-production.git
fi

# Force push to production without fetching
echo "Force pushing to production..."
git push -f production master

echo "Successfully synced with production repository"