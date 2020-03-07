const inquirer = require('inquirer');
const convertFactory = require('electron-html-to');
const fs = require('fs');
const electron = require('electron');
const axios = require('axios');
const html = require('./generateHTML');

let conversion = convertFactory({
    waitForJS: true,
    converterPath: convertFactory.converters.PDF
});

const questions = [
  {
      name: 'username',
      message: 'What is your Github username?',
      type: 'input'
  },
  {
      name: 'color',
      message: 'What color would you like for your resume to be?',
      type: 'list',
      choices: ['blue', 'red', 'green', 'pink']
  }
];

function init() {
    inquirer.prompt(questions)
    .then(function(input) {
        getGit(input);
    });
}

// getting api information from based on user inputting screen name
function getGit(input) {
    let gitURL = `https://api.github.com/users/${input.username}`;
    let gitURLStarred = `https://api.github.com/users/${input.username}/starred`;
    axios.get(gitURL)
    .then((response) => {
        axios.get(gitURLStarred)
        .then((starredRes) => {
            let starred = starredRes.data;
            let gitData = response.data;
            let userColor = input.color;
            let htmlGen = html.generateHTML(userColor, gitData, starred);
            writeToFile(htmlGen, gitData.login);

        })
        .catch((error) => {
            console.log(error);
        })
    })
    .catch((error) => {
        // in case the login name they enter does not exist
        inquirer.prompt({
            type: 'list',
            message: 'User information not found. Do you want to try again?',
            choices: ['Yes', 'No'],
            name: 'retry'
        }).then((redo) => {
            if (redo.retry === 'No') {
                process.exit();
            }
            init();
        });
    })

}

// function needed for making pdf
function writeToFile(htmlGen, name) {
    conversion({ html: htmlGen }, function (err, result) {
        if (err) {
            throw err;
        }
        result.stream.pipe(fs.createWriteStream(`./PDFs/${name}.pdf`));
        console.log('i think it worked')
        conversion.kill();
    });
}

init();

