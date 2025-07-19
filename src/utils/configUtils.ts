import * as vscode from 'vscode';
import { GenerationConfig, ModelGenerationOptions } from '../configs/types';

export function getExtensionConfig(): GenerationConfig {
    const config = vscode.workspace.getConfiguration('neuma-api-dart');

    const modelOptions: ModelGenerationOptions = {
        nullSafety: config.get<'nullable' | 'non-nullable' | 'auto'>('nullSafety', 'auto'),
        generateJsonAnnotation: config.get<boolean>('generateJsonAnnotation', true),
        generateCopyWith: config.get<boolean>('generateCopyWith', false),
        generateEquatable: config.get<boolean>('generateEquatable', false),
        generateToString: config.get<boolean>('generateToString', false),
        useFreezed: config.get<boolean>('useFreezed', false),
        fieldCase: config.get<'camelCase' | 'snake_case' | 'preserve'>('fieldCase', 'camelCase'),
        addPartStatement: config.get<boolean>('addPartStatement', true)
    };

    return {
        baseFolder: config.get<string>('defaultBaseFolder', 'lib/data/models'),
        generateSubfolders: config.get<boolean>('generateSubfolders', true),
        modelOptions
    };
}

export function convertToSnakeCase(name: string): string {
    return name.replace(/([A-Z])/g, (match, letter, index) => {
        return index === 0 ? letter.toLowerCase() : '_' + letter.toLowerCase();
    });
}

export function buildFilePath(config: GenerationConfig, classNameBase: string, modelType: string): string {
    const folderName = convertToSnakeCase(classNameBase);
    const fileName = `${folderName}_${modelType.toLowerCase()}.dart`;

    return config.generateSubfolders
        ? `${config.baseFolder}/${folderName}/${fileName}`
        : `${config.baseFolder}/${fileName}`;
}

export function modelOptionsToSet(options: ModelGenerationOptions): Set<string> {
    const features = new Set<string>();

    Object.entries(options).forEach(([key, value]) => {
        if (typeof value === 'boolean' && value) {
            features.add(key);
        } else if (typeof value === 'string') {
            features.add(`${key}:${value}`);
        }
    });

    return features;
}