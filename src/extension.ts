import { off } from 'process';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	function globalFormatSelection() : boolean {
		const config = vscode.workspace.getConfiguration().get('ocpIndent.globalFormatTakesSelection');
		if(config){ return true; }
		else { return false; }
	}

	function isOcaml(languageId: string) {
		return languageId === 'ocaml' || languageId === 'ocaml.interface';
	}

	function executeCommand(document: vscode.TextDocument, command: string) {
		document.save().then((value) => {
			const cp = require('child_process');
			cp.exec(command,
				(err: string, _: string, stderr: string) => {
					if (stderr) { vscode.window.showErrorMessage(stderr); }
					if (err) { vscode.window.showErrorMessage(err); }
				});
		});
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
		else if (globalFormatSelection()){
			let editor = vscode.window.activeTextEditor ;
			if(editor){
				optionLines = makeOptionRange(editor.selection);
			}
		}
		executeCommand(document, 'ocp-indent --inplace ' + document.uri.path + optionLines);
	}

	function indentRange(document: vscode.TextDocument, range: any) {
		if (isOcaml(document.languageId)) {
			doIndentZone(document, range);
		}
	}

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
