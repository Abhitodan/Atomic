# Changelog

All notable changes to Atomic will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-10-20

### Added

#### Core Features
- **AST ChangeSpec Engine**: Deterministic code transformations via AST manipulation
  - TypeScript/JavaScript parser using Babel
  - Python parser (stub implementation)
  - Java parser (partial implementation with java-parser)
  - Invariant checking (syntax, semantic, test, custom)
  - Support for INSERT, DELETE, REPLACE, and MOVE operations

- **Mission Checkpoints**: Reversible batch operations
  - Checkpoint state management (pending, applied, verified, failed, rolled_back)
  - Automatic file snapshots before changes
  - Rollback capability for reversible checkpoints
  - Dependency tracking between checkpoints

- **FinOps Module**: Budget and cost management
  - Budget creation and enforcement
  - Model routing based on priority and budget constraints
  - Cost forecasting for operations
  - Usage tracking with automatic budget alerts
  - Default pricing for GPT-4, GPT-3.5-turbo, Claude-3-opus, Claude-3-sonnet

- **Zero-Trust Gateway**: Security scanning and policy enforcement
  - Secret detection (AWS keys, private keys, API tokens, OAuth tokens)
  - PII detection (emails, credit cards, SSNs, IP addresses)
  - 8 default security policies
  - Custom policy support
  - Actions: redact, block, warn
  - Multi-file scanning support

- **Evidence Store**: Audit logging and evidence collection
  - Complete audit trail of all operations
  - Audit pack generation per checkpoint
  - Evidence types: diffs, test results, invariant checks, cost reports, security scans
  - File-based persistence
  - Audit pack verification (signature support placeholder)

#### CLI
- `atomic init` - Initialize Atomic in current directory
- `atomic checkpoint` - Create new checkpoint with mission metadata
- `atomic apply` - Apply checkpoint changes to files
- `atomic rollback` - Rollback a checkpoint to snapshot
- `atomic scan` - Scan files for secrets and PII with optional redaction
- `atomic budget` - Create and manage budgets
- `atomic audit` - Generate audit pack reports

#### GitHub Actions
- Atomic governance workflow for PR checks
- Security scanning on all PRs
- Budget compliance verification
- Automated audit report generation
- Critical finding blocking
- CI/CD workflow for build and test

#### Documentation
- Comprehensive README with architecture diagram
- API documentation with all public interfaces
- Usage examples for all major features
- Contributing guidelines
- Security policy
- Example configuration file

#### Testing
- 27 unit tests across 3 test suites
- Coverage for AtomicEngine, ZeroTrustGateway, and FinOpsManager
- Jest configuration with ESM module mocking
- 100% test pass rate

### Technical Details
- TypeScript 5.3+ with strict mode
- Node.js 18+ required
- ESLint for code quality (0 errors)
- Prettier for code formatting
- ~9,000 lines of code
- Zero external AI service dependencies

### Known Limitations
- Python AST parsing is stub-only (requires external Python tooling)
- Java AST manipulation is partial (CST parsing only)
- Budget data is in-memory (not persisted between CLI invocations)
- Cryptographic audit pack signatures are placeholders
- No web dashboard (CLI and programmatic API only)

### Dependencies
- @babel/parser: AST parsing for JavaScript/TypeScript
- @babel/traverse: AST traversal
- @babel/types: AST node types
- commander: CLI framework
- java-parser: Java CST parsing
- yaml: Configuration file support

[1.0.0]: https://github.com/Abhitodan/Atomic/releases/tag/v1.0.0
