/**
 * Python AST Parser implementation (stub)
 */

import { ASTParser, ASTNode, ParseResult } from './changespec';
import { ChangeSpec, Language } from '../types';

export class PythonParser extends ASTParser {
  async parse(code: string, language: Language): Promise<ParseResult> {
    // Python parsing would require external Python process or WASM-based parser
    // For now, this is a stub implementation
    return {
      ast: { type: 'Module', range: this.emptyRange(), children: [] },
      language,
      errors: [
        {
          message: 'Python parsing not yet implemented - requires external tooling',
          location: this.emptyRange(),
          severity: 'warning',
        },
      ],
    };
  }

  validate(ast: ASTNode): boolean {
    return ast.type === 'Module';
  }

  async applyChange(_ast: ASTNode, _change: ChangeSpec): Promise<ASTNode> {
    throw new Error('Python change application not yet implemented');
  }

  generate(_ast: ASTNode): string {
    return '# Python code generation not yet implemented';
  }

  private emptyRange() {
    return {
      start: { line: 0, column: 0, file: '' },
      end: { line: 0, column: 0, file: '' },
    };
  }
}
