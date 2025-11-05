import * as vscode from "vscode";

export function activate(ctx: vscode.ExtensionContext) {
  const selector: vscode.DocumentSelector = [
    { language: "typescript", scheme: "file" },
    { language: "typescriptreact", scheme: "file" },
  ];

  console.log("activate push");
  // ctx.subscriptions.push(
  //   vscode.languages.registerDefinitionProvider(selector, new RtqHookRedirectProvider())
  // )
}
let inFallback = false;

class RtqHookRedirectProvider implements vscode.DefinitionProvider {
  async provideDefinition(
    doc: vscode.TextDocument,
    pos: vscode.Position,
    token: vscode.CancellationToken,
  ): Promise<vscode.Definition | vscode.LocationLink[] | undefined> {
    if (inFallback) {
      return;
    }

    try {
      inFallback = true;

      const ident = getCallIdentifierWord(doc, pos);
      if (!ident) {
        console.log("not relevant ident");
        return;
      }

      const name = ident.text;
      if (!/^use.+(Query|[Mm]utation)$/.test(name)) {
        console.log("not relevant name");
        return;
      }

      console.log("starting");

      // Ask TS for where the hook is defined (usually the API slice file)
      const tsDefs = await vscode.commands.executeCommand<
        | (vscode.Location | vscode.LocationLink)[]
        | vscode.Location
        | vscode.LocationLink
        | undefined
      >("vscode.executeDefinitionProvider", doc.uri, pos);

      const defs = normalizeDefs(tsDefs);
      if (!defs.length) {
        return;
      }

      // Take the first location's file as the target file
      const target = defs[0];
      const targetUri =
        target.targetUri ??
        ("targetUri" in target
          ? target.targetUri
          : (target as vscode.Location).uri);

      // Compute base name: strip "use" prefix and "Query"/"Mutation" suffix (case-insensitive for mutation)
      const baseTmp = name
        .replace(/^use/, "")
        .replace(/(Query|[Mm]utation)$/, "");
      const base = baseTmp.charAt(0).toLowerCase() + baseTmp.slice(1); // first character lower case
      if (!base) {
        console.log("fail 1");
        return;
      }

      // Open the file and find first mention of the base name
      const targetDoc = await vscode.workspace.openTextDocument(targetUri);
      if (token.isCancellationRequested) {
        return;
      }

      const idx = firstWordOccurrence(targetDoc.getText(), base);
      if (idx < 0) {
        console.log("fail 2");
        return;
      }

      const start = targetDoc.positionAt(idx);
      const end = start.translate(0, base.length);

      // Return our redirected location
      const link: vscode.LocationLink = {
        originSelectionRange: ident.range,
        targetUri,
        targetRange: new vscode.Range(start, end),
        targetSelectionRange: new vscode.Range(start, end),
      };
      return [link];
    } finally {
      inFallback = false;
    }
  }
}

/* ---------------- helpers ---------------- */

function getCallIdentifierWord(doc: vscode.TextDocument, pos: vscode.Position) {
  // identifier under cursor
  const range = doc.getWordRangeAtPosition(pos, /[$_A-Za-z][$_0-9A-Za-z]*/);
  if (!range) {
    return;
  }

  // quick look-ahead to ensure it's a call: optional generics then '('
  const after = doc.getText(
    new vscode.Range(range.end, range.end.translate(0, 128)),
  );
  let i = 0;
  while (i < after.length && /\s/.test(after[i])) {
    i++;
  }

  // skip type args <...> (handles nesting)
  if (after[i] === "<") {
    let depth = 0;
    while (i < after.length) {
      const ch = after[i++];
      if (ch === "<") {
        depth++;
      } else if (ch === ">") {
        depth--;
        if (depth === 0) {
          break;
        }
      }
    }
    while (i < after.length && /\s/.test(after[i])) {
      i++;
    }
  }
  if (after[i] !== "(") {
    return;
  }

  return { text: doc.getText(range), range };
}

function normalizeDefs(
  v:
    | (vscode.Location | vscode.LocationLink)[]
    | vscode.Location
    | vscode.LocationLink
    | undefined,
): vscode.LocationLink[] {
  if (!v) {
    return [];
  }
  const arr = Array.isArray(v) ? v : [v];
  // Convert Location to LocationLink for uniform handling
  return arr.map((item) => {
    if ("targetUri" in item) {
      return item as vscode.LocationLink;
    }
    const loc = item as vscode.Location;
    return {
      targetUri: loc.uri,
      targetRange: loc.range,
      targetSelectionRange: loc.range,
    } as vscode.LocationLink;
  });
}

// Find first whole-word occurrence; returns text index or -1
function firstWordOccurrence(text: string, word: string): number {
  console.log(`firstWordOccurrence`, word);
  // \b is not great for underscores, so use explicit boundaries
  const rx = new RegExp(
    `(^|[^$_0-9A-Za-z])(${escapeReg(word)})(?![$_0-9A-Za-z])`,
    "m",
  );
  const m = rx.exec(text);
  if (!m) {
    return -1;
  }
  return m.index + (m[1] ? m[1].length : 0);
}

function escapeReg(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function deactivate() {}
