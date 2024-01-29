
RELEASE_TAG := v$(shell cat VERSION)
RELEASE_BRANCH := develop
RELEASE_DIR := /tmp/release-$(RELEASE_TAG)
PRE_RELEASE := "1"
RELEASE_TYPE := $(shell if [ $(PRE_RELEASE) = "0" ] ; then echo release; else echo pre-release ; fi)
GOLANGCI_BINARY=golangci-lint

BUILD_MOBILE := ./build

ifeq ($(OS),Windows_NT)     # is Windows_NT on XP, 2000, 7, Vista, 10...
 detected_OS := Windows
else
 detected_OS := $(strip $(shell uname))
endif

ifeq ($(detected_OS),Darwin)
 GOBIN_SHARED_LIB_EXT := dylib
  # Building on M1 is still not supported, so in the meantime we crosscompile by default to amd64
  ifeq ("$(shell sysctl -nq hw.optional.arm64)","1")
    FORCE_ARCH ?= amd64
    GOBIN_SHARED_LIB_CFLAGS=CGO_ENABLED=1 GOOS=darwin GOARCH=$(FORCE_ARCH)
  endif
else ifeq ($(detected_OS),Windows)
 GOBIN_SHARED_LIB_CGO_LDFLAGS := CGO_LDFLAGS=""
 GOBIN_SHARED_LIB_EXT := dll
else
 GOBIN_SHARED_LIB_EXT := so
 GOBIN_SHARED_LIB_CGO_LDFLAGS := CGO_LDFLAGS="-Wl,-soname,lib.so.0"
endif

help: ##@other Show this help
	@perl -e '$(HELP_FUN)' $(MAKEFILE_LIST)



# This is a code for automatic help generator.
# It supports ANSI colors and categories.
# To add new item into help output, simply add comments
# starting with '##'. To add category, use @category.
GREEN  := $(shell echo "\e[32m")
WHITE  := $(shell echo "\e[37m")
YELLOW := $(shell echo "\e[33m")
RESET  := $(shell echo "\e[0m")
HELP_FUN = \
		   %help; \
		   while(<>) { push @{$$help{$$2 // 'options'}}, [$$1, $$3] if /^([a-zA-Z0-9\-]+)\s*:.*\#\#(?:@([a-zA-Z\-]+))?\s(.*)$$/ }; \
		   print "Usage: make [target]\n\n"; \
		   for (sort keys %help) { \
			   print "${WHITE}$$_:${RESET}\n"; \
			   for (@{$$help{$$_}}) { \
				   $$sep = " " x (32 - length $$_->[0]); \
				   print "  ${YELLOW}$$_->[0]${RESET}$$sep${GREEN}$$_->[1]${RESET}\n"; \
			   }; \
			   print "\n"; \
		   }












solc: ##@solc-select install 0.8.20
	solc --base-path ./ --include-path ./node_modules --bin --abi --overwrite contracts/MappingToken.sol -o dist/abi
	solc --base-path ./ --include-path ./node_modules --bin --abi --overwrite contracts/LockRelease.sol -o dist/abi
	solc --base-path ./ --include-path ./node_modules --bin --abi --overwrite contracts/MintBurn.sol -o dist/abi

abigen:
	mkdir -p dist/go 
	abigen --abi dist/abi/MappingToken.abi --pkg MappingToken --out dist/go/MappingToken.go
	abigen --abi dist/abi/LockRelease.abi --pkg LockRelease --out dist/go/LockRelease.go
	abigen --abi dist/abi/MintBurn.abi --pkg MintBurn --out dist/go/MintBurn.go


	