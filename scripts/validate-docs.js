const fs = require('fs');
const child_process = require('child_process');

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

  try {
    child_process.execSync(
      `./node_modules/.bin/openapi-generator-cli validate \
        -i ${docsDirectory}/${file}
      `,
      execCallback,
    );
  } catch (ex) {
    console.log(ex);
  }
}