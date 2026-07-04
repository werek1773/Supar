```markdown
# Supar Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the Supar JavaScript codebase. It covers file naming, module import/export styles, commit message habits, and how to write and locate tests. This guide is ideal for contributors aiming for consistency and clarity in Supar's codebase.

## Coding Conventions

### File Naming
- Use **camelCase** for all file names.
  - Example: `myModule.js`, `userProfile.test.js`

### Import Style
- Use **relative imports** for modules within the project.
  - Example:
    ```javascript
    import { fetchData } from './apiUtils';
    ```

### Export Style
- Use **named exports**.
  - Example:
    ```javascript
    // In userUtils.js
    export function getUserName(user) { ... }
    export function isUserActive(user) { ... }

    // In another file
    import { getUserName } from './userUtils';
    ```

### Commit Messages
- Freeform style, no strict prefixes.
- Average length: ~42 characters.
- Example:
  ```
  Fix bug in user authentication flow
  ```

## Workflows

### Adding a New Module
**Trigger:** When you need to add new functionality.
**Command:** `/add-module`

1. Create a new JavaScript file using camelCase naming.
2. Implement your functionality using named exports.
3. Import your module using a relative path where needed.
4. Write a corresponding test file named `yourModule.test.js`.

### Writing Tests
**Trigger:** When you add or update functionality.
**Command:** `/write-test`

1. Create a test file with the pattern `*.test.js` (e.g., `userUtils.test.js`).
2. Write your tests using the project's preferred (unknown) testing framework.
3. Ensure your tests cover all exported functions.

### Refactoring Imports/Exports
**Trigger:** When updating module structure or splitting files.
**Command:** `/refactor-imports`

1. Ensure all imports use relative paths.
2. Change all default exports to named exports if any exist.
3. Update import statements in other files to use named imports.

## Testing Patterns

- Test files follow the `*.test.js` naming convention.
- Place test files alongside the modules they test or in a dedicated test directory.
- The specific testing framework is not detected; follow the project's existing test style.
- Example test file:
  ```javascript
  // userUtils.test.js
  import { getUserName } from './userUtils';

  test('getUserName returns correct name', () => {
    const user = { name: 'Alice' };
    expect(getUserName(user)).toBe('Alice');
  });
  ```

## Commands
| Command         | Purpose                                      |
|-----------------|----------------------------------------------|
| /add-module     | Scaffold a new module with proper conventions|
| /write-test     | Create a test file for a module              |
| /refactor-imports | Refactor imports/exports to project style  |
```
