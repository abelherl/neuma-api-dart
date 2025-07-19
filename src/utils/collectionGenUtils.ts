import * as vscode from 'vscode';
import { getExtensionConfig, buildFilePath, modelOptionsToSet } from './configUtils';
import { JsonCollectionInput } from "../configs/types"
import { generateDartModel } from './dartGenUtils';

export async function generateCollectionModels(): Promise<void> {
    // Get collection name first
    const collectionName = await vscode.window.showInputBox({
        placeHolder: 'Enter collection name (e.g. UserManagement, AuthSystem)',
        prompt: 'This will be used as the base folder name for all models in this collection.\nExample: "UserManagement" creates lib/data/models/user_management/ folder.'
    });

    if (!collectionName) return;

    // Get JSON collection input
    const jsonCollectionInput = await vscode.window.showInputBox({
        placeHolder: 'Paste your JSON collection here',
        prompt: 'Format: {"ModelName": {"type": "Request|Response", "data": {...}}, ...}\n\nExample:\n{\n  "Login": {"type": "Request", "data": {"email": "", "password": ""}},\n  "User": {"type": "Response", "data": {"id": 1, "name": "", "email": ""}}\n}',
        validateInput: text => {
            try {
                const parsed = JSON.parse(text);
                if (typeof parsed !== 'object' || Array.isArray(parsed)) {
                    return 'Must be a JSON object with model definitions';
                }

                // Validate structure
                for (const [key, value] of Object.entries(parsed)) {
                    if (!value || typeof value !== 'object') {
                        return `Invalid structure for "${key}": must be an object`;
                    }
                    const item = value as any;
                    if (!item.type || !['Request', 'Response'].includes(item.type)) {
                        return `Invalid type for "${key}": must be "Request" or "Response"`;
                    }
                    if (!item.data || typeof item.data !== 'object') {
                        return `Invalid data for "${key}": must be a valid JSON object`;
                    }
                }
                return null;
            } catch (e) {
                return 'Invalid JSON format';
            }
        }
    });

    if (!jsonCollectionInput) return;

    try {
        const collection = parseJsonCollection(jsonCollectionInput, collectionName);
        await generateAllModelsFromCollection(collection);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to parse collection: ${error}`);
    }
}

function parseJsonCollection(input: string, collectionName: string): JsonCollectionInput {
    const parsed = JSON.parse(input);
    const jsonObjects = [];

    for (const [modelName, config] of Object.entries(parsed)) {
        const item = config as any;
        jsonObjects.push({
            name: modelName,
            type: item.type,
            json: item.data
        });
    }

    return {
        collectionName,
        jsonObjects
    };
}

async function generateAllModelsFromCollection(collection: JsonCollectionInput): Promise<void> {
    const config = getExtensionConfig();
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

    if (!workspaceFolder) {
        vscode.window.showWarningMessage('No workspace folder found. Cannot create collection.');
        return;
    }

    const results: string[] = [];
    const errors: string[] = [];

    // Show progress
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Generating ${collection.jsonObjects.length} models for ${collection.collectionName}`,
        cancellable: false
    }, async (progress) => {
        const increment = 100 / collection.jsonObjects.length;

        for (let i = 0; i < collection.jsonObjects.length; i++) {
            const model = collection.jsonObjects[i];
            progress.report({
                increment,
                message: `Creating ${model.name}${model.type}...`
            });

            try {
                const finalClassName = `${model.name}${model.type}`;
                const relativePath = buildFilePath(config, model.name, model.type);

                // For collections, we might want to group them under the collection name
                const collectionPath = relativePath.replace(
                    config.baseFolder,
                    `${config.baseFolder}/${collection.collectionName.toLowerCase()}`
                );

                const featuresSet = modelOptionsToSet(config.modelOptions);
                const dartCode = generateDartModel(model.json, finalClassName, featuresSet);

                // Create directories
                const dirPath = vscode.Uri.joinPath(workspaceFolder.uri, collectionPath.substring(0, collectionPath.lastIndexOf('/')));
                await vscode.workspace.fs.createDirectory(dirPath);

                // Write file
                const fullPath = vscode.Uri.joinPath(workspaceFolder.uri, collectionPath);
                const encoder = new TextEncoder();
                await vscode.workspace.fs.writeFile(fullPath, encoder.encode(dartCode));

                results.push(collectionPath);

            } catch (error) {
                errors.push(`${model.name}${model.type}: ${error}`);
            }
        }
    });

    // Show results
    if (results.length > 0) {
        const message = `Successfully generated ${results.length} models in ${collection.collectionName}`;
        vscode.window.showInformationMessage(message);

        // Optionally show all created files
        const showFiles = await vscode.window.showInformationMessage(
            message,
            'Show Files'
        );

        if (showFiles) {
            const fileList = results.join('\n• ');
            vscode.window.showInformationMessage(`Created files:\n• ${fileList}`);
        }
    }

    if (errors.length > 0) {
        vscode.window.showErrorMessage(`Failed to generate ${errors.length} models. Check output for details.`);
        console.error('Generation errors:', errors);
    }
}