/**
 * Mock for java-parser to avoid ESM issues in tests
 */

export function parse(_code: string): any {
  return {
    type: 'CompilationUnit',
    children: [],
  };
}
