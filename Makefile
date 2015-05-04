export SHELL := /bin/bash
export PATH  := $(shell npm bin):$(PATH)

SRC_FILES = $(wildcard src/*.js)
LIB_FILES = $(patsubst src/%,lib/%,$(SRC_FILES))

all: $(LIB_FILES)

lib/%.js: src/%.js
	@mkdir -p $(@D)
	babel -o $@ $<

test: all test.js
	mocha -u exports --compilers js:babel/register

.PHONY: test
