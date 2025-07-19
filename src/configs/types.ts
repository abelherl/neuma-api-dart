// Configuration types for the extension

export interface ModelGenerationOptions {
    nullSafety: 'nullable' | 'non-nullable' | 'auto';
    generateJsonAnnotation: boolean;
    generateCopyWith: boolean;
    generateEquatable: boolean;
    generateToString: boolean;
    useFreezed: boolean;
    fieldCase: 'camelCase' | 'snake_case' | 'preserve';
    addPartStatement: boolean;
}

export interface GenerationConfig {
    baseFolder: string;
    generateSubfolders: boolean;
    modelOptions: ModelGenerationOptions;
}

export enum GenerationMode {
    SINGLE = 'single',
    COLLECTION = 'collection'
}

export interface JsonCollectionInput {
    collectionName: string;
    jsonObjects: Array<{
        name: string;
        type: 'Request' | 'Response';
        json: any;
    }>;
}