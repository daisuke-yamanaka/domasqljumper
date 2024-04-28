// Importing the 'vscode' module which contains the VS Code Extension API
// The following code imports the module using the alias 'vscode'
import * as vscode from 'vscode';

// This method is called when the extension is activated
// The extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Using the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code is executed only once when the extension is activated
	console.log('Congratulations, your extension "domasqlcreator" is now active!');

	// Commands are defined in the package.json file
	// Now, we provide the implementation for the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('domasqljumper.jumpSqlOrDao', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage('No active editor!');
			return;
		}

		const document = editor.document;
		const fileName = document.fileName;
		const fileExtension = fileName.split('.').pop();

		if (fileExtension !== 'java' && fileExtension !== 'sql' && fileExtension !== 'script') {
			vscode.window.showInformationMessage('File extension must be java, sql, or script.');
			return;
		}

		if (fileExtension === 'java') {
			const fileContent = document.getText();
			if (!fileContent.includes('interface') || !fileContent.includes('@Dao')) {
				vscode.window.showInformationMessage('This file is not a Doma Dao interface.');
				return;
			}

			const position = editor.selection.active;
			const lineText = document.lineAt(position.line).text;
			const methodNameMatch = lineText.match(/(\w+)\s*\(/);
			if (!methodNameMatch) {
				vscode.window.showInformationMessage('Could not extract method name from line.');
				return;
			}
			const methodName = methodNameMatch[1];

			const packageNameMatch = fileContent.match(/package\s+([\w\.]+);/);
			if (!packageNameMatch) {
				vscode.window.showInformationMessage('Could not extract package name from file.');
				return;
			}
			const packageName = packageNameMatch[1].replace(/\./g, '/');
			const fileTitle = fileName.replace(/^.*[\\\/]/, '').replace(/\.\w+$/, '');

			const previousLineText = document.lineAt(position.line - 1).text;
			const isScript = previousLineText.includes('@Script');

			const fileExtension = isScript ? 'script' : 'sql';
			const sqlFilePath = `src/main/java/META-INF/${packageName}/${fileTitle}/${methodName}.${fileExtension}`;
			let sqlFileUri = vscode.Uri.file(vscode.workspace.rootPath + '/' + sqlFilePath);

			try {
				// Open SQL file
				const sqlDocument = await vscode.workspace.openTextDocument(sqlFileUri);
				await vscode.window.showTextDocument(sqlDocument);
			} catch (error) {
				// If unable to open SQL file, show confirmation dialog, and if OK, create and open a new file
				const answer = await vscode.window.showInformationMessage('Would you like to create a new SQL file?', 'OK', 'Cancel');
				if (answer === 'OK') {
					await vscode.workspace.fs.writeFile(sqlFileUri, new Uint8Array());
					const sqlDocument = await vscode.workspace.openTextDocument(sqlFileUri);
					await vscode.window.showTextDocument(sqlDocument);
				}
			}
		} else if (fileExtension === 'sql' || fileExtension === 'script') {
			const fileTitle = fileName.replace(/^.*[\\\/]/, '').replace(/\.\w+$/, '');
			const parentDirName = fileName.replace(/[^\\\/]*$/, '').replace(/\\/g, '/').replace('META-INF/', '').replace(/\/$/, '');
			const javaFilePath = `${parentDirName}.java`;

			try {
				const javaFileUri = vscode.Uri.file(javaFilePath);
				const javaDocument = await vscode.workspace.openTextDocument(javaFileUri);
				await vscode.window.showTextDocument(javaDocument);
				const regex = new RegExp(`\\b${fileTitle}\\b\\s*\\(`, 'g');
				const text = javaDocument.getText();
				const match = regex.exec(text);
				if (match) {
					const position = javaDocument.positionAt(match.index);
					editor.selection = new vscode.Selection(position, position);
				}
			} catch (error) {
				vscode.window.showInformationMessage('Corresponding Java file not found.' + error);
			}
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when the extension is deactivated
export function deactivate() {}
