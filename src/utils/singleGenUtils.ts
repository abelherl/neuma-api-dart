import * as vscode from 'vscode';
import { getExtensionConfig, buildFilePath } from './configUtils';
import { generateDartModel } from './dartGenUtils';

export async function generateSingleModel(): Promise<void> {
    const jsonInput = await vscode.window.showInputBox({
        placeHolder: 'Paste your JSON object here',
        prompt: 'This should be a valid JSON object (e.g. {"name": "John"})',
        validateInput: text => {
            try {
                JSON.parse(text);
                return null;
            } catch (e) {
                return 'Invalid JSON';
            }
        }
    });

    if (!jsonInput) return;

    const modelType = await vscode.window.showQuickPick(['Request', 'Response'], {
        placeHolder: 'Select model type (Request = toJson, Response = fromJson)'
    });

    if (!modelType) return;

    const classNameBase = await vscode.window.showInputBox({
        placeHolder: 'Enter base class name (e.g. UserProfile, LoginAuth, ProductDetails)',
        prompt: 'This will create the model class and organize it in a folder structure. For example:\n• "UserProfile" creates models/user_profile/user_profile_request.dart\n• "LoginAuth" creates models/login_auth/login_auth_response.dart\nUse PascalCase - it will be converted to snake_case for folders and files.'
    });

    if (!classNameBase) return;

    const finalClassName = `${classNameBase}${modelType}`;

    // Get the full extension configuration
    const config = getExtensionConfig();

    // Build the file path using the configuration
    const relativePath = buildFilePath(config, classNameBase, modelType);

    const json = JSON.parse(jsonInput);

    // Generate the Dart model using full configuration
    const dartCode = generateDartModel(json, finalClassName, config.modelOptions);

    // Get the workspace folder
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

    if (!workspaceFolder) {
        // No workspace - fallback to untitled document
        vscode.window.showWarningMessage('No workspace folder found. Opening as untitled document.');
        const doc = await vscode.workspace.openTextDocument({
            content: dartCode,
            language: 'dart'
        });
        await vscode.window.showTextDocument(doc);
        return;
    }

    try {
        // Create the full file path
        const fullPath = vscode.Uri.joinPath(workspaceFolder.uri, relativePath);

        // Create directories if they don't exist
        const dirPath = config.generateSubfolders
            ? vscode.Uri.joinPath(workspaceFolder.uri, config.baseFolder, classNameBase.replace(/([A-Z])/g, (match, letter, index) => {
                return index === 0 ? letter.toLowerCase() : '_' + letter.toLowerCase();
            }))
            : vscode.Uri.joinPath(workspaceFolder.uri, config.baseFolder);

        await vscode.workspace.fs.createDirectory(dirPath);

        // Write the file
        const encoder = new TextEncoder();
        await vscode.workspace.fs.writeFile(fullPath, encoder.encode(dartCode));

        // Open the created file
        const doc = await vscode.workspace.openTextDocument(fullPath);
        await vscode.window.showTextDocument(doc);

        // Create informative success message
        const features = getActiveFeatures(config.modelOptions);
        const methodInfo = modelType === 'Request' ? 'with toJson() method' : 'with fromJson() method';
        const featureInfo = features.length > 0 ? ` (${features.join(', ')})` : '';

        vscode.window.showInformationMessage(`${modelType} model created at: ${relativePath} ${methodInfo}${featureInfo}`);

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create file: ${error}`);

        // Fallback: open in untitled document
        const doc = await vscode.workspace.openTextDocument({
            content: dartCode,
            language: 'dart'
        });
        vscode.window.showTextDocument(doc);
    }
}

function getActiveFeatures(options: any): string[] {
    const features: string[] = [];

    if (options.useFreezed) features.push('Freezed');
    if (options.generateJsonAnnotation) features.push('JsonAnnotation');
    if (options.generateCopyWith) features.push('copyWith');
    if (options.generateEquatable) features.push('Equatable');
    if (options.generateToString) features.push('toString');
    if (options.nullSafety === 'nullable') features.push('nullable');
    if (options.nullSafety === 'non-nullable') features.push('non-nullable');
    if (options.fieldCase !== 'camelCase') features.push(`${options.fieldCase} fields`);

    return features;
}