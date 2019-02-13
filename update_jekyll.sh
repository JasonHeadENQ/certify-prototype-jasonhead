#!/usr/bin/env bash
rm -rf _site
bundle exec jekyll build
cd _site
git init
git remote add origin git@github.com:USSBA/certify-prototype.git
git checkout -b gh-pages
git add -A
git commit -m "update site"
git push -f origin gh-pages
cd ../
rm -rf _site
