# Contributing to Atomic

Thank you for your interest in contributing to Atomic! This document provides guidelines and instructions for contributing.

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please:

- Be respectful and considerate
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members

## How to Contribute

### Reporting Bugs

1. **Check existing issues** to avoid duplicates
2. **Use the bug template** when creating an issue
3. **Include details**:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment (OS, Node version, etc.)
   - Logs/screenshots if applicable

### Suggesting Features

1. **Check existing issues/discussions** for similar requests
2. **Describe the use case** clearly
3. **Explain the expected behavior**
4. **Consider alternatives** you've thought about

### Pull Requests

#### Before You Start

1. **Open an issue first** for significant changes
2. **Discuss the approach** with maintainers
3. **Check if someone else is working on it**

#### Development Workflow

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub
   git clone https://github.com/YOUR_USERNAME/Atomic.git
   cd Atomic
   ```

2. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Make your changes**
   - Follow the code style (see below)
   - Add tests for new functionality
   - Update documentation as needed

5. **Test your changes**
   ```bash
   npm run build
   npm run typecheck
   npm run lint
   npm test
   ```

6. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   # Follow conventional commits (see below)
   ```

7. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   # Then create PR on GitHub
   ```

## Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer interfaces over types for objects
- Use explicit return types for functions
- Avoid `any`; use `unknown` if type is truly unknown
- Document complex logic with comments

**Good**:
```typescript
interface User {
  id: string;
  name: string;
}

function getUser(id: string): Promise<User> {
  // Implementation
}
```

**Bad**:
```typescript
function getUser(id: any): any {
  // Implementation
}
```

### Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `secret-redactor.ts`)
- **Classes**: `PascalCase` (e.g., `SecretRedactor`)
- **Functions/Variables**: `camelCase` (e.g., `getUserById`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_REQUEST_SIZE`)
- **Interfaces**: `PascalCase` (e.g., `ChangeSpec`)
- **Types**: `PascalCase` (e.g., `RiskLevel`)

### Code Organization

```typescript
// 1. Imports
import { External } from 'external-package';
import { Internal } from '@atomic/types';

// 2. Types/Interfaces
interface MyInterface {
  // ...
}

// 3. Constants
const CONSTANT_VALUE = 100;

// 4. Main code
export class MyClass {
  // ...
}

// 5. Helper functions
function helperFunction() {
  // ...
}
```

### Testing

- Write tests for all new functionality
- Aim for >80% code coverage
- Use descriptive test names
- Follow AAA pattern: Arrange, Act, Assert

**Example**:
```typescript
describe('SecretRedactor', () => {
  let redactor: SecretRedactor;

  beforeEach(() => {
    redactor = new SecretRedactor();
  });

  test('should redact API keys', () => {
    // Arrange
    const content = 'apikey: secret123';

    // Act
    const { sanitized, redactions } = redactor.redact(content);

    // Assert
    expect(redactions.length).toBeGreaterThan(0);
    expect(sanitized).toContain('***REDACTED***');
  });
});
```

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

### Examples

```bash
feat(dte): add Python language pack
fix(gateway): resolve redaction edge case
docs(api): update endpoint documentation
test(utils): add tests for logger utility
chore(deps): update TypeScript to 5.3
```

### Scope

Scopes correspond to packages/services:
- `gateway`, `orchestrator`, `dte`, `finops`, `evidence`
- `cli`, `types`, `schemas`, `utils`
- `docs`, `ci`, `deps`

## Documentation

### Code Comments

- Document **why**, not **what**
- Use JSDoc for public APIs
- Explain complex algorithms
- Note any gotchas or edge cases

```typescript
/**
 * Redacts sensitive data from content.
 * 
 * Uses pattern matching to identify and replace secrets with placeholders.
 * Patterns are run sequentially, so order matters for overlapping matches.
 * 
 * @param content - The content to redact
 * @returns Sanitized content and list of redactions
 */
export function redact(content: string): RedactionResult {
  // Implementation
}
```

### README Updates

Update README.md if your changes:
- Add new features
- Change installation/usage
- Modify architecture
- Add new dependencies

### Documentation Files

Update relevant docs in `docs/`:
- **ARCHITECTURE.md**: System design changes
- **API.md**: API changes
- **CHANGE_SPEC.md**: ChangeSpec schema changes
- **SECURITY.md**: Security-related changes
- **RUNBOOK.md**: Operational changes

## Pull Request Guidelines

### PR Title

Follow conventional commits format:
```
feat(gateway): add custom redaction patterns
```

### PR Description

Use this template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] Manual testing performed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests provide adequate coverage
```

### Review Process

1. **Automated checks must pass**:
   - Build successful
   - Tests passing
   - Linting clean
   - Type checking clean

2. **Code review**:
   - At least one approval required
   - Address all comments
   - Keep discussions focused

3. **Merge**:
   - Squash commits (maintainers will handle this)
   - Delete branch after merge

## Release Process

(For maintainers)

1. Update version in package.json
2. Update CHANGELOG.md
3. Create release tag
4. Publish to npm (if applicable)
5. Create GitHub release
6. Announce in discussions

## Development Environment

### Required Tools

- Node.js 18+
- npm 9+
- Git
- VS Code (recommended) or IntelliJ IDEA

### Recommended VS Code Extensions

- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- GitLens
- Jest Runner

### Project Structure

```
atomic/
├── packages/       # Shared libraries
├── services/       # Backend services
├── cli/           # Command-line interface
├── actions/       # GitHub Actions
├── examples/      # Example projects
└── docs/          # Documentation
```

## Testing Strategy

### Unit Tests

- Test individual functions/methods
- Mock external dependencies
- Fast execution (<1s per test)

### Integration Tests

- Test service interactions
- Use test database/storage
- Moderate execution time

### E2E Tests

- Test complete workflows
- Use actual services
- Longer execution time

## Security

### Reporting Vulnerabilities

**DO NOT** open public issues for security vulnerabilities.

Email: security@atomic.dev (or repository owner)

Include:
- Vulnerability description
- Steps to reproduce
- Impact assessment
- Suggested fix (if any)

### Security Best Practices

- Never commit secrets
- Use environment variables
- Validate all input
- Sanitize all output
- Follow OWASP guidelines

## Performance

### Guidelines

- Avoid unnecessary loops
- Use efficient data structures
- Cache when appropriate
- Profile before optimizing
- Document performance-critical code

### Benchmarking

For performance-critical changes:

```typescript
// Add benchmarks in __benchmarks__/
import { benchmark } from './test-utils';

benchmark('redact large content', () => {
  redactor.redact(largeContent);
});
```

## Questions?

- **General questions**: GitHub Discussions
- **Bug reports**: GitHub Issues
- **Security**: Email (see above)
- **Chat**: [Slack/Discord link if available]

## License

By contributing to Atomic, you agree that your contributions will be licensed under the Apache-2.0 License.

---

Thank you for contributing to Atomic! 🚀
