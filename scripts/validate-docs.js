const fs = require('fs');
const child_process = require('child_process');
const { exit } = require('process');

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

const docsDirectory = './docs';
const docsFileNames = fs.readdirSync(docsDirectory);

for (const file of docsFileNames) {

  const docsFile = `${docsDirectory}/${file}`

  console.log(`${docsFile}: Validating documentation file...`)
  try {
    child_process.execSync(
      `./node_modules/.bin/openapi-generator-cli validate \
        -i ${docsFile}
      `,
      execCallback,
    );
  } catch (ex) {
    console.log(ex);
    exit(1);
  }

  console.log(`${docsFile}: Documentation valid!\n\n`)
}