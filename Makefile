export SHELL := /bin/bash
export PATH  := $(shell npm bin):$(PATH)

SRC_FILES = $(wildcard src/*.js)
LIB_FILES = $(patsubst src/%,lib/%,$(SRC_FILES))

all: $(LIB_FILES)

lib/%.js: src/%.js
	@mkdir -p $(@D)
	6to5 -o $@ $<

test: all
	mocha