.PHONY: format check

all: mypy

format:
	# Format frontend code
	prettier templates/ --write
	# Format python code
	isort -rc main.py scripts/ --multi-line=3 --trailing-comma --force-grid-wrap=0 --use-parentheses --line-width=88
	black -t py37 main.py scripts/

format-check:
	# Check frontend code
	prettier templates/ --check
	# Check python code
	(isort -rc main.py scripts/--check-only --multi-line=3 --trailing-comma --force-grid-wrap=0 --use-parentheses --line-width=88) && (black -t py37 --check src/ tests/) || (echo "run \"make format\" to format the code"; exit 1)

pylint: format-check
	pylint -j0 main.py scripts/

mypy: pylint
	mypy --show-error-codes main.py scripts/
