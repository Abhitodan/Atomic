import { Project, SourceFile, SyntaxKind, Node } from 'ts-morph';
import { Patch, ChangeSpec } from '@atomic/types';
import { logger } from '@atomic/utils';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

export interface TransformResult {
  success: boolean;
  filesModified: string[];
  errors: string[];
}

export class TypeScriptPack {
  private project: Project;

  constructor(tsConfigPath?: string) {
    this.project = new Project({
      tsConfigFilePath: tsConfigPath,
      skipAddingFilesFromTsConfig: !tsConfigPath,
    });
  }

  async applyPatches(patches: Patch[], dryRun = false): Promise<TransformResult> {
    const result: TransformResult = {
      success: true,
      filesModified: [],
      errors: [],
    };

    for (const patch of patches) {
      try {
        const files = await this.resolveFiles(patch.path);

        for (const filePath of files) {
          logger.debug('Processing file', { filePath, operation: patch.astOp });

          const sourceFile = this.project.addSourceFileAtPath(filePath);

          switch (patch.astOp) {
            case 'renameSymbol':
              this.renameSymbol(sourceFile, patch);
              break;
            case 'replaceAPI':
              this.replaceAPI(sourceFile, patch);
              break;
            default:
              result.errors.push(`Unsupported operation: ${patch.astOp}`);
              result.success = false;
              continue;
          }

          if (!dryRun) {
            await sourceFile.save();
          }

          result.filesModified.push(filePath);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        result.errors.push(`Error processing patch: ${message}`);
        result.success = false;
      }
    }

    return result;
  }

  private async resolveFiles(pattern: string): Promise<string[]> {
    // If it's a direct file path, return it
    if (fs.existsSync(pattern) && fs.statSync(pattern).isFile()) {
      return [pattern];
    }

    // Otherwise, treat it as a glob pattern
    return await glob(pattern, {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    });
  }

  private renameSymbol(sourceFile: SourceFile, patch: Patch) {
    const { selector, details } = patch;
    const { newName } = details as { newName: string };

    if (!selector || !newName) {
      throw new Error('renameSymbol requires selector and newName in details');
    }

    // Simple implementation: find identifiers matching the selector
    // In a real implementation, this would use a proper AST query language
    const identifierName = this.extractIdentifierFromSelector(selector);

    sourceFile.getDescendantsOfKind(SyntaxKind.Identifier).forEach((identifier) => {
      if (identifier.getText() === identifierName) {
        identifier.replaceWithText(newName);
        logger.debug('Renamed symbol', {
          file: sourceFile.getFilePath(),
          from: identifierName,
          to: newName,
        });
      }
    });
  }

  private replaceAPI(sourceFile: SourceFile, patch: Patch) {
    const { selector, details } = patch;
    const { newProperty, argsMap } = details as {
      newProperty?: string;
      argsMap?: Record<string, string>;
    };

    if (!selector) {
      throw new Error('replaceAPI requires selector');
    }

    // Parse selector to extract object and property names
    // Example: "CallExpression[callee.object.name='auth'][callee.property.name='login']"
    const objectMatch = selector.match(/callee\.object\.name='([^']+)'/);
    const propertyMatch = selector.match(/callee\.property\.name='([^']+)'/);

    if (!objectMatch || !propertyMatch) {
      throw new Error('Invalid selector format for replaceAPI');
    }

    const objectName = objectMatch[1];
    const propertyName = propertyMatch[1];

    sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((callExpr) => {
      const expression = callExpr.getExpression();

      if (Node.isPropertyAccessExpression(expression)) {
        const obj = expression.getExpression();
        const prop = expression.getName();

        if (
          Node.isIdentifier(obj) &&
          obj.getText() === objectName &&
          prop === propertyName
        ) {
          // Replace property name if specified
          if (newProperty) {
            expression.getNameNode().replaceWithText(newProperty);
          }

          // Replace argument names if argsMap specified
          if (argsMap) {
            const args = callExpr.getArguments();
            args.forEach((arg) => {
              if (Node.isObjectLiteralExpression(arg)) {
                arg.getProperties().forEach((prop) => {
                  if (Node.isPropertyAssignment(prop)) {
                    const propName = prop.getName();
                    if (argsMap[propName]) {
                      prop.getNameNode().replaceWithText(argsMap[propName]);
                    }
                  }
                });
              }
            });
          }

          logger.debug('Replaced API call', {
            file: sourceFile.getFilePath(),
            from: `${objectName}.${propertyName}`,
            to: newProperty ? `${objectName}.${newProperty}` : 'updated',
          });
        }
      }
    });
  }

  private extractIdentifierFromSelector(selector: string): string {
    // Extract identifier name from selector like "Identifier[name='UserId']"
    const match = selector.match(/name='([^']+)'/);
    if (!match) {
      throw new Error(`Cannot extract identifier from selector: ${selector}`);
    }
    return match[1];
  }

  generateDiff(filePath: string): string {
    const sourceFile = this.project.getSourceFile(filePath);
    if (!sourceFile) {
      return '';
    }

    // Return the modified text
    return sourceFile.getFullText();
  }
}
