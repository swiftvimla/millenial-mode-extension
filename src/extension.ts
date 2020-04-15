// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as vm from 'vm';
import * as path from 'path';
import * as process from 'process';
import { setFlagsFromString } from 'v8';

// Scratch Pad
// const process = new vscode.ProcessExecution(`node`, );
// Syntax check without running
// node --check

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

namespace millennial {
  export class ExecutionSession {
    public context: vm.Context;
    public activeDecorations: vscode.TextEditorDecorationType[];
    public peekedValues: { [line: number]: any[] };
    public peekedValuesColour = `rgba(60,80,242,255)`;

    constructor() {
      this.activeDecorations = [];
      this.peekedValues = [];
      
      const context: any = {};
      
      context.global = {};
      context.require = (dependency: string) => require(dependency);
      context.peek = (msg:string) => {
        // The stack index (4) was found by trial and error. Not exactly sure what the first three frames are.
        const line: any = vm.runInContext('__stack()[4].getLineNumber()', this.context);
        this.peekedValues[line] = (line in this.peekedValues) ? this.peekedValues[line] : [];
        this.peekedValues[line].push(msg);
      };

      context.setPeekedValuesColour = (colour: string) => { this.peekedValuesColour = colour; };

      this.context = vm.createContext(context);
    }

    // Just a string for now. Would be interesting to have interactive structures at some point.
    public renderPeekedValues(values: any): string {
      const list = values.map((e:any) => e.toString()).join(', ');
      return `<- ${list}`;
    }

    dispose() {
      this.activeDecorations.forEach(decoration => decoration.dispose()); // Clear previous results
    }
    
  }
      
  // Code for finding the source line of a function invokation.
  // By running it in the same context as the client script, we effectively inject
  // these definitions into it without having to pollute it by - say - prepending this code snippet directly,
  // which would affect the line numbers in a confusing way.
  export const injectedDefinitionsSource: string = `
    function __stack() {
      let orig = Error.prepareStackTrace;
      Error.prepareStackTrace = function(_, stack){ return stack; };
      let err = new Error;
      Error.captureStackTrace(err, arguments.callee);
      let stack = err.stack;
      Error.prepareStackTrace = orig;
      return stack;
    }
    
    Object.defineProperty(global, '___line', {
      get: () => global['__stack'][1].getLineNumber()
    });
  `;

  export const injectedDefinitionsCompiledScript: vm.Script = new vm.Script(millennial.injectedDefinitionsSource);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "millennial-mode-extension" is now active!');
  
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  
  const outputChannel = vscode.window.createOutputChannel('Millennial Mode');

  let previousSession: millennial.ExecutionSession | null = null;

  context.subscriptions.push(vscode.commands.registerCommand('millennial-mode-extension.millennialMode', async () => {
    const root = vscode.workspace?.workspaceFolders?.[0].uri.fsPath;
    const nameOfVirtualFile = path.join(root || '.', 'millennial.js');
    const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(`untitled:${nameOfVirtualFile}`, true));
    const editor = await vscode.window.showTextDocument(document);
    outputChannel.show();
      
    vscode.window.onDidChangeTextEditorSelection(event => {
      if (event.textEditor === editor) {
        // TextEditorSelectionChangeKind
      }
    });
    
    vscode.workspace.onDidChangeTextDocument(event => {
      if (event.document !== document) { return; }
      
      if (previousSession !== null) {
        previousSession.dispose();
      }
      
      const session = new millennial.ExecutionSession();

      try {
        process.chdir(root || '.');
        millennial.injectedDefinitionsCompiledScript.runInContext(session.context, {});
        const result = vm.runInContext(document.getText(), session.context, { filename: nameOfVirtualFile });

        // Show in-line results
        Object.entries(session.peekedValues).forEach(([line, expressions]) => {
          const decorationType = vscode.window.createTextEditorDecorationType({
            after: {
              // TODO: Display type information
              color: session.peekedValuesColour,
              fontWeight: 'bold',
              contentText: session.renderPeekedValues(expressions),
              borderColor: 'white',
              margin: '12px'
            }
          });
          session.activeDecorations.push(decorationType);
          editor.setDecorations(decorationType, [editor.document.lineAt(parseInt(line) - 1).range]);
        });
        vscode.window.showInformationMessage(result);
        previousSession = session;
      } catch(error) {
        outputChannel.appendLine(error);
        console.error(error);
        session.dispose();
      }
    });
      
  }));
}
  
// this method is called when your extension is deactivated
export function deactivate() {}
