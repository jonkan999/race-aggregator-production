#!/bin/bash

# Use the first argument as commit message, or "Quick commit" if no argument provided
commit_message="${1:-Quick commit}"

git add .
git commit -m "$commit_message"

# Check if remote 'origin' exists
if ! git remote | grep -q 'origin'; then
    echo "No remote 'origin' found. Setting it up..."
    git remote add origin git@github.com:jonkan999/race-aggregator.git
fi

# Check if upstream branch exists, if not set it up
if ! git rev-parse --abbrev-ref --symbolic-full-name @{u} > /dev/null 2>&1; then
    echo "Setting up upstream branch..."
    git push --set-upstream origin master
else
    git push -f
fi