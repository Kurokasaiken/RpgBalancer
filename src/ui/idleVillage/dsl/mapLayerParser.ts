/**
 * NP-031 – Idle Village Map Layer Configuration DSL
 * 
 * DSL parser and interpreter for map layer configuration with
 * syntax highlighting, error reporting, and execution context.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { 
  MapLayerConfig, 
  MapLayerDSLContext, 
  DSLFunction, 
  DSLExpression,
  BUILTIN_DSL_FUNCTIONS,
  validateMapLayerConfig,
  createMapLayerConfig
} from './mapLayerConfig';

// Parser types
export interface ParseResult {
  success: boolean;
  ast?: DSLAST;
  errors: ParseError[];
  warnings: ParseWarning[];
  context: MapLayerDSLContext;
}

export interface ParseError {
  type: 'syntax' | 'semantic' | 'runtime' | 'validation';
  message: string;
  line: number;
  column: number;
  position: number;
  snippet?: string;
}

export interface ParseWarning {
  type: 'deprecated' | 'unused' | 'performance' | 'style';
  message: string;
  line: number;
  column: number;
  position: number;
}

export interface DSLAST {
  type: 'document';
  version: string;
  imports: ImportStatement[];
  variables: VariableDeclaration[];
  functions: FunctionDeclaration[];
  layers: LayerDeclaration[];
  metadata: MetadataDeclaration;
}

export interface ImportStatement {
  type: 'import';
  module: string;
  alias?: string;
  line: number;
  column: number;
}

export interface VariableDeclaration {
  type: 'variable';
  name: string;
  value: DSLExpression;
  line: number;
  column: number;
}

export interface FunctionDeclaration {
  type: 'function';
  name: string;
  parameters: Parameter[];
  body: string;
  line: number;
  column: number;
}

export interface Parameter {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
}

export interface LayerDeclaration {
  type: 'layer';
  id: string;
  properties: LayerProperty[];
  line: number;
  column: number;
}

export interface LayerProperty {
  name: string;
  value: DSLExpression;
  line: number;
  column: number;
}

export interface MetadataDeclaration {
  type: 'metadata';
  properties: Record<string, any>;
  line: number;
  column: number;
}

// Lexer
export class DSLLexer {
  private input: string;
  private position: number;
  private line: number;
  private column: number;

  constructor(input: string) {
    this.input = input;
    this.position = 0;
    this.line = 1;
    this.column = 1;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];
    
    while (this.position < this.input.length) {
      const char = this.input[this.position];
      
      // Skip whitespace
      if (/\s/.test(char)) {
        this.advance();
        continue;
      }
      
      // Skip comments
      if (char === '/' && this.peek() === '/') {
        this.skipLineComment();
        continue;
      }
      
      if (char === '/' && this.peek() === '*') {
        this.skipBlockComment();
        continue;
      }
      
      // Tokenize based on character
      if (char === '"') {
        tokens.push(this.readString());
      } else if (char === "'") {
        tokens.push(this.readString());
      } else if (/[a-zA-Z_]/.test(char)) {
        tokens.push(this.readIdentifier());
      } else if (/[0-9]/.test(char)) {
        tokens.push(this.readNumber());
      } else {
        tokens.push(this.readOperator());
      }
    }
    
    return tokens;
  }

  private advance(): void {
    if (this.position < this.input.length) {
      if (this.input[this.position] === '\n') {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
      this.position++;
    }
  }

  private peek(): string {
    return this.input[this.position + 1] || '';
  }

  private skipLineComment(): void {
    while (this.position < this.input.length && this.input[this.position] !== '\n') {
      this.advance();
    }
  }

  private skipBlockComment(): void {
    this.advance(); // Skip '/'
    this.advance(); // Skip '*'
    
    while (this.position < this.input.length) {
      if (this.input[this.position] === '*' && this.peek() === '/') {
        this.advance(); // Skip '*'
        this.advance(); // Skip '/'
        break;
      }
      this.advance();
    }
  }

  private readString(): Token {
    const quote = this.input[this.position];
    const start = this.position;
    let value = '';
    
    this.advance(); // Skip opening quote
    
    while (this.position < this.input.length && this.input[this.position] !== quote) {
      if (this.input[this.position] === '\\') {
        this.advance();
        const escaped = this.input[this.position];
        value += this.unescapeChar(escaped);
        this.advance();
      } else {
        value += this.input[this.position];
        this.advance();
      }
    }
    
    this.advance(); // Skip closing quote
    
    return {
      type: 'string',
      value,
      line: this.line,
      column: this.column - value.length - 2,
    };
  }

  private readIdentifier(): Token {
    const start = this.position;
    let value = '';
    
    while (this.position < this.input.length && /[a-zA-Z0-9_]/.test(this.input[this.position])) {
      value += this.input[this.position];
      this.advance();
    }
    
    return {
      type: 'identifier',
      value,
      line: this.line,
      column: this.column - value.length,
    };
  }

  private readNumber(): Token {
    const start = this.position;
    let value = '';
    let hasDecimal = false;
    
    while (this.position < this.input.length && /[0-9.]/.test(this.input[this.position])) {
      if (this.input[this.position] === '.') {
        if (hasDecimal) break;
        hasDecimal = true;
      }
      value += this.input[this.position];
      this.advance();
    }
    
    return {
      type: 'number',
      value: hasDecimal ? parseFloat(value) : parseInt(value, 10),
      line: this.line,
      column: this.column - value.length,
    };
  }

  private readOperator(): Token {
    const start = this.position;
    let value = '';
    
    // Check for multi-character operators
    const twoCharOps = ['==', '!=', '<=', '>=', '&&', '||', '+=', '-=', '*=', '/='];
    const threeCharOps = ['===', '!==', '=>'];
    
    if (this.position + 2 < this.input.length) {
      const threeChar = this.input.substring(this.position, this.position + 3);
      if (threeCharOps.includes(threeChar)) {
        value = threeChar;
        this.advance();
        this.advance();
        this.advance();
        return {
          type: 'operator',
          value,
          line: this.line,
          column: this.column - value.length,
        };
      }
    }
    
    if (this.position + 1 < this.input.length) {
      const twoChar = this.input.substring(this.position, this.position + 2);
      if (twoCharOps.includes(twoChar)) {
        value = twoChar;
        this.advance();
        this.advance();
        return {
          type: 'operator',
          value,
          line: this.line,
          column: this.column - value.length,
        };
      }
    }
    
    // Single character operators
    const singleCharOps = ['=', '+', '-', '*', '/', '<', '>', '!', '&', '|', '{', '}', '(', ')', '[', ']', ':', ';', ','];
    
    if (singleCharOps.includes(this.input[this.position])) {
      value = this.input[this.position];
      this.advance();
      return {
        type: 'operator',
        value,
        line: this.line,
        column: this.column - value.length,
      };
    }
    
    // Unknown character
    value = this.input[this.position];
    this.advance();
    
    return {
      type: 'unknown',
      value,
      line: this.line,
      column: this.column - value.length,
    };
  }

  private unescapeChar(escaped: string): string {
    switch (escaped) {
      case 'n': return '\n';
      case 't': return '\t';
      case 'r': return '\r';
      case '\\': return '\\';
      case '"': return '"';
      case "'": return "'";
      default: return escaped;
    }
  }
}

export interface Token {
  type: 'identifier' | 'string' | 'number' | 'operator' | 'unknown';
  value: any;
  line: number;
  column: number;
}

// Parser
export class DSLParser {
  private tokens: Token[];
  private position: number;
  private current: Token | null;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.position = 0;
    this.current = tokens[0] || null;
  }

  parse(): ParseResult {
    const errors: ParseError[] = [];
    const warnings: ParseWarning[] = [];
    const context: MapLayerDSLContext = {
      layers: [],
      variables: {},
      imports: [],
      version: '1.0.0',
      metadata: {
        name: 'Untitled',
        created: Date.now(),
        updated: Date.now(),
      },
    };

    try {
      const ast = this.parseDocument(context);
      
      // Validate AST
      this.validateAST(ast, errors, warnings);
      
      return {
        success: errors.length === 0,
        ast,
        errors,
        warnings,
        context,
      };
    } catch (error) {
      errors.push({
        type: 'syntax',
        message: error instanceof Error ? error.message : 'Unknown parsing error',
        line: this.current?.line || 0,
        column: this.current?.column || 0,
        position: this.position,
      });
      
      return {
        success: false,
        errors,
        warnings,
        context,
      };
    }
  }

  private parseDocument(context: MapLayerDSLContext): DSLAST {
    const ast: DSLAST = {
      type: 'document',
      version: '1.0.0',
      imports: [],
      variables: [],
      functions: [],
      layers: [],
      metadata: {
        type: 'metadata',
        properties: {},
        line: 0,
        column: 0,
      },
    };

    while (this.current && !this.isEOF()) {
      if (this.match('identifier', 'import')) {
        ast.imports.push(this.parseImport());
      } else if (this.match('identifier', 'layer')) {
        ast.layers.push(this.parseLayer());
      } else if (this.match('identifier', 'var') || this.match('identifier', 'let') || this.match('identifier', 'const')) {
        ast.variables.push(this.parseVariable());
      } else if (this.match('identifier', 'function')) {
        ast.functions.push(this.parseFunction());
      } else if (this.match('identifier', 'metadata')) {
        ast.metadata = this.parseMetadata();
      } else {
        this.advance(); // Skip unknown tokens
      }
    }

    return ast;
  }

  private parseImport(): ImportStatement {
    const startLine = this.current!.line;
    const startColumn = this.current!.column;
    
    this.advance(); // Skip 'import'
    
    const module = this.expect('string') as Token;
    let alias: string | undefined;
    
    if (this.match('identifier', 'as')) {
      const aliasToken = this.expect('identifier') as Token;
      alias = aliasToken.value;
    }
    
    this.expect('operator', ';');
    
    return {
      type: 'import',
      module: module.value,
      alias,
      line: startLine,
      column: startColumn,
    };
  }

  private parseVariable(): VariableDeclaration {
    const startLine = this.current!.line;
    const startColumn = this.current!.column;
    
    this.advance(); // Skip 'var', 'let', or 'const'
    
    const nameToken = this.expect('identifier') as Token;
    this.expect('operator', '=');
    const value = this.parseExpression();
    this.expect('operator', ';');
    
    return {
      type: 'variable',
      name: nameToken.value,
      value,
      line: startLine,
      column: startColumn,
    };
  }

  private parseFunction(): FunctionDeclaration {
    const startLine = this.current!.line;
    const startColumn = this.current!.column;
    
    this.advance(); // Skip 'function'
    
    const nameToken = this.expect('identifier') as Token;
    
    this.expect('operator', '(');
    const parameters = this.parseParameters();
    this.expect('operator', ')');
    
    const body = this.parseFunctionBody();
    
    return {
      type: 'function',
      name: nameToken.value,
      parameters,
      body,
      line: startLine,
      column: startColumn,
    };
  }

  private parseParameters(): Parameter[] {
    const parameters: Parameter[] = [];
    
    if (this.match('operator', ')')) {
      return parameters;
    }
    
    do {
      const nameToken = this.expect('identifier') as Token;
      let type = 'any';
      let required = true;
      let defaultValue: any;
      
      if (this.match('operator', ':')) {
        const typeToken = this.expect('identifier') as Token;
        type = typeToken.value;
      }
      
      if (this.match('operator', '=')) {
        defaultValue = this.parseExpression().value;
        required = false;
      }
      
      parameters.push({
        name: nameToken.value,
        type,
        required,
        defaultValue,
      });
      
      if (!this.match('operator', ',')) {
        break;
      }
    } while (true);
    
    return parameters;
  }

  private parseFunctionBody(): string {
    this.expect('operator', '{');
    
    const start = this.position;
    let braceCount = 1;
    let body = '';
    
    while (this.current && braceCount > 0) {
      if (this.current.value === '{') {
        braceCount++;
      } else if (this.current.value === '}') {
        braceCount--;
      }
      
      if (braceCount > 0) {
        body += this.current.value;
        this.advance();
      }
    }
    
    this.expect('operator', '}');
    
    return body;
  }

  private parseLayer(): LayerDeclaration {
    const startLine = this.current!.line;
    const startColumn = this.current!.column;
    
    this.advance(); // Skip 'layer'
    
    const idToken = this.expect('string') as Token;
    this.expect('operator', '{');
    
    const properties = this.parseLayerProperties();
    
    this.expect('operator', '}');
    
    return {
      type: 'layer',
      id: idToken.value,
      properties,
      line: startLine,
      column: startColumn,
    };
  }

  private parseLayerProperties(): LayerProperty[] {
    const properties: LayerProperty[] = [];
    
    while (this.current && !this.match('operator', '}')) {
      const nameToken = this.expect('identifier') as Token;
      this.expect('operator', ':');
      const value = this.parseExpression();
      this.expect('operator', ';');
      
      properties.push({
        name: nameToken.value,
        value,
        line: nameToken.line,
        column: nameToken.column,
      });
    }
    
    return properties;
  }

  private parseMetadata(): MetadataDeclaration {
    const startLine = this.current!.line;
    const startColumn = this.current!.column;
    
    this.advance(); // Skip 'metadata'
    this.expect('operator', '{');
    
    const properties: Record<string, any> = {};
    
    while (this.current && !this.match('operator', '}')) {
      const nameToken = this.expect('identifier') as Token;
      this.expect('operator', ':');
      const value = this.parseExpression();
      this.expect('operator', ';');
      
      properties[nameToken.value] = value.value;
    }
    
    return {
      type: 'metadata',
      properties,
      line: startLine,
      column: startColumn,
    };
  }

  private parseExpression(): DSLExpression {
    const left = this.parseTerm();
    
    if (this.match('operator', '+') || this.match('operator', '-')) {
      const operator = this.current!.value;
      this.advance();
      const right = this.parseExpression();
      
      return {
        type: 'value',
        expression: `${left.expression} ${operator} ${right.expression}`,
        variables: { ...left.variables, ...right.variables },
      };
    }
    
    return left;
  }

  private parseTerm(): DSLExpression {
    const left = this.parseFactor();
    
    if (this.match('operator', '*') || this.match('operator', '/')) {
      const operator = this.current!.value;
      this.advance();
      const right = this.parseTerm();
      
      return {
        type: 'value',
        expression: `${left.expression} ${operator} ${right.expression}`,
        variables: { ...left.variables, ...right.variables },
      };
    }
    
    return left;
  }

  private parseFactor(): DSLExpression {
    if (this.match('operator', '(')) {
      this.advance();
      const expr = this.parseExpression();
      this.expect('operator', ')');
      return expr;
    }
    
    if (this.match('operator', '{')) {
      return this.parseObjectExpression();
    }
    
    if (this.match('operator', '[')) {
      return this.parseArrayExpression();
    }
    
    if (this.current?.type === 'identifier' && this.peek()?.value === '(') {
      return this.parseFunctionCall();
    }
    
    const token = this.current!;
    this.advance();
    
    return {
      type: 'value',
      expression: String(token.value),
      variables: {},
    };
  }

  private parseObjectExpression(): DSLExpression {
    const start = this.position;
    let braceCount = 1;
    let expr = '{';
    
    this.advance(); // Skip '{'
    
    while (this.current && braceCount > 0) {
      if (this.current.value === '{') {
        braceCount++;
      } else if (this.current.value === '}') {
        braceCount--;
      }
      
      if (braceCount > 0) {
        expr += this.current.value;
        this.advance();
      }
    }
    
    return {
      type: 'value',
      expression,
      variables: {},
    };
  }

  private parseArrayExpression(): DSLExpression {
    const start = this.position;
    let bracketCount = 1;
    let expr = '[';
    
    this.advance(); // Skip '['
    
    while (this.current && bracketCount > 0) {
      if (this.current.value === '[') {
        bracketCount++;
      } else if (this.current.value === ']') {
        bracketCount--;
      }
      
      if (bracketCount > 0) {
        expr += this.current.value;
        this.advance();
      }
    }
    
    return {
      type: 'value',
      expression,
      variables: {},
    };
  }

  private parseFunctionCall(): DSLExpression {
    const nameToken = this.current!;
    this.advance(); // Skip function name
    
    this.expect('operator', '(');
    const args = this.parseArguments();
    this.expect('operator', ')');
    
    const argsStr = args.map(arg => arg.expression).join(', ');
    
    return {
      type: 'value',
      expression: `${nameToken.value}(${argsStr})`,
      variables: {},
    };
  }

  private parseArguments(): DSLExpression[] {
    const args: DSLExpression[] = [];
    
    if (this.match('operator', ')')) {
      return args;
    }
    
    do {
      args.push(this.parseExpression());
      
      if (!this.match('operator', ',')) {
        break;
      }
    } while (true);
    
    return args;
  }

  private validateAST(ast: DSLAST, errors: ParseError[], warnings: ParseWarning[]): void {
    // Validate imports
    ast.imports.forEach(imp => {
      if (!imp.module) {
        errors.push({
          type: 'semantic',
          message: 'Import statement missing module',
          line: imp.line,
          column: imp.column,
          position: 0,
        });
      }
    });
    
    // Validate layers
    const layerIds = new Set<string>();
    ast.layers.forEach(layer => {
      if (layerIds.has(layer.id)) {
        errors.push({
          type: 'semantic',
          message: `Duplicate layer ID: ${layer.id}`,
          line: layer.line,
          column: layer.column,
          position: 0,
        });
      }
      layerIds.add(layer.id);
      
      // Validate required properties
      const requiredProps = ['type', 'name'];
      const propNames = layer.properties.map(p => p.name);
      
      requiredProps.forEach(prop => {
        if (!propNames.includes(prop)) {
          errors.push({
            type: 'semantic',
            message: `Missing required property: ${prop}`,
            line: layer.line,
            column: layer.column,
            position: 0,
          });
        }
      });
    });
    
    // Validate variables
    const varNames = new Set<string>();
    ast.variables.forEach(variable => {
      if (varNames.has(variable.name)) {
        warnings.push({
          type: 'unused',
          message: `Duplicate variable declaration: ${variable.name}`,
          line: variable.line,
          column: variable.column,
          position: 0,
        });
      }
      varNames.add(variable.name);
    });
    
    // Validate functions
    const funcNames = new Set<string>();
    ast.functions.forEach(func => {
      if (funcNames.has(func.name)) {
        warnings.push({
          type: 'unused',
          message: `Duplicate function declaration: ${func.name}`,
          line: func.line,
          column: func.column,
          position: 0,
        });
      }
      funcNames.add(func.name);
    });
  }

  private match(type: string, value?: string): boolean {
    return this.current !== null && 
           this.current.type === type && 
           (value === undefined || this.current.value === value);
  }

  private expect(type: string, value?: string): Token {
    if (!this.current) {
      throw new Error(`Unexpected end of input, expected ${type}${value ? ` ${value}` : ''}`);
    }
    
    if (this.current.type !== type || (value && this.current.value !== value)) {
      throw new Error(`Expected ${type}${value ? ` ${value}` : ''}, got ${this.current.type}${this.current.value ? ` ${this.current.value}` : ''}`);
    }
    
    const token = this.current;
    this.advance();
    return token;
  }

  private peek(): Token | null {
    return this.tokens[this.position + 1] || null;
  }

  private isEOF(): boolean {
    return this.position >= this.tokens.length;
  }
}

// Interpreter
export class DSLInterpreter {
  private context: MapLayerDSLContext;
  private functions: Record<string, Function>;
  private variables: Record<string, any>;

  constructor(context: MapLayerDSLContext) {
    this.context = context;
    this.functions = { ...BUILTIN_DSL_FUNCTIONS };
    this.variables = { ...context.variables };
  }

  interpret(ast: DSLAST): MapLayerConfig[] {
    // Process imports
    ast.imports.forEach(imp => {
      this.processImport(imp);
    });
    
    // Process variables
    ast.variables.forEach(variable => {
      this.variables[variable.name] = this.evaluateExpression(variable.value);
    });
    
    // Process functions
    ast.functions.forEach(func => {
      this.functions[func.name] = this.createFunction(func);
    });
    
    // Process layers
    const layers: MapLayerConfig[] = [];
    ast.layers.forEach(layer => {
      try {
        const config = this.processLayer(layer);
        layers.push(config);
      } catch (error) {
        console.error(`Error processing layer ${layer.id}:`, error);
      }
    });
    
    return layers;
  }

  private processImport(imp: ImportStatement): void {
    // In a real implementation, this would load external modules
    console.log(`Importing module: ${imp.module}${imp.alias ? ` as ${imp.alias}` : ''}`);
  }

  private evaluateExpression(expr: DSLExpression): any {
    if (expr.type === 'value') {
      try {
        // Create a safe evaluation context
        const context = {
          ...this.variables,
          ...this.functions,
        };
        
        // Simple expression evaluation (in production, use a proper expression parser)
        return this.evaluateSimpleExpression(expr.expression, context);
      } catch (error) {
        console.error(`Error evaluating expression: ${expr.expression}`, error);
        return null;
      }
    }
    
    return null;
  }

  private evaluateSimpleExpression(expression: string, context: Record<string, any>): any {
    // This is a simplified expression evaluator
    // In production, use a proper expression parser like mathjs or similar
    
    // Handle literals
    if (expression.startsWith('"') || expression.startsWith("'")) {
      return expression.slice(1, -1);
    }
    
    if (/^\d+$/.test(expression)) {
      return parseInt(expression, 10);
    }
    
    if (/^\d+\.\d+$/.test(expression)) {
      return parseFloat(expression);
    }
    
    // Handle function calls
    const funcMatch = expression.match(/^(\w+)\((.*)\)$/);
    if (funcMatch) {
      const funcName = funcMatch[1];
      const argsStr = funcMatch[2];
      const args = argsStr ? argsStr.split(',').map(arg => this.evaluateSimpleExpression(arg.trim(), context)) : [];
      
      if (context[funcName] && typeof context[funcName] === 'function') {
        return context[funcName](...args);
      }
    }
    
    // Handle variable references
    if (context[expression] !== undefined) {
      return context[expression];
    }
    
    return expression;
  }

  private createFunction(func: FunctionDeclaration): Function {
    const params = func.parameters.map(p => p.name);
    const body = func.body;
    
    return new Function(...params, body);
  }

  private processLayer(layer: LayerDeclaration): MapLayerConfig {
    const config: any = {};
    
    layer.properties.forEach(prop => {
      const value = this.evaluateExpression(prop.value);
      if (value !== null) {
        this.setNestedProperty(config, prop.name, value);
      }
    });
    
    // Validate and create layer config
    const validation = validateMapLayerConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid layer configuration: ${validation.errors.join(', ')}`);
    }
    
    return createMapLayerConfig(config);
  }

  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }
}

// Main DSL processor
export class MapLayerDSLProcessor {
  private static instance: MapLayerDSLProcessor;
  private cache: Map<string, ParseResult> = new Map();

  static getInstance(): MapLayerDSLProcessor {
    if (!MapLayerDSLProcessor.instance) {
      MapLayerDSLProcessor.instance = new MapLayerDSLProcessor();
    }
    return MapLayerDSLProcessor.instance;
  }

  parse(dsl: string, useCache: boolean = true): ParseResult {
    const cacheKey = this.generateCacheKey(dsl);
    
    if (useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    try {
      const lexer = new DSLLexer(dsl);
      const tokens = lexer.tokenize();
      
      const parser = new DSLParser(tokens);
      const result = parser.parse();
      
      if (useCache) {
        this.cache.set(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        errors: [{
          type: 'syntax',
          message: error instanceof Error ? error.message : 'Unknown parsing error',
          line: 0,
          column: 0,
          position: 0,
        }],
        warnings: [],
        context: {
          layers: [],
          variables: {},
          imports: [],
          version: '1.0.0',
          metadata: {
            name: 'Untitled',
            created: Date.now(),
            updated: Date.now(),
          },
        },
      };
    }
  }

  interpret(ast: DSLAST, context: MapLayerDSLContext): MapLayerConfig[] {
    const interpreter = new DSLInterpreter(context);
    return interpreter.interpret(ast);
  }

  process(dsl: string, context?: MapLayerDSLContext): { layers: MapLayerConfig[]; errors: ParseError[]; warnings: ParseWarning[] } {
    const parseResult = this.parse(dsl);
    
    if (!parseResult.success || !parseResult.ast) {
      return {
        layers: [],
        errors: parseResult.errors,
        warnings: parseResult.warnings,
      };
    }
    
    const interpreter = new DSLInterpreter(parseResult.context);
    const layers = interpreter.interpret(parseResult.ast);
    
    return {
      layers,
      errors: parseResult.errors,
      warnings: parseResult.warnings,
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  private generateCacheKey(dsl: string): string {
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < dsl.length; i++) {
      const char = dsl.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }
}
