import { ModelGenerationOptions } from '../configs/types';

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function pascalCase(str: string): string {
    return str
        .replace(/(_|-|\s)+(.)?/g, (_, __, chr) => (chr ? chr.toUpperCase() : ''))
        .replace(/^(.)/, (_, chr) => chr.toUpperCase());
}

function toCamelCase(input: string): string {
    return input
        // Handle snake_case and kebab-case
        .replace(/[_-]+(.)?/g, (_, chr) => chr ? chr.toUpperCase() : '')
        // Handle consecutive uppercase letters (like "URL" -> "Url")
        .replace(/([A-Z])([A-Z]+)/g, (_, first, rest) => first + rest.toLowerCase())
        // Ensure first letter is lowercase
        .replace(/^[A-Z]/, match => match.toLowerCase());
}

function toSnakeCase(input: string): string {
    return input
        .replace(/([a-z\d])([A-Z])/g, '$1_$2')
        .toLowerCase();
}

function preserveCase(input: string): string {
    return input;
}

function applyFieldCase(input: string, fieldCase: 'camelCase' | 'snake_case' | 'preserve'): string {
    switch (fieldCase) {
        case 'camelCase': return toCamelCase(input);
        case 'snake_case': return toSnakeCase(input);
        case 'preserve': return preserveCase(input);
        default: return toCamelCase(input);
    }
}

function determineNullability(value: any, nullSafety: 'nullable' | 'non-nullable' | 'auto'): boolean {
    if (nullSafety === 'nullable') return true;
    if (nullSafety === 'non-nullable') return false;
    // auto mode: nullable if value is null or undefined
    return value === null || value === undefined;
}

function makeTypeNullable(type: string, isNullable: boolean): string {
    return isNullable ? `${type}?` : type;
}

function generateImports(options: ModelGenerationOptions): string[] {
    const imports: string[] = [];

    if (options.generateJsonAnnotation) {
        imports.push("import 'package:json_annotation/json_annotation.dart';");
    }

    if (options.generateEquatable) {
        imports.push("import 'package:equatable/equatable.dart';");
    }

    if (options.useFreezed) {
        imports.push("import 'package:freezed_annotation/freezed_annotation.dart';");
    }

    return imports;
}

function generatePartStatements(className: string, options: ModelGenerationOptions): string[] {
    const parts: string[] = [];
    const snakeCaseClassName = toSnakeCase(className);

    if (options.addPartStatement) {
        if (options.useFreezed) {
            parts.push(`part '${snakeCaseClassName}.freezed.dart';`);
            if (options.generateJsonAnnotation) {
                parts.push(`part '${snakeCaseClassName}.g.dart';`);
            }
        } else if (options.generateJsonAnnotation) {
            parts.push(`part '${snakeCaseClassName}.g.dart';`);
        }
    }

    return parts;
}

