#!/bin/bash

# Navigate to the project root directory
cd /race-aggregator/project-root || exit

# Add production remote if it doesn't exist
if ! git remote | grep -q 'production'; then
    git remote add production https://github.com/jonkan999/race-aggregator-production.git
fi

# Fetch from production
git fetch production

# Force push to production
git push production master --force

echo "Successfully synced with production repository"