import * as vscode from 'vscode';
import { generateDartModel } from '../utils/jsonToDart';

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
            placeHolder: 'Enter base class name (e.g. Login)',
            prompt: 'The model will be named LoginRequest or LoginResponse'
        });

        if (!classNameBase) return;

        const finalClassName = `${classNameBase}${modelType}`;
        const json = JSON.parse(jsonInput);
        const dartCode = generateDartModel(json, finalClassName);

        const doc = await vscode.workspace.openTextDocument({ content: dartCode, language: 'dart' });
        vscode.window.showTextDocument(doc);
    });
}
