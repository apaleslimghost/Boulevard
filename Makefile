export SHELL := /bin/bash
export PATH  := $(shell npm bin):$(PATH)

JS_FILES = $(wildcard *.js)
MIN_FILES = $(patsubst %, min/%, $(JS_FILES) test.js)

MOCHA_OPTS = -u exports --reporter dot

ifeq ($(MAKECMDGOALS),test)
MAKEFLAGS += -j2
endif

test: test-normal test-minify

test-normal: index.js test.js
	mocha $(MOCHA_OPTS)

test-minify: minify
	mocha $(MOCHA_OPTS) min/test.js

minify: $(MIN_FILES)

min/%.js: %.js
	@mkdir -p $(@D)
	babel --presets min -o $@ $<

.PHONY: test test-normal test-minify
