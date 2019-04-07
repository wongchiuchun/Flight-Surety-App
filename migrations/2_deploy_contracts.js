const FlightSuretyApp = artifacts.require("./FlightSuretyApp.sol");
const FlightSuretyData = artifacts.require("./FlightSuretyData.sol");
const fs = require('fs');

module.exports = async function(deployer) {

    //let firstAirline = '0x2c6a63BDAe49198eA4fdDe046E63028Ba2a1b95f';
    deployer.deploy(FlightSuretyData).then(() => {
        return deployer.deploy(FlightSuretyApp, FlightSuretyData.address)
                .then(() => {
                    let config = {
                        localhost: {
                            url: 'http://localhost:7545',
                            dataAddress: FlightSuretyData.address,
                            appAddress: FlightSuretyApp.address
                        }
                   }
                    fs.writeFileSync(__dirname + '/../src/dapp/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
                    fs.writeFileSync(__dirname + '/../src/server/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
                });
    });
}