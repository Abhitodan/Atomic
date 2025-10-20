/**
 * JavaScript/TypeScript AST Parser implementation
 */

import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import { ASTParser, ASTNode, ParseResult, ParseError } from './changespec';
import { ChangeSpec, Language, ChangeType, CodeRange } from '../types';

export class JavaScriptParser extends ASTParser {
  async parse(code: string, language: Language): Promise<ParseResult> {
    const errors: ParseError[] = [];

    try {
      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: language === Language.TYPESCRIPT ? ['typescript'] : ['jsx'],
        errorRecovery: true,
      });

      return {
        ast: this.babelToInternal(ast),
        language,
        errors,
      };
    } catch (error) {
      const err = error as Error;
      errors.push({
        message: err.message,
        location: {
          start: { line: 0, column: 0, file: '' },
          end: { line: 0, column: 0, file: '' },
        },
        severity: 'error',
      });

      return {
        ast: { type: 'Program', range: this.emptyRange(), children: [] },
        language,
        errors,
      };
    }
  }

  validate(ast: ASTNode): boolean {
    return ast.type === 'Program';
  }

  async applyChange(ast: ASTNode, change: ChangeSpec): Promise<ASTNode> {
    // Convert internal AST to Babel AST for manipulation
    const babelAst = this.internalToBabel(ast);

    switch (change.type) {
      case ChangeType.INSERT:
        return this.applyInsert(babelAst, change);
      case ChangeType.DELETE:
        return this.applyDelete(babelAst, change);
      case ChangeType.REPLACE:
        return this.applyReplace(babelAst, change);
      default:
        throw new Error(`Unsupported change type: ${change.type}`);
    }
  }

  generate(ast: ASTNode): string {
    const babelAst = this.internalToBabel(ast);
    const result = generate(babelAst as any, {
      retainLines: false,
      compact: false,
    });
    return result.code;
  }

  private applyInsert(ast: any, change: ChangeSpec): ASTNode {
    if (!change.content) {
      throw new Error('Insert change requires content');
    }

    const insertedCode = parser.parse(change.content, { sourceType: 'module' });
    const self = this;

    traverse(ast, {
      enter(path: any) {
        const node = path.node;
        if (node.loc && self.matchesLocation(node.loc, change.range.start)) {
          // Insert new code at this location
          if (t.isProgram(insertedCode) && (insertedCode as any).body) {
            path.insertBefore((insertedCode as any).body);
          }
        }
      },
    });

    return this.babelToInternal(ast);
  }

  private applyDelete(ast: any, change: ChangeSpec): ASTNode {
    const self = this;
    
    traverse(ast, {
      enter(path: any) {
        const node = path.node;
        if (node.loc && self.nodeInRange(node.loc, change.range)) {
          path.remove();
        }
      },
    });

    return this.babelToInternal(ast);
  }

  private applyReplace(ast: any, change: ChangeSpec): ASTNode {
    if (!change.content) {
      throw new Error('Replace change requires content');
    }

    const replacementCode = parser.parse(change.content, { sourceType: 'module' });
    const self = this;

    traverse(ast, {
      enter(path: any) {
        const node = path.node;
        if (node.loc && self.nodeInRange(node.loc, change.range)) {
          if (t.isProgram(replacementCode) && (replacementCode as any).body && (replacementCode as any).body.length > 0) {
            path.replaceWith((replacementCode as any).body[0]);
          }
        }
      },
    });

    return this.babelToInternal(ast);
  }

  private babelToInternal(babelAst: any): ASTNode {
    return {
      type: babelAst.type || 'Program',
      range: babelAst.loc
        ? {
            start: {
              line: babelAst.loc.start.line,
              column: babelAst.loc.start.column,
              file: '',
            },
            end: { line: babelAst.loc.end.line, column: babelAst.loc.end.column, file: '' },
          }
        : this.emptyRange(),
      value: babelAst,
    };
  }

  private internalToBabel(ast: ASTNode): any {
    return ast.value || { type: 'Program', body: [] };
  }

  private emptyRange(): CodeRange {
    return {
      start: { line: 0, column: 0, file: '' },
      end: { line: 0, column: 0, file: '' },
    };
  }

  private matchesLocation(loc: any, target: any): boolean {
    return loc.start.line === target.line && loc.start.column === target.column;
  }

  private nodeInRange(loc: any, range: CodeRange): boolean {
    return (
      loc.start.line >= range.start.line &&
      loc.end.line <= range.end.line &&
      loc.start.column >= range.start.column &&
      loc.end.column <= range.end.column
    );
  }
}
