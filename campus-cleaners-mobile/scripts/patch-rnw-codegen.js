/**
 * patch-rnw-codegen.js
 * 
 * Postinstall script that patches react-native-web to export a no-op
 * codegenNativeComponent function. This is needed because some React Native
 * libraries import codegenNativeComponent from 'react-native', which Metro
 * aliases to react-native-web on the web platform. react-native-web v0.21
 * does not export this function, causing a runtime TypeError.
 */
const fs = require('fs');
const path = require('path');

const CJS_STUB = `
// Patch: stub codegenNativeComponent for web compatibility
exports.codegenNativeComponent = function codegenNativeComponent(name, options) {
  return function UnimplementedNativeComponent() { return null; };
};`;

const ESM_STUB = `
// Patch: stub codegenNativeComponent for web compatibility
export function codegenNativeComponent(name, options) {
  return function UnimplementedNativeComponent() { return null; };
}`;

const PATCH_MARKER = 'stub codegenNativeComponent';

function patchFile(filePath, stub) {
  if (!fs.existsSync(filePath)) {
    console.log(`  [skip] ${filePath} not found`);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(PATCH_MARKER)) {
    console.log(`  [ok]   ${path.basename(filePath)} already patched`);
    return;
  }
  fs.writeFileSync(filePath, content + '\n' + stub, 'utf8');
  console.log(`  [done] ${path.basename(filePath)} patched`);
}

console.log('Patching react-native-web for codegenNativeComponent...');

const rnwDist = path.join(__dirname, 'node_modules', 'react-native-web', 'dist');
patchFile(path.join(rnwDist, 'index.js'), ESM_STUB);
patchFile(path.join(rnwDist, 'cjs', 'index.js'), CJS_STUB);

console.log('Done.');
