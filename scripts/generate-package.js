const fs = require('fs');
const child_process = require('child_process');

const docsDirectory = './docs';
const baseDirectory = '/tmp/api-models'
const outputDirectory = `${baseDirectory}/types`;

function createOutputDirectoryIfNotExists(outputDirectory) {
  if (!fs.existsSync(outputDirectory)) {
    console.log('Output directory does not exist. Creating...');
    fs.mkdirSync(outputDirectory, { recursive: true });
    console.log('Output directory created.');
  } else {
    console.log('Exists');
  }
}

function getServicePropertiesFromDocsFile(file) {
  const content = fs.readFileSync(`${docsDirectory}/${file}`, 'utf-8').toString().split('\n');
  let version = '';
  let serviceName = '';

  for (const line of content) {
    // console.log({ line });
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
      -g typescript-node \
      -o /tmp/api-models/${serviceName}`,
    execCallback);
  } catch (ex) {
    console.error(ex);
    throw new Error('Could not run OpenAPI Generator');
  }
}

function generateServiceClassFiles(serviceName) {
  const modelDirectory = `${baseDirectory}/${serviceName}/model`;
  const modelDirectoryFiles = fs.readdirSync(modelDirectory);
  
  const transformedFileArray = [];
  for (const modelFile of modelDirectoryFiles) {
    if (modelFile === 'models.ts') {
      continue;
    }

    const fileContentString = generateFileContentString(`${modelDirectory}/${modelFile}`);  
    transformedFileArray.push(fileContentString);
  }

  const serviceClassFileDirectory = `${outputDirectory}/${serviceName}`;
  const serviceClassFileContent = transformedFileArray.join('\n');

  writeServiceClassFile(serviceClassFileDirectory, serviceClassFileContent);
}

function generateFileContentString(modelFilePath) {
  const content = fs.readFileSync(`${modelFilePath}`, 'utf-8').toString().split('\n');
  return content.filter(line => !line.includes('import')).join('\n');
}

function writeServiceClassFile(serviceClassFileDirectory, serviceClassFileContent) {
  if (!fs.existsSync(serviceClassFileDirectory)) {
    fs.mkdirSync(serviceClassFileDirectory, { recursive: true });
  }
  fs.writeFileSync(`${serviceClassFileDirectory}/index.ts`, serviceClassFileContent);
}



function generatePackages() {
  createOutputDirectoryIfNotExists(outputDirectory);
  const docsFileNames = fs.readdirSync(docsDirectory);
  
  for (const file of docsFileNames) {
    const { version, serviceName } = getServicePropertiesFromDocsFile(file);
  
    runOpenAPIGenerator(file, serviceName);
    generateServiceClassFiles(serviceName);
  }
}

generatePackages();
