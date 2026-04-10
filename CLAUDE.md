# CLAUDE.md - Project Configuration

## Project Overview
This is the `@peter.naydenov/dom-selector` library - a DOM selection and reference organizer.

## Testing Stack
- **Test Runner**: Playwright with Vitest-style syntax
- **Browser**: Chrome (existing browser)
- **Test File**: `test/01-general.spec.js`
- **Test HTML**: `index.html` (served via http-server)

## Commands
```bash
npm test        # Run Playwright tests
npm run test:ui # Run tests with Playwright UI
```

## Playwright Configuration
- Config file: `playwright.config.js`
- Tests run in existing Chrome browser
- Single worker execution (no blinking)
- HTTP server on port 5173

## Key Files
- `src/main.js` - Main library source
- `test/01-general.spec.js` - Playwright tests (13 tests, all passing)
- `index.html` - Test HTML fixture with DOM content

## Test Conventions
- Uses Vitest-style syntax: `test`, `expect`, `test.describe`, `test.beforeEach`
- Import from `@playwright/test`
- Use `page.evaluate()` to run code in browser context
- Access `window.DomSelector` for the library
- Tests run sequentially in single browser instance
