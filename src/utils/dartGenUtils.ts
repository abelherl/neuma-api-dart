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

function generateDartModel(json: any, className: string, generated: Set<string> = new Set()): string {
    if (generated.has(className)) return '';
    generated.add(className);

    const fields: string[] = [];
    const constructorParams: string[] = [];
    const fromJsonLines: string[] = [];
    const toJsonLines: string[] = [];
    const nestedClasses: string[] = [];

    const isRequest = className.toLowerCase().includes('request');
    const isResponse = className.toLowerCase().includes('response');

    // Extract the base name by removing "Request"/"Response"
    const baseName = className.replace(/(Request|Response)$/i, '');

    for (const [key, value] of Object.entries(json)) {
        let type = 'dynamic';
        const varName = toCamelCase(key);
        let parseCode = `json['${key}']`;
        let toJsonCode = `'${key}': ${varName}`;

        if (typeof value === 'string') {
            type = 'String';
        } else if (typeof value === 'number') {
            type = 'num';
        } else if (typeof value === 'boolean') {
            type = 'bool';
        } else if (value === null) {
            type = 'dynamic';
        } else if (Array.isArray(value)) {
            if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                // Fixed: Put the suffix after the property name
                const nestedClass = `${baseName}${pascalCase(key)}${isResponse ? 'Response' : isRequest ? 'Request' : ''}`;
                type = `List<${nestedClass}>`;
                parseCode = `(json['${key}'] as List).map((e) => ${nestedClass}.fromJson(e)).toList()`;
                toJsonCode = `'${key}': ${varName}.map((e) => e.toJson()).toList()`;
                nestedClasses.push(generateDartModel(value[0], nestedClass, generated));
            } else {
                const elementType = typeof value[0];
                type = `List<${elementType === 'string' ? 'String' : elementType === 'number' ? 'num' : 'dynamic'}>`;
                toJsonCode = `'${key}': ${varName}`;
            }
        } else if (typeof value === 'object') {
            // Fixed: Put the suffix after the property name, not the base name
            const nestedClass = `${baseName}${pascalCase(key)}${isResponse ? 'Response' : isRequest ? 'Request' : ''}`;
            type = nestedClass;
            parseCode = `${nestedClass}.fromJson(json['${key}'])`;
            toJsonCode = `'${key}': ${varName}.toJson()`;
            nestedClasses.push(generateDartModel(value, nestedClass, generated));
        }

        fields.push(`  final ${type} ${varName};`);
        constructorParams.push(`    required this.${varName},`);
        fromJsonLines.push(`      ${varName}: ${parseCode},`);
        toJsonLines.push(`      ${toJsonCode},`);
    }

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

    const mainClass = `
class ${className} {
${fields.join('\n')}

  const ${className}({
${constructorParams.join('\n')}
  });${methods}
}
`.trim();

    return [mainClass, ...nestedClasses].join('\n\n');
}

export { generateDartModel, capitalize, pascalCase };