# Contributing to Atomic

Thank you for your interest in contributing to Atomic! This document provides guidelines for contributing.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help maintain a welcoming environment

## How to Contribute

### Reporting Bugs

1. Check existing issues first
2. Use the bug report template
3. Include:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details
   - Logs/screenshots if applicable

### Suggesting Features

1. Check if the feature has been requested
2. Open a discussion or issue
3. Describe:
   - Use case
   - Proposed solution
   - Alternatives considered
   - Impact on existing features

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add/update tests
5. Update documentation
6. Run linter and tests:
   ```bash
   npm run lint
   npm test
   npm run build
   ```
7. Commit with clear messages
8. Push to your fork
9. Open a Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/Atomic.git
cd Atomic

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run linter
npm run lint

# Format code
npm run format
```

## Code Style

- Follow TypeScript best practices
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Keep functions focused and small
- Prefer composition over inheritance
- Write tests for new features

## Testing

- Write unit tests for all new features
- Maintain or improve code coverage (>70%)
- Test edge cases and error conditions
- Use descriptive test names

Example:
```typescript
describe('FeatureName', () => {
  test('should do something specific', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = doSomething(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

## Documentation

- Update README.md for user-facing changes
- Update API.md for API changes
- Add examples to EXAMPLES.md
- Include inline comments for complex logic

## Commit Messages

Follow conventional commits:

- `feat: add new feature`
- `fix: fix bug in X`
- `docs: update documentation`
- `test: add tests for Y`
- `refactor: restructure Z`
- `chore: update dependencies`

## Priority Areas

We welcome contributions in these areas:

1. **Python AST Support**: Full Python parsing and manipulation
2. **Java AST Support**: Complete Java transformation support
3. **Budget Persistence**: Add database/file persistence for budgets
4. **Cryptographic Signing**: Implement audit pack signatures
5. **Language Support**: Add support for more languages
6. **UI Dashboard**: Web-based dashboard for monitoring
7. **Integration Tests**: End-to-end testing scenarios
8. **Performance**: Optimization and benchmarking

## Questions?

- Open a discussion on GitHub
- Check existing issues and PRs
- Review documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
