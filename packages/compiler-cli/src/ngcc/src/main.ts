/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { resolve } from 'path';
import * as ts from 'typescript';
import { Decorator } from '../../ngtsc/host';
import { FlatEsm2015PackageParser } from './parser/flat_esm2015_parser';
import { Esm2015ReflectionHost } from './host/esm2015_host';

interface DecoratedClass {
  name: string;
  declaration: ts.Declaration;
  decorators: Decorator[];
}

export function mainNgcc(args: string[]): number {
  const rootPath = args[0];
  const packagePath = resolve(rootPath, 'fesm2015');
  const entryPointPath = resolve(packagePath, 'common.js');
  const options: ts.CompilerOptions = { allowJs: true, rootDir: packagePath };
  const host = ts.createCompilerHost(options);
  const packageProgram = ts.createProgram([entryPointPath], options, host);
  const entryPointFile = packageProgram.getSourceFile(entryPointPath)!;
  const typeChecker = packageProgram.getTypeChecker();

  const parser = new FlatEsm2015PackageParser(typeChecker);
  const classDeclarations = parser.getExportedClasses(entryPointFile);
  console.error('Exported classes', classDeclarations.map(m => m.getText()));

  const reflectionHost = new Esm2015ReflectionHost(typeChecker);
  const decoratedClasses = classDeclarations
    .map(declaration => ({
      name: declaration.getText(),
      declaration,
      decorators: reflectionHost.getDecoratorsOfDeclaration(declaration)
    }))
    .filter(decoratedClass => decoratedClass.decorators) as DecoratedClass[];

  console.log('Decorated classes', decoratedClasses.map(decoratedClass =>
    decoratedClass.name +
    decoratedClass.decorators.map(decorator => decorator.name)));

  return 0;
}

