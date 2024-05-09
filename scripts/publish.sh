#!/usr/bin/env bash

set -euo pipefail

BASEDIR=$(cd $(dirname $0); pwd)
REPO_DIR=$(cd ${BASEDIR}/..; pwd)

echo "====> deploying to github"

PAGES_DIR=$(mktemp -d)
git worktree add -f ${PAGES_DIR} gh-pages
rm -rf ${PAGES_DIR}/*

# copy the build files to the gh-pages folder
cp -rp ${REPO_DIR}/build/* ${PAGES_DIR}

cd ${PAGES_DIR}
git add -A
git commit -m "deployed on $(date) by ${USER}"
git push origin gh-pages
git worktree remove ${PAGES_DIR}
