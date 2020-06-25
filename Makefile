PYTHON_FILES = main.py miniconf/
JS_FILES = $(shell find static/js -name "*.js")
CSS_FILES = $(shell find static/css -name "*.css")
TEMP_DEPLOY_BRANCH = "temp-gh-pages"
AWS_S3_BUCKET = "s3://serverlessrepo-acl2020-virtual-conferenc-s3bucket-mlnhxyxwrhh2"
AWS_CLOUDFRONT_DISTRIBUTION_ID = "EY8475KHJPSA0"

.PHONY: format-python format-web format run freeze format-check

all: format-check

format-python:
	isort -rc $(PYTHON_FILES) --multi-line=3 --trailing-comma --force-grid-wrap=0 --use-parentheses --line-width=88
	black -t py37 $(PYTHON_FILES)

format-web:
	npx prettier $(JS_FILES) $(CSS_FILES) --write
	npx eslint $(JS_FILES) --fix

format: format-python format-web

run:
	export FLASK_DEBUG=True; export FLASK_DEVELOPMENT=True; python3 main.py sitedata_acl2020/

freeze:
	rm -rf build/
	python3 main.py sitedata_acl2020/ --build
	python3 generate_version.py build/version.json

# check code format
format-check:
	(isort -rc $(PYTHON_FILES) --check-only --multi-line=3 --trailing-comma --force-grid-wrap=0 --use-parentheses --line-width=88) && (black -t py37 --check $(PYTHON_FILES)) || (echo "run \"make format\" to format the code"; exit 1)
	pylint -j0 $(PYTHON_FILES)
	mypy --show-error-codes $(PYTHON_FILES)
	npx prettier $(JS_FILES) $(CSS_FILES) --check
	npx eslint $(JS_FILES)
	@echo "format-check passed"

deploy: freeze
	git branch -D gh-pages
	git branch -D $(TEMP_DEPLOY_BRANCH)
	git checkout -b $(TEMP_DEPLOY_BRANCH)
	git add -f build
	git commit -am "Deploy on gh-pages"
	git subtree split --prefix build -b gh-pages
	# git push --force "https://${GH_TOKEN}@${GH_REF}.git" $(TEMP_DEPLOY_BRANCH):gh-pages
	git push --force origin gh-pages
	git checkout @{-1}
	@echo "Deployed to gh-pages 🚀"

deploy-aws: freeze
	aws s3 cp build/ $(AWS_S3_BUCKET) --recursive
	# invalidate caches so that new content are immediately available
	aws cloudfront create-invalidation --distribution-id $(AWS_CLOUDFRONT_DISTRIBUTION_ID) --paths "/*"
