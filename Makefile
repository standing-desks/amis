PYTHON ?= .venv/bin/python

.PHONY: docs check check-docs check-browser

docs:
	$(PYTHON) tools/build_docs.py

check-docs:
	$(PYTHON) tools/build_docs.py --check

check-browser:
	npm test

check: check-docs check-browser
