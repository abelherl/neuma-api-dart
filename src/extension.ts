import * as vscode from 'vscode';
import { registerGenerateModelCommand } from './commands/generateModel';
// import { registerGenerateCollectionCommand } from './commands/generateCollection';

export function activate(context: vscode.ExtensionContext) {
	console.log('Neuma API Flutter extension is now active!');

	const generateModelDisposable = registerGenerateModelCommand(context);
	// const generateCollectionDisposable = registerGenerateCollectionCommand(context);

	context.subscriptions.push(generateModelDisposable);
	// context.subscriptions.push(generateCollectionDisposable);
}

export function deactivate() { }