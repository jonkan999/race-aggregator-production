#!/bin/bash

# Use the first argument as commit message, or "Quick commit" if no argument provided
commit_message="${1:-Quick commit}"

git add .
git commit -m "$commit_message"
git push -f