import * as vscode from 'vscode';
import { generateDartModel } from '../utils/dartGenUtils';

export function registerGenerateModelCommand(context: vscode.ExtensionContext) {
    return vscode.commands.registerCommand('neuma-api-dart.generateModel', async () => {
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
            placeHolder: 'Select model type'
        });

        if (!modelType) return;

        const classNameBase = await vscode.window.showInputBox({
            placeHolder: 'Enter base class name (e.g. UserProfile, LoginAuth, ProductDetails)',
            prompt: 'This will create the model class and organize it in a folder structure. For example:\n• "UserProfile" creates models/user_profile/user_profile_request.dart\n• "LoginAuth" creates models/login_auth/login_auth_response.dart\nUse PascalCase - it will be converted to snake_case for folders and files.'
        });

        if (!classNameBase) return;

        const finalClassName = `${classNameBase}${modelType}`;

        // Get extension configuration
        const config = vscode.workspace.getConfiguration('neuma-api-dart');
        const baseFolder = config.get<string>('defaultBaseFolder', 'lib/models');
        const generateSubfolders = config.get<boolean>('generateSubfolders', true);

        // Convert PascalCase to snake_case for folder and file names (Dart convention)
        const folderName = classNameBase.replace(/([A-Z])/g, (match, letter, index) => {
            return index === 0 ? letter.toLowerCase() : '_' + letter.toLowerCase();
        });

        const fileName = `${folderName}_${modelType.toLowerCase()}.dart`;

        // Build path based on subfolder setting
        const relativePath = generateSubfolders
            ? `${baseFolder}/${folderName}/${fileName}`
            : `${baseFolder}/${fileName}`;

        const json = JSON.parse(jsonInput);

        // Create model generation options from config
        const modelOptions = {
            nullSafety: config.get<string>('nullSafety', 'auto'),
            generateJsonAnnotation: config.get<boolean>('generateJsonAnnotation', true),
            generateFromJson: config.get<boolean>('generateFromJson', true),
            generateToJson: config.get<boolean>('generateToJson', true),
            generateCopyWith: config.get<boolean>('generateCopyWith', false),
            generateEquatable: config.get<boolean>('generateEquatable', false),
            generateToString: config.get<boolean>('generateToString', false),
            useFreezed: config.get<boolean>('useFreezed', false),
            fieldCase: config.get<string>('fieldCase', 'camelCase'),
            addPartStatement: config.get<boolean>('addPartStatement', true)
        };

        const dartCode = generateDartModel(json, finalClassName, new Set(Object.keys(modelOptions)));

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
            const dirPath = generateSubfolders
                ? vscode.Uri.joinPath(workspaceFolder.uri, `${baseFolder}/${folderName}`)
                : vscode.Uri.joinPath(workspaceFolder.uri, baseFolder);
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
    });
}