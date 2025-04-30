# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Lint/Test Commands
- Format code: `npx prettier --write [file]`
- The project doesn't use a build system - PHP/Vue files are loaded directly

## Code Style Guidelines
- **JavaScript**: 
  - Format: 2 spaces, 80 chars max line length, single quotes, semicolons required
  - Components: Vue.js 3 component objects with template, data(), methods properties
  - Naming: camelCase for functions/variables (e.g., `fetchData()`, `animalTracker`)
  - ES6 features: Use arrow functions, template literals, destructuring
  - Error handling: Try/catch blocks and promise chains with .catch()

- **PHP**:
  - Files: snake_case.php (e.g., `animal_manager.php`)
  - Classes: PascalCase (e.g., `AnimalManager`) with camelCase methods
  - Functions: snake_case for standalone functions 
  - Variables: snake_case with descriptive names (e.g., `$animal_id`)
  - Error handling: Try/catch and return status objects with success/error flags