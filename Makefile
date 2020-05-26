PYTHON_FILES = main.py scripts/
JS_FILES = $(shell find static/js -name "*.js")
CSS_FILES = $(shell find static/css -name "*.css")
.PHONY: format-python format-web run freeze format-check

all: format-check

# format code
format-python:
	isort -rc $(PYTHON_FILES) --multi-line=3 --trailing-comma --force-grid-wrap=0 --use-parentheses --line-width=88
	black -t py37 $(PYTHON_FILES)

format-web:
	prettier $(JS_FILES) $(CSS_FILES) --write
	eslint $(JS_FILES) --fix

run:
	export FLASK_DEBUG=True
	export FLASK_DEVELOPMENT=True
	python3 main.py sitedata/

freeze:
	python3 main.py sitedata/ --build

# check code format
format-check:
	(isort -rc $(PYTHON_FILES) --check-only --multi-line=3 --trailing-comma --force-grid-wrap=0 --use-parentheses --line-width=88) && (black -t py37 --check $(PYTHON_FILES)) || (echo "run \"make format\" to format the code"; exit 1)
	pylint -j0 $(PYTHON_FILES)
	mypy --show-error-codes $(PYTHON_FILES)
	prettier $(JS_FILES) $(CSS_FILES) --check
	eslint $(JS_FILES)
