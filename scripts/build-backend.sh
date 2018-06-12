#!/usr/bin/env bash

set -e

rm -rf dist
babel contracts --out-dir ./dist/contracts
babel contracts/addresses --out-dir ./dist/contracts/addresses
babel src --out-dir ./dist/src
copyfiles \
  npm-readme.md \
  LICENSE \
  package.json \
  npm-shrinkwrap.json \
  contracts/abi/**/* \
  contracts/abi/dai/**/* \
  src/utils/configs/* \
  contracts/addresses/daiV1.json \
  contracts/addresses/exchanges.json \
  dist
mv dist/npm-readme.md dist/README.md
cp package-lock.json dist/npm-shrinkwrap.json