const Cryptr = require('cryptr');
var prompt = require('prompt');

var schema = {
  properties: {
    username: {
      required: true
    },
    password: {
      hidden: true,
      required: true
    }
  }
};

prompt.start();
console.log("Please enter the Staff Squared Credentials:")
prompt.get(schema, function (err, result) {
  console.log('Encrypted Username: ', new Cryptr('XfT&TTub6PtOop8MDMrDsZ$QC!&$E@95NXYxtL%F4*yTvC9ZJU#F^S03Ixpf9bK!').encrypt(result.username));
  console.log('Encrypted Password: ', new Cryptr('0NA4@&VwBeY0NCVHIVTAJZ2s^l5M1E1aPoylBNRFAn8^zc4J1hB&p$24L4pmZH*J').encrypt(result.password));
});
