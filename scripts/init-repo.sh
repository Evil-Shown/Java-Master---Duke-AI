#!/usr/bin/env bash
set -e
# Usage: ./init-repo.sh [REMOTE_URL] [BRANCH]
REMOTE_URL=$1
BRANCH=${2:-main}

echo "Initializing git repository..."
if [ ! -d .git ]; then
  git init
else
  echo ".git already exists"
fi

# configure user if not set
if ! git config user.name >/dev/null; then
  echo "Configuring git user.name and user.email locally"
  git config user.name "Your Name"
  git config user.email "you@example.com"
fi

git add .
# commit if no commits yet
if [ -z "$(git rev-parse --verify HEAD 2>/dev/null)" ]; then
  git commit -m "Initial commit"
else
  echo "Repository already has commits"
fi

if [ -n "$REMOTE_URL" ]; then
  if ! git remote | grep -q origin; then
    git remote add origin "$REMOTE_URL"
  else
    git remote set-url origin "$REMOTE_URL"
  fi
  git branch -M "$BRANCH"
  echo "Pushing to origin/$BRANCH (you may be prompted for credentials)"
  git push -u origin "$BRANCH"
else
  echo "No remote provided. To add one: git remote add origin <URL> && git push -u origin main"
fi

echo "Done."