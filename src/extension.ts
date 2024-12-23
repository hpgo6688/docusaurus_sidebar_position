import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('extension.updateSidebarPosition', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage('No active editor');
			return;
		}

		const filePath = editor.document.fileName;
		const directoryPath = path.dirname(filePath);

		fs.readdir(directoryPath, (err, files) => {
			if (err) {
				vscode.window.showErrorMessage('Unable to scan directory');
				return;
			}

			const mdFiles = files.filter(file => path.extname(file) === '.md' || path.extname(file) === '.mdx');
			const newPosition = mdFiles.length;

			fs.readFile(filePath, 'utf8', (err, data) => {
				if (err) {
					vscode.window.showErrorMessage('Error reading file');
					return;
				}

				const updatedData = data.replace(/sidebar_position: \d+/g, `sidebar_position: ${newPosition}`);
				fs.writeFile(filePath, updatedData, 'utf8', (err) => {
					if (err) {
						vscode.window.showErrorMessage('Error writing file');
						return;
					}
					vscode.window.showInformationMessage('Sidebar position updated!');
				});
			});
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
