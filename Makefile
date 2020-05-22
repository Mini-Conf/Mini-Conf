HTML_FILES = $(shell find templates/ -name "*.html")
PYTHON_FILES = main.py scripts/

.PHONY: format check

all: format-check

# format code
format:
	prettier $(HTML_FILES) --write
	eslint $(HTML_FILES) --fix
	isort -rc $(PYTHON_FILES) --multi-line=3 --trailing-comma --force-grid-wrap=0 --use-parentheses --line-width=88
	black -t py37 $(PYTHON_FILES)

# check code format
format-check:
	prettier $(HTML_FILES) --check
	eslint $(HTML_FILES)
	(isort -rc $(PYTHON_FILES) --check-only --multi-line=3 --trailing-comma --force-grid-wrap=0 --use-parentheses --line-width=88) && (black -t py37 --check $(PYTHON_FILES)) || (echo "run \"make format\" to format the code"; exit 1)
	pylint -j0 $(PYTHON_FILES)
	mypy --show-error-codes $(PYTHON_FILES)