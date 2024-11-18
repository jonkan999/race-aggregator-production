#!/bin/bash
set -e

# Set the paths and environment
export RACE_AGGREGATOR_PATH="/race-aggregator"
export PYTHONPATH=$RACE_AGGREGATOR_PATH

# Configuration
PROD_REPO="jonkan999/race-aggregator-production"
WORK_DIR="/race-aggregator-production"
GITHUB_TOKEN=$(cat $RACE_AGGREGATOR_PATH/project-root/credentials/github_token)

# Change to work directory
cd "$WORK_DIR"

# Ensure we're on master and up to date
git checkout master
git pull origin master

# Create new branch
BRANCH_NAME="auto-build-$(date +%Y%m%d-%H%M%S)"
git checkout -b "$BRANCH_NAME"

# Store the output of the Python script
UPDATED_RACES=$(python3 $RACE_AGGREGATOR_PATH/project-root/python/process_new_posts.py)

# If there are changes, commit and push
if [[ -n $(git status -s) ]]; then
    # Ensure workflow directory exists
    mkdir -p .github/workflows
    
    # Create or update the workflow file
    cat > .github/workflows/auto-build.yml << 'EOF'
name: Deploy to Production

on:
  push:
    branches: [master]
    paths:
      - 'build/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        country: [se]

    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install Firebase CLI
        run: npm install -g firebase-tools

      - name: Deploy to Firebase Production
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
          COUNTRY: ${{ matrix.country }}
        run: |
          # Verify build directory exists
          if [ ! -d "build/$COUNTRY" ]; then
            echo "No build directory found for $COUNTRY"
            exit 1
          fi

          # Deploy to Firebase prod target
          firebase deploy --token "$FIREBASE_TOKEN" --only hosting:${COUNTRY}prod
EOF

    # Add all changes including workflow
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