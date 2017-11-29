publish-docs:
	npm install --no-shrinkwrap
	git checkout -b gh-pages
	npm run docco
	git add -f docs/
	git fetch
	git checkout origin/gh-pages
	git commit -m "Publish docs"
	git push -f git@github.com:canjs/can-queues gh-pages
	git checkout -
	git branch -D gh-pages
