PYTHON ?= .venv/bin/python

.PHONY: docs check check-docs check-browser check-contract

docs:
	$(PYTHON) tools/build_docs.py

check-docs:
	$(PYTHON) tools/build_docs.py --check

check-browser:
	npm test

check-contract:
	$(PYTHON) tests/check_contract.py

check: check-docs check-browser check-contract
