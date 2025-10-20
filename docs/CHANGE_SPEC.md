# ChangeSpec Documentation

## Overview

A **ChangeSpec** (Change Specification) is a declarative, typed specification for deterministic code transformations. It describes WHAT changes should be made without prescribing HOW they are implemented.

## Schema

The ChangeSpec follows this JSON Schema structure:

```json
{
  "id": "CS-XXX",                    // Unique identifier
  "intent": "Human-readable goal",   // What and why
  "scope": ["path/patterns"],        // Where to apply
  "language": "typescript",          // Primary language
  "assumptions": ["..."],            // Explicit assumptions (optional)
  "patches": [...],                  // AST operations
  "invariants": [...],               // Verification rules
  "tests": {...},                    // Test strategy
  "risk": "low|medium|high",         // Risk assessment (optional)
  "telemetry": {...}                 // Metadata (optional)
}
```

## Properties

### id (required)
- **Type**: `string`
- **Pattern**: `^CS-[0-9]+$`
- **Description**: Unique identifier for the ChangeSpec
- **Example**: `"CS-001"`, `"CS-12345"`

### intent (required)
- **Type**: `string`
- **Description**: Human-readable description of the intended change
- **Example**: `"Rename UserId to AccountId and migrate auth.login to auth.signIn"`

### scope (required)
- **Type**: `array` of strings
- **Description**: File paths or glob patterns defining where changes apply
- **Examples**:
  - `["src/types.ts"]` - Single file
  - `["src/**/*.ts"]` - All TypeScript files
  - `["packages/auth", "apps/web"]` - Multiple directories

### language (required)
- **Type**: `string`
- **Enum**: `"typescript"`, `"javascript"`, `"python"`, `"java"`
- **Description**: Primary programming language for the change

### assumptions (optional)
- **Type**: `array` of strings
- **Description**: Explicit assumptions made during planning
- **Example**: `["All auth.login calls have username/password params", "No dynamic property access"]`

### patches (required)
Array of AST-level operations to perform.

#### Patch Structure
```json
{
  "path": "file/or/glob/pattern",
  "astOp": "operation-type",
  "selector": "AST-query-string",
  "details": {...}
}
```

#### Supported Operations

##### renameSymbol
Rename an identifier across the codebase.

```json
{
  "path": "src/**/*.ts",
  "astOp": "renameSymbol",
  "selector": "Identifier[name='UserId']",
  "details": {
    "newName": "AccountId"
  }
}
```

##### replaceAPI
Transform API calls (method names, arguments).

```json
{
  "path": "src/**/*.ts",
  "astOp": "replaceAPI",
  "selector": "CallExpression[callee.object.name='auth'][callee.property.name='login']",
  "details": {
    "newProperty": "signIn",
    "argsMap": {
      "username": "email"
    }
  }
}
```

##### Other Operations (v2)
- `moveModule`: Move/rename modules
- `insertNode`: Add new AST nodes
- `deleteNode`: Remove AST nodes
- `editString`: String literal transformations
- `editRegex`: Regex-based edits

### invariants (required)
Array of constraints that must hold after applying patches.

#### Invariant Structure
```json
{
  "name": "Descriptive name",
  "type": "check-type",
  "spec": "specification"
}
```

#### Invariant Types

##### typecheck
Run type checker to verify type safety.

```json
{
  "name": "TypeCheckAll",
  "type": "typecheck",
  "spec": "tsc --noEmit"
}
```

##### symbolExists
Verify a symbol exists in the codebase.

```json
{
  "name": "NewSymbolExists",
  "type": "symbolExists",
  "spec": "AccountId"
}
```

##### semanticRule
Custom semantic validation.

```json
{
  "name": "NoOldAPICalls",
  "type": "semanticRule",
  "spec": "No calls to auth.login remain"
}
```

##### regex
Pattern matching validation.

```json
{
  "name": "NoDeprecatedImports",
  "type": "regex",
  "spec": "import.*from ['\"]old-package['\"]"
}
```

