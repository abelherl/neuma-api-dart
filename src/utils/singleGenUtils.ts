import * as vscode from 'vscode';
import { getExtensionConfig, buildFilePath, convertToSnakeCase } from './configUtils';
import { generateDartModel } from './dartGenUtils';

export async function generateSingleModel(): Promise<void> {
    // Get JSON input
    const jsonInput = await vscode.window.showInputBox({
        placeHolder: 'Paste your JSON object here',
        prompt: 'This should be a valid JSON object (e.g. {"name": "John", "age": 25})',
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

    // Get model type
    const modelType = await vscode.window.showQuickPick(['Request', 'Response'], {
        placeHolder: 'Select model type'
    });

    if (!modelType) return;

    // Get class name
    const classNameBase = await vscode.window.showInputBox({
        placeHolder: 'Enter base class name (e.g. UserProfile, LoginAuth, ProductDetails)',
        prompt: 'This will create the model class and organize it in a folder structure.\n• "UserProfile" → lib/data/models/user_profile/user_profile_request.dart\n• "LoginAuth" → lib/data/models/login_auth/login_auth_response.dart\nUse PascalCase - it will be converted to snake_case for folders and files.'
    });

    if (!classNameBase) return;

    const config = getExtensionConfig();
    const finalClassName = `${classNameBase}${modelType}`;
    const relativePath = buildFilePath(config, classNameBase, modelType);
    const json = JSON.parse(jsonInput);

    await createModelFile(json, finalClassName, relativePath, config);
}

async function createModelFile(json: any, className: string, relativePath: string, config: any): Promise<void> {
    const dartCode = generateDartModel(json, className, config.modelOptions);

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
        const dirPath = vscode.Uri.joinPath(workspaceFolder.uri, relativePath.substring(0, relativePath.lastIndexOf('/')));
        await vscode.workspace.fs.createDirectory(dirPath);

        // Write the file
        const encoder = new TextEncoder();
        await vscode.workspace.fs.writeFile(fullPath, encoder.encode(dartCode));

        // Open the created file
        const doc = await vscode.workspace.openTextDocument(fullPath);
        await vscode.window.showTextDocument(doc);

        vscode.window.showInformationMessage(`Model created at: ${relativePath}`);

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