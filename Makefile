PLUGIN_ID = com.mattermost.plugin-quote
PLUGIN_VERSION = 2.0.0
BUNDLE_NAME = $(PLUGIN_ID)-$(PLUGIN_VERSION).tar.gz

## Builds the webapp bundle
.PHONY: build
build:
	@echo "Building webapp..."
	cd webapp && npm install
	cd webapp && npm run build
	@echo "Build complete!"

## Packages the plugin for distribution
.PHONY: package
package: build
	@echo "Packaging plugin..."
	rm -rf dist/
	mkdir -p dist/$(PLUGIN_ID)/webapp/dist
	cp plugin.json dist/$(PLUGIN_ID)/
	cp webapp/dist/main.js dist/$(PLUGIN_ID)/webapp/dist/
	cd dist && tar -czf $(BUNDLE_NAME) $(PLUGIN_ID)
	@echo ""
	@echo "✅ Plugin packaged successfully!"
	@echo "📦 Location: dist/$(BUNDLE_NAME)"
	@echo ""
	@echo "To install:"
	@echo "  1. Go to System Console > Plugins > Plugin Management"
	@echo "  2. Click 'Upload Plugin'"
	@echo "  3. Select dist/$(BUNDLE_NAME)"
	@echo ""

## Cleans build artifacts
.PHONY: clean
clean:
	@echo "Cleaning build artifacts..."
	rm -rf dist/
	rm -rf webapp/dist/
	rm -rf webapp/node_modules/
	@echo "Clean complete!"

## Install dependencies only
.PHONY: install
install:
	@echo "Installing dependencies..."
	cd webapp && npm install
	@echo "Dependencies installed!"

## Development build with watch
.PHONY: watch
watch:
	@echo "Starting development mode..."
	cd webapp && npm run dev

## Quick package without cleaning node_modules
.PHONY: quick-package
quick-package:
	@echo "Quick packaging (skipping npm install)..."
	cd webapp && npm run build
	rm -rf dist/
	mkdir -p dist/$(PLUGIN_ID)/webapp/dist
	cp plugin.json dist/$(PLUGIN_ID)/
	cp webapp/dist/main.js dist/$(PLUGIN_ID)/webapp/dist/
	cd dist && tar -czf $(BUNDLE_NAME) $(PLUGIN_ID)
	@echo "✅ Quick package complete: dist/$(BUNDLE_NAME)"

## Show help
.PHONY: help
help:
	@echo "Mattermost Quote Plugin - Build Commands"
	@echo ""
	@echo "Available targets:"
	@echo "  make install        - Install npm dependencies"
	@echo "  make build          - Build webapp bundle"
	@echo "  make package        - Build and package plugin (creates .tar.gz)"
	@echo "  make quick-package  - Package without reinstalling dependencies"
	@echo "  make watch          - Development mode with auto-rebuild"
	@echo "  make clean          - Remove all build artifacts"
	@echo "  make help           - Show this help"
	@echo ""

.DEFAULT_GOAL := help
