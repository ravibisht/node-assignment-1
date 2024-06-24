const express = require('express');
const app = express();
const fs = require('node:fs/promises');
const path = require("node:path");

const filesPath = path.resolve(__dirname, './files');

const files = {
    A: 'fileA.txt',
    B: 'fileB.txt',
    C: 'fileC.txt',
    D: 'fileD.txt',
};

function getFilePath(fileName) {
    return filesPath + path.sep + fileName;
}

const fileStatus = {
    A: false,
    B: false,
    C: false,
    D: false
};


async function bootStrapApplication(){

    app.use(express.json());

    app.use(routes());
    
    await createFiles();

    app.listen(3000, async () => {
        console.log(`Server running on 3000 `);
    });
}


async function createFiles(){
   const createFilePromises = Object.keys(files).map(file => fs.writeFile(getFilePath(files[file]),''));
   return Promise.all(createFilePromises);
}

// routes
function routes(){

    const router = express.Router();
    
    router.post('/dashboard/submit-number', async (req, res) => {
        
        const { number } = req.body;

        if (number < 1 || number > 25) {
            return res.status(400).json({ error: 'Number must be between 1 and 25' });
        }

        // check whether the process is completed or not  
        if (Object.values(fileStatus).every(status => status)) {
            return res.json({ message: 'Process complete' });
        }

        const result = number * 7;
        let fileToWrite = 'D';

        if (result > 140) {
            fileToWrite = 'A';
        } else if (result > 100) {
            fileToWrite = 'B';
        } else if (result > 60) {
            fileToWrite = 'C';
        }

        const fileResult = await fs.appendFile(getFilePath(files[fileToWrite]), result + '\n', ).catch(err => err)

        if (fileResult instanceof Error){
            return res.status(500).json({ error: 'Failed to write to file' });
        }
        fileStatus[fileToWrite] = true;


        res.json({ message: 'Number processed', result });
    });
    
    router.get('/dashboard/list-numbers', async (req, res) => {
        const data = {};
        try {
            await Promise.all(Object.keys(files).map(async fileKey => {
                try {
                    const content = await fs.readFile(getFilePath(files[fileKey]), 'utf8');
                    data[fileKey] = content.split('\n').filter(line => line).map(Number);
                } catch (err) {
                    data[fileKey] = 'Error reading file';
                }
            }));
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: 'Failed to read files' });
        }
    });
    
    return router;
}

bootStrapApplication()