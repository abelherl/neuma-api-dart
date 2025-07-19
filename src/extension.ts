import * as vscode from 'vscode';
import { registerGenerateModelCommand } from './commands/generateModel';

export function activate(context: vscode.ExtensionContext) {
	console.log('Neuma API Dart extension is now active!');

	const generateModelDisposable = registerGenerateModelCommand(context);
	// const generateCollectionDisposable = registerGenerateModelCommand(context);

	context.subscriptions.push(generateModelDisposable);
	// context.subscriptions.push(generateCollectionDisposable);
}

export function deactivate() { }