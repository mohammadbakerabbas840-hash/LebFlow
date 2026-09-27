const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } });
    module._compile(result.outputText, filename);
  };
}
const { serviceContent, conditionalDocuments, requestStages } = require('../src/data/serviceGuides.ts');
const output = path.join(__dirname, '../LebFlow/database/data/services.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify({ services: serviceContent, conditionalDocuments, stages: requestStages, offices: require('../src/data/offices.ts').offices }, null, 2));
console.log(`Exported ${Object.keys(serviceContent).length} service guides.`);