##### apiCompat
API compatibility check.

```json
{
  "name": "BackwardsCompat",
  "type": "apiCompat",
  "spec": "All public APIs remain callable"
}
```

### tests (required)
Testing strategy for the change.

```json
{
  "strategy": "augment|generate|hybrid",
  "targets": ["path/to/test"],
  "mutationThreshold": 0.6
}
```

- **strategy**:
  - `augment`: Add to existing tests
  - `generate`: Generate new tests
  - `hybrid`: Mix of both
  
- **targets**: Paths to test

- **mutationThreshold**: Minimum mutation score (0.0-1.0)

### risk (optional)
- **Type**: `string`
- **Enum**: `"low"`, `"medium"`, `"high"`
- **Description**: Risk assessment
- **Default**: `"medium"`
- **Impact**:
  - `high`: Requires mutation testing, human approval
  - `medium`: Standard validation
  - `low`: Automated approval allowed

## Complete Example

```json
{
  "id": "CS-001",
  "intent": "Rename UserId → AccountId and replace auth.login(v1) → auth.signIn(v2)",
  "scope": ["packages/auth", "apps/web"],
  "language": "typescript",
  "assumptions": [
    "All login calls follow standard pattern",
    "No runtime property access on auth object"
  ],
  "patches": [
    {
      "path": "packages/auth/src/types.ts",
      "astOp": "renameSymbol",
      "selector": "Identifier[name='UserId']",
      "details": {
        "newName": "AccountId"
      }
    },
    {
      "path": "apps/web/src/**/*.ts",
      "astOp": "replaceAPI",
      "selector": "CallExpression[callee.object.name='auth'][callee.property.name='login']",
      "details": {
        "newProperty": "signIn",
        "argsMap": {
          "username": "email"
        }
      }
    }
  ],
  "invariants": [
    {
      "name": "TypeCheckAll",
      "type": "typecheck",
      "spec": "tsc --noEmit"
    },
    {
      "name": "AuthAPICompat",
      "type": "semanticRule",
      "spec": "No calls to auth.login remain; all calls compile"
    },
    {
      "name": "NewTypeExists",
      "type": "symbolExists",
      "spec": "AccountId"
    }
  ],
  "tests": {
    "strategy": "augment",
    "targets": ["packages/auth", "apps/web"],
    "mutationThreshold": 0.6
  },
  "risk": "medium",
  "telemetry": {
    "createdBy": "agent-copilot",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Best Practices

### 1. Be Explicit
- Always include assumptions
- Use specific selectors
- Define clear invariants

### 2. Scope Control
- Start narrow, expand gradually
- Use specific paths over broad globs
- Test on subset first

### 3. Invariants
- Always include type checking
- Add semantic rules for critical changes
- Verify both presence (new API) and absence (old API)

### 4. Risk Assessment
- High risk: Database schemas, public APIs, security
- Medium risk: Internal APIs, refactoring
- Low risk: Formatting, naming (non-public)

### 5. Testing
- Set realistic mutation thresholds
- Use `augment` for existing tests
- Use `generate` for new modules
- High-risk changes → high thresholds (0.8+)

## Validation

ChangeSpecs are validated against the JSON Schema before execution:

```typescript
import { validateChangeSpec } from '@atomic/schemas';

const isValid = validateChangeSpec(changeSpec);
if (!isValid) {
  console.error(validateChangeSpec.errors);
}
```

## CLI Usage

### Plan
```bash
atomic dte plan \
  --intent "Rename UserId to AccountId" \
  --scope "src/**/*.ts" \
  --output changespec.json
```

### Apply
```bash
atomic dte apply --spec changespec.json
```

### Verify
```bash
atomic dte verify --spec changespec.json --ci
```

## Version History

- **v1.0**: Initial release (TypeScript, JavaScript, Python, Java)
- **Future**: Additional AST operations, more languages
