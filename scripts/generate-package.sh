#!/bin/bash

# Set up important file and directory paths
DOCS_DIR="./docs"

BASE_DIR="/tmp/api-models"
OUTPUT_DIR="${BASE_DIR}/types"

function constructServiceName() {
  SERVICE_NAME_INTERMEDIATE1=$(echo $FILE | cut -d'/' -f 3)
  SERVICE_NAME_INTERMEDIATE2=${SERVICE_NAME_INTERMEDIATE1: 0: -5}
  SERVICE_NAME=${SERVICE_NAME_INTERMEDIATE2~}

  echo $SERVICE_NAME

  MODEL_DIR="${BASE_DIR}/${SERVICE_NAME}/model"
  EXCLUDE_MODEL_FILE="${MODEL_DIR}/models.ts"
}

function getServiceVersion() {
  echo 'GetServiceVersion'
  while read -r CURRENT_LINE
    do

      # If current line includes version
      if [[ "$CURRENT_LINE" == *"version:"* ]]; then

        # Strip out version tag by splitting on space and taking index 2
        VERSION=$(echo $CURRENT_LINE | cut -d' ' -f 2)
        break
      fi
  done < "$FILE"
}

function constructTypesFile() {
  if [ $MODEL_FILE != $EXCLUDE_MODEL_FILE ] && [ -f $MODEL_FILE ]
  then
    if [ ! -d $OUTPUT_DIR/${SERVICE_NAME} ]; then
      mkdir $OUTPUT_DIR/${SERVICE_NAME}
    fi
    # Filter through each file, remove all import statements
    grep -v "import" $MODEL_FILE >> $OUTPUT_DIR/${SERVICE_NAME}/index.ts

    echo "Types File - DONE!"
  fi
}

function generateServicePackage() {
    cd $OUTPUT_DIR/${SERVICE_NAME}

    npm init -y
    # echo -e "ryan-mcdonagh-openapi-models-${SERVICE_NAME,,}\n${VERSION}\n${SERVICE_NAME}\n index.js \n  \n \n \n \n \nyes\n" | npm init
    # printf "ryan-mcdonagh-openapi-models-${SERVICE_NAME,,}\n${VERSION}\n${SERVICE_NAME}\n index.js \n  \n \n \n \n \nyes\n" | npm init

    cd -
}

# If output directory does not exist, create it
if [ ! -d $OUTPUT_DIR ]; then
  echo "Output directory does not exist, creating..."
  mkdir $OUTPUT_DIR
  echo "Done!"
fi

# If Output directory does exist, delete all files in it
for FILE in $OUTPUT_DIR/*.ts
  do
    if [ -f $FILE ]
    then
      rm $FILE
    fi
done

# For each documentation file
for FILE in $DOCS_DIR/*.yaml
  do
    echo $FILE
    constructServiceName
    getServiceVersion
    ./node_modules/.bin/openapi-generator-cli generate -i $FILE -g typescript-node -o /tmp/api-models/${SERVICE_NAME}

    for MODEL_FILE in $MODEL_DIR/*.ts
      do
        constructTypesFile
    done

    generateServicePackage
done

# # Change to base directory and setup package
# cd $BASE_DIR
# npm init -y