function generateFreezedModel(json: any, className: string, options: ModelGenerationOptions, generated: Set<string> = new Set()): string {
    if (generated.has(className)) return '';
    generated.add(className);

    const fields: string[] = [];
    const nestedClasses: string[] = [];
    const isRequest = className.toLowerCase().includes('request');
    const isResponse = className.toLowerCase().includes('response');
    const baseName = className.replace(/(Request|Response)$/i, '');

    for (const [key, value] of Object.entries(json)) {
        let type = 'dynamic';
        const varName = applyFieldCase(key, options.fieldCase);
        const isNullable = determineNullability(value, options.nullSafety);

        if (typeof value === 'string') {
            type = makeTypeNullable('String', isNullable);
        } else if (typeof value === 'number') {
            type = makeTypeNullable('num', isNullable);
        } else if (typeof value === 'boolean') {
            type = makeTypeNullable('bool', isNullable);
        } else if (value === null) {
            type = 'dynamic?';
        } else if (Array.isArray(value)) {
            if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                const nestedClass = `${baseName}${pascalCase(key)}${isResponse ? 'Response' : isRequest ? 'Request' : ''}`;
                type = makeTypeNullable(`List<${nestedClass}>`, isNullable);
                nestedClasses.push(generateFreezedModel(value[0], nestedClass, options, generated));
            } else {
                const elementType = typeof value[0];
                const listType = `List<${elementType === 'string' ? 'String' : elementType === 'number' ? 'num' : 'dynamic'}>`;
                type = makeTypeNullable(listType, isNullable);
            }
        } else if (typeof value === 'object') {
            const nestedClass = `${baseName}${pascalCase(key)}${isResponse ? 'Response' : isRequest ? 'Request' : ''}`;
            type = makeTypeNullable(nestedClass, isNullable);
            nestedClasses.push(generateFreezedModel(value, nestedClass, options, generated));
        }

        let fieldDeclaration = `${type} ${varName}`;

        if (options.generateJsonAnnotation && varName !== key) {
            fieldDeclaration = `@JsonKey(name: '${key}') ${fieldDeclaration}`;
        }

        fields.push(`    required ${fieldDeclaration},`);
    }

    const imports = generateImports(options);
    const parts = generatePartStatements(className, options);

    let classDeclaration = '';
    if (imports.length > 0) {
        classDeclaration += imports.join('\n') + '\n\n';
    }
    if (parts.length > 0) {
        classDeclaration += parts.join('\n') + '\n\n';
    }

    const mixins = options.generateJsonAnnotation ? ' with _$' + className : '';

    classDeclaration += `@freezed
class ${className}${mixins} {
  const factory ${className}({
${fields.join('\n')}
  }) = _${className};

`;

    if (options.generateJsonAnnotation) {
        classDeclaration += `  factory ${className}.fromJson(Map<String, dynamic> json) => _$${className}FromJson(json);`;
    }

    classDeclaration += '\n}';

    return [classDeclaration, ...nestedClasses].join('\n\n');
}

