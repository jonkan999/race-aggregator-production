#!/bin/bash

# Use the first argument as commit message, or "Quick commit" if no argument provided
commit_message="${1:-Quick commit}"

git add .
git commit -m "$commit_message"

# Check if upstream branch exists, if not set it up
if ! git rev-parse --abbrev-ref --symbolic-full-name @{u} > /dev/null 2>&1; then
    git push --set-upstream origin master
else
    git push -f
fi