/**
 * Java AST Parser implementation
 */

import { parse } from 'java-parser';
import { ASTParser, ASTNode, ParseResult } from './changespec';
import { ChangeSpec, Language, CodeRange } from '../types';

export class JavaParser extends ASTParser {
  async parse(code: string, language: Language): Promise<ParseResult> {
    try {
      const cst = parse(code);

      return {
        ast: this.cstToInternal(cst),
        language,
        errors: [],
      };
    } catch (error) {
      const err = error as Error;
      return {
        ast: { type: 'CompilationUnit', range: this.emptyRange(), children: [] },
        language,
        errors: [
          {
            message: err.message,
            location: this.emptyRange(),
            severity: 'error',
          },
        ],
      };
    }
  }

  validate(ast: ASTNode): boolean {
    return ast.type === 'CompilationUnit';
  }

  async applyChange(_ast: ASTNode, _change: ChangeSpec): Promise<ASTNode> {
    // Java CST manipulation is complex and would require proper visitor implementation
    // This is a simplified placeholder
    throw new Error('Java change application not yet fully implemented');
  }

  generate(_ast: ASTNode): string {
    // Java code generation from CST not yet implemented
    return '// Java code generation not yet implemented';
  }

  private cstToInternal(cst: any): ASTNode {
    return {
      type: 'CompilationUnit',
      range: this.emptyRange(),
      value: cst,
    };
  }

  private emptyRange(): CodeRange {
    return {
      start: { line: 0, column: 0, file: '' },
      end: { line: 0, column: 0, file: '' },
    };
  }
}