function generateRegularModel(json: any, className: string, options: ModelGenerationOptions, generated: Set<string> = new Set()): string {
    if (generated.has(className)) return '';
    generated.add(className);

    const fields: string[] = [];
    const constructorParams: string[] = [];
    const fromJsonLines: string[] = [];
    const toJsonLines: string[] = [];
    const nestedClasses: string[] = [];
    const copyWithParams: string[] = [];
    const copyWithAssignments: string[] = [];

    const isRequest = className.toLowerCase().includes('request');
    const isResponse = className.toLowerCase().includes('response');
    const baseName = className.replace(/(Request|Response)$/i, '');

    for (const [key, value] of Object.entries(json)) {
        let type = 'dynamic';
        const varName = applyFieldCase(key, options.fieldCase);
        const isNullable = determineNullability(value, options.nullSafety);
        let parseCode = `json['${key}']`;
        let toJsonCode = `'${key}': ${varName}`;

        if (typeof value === 'string') {
            type = makeTypeNullable('String', isNullable);
        } else if (typeof value === 'number') {
            type = makeTypeNullable('num', isNullable);
        } else if (typeof value === 'boolean') {
            type = makeTypeNullable('bool', isNullable);
        } else if (value === null) {
            type = 'dynamic?';
        } else if (Array.isArray(value)) {
            if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                const nestedClass = `${baseName}${pascalCase(key)}${isResponse ? 'Response' : isRequest ? 'Request' : ''}`;
                type = makeTypeNullable(`List<${nestedClass}>`, isNullable);
                parseCode = isNullable
                    ? `json['${key}'] != null ? (json['${key}'] as List).map((e) => ${nestedClass}.fromJson(e)).toList() : null`
                    : `(json['${key}'] as List).map((e) => ${nestedClass}.fromJson(e)).toList()`;
                toJsonCode = isNullable
                    ? `'${key}': ${varName}?.map((e) => e.toJson()).toList()`
                    : `'${key}': ${varName}.map((e) => e.toJson()).toList()`;
                nestedClasses.push(generateRegularModel(value[0], nestedClass, options, generated));
            } else {
                const elementType = typeof value[0];
                const listType = `List<${elementType === 'string' ? 'String' : elementType === 'number' ? 'num' : 'dynamic'}>`;
                type = makeTypeNullable(listType, isNullable);
                if (isNullable) {
                    parseCode = `json['${key}'] != null ? List<${elementType === 'string' ? 'String' : elementType === 'number' ? 'num' : 'dynamic'}>.from(json['${key}']) : null`;
                } else {
                    parseCode = `List<${elementType === 'string' ? 'String' : elementType === 'number' ? 'num' : 'dynamic'}>.from(json['${key}'])`;
                }
                toJsonCode = `'${key}': ${varName}`;
            }
        } else if (typeof value === 'object') {
            const nestedClass = `${baseName}${pascalCase(key)}${isResponse ? 'Response' : isRequest ? 'Request' : ''}`;
            type = makeTypeNullable(nestedClass, isNullable);
            parseCode = isNullable
                ? `json['${key}'] != null ? ${nestedClass}.fromJson(json['${key}']) : null`
                : `${nestedClass}.fromJson(json['${key}'])`;
            toJsonCode = isNullable
                ? `'${key}': ${varName}?.toJson()`
                : `'${key}': ${varName}.toJson()`;
            nestedClasses.push(generateRegularModel(value, nestedClass, options, generated));
        }

        let fieldDeclaration = `final ${type} ${varName};`;

        if (options.generateJsonAnnotation && varName !== key) {
            fieldDeclaration = `@JsonKey(name: '${key}')\n  ${fieldDeclaration}`;
        }

        fields.push(`  ${fieldDeclaration}`);
        constructorParams.push(`    required this.${varName},`);
        fromJsonLines.push(`      ${varName}: ${parseCode},`);
        toJsonLines.push(`      ${toJsonCode},`);

        if (options.generateCopyWith) {
            copyWithParams.push(`    ${type} ${varName},`);
            copyWithAssignments.push(`      ${varName}: ${varName} ?? this.${varName},`);
        }
    }

    const imports = generateImports(options);
    const parts = generatePartStatements(className, options);

    let classContent = '';
    if (imports.length > 0) {
        classContent += imports.join('\n') + '\n\n';
    }
    if (parts.length > 0) {
        classContent += parts.join('\n') + '\n\n';
    }

    const extendsClause = options.generateEquatable ? ' extends Equatable' : '';
    const jsonAnnotation = options.generateJsonAnnotation ? '@JsonSerializable()\n' : '';

    classContent += `${jsonAnnotation}class ${className}${extendsClause} {
${fields.join('\n')}

  const ${className}({
${constructorParams.join('\n')}
  });`;

    // Generate methods based on model type and configuration
    let methods = '';

    if (isResponse || (!isRequest && !isResponse)) {
        methods += `

  factory ${className}.fromJson(Map<String, dynamic> json) {
    return ${className}(
${fromJsonLines.join('\n')}
    );
  }`;
    }

    if (isRequest || (!isRequest && !isResponse)) {
        methods += `

  Map<String, dynamic> toJson() {
    return {
${toJsonLines.join('\n')}
    };
  }`;
    }

    if (options.generateCopyWith) {
        methods += `

  ${className} copyWith({
${copyWithParams.join('\n')}
  }) {
    return ${className}(
${copyWithAssignments.join('\n')}
    );
  }`;
    }

    if (options.generateToString) {
        const fieldNames = fields.map(field => {
            const match = field.match(/final .+ (\w+);/);
            return match ? match[1] : '';
        }).filter(name => name);

        methods += `

  @override
  String toString() {
    return '${className}(${fieldNames.map(name => `${name}: $${name}`).join(', ')})';
  }`;
    }

    if (options.generateEquatable) {
        const fieldNames = fields.map(field => {
            const match = field.match(/final .+ (\w+);/);
            return match ? match[1] : '';
        }).filter(name => name);

        methods += `

  @override
  List<Object?> get props => [${fieldNames.join(', ')}];`;
    }

    classContent += methods + '\n}';

    return [classContent, ...nestedClasses].join('\n\n');
}

function generateDartModel(json: any, className: string, options: ModelGenerationOptions, generated: Set<string> = new Set()): string {
    if (options.useFreezed) {
        return generateFreezedModel(json, className, options, generated);
    } else {
        return generateRegularModel(json, className, options, generated);
    }
}

export { generateDartModel, capitalize, pascalCase };