import type ts from "typescript/lib/tsserverlibrary";

function init(modules: {
  typescript: typeof import("typescript/lib/tsserverlibrary");
}) {
  console.log("plox1");
  const ts = modules.typescript;

  function create(info: ts.server.PluginCreateInfo): ts.LanguageService {
    const oldLanguageService = info.languageService;
    const languageService = createLanguageServiceProxy(oldLanguageService);

    languageService.getDefinitionAndBoundSpan = (fileName, position) => {
      const normalResult = oldLanguageService.getDefinitionAndBoundSpan(
        fileName,
        position,
      );

      const program = languageService.getProgram();
      if (!program) {
        return normalResult;
      }
      const sourceFile = program.getSourceFile(fileName);
      if (!sourceFile) {
        return normalResult;
      }

      const node = findTokenAt(sourceFile, position, ts);
      const identifier = getCallIdentifier(node, ts);
      if (!identifier) {
        return normalResult;
      }

      const name = identifier.text;
      // match: useLazyFooBarQuery | useFooBarQuery | useFooBarMutation
      const m = /^(useLazy|use)(.+?)(Query|Mutation)$/.exec(name);
      if (!m) {
        return normalResult;
      }

      const tmpBase = m[2] as string | undefined;
      if (!tmpBase) {
        return normalResult;
      }
      const base = tmpBase.charAt(0).toLowerCase() + tmpBase.slice(1);
      if (!base) {
        return normalResult;
      }

      // Use the first TS definition target file as the search file
      const defFile = normalResult?.definitions?.[0]?.fileName;
      if (!defFile) {
        return normalResult;
      }

      const text = program.getSourceFile(defFile)?.getFullText();
      if (text === undefined) {
        return normalResult;
      }
      const newDefinitionIndex = firstWholeWordIndex(text, base);
      if (newDefinitionIndex < 0) {
        return normalResult;
      }

      const def: ts.DefinitionInfo = {
        fileName: defFile,
        textSpan: { start: newDefinitionIndex, length: base.length },
        kind: ts.ScriptElementKind.functionElement,
        name: base,
        containerKind: ts.ScriptElementKind.unknown,
        containerName: "",
      };

      return {
        textSpan: normalResult?.textSpan ?? {
          start: identifier.getStart(),
          length: identifier.getWidth(),
        },
        definitions: [def],
      };
    };

    return languageService;
  }

  return {
    create,
    onConfigurationChanged() {},
    getExternalFiles() {
      return [];
    },
  };
}

function createLanguageServiceProxy(oldLanguageService: ts.LanguageService) {
  const proxy: ts.LanguageService = Object.create(null);
  for (const k of Object.keys(
    oldLanguageService,
  ) as (keyof ts.LanguageService)[]) {
    const orig = oldLanguageService[k];
    proxy[k] = (...args: any[]) =>
      (orig as any).apply(oldLanguageService, args);
  }
  return proxy;
}

function firstWholeWordIndex(haystack: string, word: string): number {
  // word boundary for TS identifiers (letters/digits/_/$), not using \b (bad with _/$)
  const esc = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rx = new RegExp(`(^|[^$_0-9A-Za-z])(${esc})(?![$_0-9A-Za-z])`, "m");
  const m = rx.exec(haystack);
  if (!m) {
    return -1;
  }
  return m.index + (m[1] ? m[1].length : 0);
}

function findTokenAt(
  sf: ts.SourceFile,
  pos: number,
  ts: typeof import("typescript/lib/tsserverlibrary"),
): ts.Node | undefined {
  let out: ts.Node | undefined;
  function walk(n: ts.Node) {
    if (pos >= n.getStart() && pos < n.getEnd()) {
      out = n;
      n.forEachChild(walk);
    }
  }
  walk(sf);
  return out;
}

// If cursor is on foo in foo(...), return that Identifier node
function getCallIdentifier(
  node: ts.Node | undefined,
  ts: typeof import("typescript/lib/tsserverlibrary"),
): ts.Identifier | undefined {
  if (!node) {
    return;
  }
  // On identifier itself
  if (
    ts.isIdentifier(node) &&
    ts.isCallExpression(node.parent) &&
    node.parent.expression === node
  ) {
    return node;
  }
  // On call expression somewhere inside
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
    return node.expression;
  }
  // Maybe on property access: obj.foo()
  if (
    ts.isPropertyAccessExpression(node) &&
    ts.isIdentifier(node.name) &&
    ts.isCallExpression(node.parent)
  ) {
    return node.name;
  }
  if (node.parent) {
    return getCallIdentifier(node.parent, ts);
  }
  return;
}

export = init;
