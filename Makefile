.PHONY: format check

format:
	# Check frontend code
	prettier templates/ --write


check:
	# Fromat frontend code
	prettier templates/ --check
