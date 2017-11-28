publish-docs:
	npm install --no-shrinkwrap
	git checkout -b gh-pages
	./node_modules/.bin/docco can-queues.js queue.js queue-state.js completion-queue.js priority-queue.js
	git add -f docs/
	git fetch
	git checkout origin/gh-pages
	git commit -m "Publish docs"
	git push -f git@github.com:canjs/can-queues gh-pages
	git rm -q -r --cached node_modules
	git checkout -
	git branch -D gh-pages
