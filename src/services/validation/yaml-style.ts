import { TextDocument } from 'vscode-languageserver-textdocument';
import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver-types';
import { isMap, isSeq, visit, CST } from 'yaml';
import { SingleYAMLDocument } from '../../parser/yaml-documents';
import { LanguageSettings } from '../..';
import { AdditionalValidator } from './types';
import * as l10n from '@vscode/l10n';

export class YAMLStyleValidator implements AdditionalValidator {
  private forbidSequence: boolean;
  private forbidMapping: boolean;

  constructor(settings: LanguageSettings) {
    this.forbidMapping = settings.flowMapping === 'forbid';
    this.forbidSequence = settings.flowSequence === 'forbid';
  }
  validate(document: TextDocument, yamlDoc: SingleYAMLDocument): Diagnostic[] {
    const result = [];
    visit(yamlDoc.internalDocument, (key, node) => {
      if (this.forbidMapping && isMap(node) && node.srcToken?.type === 'flow-collection') {
        result.push(
          Diagnostic.create(
            this.getRangeOf(document, node.srcToken),
            l10n.t('flowStyleMapForbidden', 'Flow style mapping is forbidden'),
            DiagnosticSeverity.Error,
            'flowMap'
          )
        );
      }
      if (this.forbidSequence && isSeq(node) && node.srcToken?.type === 'flow-collection') {
        result.push(
          Diagnostic.create(
            this.getRangeOf(document, node.srcToken),
            l10n.t('flowStyleSeqForbidden'),
            DiagnosticSeverity.Error,
            'flowSeq'
          )
        );
      }
    });
    return result;
  }

  private getRangeOf(document: TextDocument, node: CST.FlowCollection): Range {
    const endOffset = node.end[0].offset;
    let endPosition = document.positionAt(endOffset);
    endPosition = { character: endPosition.character + 1, line: endPosition.line };
    return Range.create(document.positionAt(node.start.offset), endPosition);
  }
}
