require('dotenv').config();
const Minio = require('minio');

const client = new Minio.Client({
  endPoint: process.env.S3ADDRESS,
  port: 443,
  useSSL: true,
  accessKey: process.env.S3KEY,
  secretKey: process.env.S3SECRET,
});

const bucket = 'geocodes';
const object = 'summoned/bodc/0017b0da950872eb00e6c5aea7a75e8caac12045.jsonld';

console.log('Endpoint:', process.env.S3ADDRESS);
console.log('Bucket:', bucket);
console.log('Object:', object);
console.log('Access Key:', process.env.S3KEY?.slice(0, 4) + '...');
console.log();

client.getObject(bucket, object, (err, stream) => {
  if (err) {
    console.error('Error:', err.message);
    console.error('Code:', err.code);
    process.exit(1);
  }

  let data = '';
  stream.on('data', (chunk) => { data += chunk; });
  stream.on('end', () => {
    console.log('Success! Received', data.length, 'bytes');
    console.log(data.slice(0, 500));
  });
  stream.on('error', (err) => {
    console.error('Stream error:', err.message);
    process.exit(1);
  });
});
