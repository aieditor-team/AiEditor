#!/usr/bin/env sh

# abort on errors
set -e

# copy changes.md
cp ../changes.md ./zh/

# build
npm run docs:build
#vuepress build .

ossutil rm oss://aieditor-docs/ -rf
ossutil cp -rf assets/image oss://aieditor-docs/assets/image
ossutil cp -rf .vitepress/dist  oss://aieditor-docs/
