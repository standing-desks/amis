PYTHON ?= .venv/bin/python

.PHONY: docs check check-docs check-browser check-contract check-conversions check-api

docs:
	$(PYTHON) tools/build_docs.py

check-docs:
	$(PYTHON) tools/build_docs.py --check

check-browser:
	npm test

check-conversions:
	npm run test:conversions

check-contract:
	$(PYTHON) tests/check_contract.py

check-api:
	$(PYTHON) tests/check_api.py

check: check-docs check-browser check-contract check-api
