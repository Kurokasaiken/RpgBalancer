#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const HEADERS = new Set([
  'AGENT',
  'OBIETTIVO',
  'PROMPT READINESS',
  'ISTRUZIONI AGENTE',
  'FILE TARGET',
  'DIPENDENZE',
  'OPERAZIONI',
  'OPERAZIONI DA ESEGUIRE',
  'OPERAZIONI VIETATE',
  'ASSUNZIONI',
  'REGRESSION SAFEGUARDS',
  'AUTONOMIA & CHECK-IN',
  'KANBAN COMPLETION',
  'NOTE',
  'EVIDENCE LOG',
  'EVIDENCE',
  'PREREQUISITI',
  'DELIVERABLES',
  'CONTESTO & MOTIVO DEL RINVIO',
  'OBIETTIVO TECNICO',
  'MISSIONE',
  'OUTPUT ATTESI',
  'DOCUMENTAZIONE DA AGGIORNARE',
  'CONTEXT',
  'OBIETTIVO',
]);

function main() {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error('Usage: node enforcePromptReadiness.js <file...>');
    process.exit(1);
  }

  files.forEach((filePath) => {
    const absolutePath = path.resolve(filePath);
    const original = fs.readFileSync(absolutePath, 'utf8');
    const updated = original.replace(/```text([\s\S]*?)```/g, (match, blockContent) => {
      const transformed = transformBlock(blockContent);
      return '```text\n' + transformed.trimEnd() + '\n```';
    });

    if (updated !== original) {
      fs.writeFileSync(absolutePath, updated);
      console.log(`Updated ${filePath}`);
    } else {
      console.log(`No changes for ${filePath}`);
    }
  });
}

function transformBlock(blockContent) {
  let content = blockContent.replace(/^\n/, '').replace(/\r/g, '');
  const lines = content.split('\n');
  const hasReadiness = lines.some((line) => line.trim() === 'PROMPT READINESS');
  const hasAgentInstructions = lines.some((line) => line.trim() === 'ISTRUZIONI AGENTE');
  let insertedReadiness = hasReadiness;
  let insertedAgentInstructions = hasAgentInstructions;
  let awaitingAgentValue = false;

  const result = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (awaitingAgentValue) {
      result.push(line);
      if (trimmed !== '' && !isHeader(trimmed)) {
        if (!insertedAgentInstructions) {
          if (result.length === 0 || result[result.length - 1].trim() !== '') {
            result.push('');
          }
          result.push('ISTRUZIONI AGENTE');
          result.push('Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.');
          result.push('');
          insertedAgentInstructions = true;
        }
        awaitingAgentValue = false;
      }
      continue;
    }

    if (!insertedReadiness && trimmed === 'FILE TARGET') {
      if (result.length && result[result.length - 1].trim() !== '') {
        result.push('');
      }
      result.push('PROMPT READINESS');
      insertedReadiness = true;
    }

    if (!insertedAgentInstructions && trimmed === 'AGENT') {
      awaitingAgentValue = true;
    }

    if (trimmed === 'FILE TARGET') {
      result.push(line);
      const { transformedLines, nextIndex } = transformFileTargets(lines, i + 1);
      transformedLines.forEach((l) => result.push(l));
      i = nextIndex - 1;
      continue;
    }

    result.push(line);
  }

  return result.join('\n').replace(/\n{3,}/g, '\n\n');
}

function transformFileTargets(lines, startIndex) {
  const transformed = [];
  let i = startIndex;

  for (; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (isHeader(trimmed)) {
      break;
    }

    if (trimmed.startsWith('-')) {
      transformed.push(transformTargetLine(line));
    } else {
      transformed.push(line);
    }
  }

  return { transformedLines: transformed, nextIndex: i };
}

function isHeader(value) {
  if (!value) return false;
  return HEADERS.has(value);
}

function transformTargetLine(line) {
  const dashIndex = line.indexOf('-');
  if (dashIndex === -1) return line;
  const prefix = line.slice(0, dashIndex);
  let text = line.slice(dashIndex + 1).trim();
  const lower = text.toLowerCase();

  if (lower.startsWith('[esistente]') || lower.startsWith('[nuovo]')) {
    return line;
  }

  let status = '[esistente]';
  if (/(^|\s)\(nuovo\)/i.test(text)) {
    status = '[nuovo]';
    text = text.replace(/\s*\(nuovo\)/gi, '').trim();
  }

  const suffix = status === '[nuovo]' ? ' — creare scaffolding prima di iniziare.' : '';
  return `${prefix}- ${status} ${text}${suffix}`;
}

main();
