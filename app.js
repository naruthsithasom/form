const express = require('express')
const app = express()
const mysql = require('mysql')
const readBody = express.urlencoded({ extended: false })
const AWS = require('aws-sdk');
const dotenv = require('dotenv');
const { render } = require('ejs');

dotenv.config();

const kmsClient = new AWS.KMS({
  region: 'ap-southeast-1',
  accessKeyId: "AKIAX2Z7CY5RWYR3MPNL",
  secretAccessKey: "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"
});

const pool = mysql.createPool({ host: 'localhost', database: 'db_kbtg', user: 'root', password: 'Ypqe=LyiQ6ti'})

app.listen(8080)
app.engine('html', require('ejs').renderFile)
app.get('/add', showIndex)
app.post('/add', readBody, addMember)
app.get('/decrypt', showDecrypt)
app.get('/encrypt', showEncrypt)


function showIndex(req, res){
  res.render('index.html')
}


function showDecrypt(req, res){
  pool.query(`select * from register`, async function (error, data) {

    let dataDecode = []
    let store = []
    for (let i = 1; i < data.length; i++) {
      dataDecode.push(data[i].full_name)
      dataDecode.push(data[i].email)
      dataDecode.push(data[i].linkedin)
      dataDecode.push(data[i].messages)
    }
  
    let j = 0
    while (j < dataDecode.length) {
      
      let decryptMySecureText = await decryptEncodedstring(dataDecode[j]);
      store.push(decryptMySecureText)
      
      j++;
    }
    res.send(store)
  
  })
}
function showEncrypt(req, res){
  pool.query(`select * from register`, async function (error, data) {

    res.send(data)

  })
}

async function addMember(req, res) {

  let sql = 'insert into `register`(full_name, email, linkedin, messages) values (?, ?, ?, ?)'
  let data = [req.body.full_name, req.body.email, req.body.linkedin, req.body.messages]
  let dataEncode = []

  let i = 0

  while (i < data.length) {

    let encryptMySecureText = await encryptString(data[i]);

    dataEncode[i] = encryptMySecureText

    console.log("\n\nEncrypted string : " + encryptMySecureText);

    i++;
  }
  pool.query(sql, dataEncode, function (error, result) {

    if (error == null) {

      res.send(dataEncode)

    } else {

      res.send('Error..')
    }
  })

}
async function encryptString(text) {

  const paramsEncrypt = {
    KeyId: 'arn:aws:kms:ap-southeast-1:538613827427:key/f7ea6177-c4db-4537-9528-00573d56de69',
    Plaintext: new Buffer.from(text)
  };

  const encryptResult = await kmsClient.encrypt(paramsEncrypt).promise();
  if (Buffer.isBuffer(encryptResult.CiphertextBlob)) {
    return Buffer.from(encryptResult.CiphertextBlob).toString('base64');
  } else {
    throw new Error('error');
  }
}

async function decryptEncodedstring(encoded) {

  const paramsDecrypt = {
    CiphertextBlob: Buffer.from(encoded, 'base64')
  };

  const decryptResult = await kmsClient.decrypt(paramsDecrypt).promise();
  if (Buffer.isBuffer(decryptResult.Plaintext)) {
    return Buffer.from(decryptResult.Plaintext).toString();
  } else {
    throw new Error('error');
  }
}