import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        this.initialize(callback);
        this.owner = null;
        this.allaccounts = [];
        this.appAddress = config.appAddress
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];

            this.allaccounts = accts;

            callback();
            
        });

    };   

   //async inital2 (callback){

    //    let self = this;
        
        //await self.flightSuretyData.methods.authorisecontract(self.appAddress).send({from: self.owner, gas:999999999, gasPrice: 999999999});
    
    //    await regairline((error, result) => {console.log(result)});

    //    await regflight((error, result) => {console.log(result)});

    //    callback();
   //}


   async isOperational(callback) {
    let self = this;
    self.flightSuretyApp.methods
         .isOperational()
         .call({ from: self.owner}, callback);
    }
   
   async regairline(callback) {
    let self = this;

    await self.flightSuretyData.methods.fund().send({from: self.allaccounts[0], value: 10000000000000000000, gas:999999999, gasPrice: 999999999});
    for(let a=1; a<3; a++) {
        await self.flightSuretyApp.methods.registerAirlineApp(self.allaccounts[a]).send({from: self.allaccounts[0]});
        await self.flightSuretyData.methods.fund().send({from: self.allaccounts[a], value: 10000000000000000000, gas:999999999, gasPrice: 999999999});
    }
        //await self.flightSuretyData.methods.checkreg(self.allaccounts[0]).call({ from: self.allaccounts[0]}, callback);
    await self.flightSuretyData.methods.checkpaid(self.allaccounts[2]).call({ from: self.allaccounts[0]}, callback);     
    }   

    

   async regflight(callback) {
        let self = this;
        await self.flightSuretyApp.methods.registerFlight(1561874400).send({from: self.allaccounts[0], gas:999999999, gasPrice: 999999999});
        await self.flightSuretyApp.methods.registerFlight(1559203200).send({from: self.allaccounts[1], gas:999999999, gasPrice: 999999999});
        await self.flightSuretyApp.methods.registerFlight(1558792800).send({from: self.allaccounts[2], gas:999999999, gasPrice: 999999999});  
    
        await self.flightSuretyApp.methods.flightregstatus(self.allaccounts[2],1558792800).call({ from: self.allaccounts[1]}, callback);
    }

    

    async isreg(callback) {
        let self = this;
        let list = [];
        let first = await self.flightSuretyApp.methods
             .flightregstatus(self.allaccounts[0],1561874400)
             .call({ from: self.owner});
        list.push(first);
        let second = await self.flightSuretyApp.methods
        .flightregstatus(self.allaccounts[1],1559203200)
        .call({ from: self.owner});
        list.push(second);
        let third = await self.flightSuretyApp.methods
        .flightregstatus(self.allaccounts[2],1558792800)
        .call({ from: self.owner});
        list.push(third);
        callback(list);
     }

    async fetchFlightStatus(flight, callback) {
        let self = this;
        let airline = 0;
        let timestamp = 0;

        if (flight == 'NH100'){
            airline = self.allaccounts[0];
            timestamp = 1561874400
        }else if(flight == 'KA999'){
            airline = self.allaccounts[1];
            timestamp = 1559203200
        }else if(flight == 'CA997'){
            airline = self.allaccounts[2];
            timestamp = 1558792800
        }else{
            throw error;
        }

        let payload = {
            airline: airline,
            flight: flight,
            timestamp: timestamp
        } 
        await self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner, gas:999999999, gasPrice: 999999999}, (error, result) => {
                callback(error, payload);
            });
    }

    async buyinsurance(iflight, ivalue, address, callback) {
        let self = this;
        let airline = 0;
        let timestamp = 0;
        let result = [];

        if (iflight == 'NH100'){
            airline = self.allaccounts[0];
            timestamp = 1561874400
        }else if(iflight == 'KA999'){
            airline = self.allaccounts[1];
            timestamp = 1559203200
        }else if(iflight == 'CA997'){
            airline = self.allaccounts[2];
            timestamp = 1558792800
        }else{
            throw error;
        }

        let payload = {
            airline: airline,
            timestamp: timestamp
        } 

        await self.flightSuretyApp.methods
            .buyinsurance(payload.airline, payload.timestamp)
            .send({ from: address, value: ivalue, gas:999999999, gasPrice: 999999999});

        let istatus = await self.flightSuretyData.methods.checkinsured(address, payload.airline, payload.timestamp)
            .call({from: address, gas:999999999, gasPrice: 999999999})    
        
        result.push(istatus.toString());

        let iamount = await self.flightSuretyData.methods.checkinsuredamount(address, payload.airline, payload.timestamp)
           .call({from: address, gas:999999999, gasPrice: 999999999})    

        result.push(iamount.toString());

        callback(result);
    }

    async checkbalance(address, callback) {
        let self = this;
        let result = await self.flightSuretyData.methods.checkcredit(address)
            .call({from: self.owner, gas:999999999, gasPrice: 999999999});
        callback(result);
        }

    async checkiamount(flight, address, callback) {
        let self = this;
        let airline = 0;
        let timestamp = 0;

        if (flight == 'NH100'){
            airline = self.allaccounts[0];
            timestamp = 1561874400
        }else if(flight == 'KA999'){
            airline = self.allaccounts[1];
            timestamp = 1559203200
        }else if(flight == 'CA997'){
            airline = self.allaccounts[2];
            timestamp = 1558792800
        }else{
            throw error;
        }

        let payload = {
            airline: airline,
            timestamp: timestamp
        } 
        let result = await self.flightSuretyData.methods.checkinsuredamount(address, payload.airline, payload.timestamp)
            .call({from: self.owner, gas:999999999, gasPrice: 999999999});
        callback(result);
        }

    async withdraw (amount, address, callback) {
        let self = this;
        await self.flightSuretyData.methods.pay(amount)
                .send({from: address, gas:999999999, gasPrice: 999999999});
        let result = await self.flightSuretyData.methods.checkcredit(address)
                .call({from: self.owner, gas:999999999, gasPrice: 999999999});
        callback(result);
            }

    async setup (callback) {
        let self = this;
        //callback(self.appAddress);
        await this.regairline((error, result) => {console.log(error,result)});
        await this.regflight((error, result) => {console.log(error,result)});
        await self.flightSuretyData.methods.authorisecontract(self.appAddress).send({from: self.owner, gas:999999999, gasPrice: 999999999},callback);
        //await self.flightSuretyData.methods.creditInsurees(self.allaccounts[0],1561874400)
        //        .send({from: self.owner, gas:999999999, gasPrice: 999999999},callback);
            }

}


