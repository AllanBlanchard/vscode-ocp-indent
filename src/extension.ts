import * as vscode from 'vscode';

function globalFormatSelection(): boolean {
	const config = vscode.workspace.getConfiguration().get('ocpIndent.globalFormatTakesSelection');
	if (config) { return true; }
	else { return false; }
}
function ocpIndentPath(): string {
	const config = vscode.workspace.getConfiguration().get('ocpIndent.path');
	if (config) { return String(config); }
	else { return ""; }
}

function ocpCommand() {
	const path = ocpIndentPath();
	if (path === "") {
		return 'ocp-indent';
	} else {
		return path;
	}
}

function executeOcpIndent(document: vscode.TextDocument, args: string[]): string | undefined {
	const cmd = ocpCommand();
	const text = document.getText();
	const options = {
		input: text,
		encoding: 'utf8',
	};
	const cp = require('child_process');
	const { stdout, stderr, error } = cp.spawnSync(cmd, args, options);
	if (stderr) { vscode.window.showErrorMessage(stderr); }
	if (error) { vscode.window.showErrorMessage(error); }
	const output = error || stderr ? undefined : stdout;
	return output;
}

function makeOptionRange({ start, end }: vscode.Range): string[] {
	return ['-l', (start.line + 1) + '-' + (end.line + 1)];
}

function doIndentZone(document: vscode.TextDocument, range: any): string | undefined {
	let optionLines: string[] = [];
	if (range) {
		optionLines = makeOptionRange(range);
	}
	else if (globalFormatSelection()) {
		let editor = vscode.window.activeTextEditor;
		if (editor && editor.selection.start.isBefore(editor.selection.end)) {
			optionLines = makeOptionRange(editor.selection);
		}
	}
	return executeOcpIndent(document, optionLines);
}

function isOcaml(languageId: string) {
	return languageId === 'ocaml' || languageId === 'ocaml.interface';
}

function indentRange(document: vscode.TextDocument, range?: vscode.Range):
	vscode.ProviderResult<vscode.TextEdit[]> {
	if (isOcaml(document.languageId)) {
		const output = doIndentZone(document, range);
		if (output) {
			var firstLine = document.lineAt(0);
			var lastLine = document.lineAt(document.lineCount - 1);
			var fullRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
			return [vscode.TextEdit.replace(fullRange, output)];
		}
	}
	return [];
}

export function activate(context: vscode.ExtensionContext) {
	let providerFull = {
		provideDocumentFormattingEdits(document: vscode.TextDocument) {
			return indentRange(document, undefined);
		}
	};

	vscode.languages.registerDocumentFormattingEditProvider('ocaml', providerFull);
	vscode.languages.registerDocumentFormattingEditProvider('ocaml.interface', providerFull);

	let providerPartial = {
		provideDocumentRangeFormattingEdits(document: vscode.TextDocument, range: vscode.Range) {
			return indentRange(document, range);
		}
	};

	vscode.languages.registerDocumentRangeFormattingEditProvider('ocaml', providerPartial);
	vscode.languages.registerDocumentRangeFormattingEditProvider('ocaml.interface', providerPartial);
}
