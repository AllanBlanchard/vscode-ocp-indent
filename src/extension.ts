import * as vscode from 'vscode';
import { existsSync } from 'fs';
import { cpuUsage } from 'process';

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
	if (path === ""){
		return 'ocp-indent --inplace';
	} else {
		return path + ' --inplace';
	}
}

function executeOcpIndent(document: vscode.TextDocument, option: string) {
	if (existsSync(document.uri.fsPath)) {
		const { path } = document.uri;
		document.save().then((value) => {
			const cp = require('child_process');
			cp.exec(ocpCommand() + ' ' + path + ' ' + option,
				(err: string, _: string, stderr: string) => {
					if (stderr) { vscode.window.showErrorMessage(stderr); }
					if (err) { vscode.window.showErrorMessage(err); }
				});
		});
	} else {
		vscode.window.showWarningMessage
			('OCP-Indent can only deal with saved files, save the file and try again.');
	}
}

function makeOptionRange({ start, end }: vscode.Range) {
	let result = "";
	if (start.line !== end.line || start.character !== end.character) {
		result = ' -l ' + start.line + '-' + end.line;
	}
	return result;
}

function doIndentZone(document: vscode.TextDocument, range: any) {
	let optionLines = '';
	if (range) {
		optionLines = makeOptionRange(range);
	}
	else if (globalFormatSelection()) {
		let editor = vscode.window.activeTextEditor;
		if (editor) {
			optionLines = makeOptionRange(editor.selection);
		}
	}
	executeOcpIndent(document, optionLines);
}

function isOcaml(languageId: string) {
	return languageId === 'ocaml' || languageId === 'ocaml.interface';
}

function indentRange(document: vscode.TextDocument, range: any) {
	if (isOcaml(document.languageId)) {
		doIndentZone(document, range);
	}
}

export function activate(context: vscode.ExtensionContext) {
	let providerFull = {
		provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
			indentRange(document, undefined);
			return [];
		}
	};

	vscode.languages.registerDocumentFormattingEditProvider('ocaml', providerFull);
	vscode.languages.registerDocumentFormattingEditProvider('ocaml.interface', providerFull);

	let providerPartial = {
		provideDocumentRangeFormattingEdits(document: vscode.TextDocument, range: vscode.Range) {
			indentRange(document, range);
			return [];
		}
	};

	vscode.languages.registerDocumentRangeFormattingEditProvider('ocaml', providerPartial);
	vscode.languages.registerDocumentRangeFormattingEditProvider('ocaml.interface', providerPartial);
}
