const fs = require('fs');
const child_process = require('child_process');
const npmPublish = require("@jsdevtools/npm-publish");

const docsDirectory = './docs';
const baseDirectory = '/tmp/api-models'
const outputDirectory = `${baseDirectory}/types`;

function createOutputDirectoryIfNotExists(outputDirectory) {
  if (!fs.existsSync(outputDirectory)) {
    console.log('Output directory does not exist. Creating...');
    fs.mkdirSync(outputDirectory, { recursive: true });
    console.log('Output directory created.');
  } else {
    console.log('Output directory exists');
  }
}

function getServicePropertiesFromDocsFile(file) {
  const content = fs.readFileSync(`${docsDirectory}/${file}`, 'utf-8').toString().split('\n');
  let version = '';
  let serviceName = '';

  for (const line of content) {
    if (line.includes('version')) {
      version = line.replace(' ', '').split(':')[1].replace(' ', '');
    }

    if (line.includes('title')) {
      serviceName = line.replace(' ', '').split(':')[1].replace(' ', '');
    }

    if (version && serviceName) {
      break;
    }
  }
  return ({ version, serviceName });
}

function execCallback(error, stderr, stdout) {
  if (error) {
    throw new Error(error);
  }
  if (stderr) {
    console.log(stderr);
    return;
  }
  console.log(stdout);
}

function runOpenAPIGenerator(file, serviceName) {
  try {
    child_process.execSync(
    `./node_modules/.bin/openapi-generator-cli generate \
      -i ${docsDirectory}/${file} \
      -g typescript-axios \
      -o /tmp/api-models/${serviceName}`,
    execCallback);
  } catch (ex) {
    console.error(ex);
    throw new Error('Could not run OpenAPI Generator');
  }
}

function generateServiceInterfaceFile(serviceName) {
  const modelFile = `${baseDirectory}/${serviceName}/api.ts`;
  
  const fileContentString = generateFileContentString(modelFile);

  const serviceClassFileDirectory = `${outputDirectory}/${serviceName}`;

  writeServiceClassFile(serviceClassFileDirectory, fileContentString);
}

function generateFileContentString(modelFilePath) {
  const content = fs.readFileSync(`${modelFilePath}`, 'utf-8').toString().split('\n');

  let copyLine = false;
  let contentString = '';

  for (const line of content) {
    if (line.includes('export interface')) {
      copyLine = true;
    }
    if (copyLine) {
      contentString += `${line}\n`;
    }
    if (line === '}') {
      copyLine = false;
      contentString += `\n`;
    }
  }

  return contentString;
}


function writeServiceClassFile(serviceClassFileDirectory, serviceClassFileContent) {
  if (!fs.existsSync(serviceClassFileDirectory)) {
    fs.mkdirSync(serviceClassFileDirectory, { recursive: true });
  }
  fs.writeFileSync(`${serviceClassFileDirectory}/index.ts`, serviceClassFileContent);
}

function generatePackageJSONFile(values) {
  if (!values.name) {
    throw new Error('Could not generate package.json - missing name value');
  }
  if (!values.version) {
    throw new Error('Could not generate package.json - missing version value');
  }
  if (!values.filePath) {
    throw new Error('Could not generate package.json - missing filePath value');
  }

  const contentString = generatePackageJSONFileString(values);
  fs.writeFileSync(`${values.filePath}/package.json`, contentString);
}

function generatePackageJSONFileString(values) {
  return `{
    "name": "ryan-mcdonagh-data-models-v2-${values.name.toLowerCase()}",
    "version": "${values.version}"
}`;
}

function publishPackage(packageFilePath) {
  npmPublish({
    package: `${packageFilePath}/package.json`,
    token: process.env.NPM_TOKEN
  }).catch(ex => console.log(ex));
}


function generatePackages() {
  createOutputDirectoryIfNotExists(outputDirectory);
  const docsFileNames = fs.readdirSync(docsDirectory);

  for (const file of docsFileNames) {
    const { version, serviceName } = getServicePropertiesFromDocsFile(file);
  
    runOpenAPIGenerator(file, serviceName);
    generateServiceInterfaceFile(serviceName);
    generatePackageJSONFile({
      name: serviceName,
      version,
      filePath: `${outputDirectory}/${serviceName}`,
    });
    publishPackage(`${outputDirectory}/${serviceName}`);
  }
}

generatePackages();
