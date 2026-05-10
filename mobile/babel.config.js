const path = require("path");

const UNISTYLES_CONFIG = path.resolve(__dirname, "src/theme/unistyles.ts");

// Auto-injects `import "<UNISTYLES_CONFIG>";` at the top of every file that
// imports from `react-native-unistyles`. Required for Expo Router's static
// web export (SSR): the SSR entry is `@expo/router-server/node/render.js`,
// not our `index.js`, so the explicit configure import in `index.js` never
// runs. Without this, modules like Avatar.tsx that call
// `StyleSheet.create((theme) => ...)` at top level evaluate before any
// layout's side-effect import and throw "did you forget to call configure?".
function injectUnistylesConfig({ types: t }) {
  return {
    name: "inject-unistyles-config",
    visitor: {
      Program: {
        enter(programPath, state) {
          const filename = state.file.opts.filename;
          if (!filename || filename === UNISTYLES_CONFIG) return;

          const usesUnistyles = programPath.node.body.some(
            (node) =>
              t.isImportDeclaration(node) &&
              node.source.value === "react-native-unistyles",
          );
          if (!usesUnistyles) return;

          const relative = path
            .relative(path.dirname(filename), UNISTYLES_CONFIG)
            .replace(/\.tsx?$/, "");
          const importPath = relative.startsWith(".")
            ? relative
            : `./${relative}`;
          programPath.unshiftContainer(
            "body",
            t.importDeclaration([], t.stringLiteral(importPath)),
          );
        },
      },
    },
  };
}

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      injectUnistylesConfig,
      ["inline-import", { extensions: [".sql"] }],
      ["react-native-unistyles/plugin", { root: __dirname }],
    ],
  };
};
