export SHELL := /bin/bash
export PATH  := $(shell npm bin):$(PATH)

SRC_FILES = $(wildcard src/*.js)
LIB_FILES = $(patsubst src/%,lib/%,$(SRC_FILES))
MIN_FILES = $(patsubst %, min/%, $(LIB_FILES) test.js)

all: $(LIB_FILES)

lib/%.js: src/%.js
	@mkdir -p $(@D)
	babel -o $@ $<

test: test-normal test-minify

test-normal: all test.js
	mocha -u exports --compilers js:babel-register

test-minify: minify
	mocha -u exports min/test.js

minify: $(MIN_FILES)

min/%.js: %.js
	@mkdir -p $(@D)
	babel --presets min -o $@ $<

.PHONY: test
