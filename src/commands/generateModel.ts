import * as vscode from 'vscode';
import { generateSingleModel } from '../utils/singleGenUtils';

export function registerGenerateModelCommand(context: vscode.ExtensionContext) {
    return vscode.commands.registerCommand('neuma-api-dart.generateModel', generateSingleModel);
}