/**
 * AST ChangeSpec - Deterministic code transformations
 */

import { ChangeSpec, Invariant, Language, CodeRange } from '../types';

export interface ASTNode {
  type: string;
  range: CodeRange;
  children?: ASTNode[];
  value?: unknown;
}

export interface ParseResult {
  ast: ASTNode;
  language: Language;
  errors: ParseError[];
}

export interface ParseError {
  message: string;
  location: CodeRange;
  severity: 'error' | 'warning';
}

export abstract class ASTParser {
  abstract parse(code: string, language: Language): Promise<ParseResult>;
  abstract validate(ast: ASTNode): boolean;
  abstract applyChange(ast: ASTNode, change: ChangeSpec): Promise<ASTNode>;
  abstract generate(ast: ASTNode): string;
}

export class ChangeSpecEngine {
  private parsers: Map<Language, ASTParser> = new Map();

  registerParser(language: Language, parser: ASTParser): void {
    this.parsers.set(language, parser);
  }

  async validateChange(change: ChangeSpec, code: string, language: Language): Promise<boolean> {
    const parser = this.getParser(language);
    const parseResult = await parser.parse(code, language);

    if (parseResult.errors.length > 0) {
      return false;
    }

    // Check all invariants
    for (const invariant of change.invariants) {
      if (!(await this.checkInvariant(invariant, parseResult.ast))) {
        return false;
      }
    }

    return true;
  }

  async applyChangeSpec(
    changes: ChangeSpec[],
    code: string,
    language: Language
  ): Promise<string> {
    const parser = this.getParser(language);
    const parseResult = await parser.parse(code, language);

    if (parseResult.errors.length > 0) {
      throw new Error(`Parse errors: ${parseResult.errors.map((e) => e.message).join(', ')}`);
    }

    // Apply changes in order
    for (const change of changes) {
      if (!(await this.validateChange(change, code, language))) {
        throw new Error(`Change ${change.id} failed validation`);
      }

      parseResult.ast = await parser.applyChange(parseResult.ast, change);
      code = parser.generate(parseResult.ast);
    }

    return code;
  }

  private async checkInvariant(invariant: Invariant, ast: ASTNode): Promise<boolean> {
    switch (invariant.type) {
      case 'syntax':
        return this.checkSyntaxInvariant(invariant, ast);
      case 'semantic':
        return this.checkSemanticInvariant(invariant, ast);
      case 'test':
        return this.checkTestInvariant(invariant, ast);
      case 'custom':
        return this.checkCustomInvariant(invariant, ast);
      default:
        return false;
    }
  }

  private checkSyntaxInvariant(_invariant: Invariant, ast: ASTNode): boolean {
    // Basic syntax validation - AST should be well-formed
    return ast.type !== undefined;
  }

  private checkSemanticInvariant(_invariant: Invariant, _ast: ASTNode): boolean {
    // Semantic checks (e.g., no undefined variables, type consistency)
    // This is a simplified implementation
    return true;
  }

  private checkTestInvariant(_invariant: Invariant, _ast: ASTNode): boolean {
    // Test invariants would be checked by running tests
    // This is a placeholder
    return true;
  }

  private checkCustomInvariant(invariant: Invariant, ast: ASTNode): boolean {
    // Custom invariants can be user-defined
    try {
      // eslint-disable-next-line no-new-func
      const validator = new Function('ast', invariant.validator);
      return validator(ast);
    } catch {
      return false;
    }
  }

  private getParser(language: Language): ASTParser {
    const parser = this.parsers.get(language);
    if (!parser) {
      throw new Error(`No parser registered for language: ${language}`);
    }
    return parser;
  }
}
