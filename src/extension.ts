import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	console.log('Extension "updateSidebarPosition" is now active!');
	let disposable = vscode.commands.registerCommand('extension.updateSidebarPosition', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage('No active editor');
			return;
		}

		const filePath = editor.document.fileName;
		const directoryPath = path.dirname(filePath);

		fs.readdir(directoryPath, { withFileTypes: true }, (err, entries) => {
			if (err) {
				vscode.window.showErrorMessage('Unable to scan directory');
				return;
			}

			const mdEntries = entries.filter(entry =>
				(entry.isFile() && (path.extname(entry.name) === '.md' || path.extname(entry.name) === '.mdx')) ||
				entry.isDirectory()
			);
			const newPosition = mdEntries.length;

			fs.readFile(filePath, 'utf8', (err, data) => {
				if (err) {
					vscode.window.showErrorMessage('Error reading file');
					return;
				}

				let updatedData: string;
				const sidebarPositionRegex = /sidebar_position: \d+/;
				const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---/m;

				if (sidebarPositionRegex.test(data)) {
					updatedData = data.replace(sidebarPositionRegex, `sidebar_position: ${newPosition}`);
				} else if (frontMatterRegex.test(data)) {
					updatedData = data.replace(frontMatterRegex, `---\n$1\nsidebar_position: ${newPosition}\n---`);
				} else {
					updatedData = `---\nsidebar_position: ${newPosition}\ntitle: \n---\n${data}`;
				}

				fs.writeFile(filePath, updatedData, 'utf8', (err) => {
					if (err) {
						vscode.window.showErrorMessage('Error writing file');
						return;
					}
					vscode.workspace.openTextDocument(filePath).then(doc => {
						vscode.window.showTextDocument(doc).then(editor => {
							// Find or add 'title: ' and move cursor
							let titleIndex = updatedData.indexOf('title: ');
							if (titleIndex === -1) {
								titleIndex = updatedData.indexOf('sidebar_position:') + `sidebar_position: ${newPosition}\n`.length;
								updatedData = updatedData.replace('---\n', `---\ntitle: \n`);
							}

							const position = doc.positionAt(titleIndex + 'title: '.length);
							editor.selection = new vscode.Selection(position, position);

							vscode.window.showInformationMessage('Sidebar position updated!');
						});
					});
				});


			});
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
