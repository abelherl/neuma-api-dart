import * as vscode from 'vscode';
import { registerGenerateModelCommand } from './commands/generateModel';

export function activate(context: vscode.ExtensionContext) {
	const disposable = registerGenerateModelCommand(context)
	context.subscriptions.push(disposable);
}