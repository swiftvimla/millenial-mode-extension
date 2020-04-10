// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as vm from 'vm';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "millennial-mode-extension" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	context.subscriptions.push(vscode.commands.registerCommand('millennial-mode-extension.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('OMG WHERE IS MY CODE. OH. FOUND IT.');
	}));

	// let anotherDisposable = vscode.window.activeTextEditor?.setDecorations
	// node_modules/@types/vscode/index.d.ts
	// export const onDidChangeActiveTextEditor: Event<TextEditor | undefined>;
	const outputChannel = vscode.window.createOutputChannel('Millennial Mode');

	const webpanel = () => {
		const panel = vscode.window.createWebviewPanel('', 'Millennial Mode Content', vscode.ViewColumn.Beside, {});
		panel.webview.html = `<!DOCTYPE html>
		<html lang="en">
		<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Cat Coding</title>
		<script>
		console.log('Hello World From the Webview')
		</script>
		</head>
		<body>
		<img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
		</body>
		</html>`;
	};

	context.subscriptions.push(vscode.commands.registerCommand('millennial-mode-extension.millennialMode', async () => {
		// vscode.workspace.onDidChangeTextDocument
		vscode.window.showInformationMessage('OH NO ');
		// vscode.window.showTextDocument(, {})
		const doc = await vscode.workspace.openTextDocument(vscode.Uri.parse(`untitled:millennial.js`, true));
		// const document = await vscode.workspace.openTextDocument({ language: 'js', content: '// Write your millennial code here' });
		// vscode.window.showInformationMessage(document.fileName);
		const editor = await vscode.window.showTextDocument(doc);
		
		outputChannel.show();

		// const process = new vscode.ProcessExecution(`node`, );

		// Syntax check without running
		// node --check

		const preface = `
			function __stack() {
				var orig = Error.prepareStackTrace;
				Error.prepareStackTrace = function(_, stack){ return stack; };
				var err = new Error;
				Error.captureStackTrace(err, arguments.callee);
				var stack = err.stack;
				Error.prepareStackTrace = orig;
				return stack;
			}
				
			Object.defineProperty(global, '___line', {
				get: function(){
					return global['__stack'][1].getLineNumber();
				}
			});
		`;

		const defineStack = new vm.Script(preface);

		let context: any = {};

		const printedExpressions: { [line:number]: any } = {};

		vscode.workspace.onDidChangeTextDocument(event => {
			if (event.document === doc) {
				context = {
					x: 5,
					global: {},
					log: (msg:string) => {
						// vscode.window.showInformationMessage(msg);
						const metadata: any = vm.runInContext('__stack()[4].getLineNumber()', context);
						printedExpressions[metadata] = msg;

						// outputChannel.append(metadata);
						// outputChannel.appendLine(msg);
						// outputChannel.appendLine(`[${__stack()}] ${msg}`);
						// vscode.window.showInformationMessage(`[${__stack()}] ${msg}`);
					}
				};
				try {
					context = vm.createContext(context);
					defineStack.runInContext(context, {});
					const result = vm.runInContext(doc.getText(), context, { filename: 'millennial' });

					// Show in-line results
					if (editor) {
						Object.entries(printedExpressions).forEach(([line, expression]) => {
							const decorationType = vscode.window.createTextEditorDecorationType({
								backgroundColor: 'rgba(1,1,1,0)',
								after: { 'contentText': String(expression), borderColor: 'white', margin: '30px' }
							});
							editor.setDecorations(decorationType, [editor.document.lineAt(parseInt(line) - 1).range]);
						});

					}

					vscode.window.showInformationMessage(result);
				} catch(error) {
					console.log(error);
				}
			}
		});
		// onDidChangeTextEditorSelection
		
	}));

	// context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((meditor) => {}))
}

// this method is called when your extension is deactivated
export function deactivate() {}
