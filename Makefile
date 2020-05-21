PYTHON_FILES = main.py scripts/

.PHONY: format check

all: mypy

# format code
format:
	prettier templates/ --write
	isort -rc $(PYTHON_FILES) --multi-line=3 --trailing-comma --force-grid-wrap=0 --use-parentheses --line-width=88
	black -t py37 $(PYTHON_FILES)

# check code format
format-check:
	prettier templates/ --check
	(isort -rc $(PYTHON_FILES) --check-only --multi-line=3 --trailing-comma --force-grid-wrap=0 --use-parentheses --line-width=88) && (black -t py37 --check $(PYTHON_FILES)) || (echo "run \"make format\" to format the code"; exit 1)

pylint: format-check
	pylint -j0 $(PYTHON_FILES)

mypy: pylint
	mypy --show-error-codes $(PYTHON_FILES)
