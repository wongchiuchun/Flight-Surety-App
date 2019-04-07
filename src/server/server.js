import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
const ORACLES_COUNT = 20;
let oracle_index = {};
let final = {};
let allaccounts = [];
let s = 20;  //to test whether front end can auto credit accounts, please change this to 20 and keep line 66 in comment 


async function registerOracles () {
  await web3.eth.getAccounts((err,accounts) => { return allaccounts = accounts});
    //console.log(allaccounts);
    for(let a=1; a<(ORACLES_COUNT+1); a++) {
    await flightSuretyApp.methods.registerOracle().send({from: allaccounts[a],value: 1000000000000000000, gas:999999999, gasPrice: 999999999});
      let result = await flightSuretyApp.methods.getMyIndexes().call({from: allaccounts[a]});
      oracle_index[a] = result;
      };
    //console.log(oracle_index);
    return final = oracle_index;
}

function rand(x){
  return Math.floor((Math.random() * x) + 1);
}

async function setstatus(){
  let x = await rand(6);
  //console.log(x);
  if (x == 1){
    return s = 0;
  } else if (x == 2){
    return s = 10;
  } else if (x == 3){
    return s = 20;
  }else if (x == 4){
    return s = 30;
  }else if (x == 5){
    return s = 40;
  }else if (x == 6){
    return s = 50;
  }
}

function listen() {
    flightSuretyApp.events.OracleRequest({
        fromBlock: 0
       }, async function (error, event) {
           if (error) console.log(error);
           if (event){
          //console.log(event);
              let index = event.returnValues.index;
              let airline = event.returnValues.airline;
              let flight = event.returnValues.flight;
              let timestamp = event.returnValues.timestamp;
              
          console.log('index is', index, 'airline is', airline, 'flight is', flight, 'timestamp is', timestamp);

          //await setstatus(); //to test front end with a specific status, please change variable s and keep this in bracket
      
          console.log('status is', s);

          for(let a=1; a<(ORACLES_COUNT+1); a++) {      
            for(let i=0; i<4; i++) {
              if (index == final[a][i]){
                await flightSuretyApp.methods.submitOracleResponse(index, airline, flight, timestamp, s).send({from: allaccounts[a], gas:999999999, gasPrice: 999999999});
                await console.log('account', a, ' is matching');
                }
              }            
            }
          }
    });

}

//initialise server, register oracles first, print out list of indexes and then listen for event.
async function test() {
  await registerOracles ()
  console.log(final);
  await listen ()
}

//call initialise function
test();

const app = express();

app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;


