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
    const nestedClasses: string[] = [];

    for (const [key, value] of Object.entries(json)) {
        let type = 'dynamic';
        const varName = toCamelCase(key);
        let parseCode = `json['${key}']`;

        if (typeof value === 'string') type = 'String';
        else if (typeof value === 'number') type = 'num';
        else if (typeof value === 'boolean') type = 'bool';
        else if (value === null) type = 'dynamic';
        else if (Array.isArray(value)) {
            if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                const nestedClass = `${className}${pascalCase(key)}Item`;
                type = `List<${nestedClass}>`;
                parseCode = `(json['${key}'] as List).map((e) => ${nestedClass}.fromJson(e)).toList()`;
                nestedClasses.push(generateDartModel(value[0], nestedClass, generated));
            } else {
                const elementType = typeof value[0];
                type = `List<${elementType === 'string' ? 'String' : elementType === 'number' ? 'num' : 'dynamic'}>`;
            }
        } else if (typeof value === 'object') {
            const nestedClass = `${className}${pascalCase(key)}`;
            type = nestedClass;
            parseCode = `${nestedClass}.fromJson(json['${key}'])`;
            nestedClasses.push(generateDartModel(value, nestedClass, generated));
        }

        fields.push(`  final ${type} ${varName};`);
        constructorParams.push(`    required this.${varName},`);
        fromJsonLines.push(`      ${varName}: ${parseCode},`);
    }

    const mainClass = `
class ${className} {
${fields.join('\n')}

  const ${className}({
${constructorParams.join('\n')}
  });

  factory ${className}.fromJson(Map<String, dynamic> json) {
    return ${className}(
${fromJsonLines.join('\n')}
    );
  }
}
`.trim();

    return [mainClass, ...nestedClasses].join('\n\n');
}

export { generateDartModel, capitalize, pascalCase };