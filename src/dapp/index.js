
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });
        
        //try to register 3 airlines and see if it is working. Can hide after initial run
        //contract.regairline((error, result) => {
        //    console.log(error,result);
        //    display('Setup Test', 'check if airline has funded', [ { label: 'Is paid', error: error, value: result} ]);
        //});

        //try to register 3 flights and see if it is working. Can hide after initial run
        //contract.regflight((error, result) => {
        //    console.log(error,result);
        //    display('Setup Test', 'check if flight could be registered', [ { label: 'flight is reg', error: error, value: result} ]);
        //});

        //to see if the flights have been registered properly
        contract.isreg((error, result) => {
            console.log(error,result);
            displaymul('Flight List', 'Flight & Status (could be insured)',[ { label: ['flight 1', 'flight 2', 'flight 3'], error: error, name: ['NH100','KA999', 'CA997'], value: result} ],
                );
        });
    

        DOM.elid('buy-insurance').addEventListener('click', () => {
            let iflight = DOM.elid('iflight-number').value.toString();
            let ivalue = DOM.elid('ivalue').value*1000000000000000000;
            let address = DOM.elid('iaddress').value;
            contract.buyinsurance(iflight, ivalue, address, (error, result) => {
                display('Insurance Status', 'Insurance Status - ', [ { label: 'Insured, Insured Amount(wei):', error: error, value: result} ]);
            });
        });

        DOM.elid('check-isum').addEventListener('click', () => {
            let flight = DOM.elid('bflight-number').value.toString();
            let address = DOM.elid('baddress').value;
            contract.checkiamount(flight, address, (error, result) => {
                display('Insured Amount', 'Amount - ', [ { label: 'Insured Amount(wei):', error: error, value: result} ]);
            });
        });

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value.toString();
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        })

        DOM.elid('check-balance').addEventListener('click', () => {
            let address = DOM.elid('address').value;
            contract.checkbalance(address, (error, result) => {
                display('Credit Balance', 'Balance - ', [ { label: 'Your outstanding credit is (wei):', error: error, value: result} ]);
           });
        });

        DOM.elid('withdraw').addEventListener('click', () => {
            let amount = DOM.elid('amount').value;
            let address = DOM.elid('waddress').value;
            contract.withdraw(amount, address, (error, result) => {
                display('Remaining Balance', 'Balance - ', [ { label: 'Your remaining credit is (wei):', error: error, value: result} ]);
           });
        });
        

        DOM.elid('setup').addEventListener('click', () => {
            contract.setup((error, result) => {
                display('Testing Status', 'Reminder', [ { label: 'Note:', error: error, value: 'please refresh the page'} ]);
            });
        });


    
    });

})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}

function displaymul(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        for (let a=0; a<result.label.length; a++){ 
            row.appendChild(DOM.div({className: 'col-sm-2 field'}, result.label[a]));
            row.appendChild(DOM.div({className: 'col-sm-5 field-name'}, result.name[a]));
            row.appendChild(DOM.div({className: 'col-sm-5 field-value'}, result.error ? String(result.error[a]) : String(result.value[a])));
        }
        
        section.appendChild(row);
    })
    displayDiv.append(section);

}

