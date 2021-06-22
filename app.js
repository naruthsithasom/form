// npm install express ejs body-parser cookie-parser mysql multer
const express = require('express')
const app = express()
const mysql   = require('mysql')
const readBody = express.urlencoded({extended:false})
const AWS = require('aws-sdk');
const dotenv = require('dotenv');

dotenv.config();

const kmsClient = new AWS.KMS({
  region: 'ap-southeast-1',
  accessKeyId: "AKIAX2Z7CY5RWYR3MPNL",
  secretAccessKey: "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"
});

var pool    = mysql.createPool({ host:'54.251.234.220:3306', database:'db_kbtg', user:'root', password:'Ypqe=LyiQ6ti'})
app.listen(8080)
app.engine('html', require('ejs').renderFile)
app.get('/jobs', (req, res) => res.render('index.html'))
app.post('/jobs', readBody, saveJobs)

app.get('/register', (req, res) =>  (pool.query(`select * from register`, ( error,data ) => { res.send(data) })))

async function  saveJobs(req, res){

	let sql = 'insert into `register`(full_name, email, linkedin, messages) values (?, ?, ?, ?)'
	let data = [req.body.full_name, req.body.email, req.body.linkedin, req.body.messages]
  let dataEncode = []

  // res.send('welcome <br> ' + data )
  let i = 0
   
  while( i < data.length ){
    
    let encryptMySecureText = await encryptString(data[i]);  
    
    dataEncode[i] = encryptMySecureText
    
    console.log("\n\nEncrypted string : " + encryptMySecureText);
    
    let decryptMySecureText = await decryptEncodedstring(encryptMySecureText);
    
    console.log("\n\decryptResult string : " + decryptMySecureText);
    
    i++;
   }
  //  console.log(dataEncode)
  pool.query(sql, dataEncode, function(error, result){
		let model = { }
		if(error == null){

			model.message = 'Register Success...'

		} else {

			model.message = 'Fail to register...'
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