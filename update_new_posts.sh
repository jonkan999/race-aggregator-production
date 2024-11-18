#!/bin/bash
set -e

# Configuration
PROD_REPO="jonkan999/race-aggregator-production"
WORK_DIR="/race-aggregator-production"
GITHUB_TOKEN=$(cat /race-aggregator/project-root/credentials/github_token)

# Change to work directory
cd "$WORK_DIR"

# Ensure we're on master and up to date
git checkout master
git pull origin master

# Create new branch
BRANCH_NAME="auto-build-$(date +%Y%m%d-%H%M%S)"
git checkout -b "$BRANCH_NAME"

# Store the output of the Python script
UPDATED_RACES=$(python3 /race-aggregator/project-root/python/process_new_posts.py)

# If there are changes, commit and push
if [[ -n $(git status -s) ]]; then
    git add .
    git commit -m "Auto-build: Updated race pages with new posts

Races updated:
${UPDATED_RACES}"
    git push origin "$BRANCH_NAME"
    
    # Push directly to master (since this is production)
    git checkout master
    git merge "$BRANCH_NAME"
    git push origin master
    
    # Clean up branch
    git branch -d "$BRANCH_NAME"
    git push origin --delete "$BRANCH_NAME"
fi