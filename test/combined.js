var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {
  const TEST_ORACLES_COUNT = 20;
  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: accounts[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`can allow access to setOperatingStatus() for Contract Owner account`, async function () {

    let accessDenied = true;
    // Ensure that access is allowed for Contract Owner account
    try 
    {
        await config.flightSuretyData.setOperatingStatus(false);
    }
    catch(e) {
        accessDenied = true;
    }
    accessDenied = await config.flightSuretyData.isOperational.call();

    assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
    
    await config.flightSuretyData.setOperatingStatus(true);
  });

  it(`cannot register airline if not paid`, async function () {
    await config.flightSuretyData.authorisecontract(config.flightSuretyApp.address);
    let reg = true;
    // Ensure that access is allowed for Contract Owner account
    try 
    {
        await config.flightSuretyApp.registerAirlineApp(accounts[1]);
    }
    catch(e) {
        reg = false;
    }
    
    assert.equal(reg, false, "Cannot authrise App contract");
    
  });

  it(`can register airline if paid`, async function () {
    await config.flightSuretyData.authorisecontract(config.flightSuretyApp.address);
    let reg = true;
    // Ensure that access is allowed for Contract Owner account
    try 
    {
        await config.flightSuretyApp.registerAirlineApp(accounts[1]);
    }
    catch(e) {
        reg = false;
    }
    
    assert.equal(reg, false, "Cannot authrise App contract");
    
  });

   it(`can authorise app contract`, async function () {
    await config.flightSuretyData.authorisecontract(config.flightSuretyApp.address);
    let auth = true;
    
    await config.flightSuretyData.fund({from:accounts[0],value: 10000000000000000000})

    try 
    {
        await config.flightSuretyApp.registerAirlineApp(accounts[1]);
    }
    catch(e) {
        auth = false;
    }
    
    assert.equal(auth, true, "Cannot authrise App contract");
    
  });

  it('airline cannot register a flight for insurance if it is not funded', async () => {
    
    let result = true;
  
    try {
        await config.flightSuretyApp.registerFlight(1561874400, {from: accounts[1]});
    }
    catch(e) {
        result = false;
    }
  
    assert.equal(result, false, "Airline should not be able to register flight for insurance if it hasn't provided funding");

  });

  it(`first four airline require only registered airline to add`, async function () {
    
    await config.flightSuretyData.fund({from:accounts[1],value: 10000000000000000000})
    await config.flightSuretyApp.registerAirlineApp(accounts[2], {from:accounts[1]});
    await config.flightSuretyData.fund({from:accounts[2],value: 10000000000000000000})
    await config.flightSuretyApp.registerAirlineApp(accounts[3], {from:accounts[2]});
    await config.flightSuretyData.fund({from:accounts[3],value: 10000000000000000000})
    await config.flightSuretyApp.registerAirlineApp(accounts[4], {from:accounts[3]});
   
    let rega = false;

    rega = await config.flightSuretyData.checkreg(accounts[4]);
    
    assert.equal(rega, true, "Cannot register airline");
    
  });

  it(`fifth airline cannot be registered just by one airline`, async function () {
    
    await config.flightSuretyData.fund({from:accounts[4],value: 10000000000000000000})
    await config.flightSuretyApp.registerAirlineApp(accounts[5], {from:accounts[4]});
   
    let rega = false;

    rega = await config.flightSuretyData.checkreg(accounts[5]);
    
    assert.equal(rega, false, "Multi party concensus does not work");
    
  });

  it(`fifth airline can be registered if over half of the registered airlines endorse`, async function () {
    
    await config.flightSuretyApp.registerAirlineApp(accounts[5], {from:accounts[0]});
    await config.flightSuretyApp.registerAirlineApp(accounts[5], {from:accounts[2]});
   
    let rega = false;

    rega = await config.flightSuretyData.checkreg(accounts[5]);
    
    assert.equal(rega, true, "Multi party concensus does not work");
    
  });


  

  it('airline can register a flight for insurance if it has funded', async () => {
   
    await config.flightSuretyData.fund({from:accounts[1],value: 10000000000000000000})
  
    let result = true;
  
    try {
        await config.flightSuretyApp.registerFlight(1561874400, {from: accounts[1]});
    }
    catch(e) {
        result = false;
    }

    let status = await config.flightSuretyApp.flightregstatus(accounts[1],1561874400);
    assert.equal(result, true, "Airline should be able to register flight for insurance after it has provided funding"); 
    assert.equal(status, true, "flight should have been registered"); 
});

  it('passenger can buy insurance after flight has been registered', async () => {
   
    let insured = false;
  
    try {
        await config.flightSuretyApp.buyinsurance(accounts[1], 1561874400, {from:accounts[2],value: 1000000000000000000});
    }
    catch(e) {
        insured = false;
    }

    insured = await config.flightSuretyData.checkinsured(accounts[2],accounts[1],1561874400);
    assert.equal(insured, true, "Airline should be able to register flight for insurance after it has provided funding"); 
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
          await config.flightSuretyApp.submitOracleResponse(index1, accounts[1], flight, timestamp, 20, {from: accounts[a]});
          console.log(`submitted by ${accounts[a]}`) //the index is the same as what is used for checking if request is open
        }
        catch(e) {
          // Enable this when debugging
           console.log('\nIndex does not match', oracleIndexes, flight, timestamp);
        }

      }

    })

  it('can auto update credit when flight delay triggered insurance', async () => {

    let credit  = await config.flightSuretyData.checkcredit(accounts[2]);

    let payout = 1000000000000000000*1.5;
    
    assert.equal(credit, payout, "Credit is incorrect"); 
  });

  it('can withdraw funds from credit', async () => {
    
    let pbalance = await web3.eth.getBalance(accounts[2]);

    let credit  = await config.flightSuretyData.checkcredit(accounts[2]);
    
    await config.flightSuretyData.pay(credit, {from: accounts[2]});

    let nbalance  = await web3.eth.getBalance(accounts[2]);

    let bstatus = false;

    if(nbalance>pbalance){
        bstatus = true;
    }else{
        bstatus = false;
    };
    
    assert.equal(bstatus, true, "Cannot pay out"); 
  });


 


});
