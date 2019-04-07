
var Test = require('../config/testConfig.js');
//var BigNumber = require('bignumber.js');

contract('Oracles', async (accounts) => {

  const TEST_ORACLES_COUNT = 20;
  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);

    // Watch contract events
    const STATUS_CODE_UNKNOWN = 0;
    const STATUS_CODE_ON_TIME = 10;
    const STATUS_CODE_LATE_AIRLINE = 20;
    const STATUS_CODE_LATE_WEATHER = 30;
    const STATUS_CODE_LATE_TECHNICAL = 40;
    const STATUS_CODE_LATE_OTHER = 50;

  });


  it('can register oracles', async () => {
    
    // ARRANGE
    let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();

    // ACT
    for(let a=1; a<TEST_ORACLES_COUNT; a++) {      
      await config.flightSuretyApp.registerOracle({ from: accounts[a], value: fee });
      let result = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]});
      console.log(`Oracle ${a} Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
    }
  });

  it('can retrieve oracles index', async () => {
    let a = await config.flightSuretyApp.getMyIndexes.call({from: accounts[2]});
    console.log(a[0].toNumber())
  })

  it('can generate a request', async () => {
    let flight = 'ND1309'; // Course number
    let timestamp = 1561874400;

    await config.flightSuretyApp.fetchFlightStatus(accounts[1], flight, timestamp);

    let first = await config.flightSuretyApp.getoraclestatus(accounts[1], flight, timestamp);
    
    let index = await config.flightSuretyApp.getrequestindex(accounts[1], flight, timestamp);
    console.log(index);

    assert.equal(first,true,"The status should be open")
  })

  it('can submit a request', async () => {
    let flight = 'ND1309'; // Course number
    let timestamp = 1561874400;
    let index1 = await config.flightSuretyApp.getrequestindex(accounts[1], flight, timestamp);
    
    await config.flightSuretyApp.fetchFlightStatus(accounts[1], flight, timestamp);
    let first = await config.flightSuretyApp.getoraclestatus(accounts[1], flight, timestamp);
    console.log(first);
    console.log(index1);


   for(let a=1; a<TEST_ORACLES_COUNT; a++) {

      // Get oracle information
      let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({ from: accounts[a]});
      
        try {
          // Submit a response...it will only be accepted if there is an Index match
          await config.flightSuretyApp.submitOracleResponse(index1, accounts[1], flight, timestamp, 10, {from: accounts[a]});
          console.log(`submitted by ${accounts[a]}`) //the index is the same as what is used for checking if request is open
        }
        catch(e) {
          // Enable this when debugging
           console.log('\nIndex does not match', oracleIndexes, flight, timestamp);
        }

      }

    })
  
})
