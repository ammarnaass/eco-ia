const crypto = require('crypto');
const body = '{"test":"hello"}';
const secret = '86ee18f1f33f5a09f6a22eb222a4b298';
const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
console.log('Expected:', 'sha256=' + expected);
console.log('Body bytes:', Buffer.byteLength(body, 'utf8'));
console.log('Body:', JSON.stringify(body));

// Also test the inner code from signature.js
const parsed = JSON.parse(body);
const jsonBody = Buffer.from(JSON.stringify(parsed));
const jsonExpected = crypto.createHmac('sha256', secret).update(jsonBody).digest('hex');
console.log('Via JSON.stringify:', 'sha256=' + jsonExpected);
