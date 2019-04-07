pragma solidity ^0.4.25;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)
    
    address private contractOwner; 
    bool private operational = true;         
    //link the app contract to the data contract

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Contract constructor
    *
    */
    //link the app contract to data contract at initiation and make the contract owner the first airline

    FlightSuretyData flightsuretydata;
    constructor  (address data) public 
    {
        contractOwner = msg.sender;
        flightsuretydata = FlightSuretyData(data);
        flightsuretydata.registerAirline(msg.sender); 
    }


    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/
    
    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

        // Account used to deploy contract

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;        
        address airline;
    }
    mapping(bytes32 => Flight) private flights; //original private, changed cause comilation error

 
    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
         // Modify to call data contract's status
        require(true, "Contract is currently not operational");  
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier isregistered(){
        require(flightsuretydata.regairlines(tx.origin) == true);
        _;
    }

    modifier ispaid() {
        require(flightsuretydata.paidairlines(tx.origin) == true);
        _;
    }

    modifier isunique(string a) {
        require(reported[a] == false);
        _;
    }
    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational() 
                            public 
                            view 
                            returns(bool) 
    {
        return operational;  // Modify to call data contract's status
    }

    function setOperatingStatus
                            (
                                bool mode
                            ) 
                            public
                            requireContractOwner() 
    {
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

  
   /**
    * @dev Add an airline to the registration queue
    *
    */
    address[] multiCalls = new address[](0);
    //**** */
    //**** */can't call length function somehow

    function registerAirlineApp
                            (
                                address _airline   
                            )
                            ispaid() requireIsOperational()
                            public
                            returns(bool success)
    {
        uint256 U = flightsuretydata.getnum();

        uint256 T = U.div(2);
        
        if(U<=4)
        {
            flightsuretydata.registerAirline(_airline);
            return true;
        }
        else{        
            multiCalls.push(msg.sender);
            if (multiCalls.length >= T) {
                flightsuretydata.registerAirline(_airline);      
                multiCalls = new address[](0);
                return true;  
            }else{
                return false;
            }
        }
    }



   /**
    * @dev Register a future flight for insuring.
    *
    */

    /** To allow airline to register flight for insurance*/
    event flightreg(address airline, uint8 status, uint256 timestamp);

    function registerFlight (uint256 _timestamp) ispaid() requireIsOperational() public {
       bytes32 key = keccak256(abi.encodePacked(msg.sender, _timestamp));
       flights[key] = Flight({isRegistered: true, statusCode: 0, updatedTimestamp: _timestamp, airline: msg.sender});
       emit flightreg(flights[key].airline, flights[key].statusCode, flights[key].updatedTimestamp); 
    }


    /** This section is related to passenger */
    //buy insurance

    function buyinsurance (address _airline, uint256 _timestamp) requireIsOperational() public payable{
        bytes32 key = keccak256(abi.encodePacked(_airline, _timestamp));
        require(flights[key].isRegistered == true, "Flight can't be insured");
        require(msg.value>0 && msg.value <=1 ether);
        flightsuretydata.buy.value(msg.value)(_airline, _timestamp);
    }



   /**
    * @dev Called after oracle has updated flight status
    *
    */  
    function processFlightStatus
                                (
                                    address airline,
                                    uint256 timestamp,
                                    uint8 statusCode
                                )
                                requireIsOperational() private
    {
        if(statusCode == 20){
            flightsuretydata.creditInsurees(airline, timestamp);
        }
    }

    //need to verify that the response is indeed the same as the Status code


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus
                        (
                            address airline,
                            string flight,
                            uint256 timestamp                            
                        )
                        requireIsOperational() public
    {
        uint8 index = getRandomIndex(msg.sender); 

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(airline, flight, timestamp)); //deleted index
        oracleResponses[key] = ResponseInfo({
                                                requester: msg.sender,
                                                isOpen: true,
                                                index: index
                                            });

        emit OracleRequest(index, airline, flight, timestamp);
    } 

    function getoraclestatus (address airline,
                            string flight,
                            uint256 timestamp) public view returns (bool status){
        
        bytes32 key = keccak256(abi.encodePacked(airline, flight, timestamp)); 
        status = oracleResponses[key].isOpen;
        return status;
                            }

    function getflightkey (address _airline, uint256 _timestamp) public view returns (bytes32 key) {
        key = keccak256(abi.encodePacked(_airline, _timestamp));
        return key;
    }

    function flightregstatus (address _airline, uint256 _timestamp) public view returns (bool status) {
        bytes32 key = getflightkey (_airline, _timestamp);
        status = flights[key].isRegistered;
        return status;
    }







// region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;    

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;        
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    mapping(string => bool) private reported; //make sure the flight will not be reported twice

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;
        uint index;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status, bool verified);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle
                            (
                            )
                            external
                            payable
    {
        // Require registration fee
        require(msg.value >= 1 ether, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });
    }

    function getMyIndexes
                            (
                            )
                            external
                            view
                            returns(uint8[3])
    {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }

    function getrequestindex(
                            address airline,
                            string flight,
                            uint256 timestamp 
    ) public view returns (uint8 index){
        bytes32 key = keccak256(abi.encodePacked(airline, flight, timestamp));
        index = uint8(oracleResponses[key].index);
        return index;
    }



    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
                        (
                            uint8 index,
                            address airline,
                            string flight,
                            uint256 timestamp,
                            uint8 statusCode
                        )
                        isunique(flight) requireIsOperational() external returns (uint8)
    {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(airline, flight, timestamp)); 
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);

        //return index;
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {
            
            oracleResponses[key].isOpen = false;

            if(statusCode == 20){
               processFlightStatus(airline, timestamp, statusCode);
            }

            emit FlightStatusInfo(airline, flight, timestamp, statusCode, true);

            // Handle flight status as appropriate

            reported[flight] = true;
        }else{
            emit FlightStatusInfo(airline, flight, timestamp, statusCode, false);
        }
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes
                            (                       
                                address account         
                            )
                            internal
                            returns(uint8[3])
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);
        
        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex
                            (
                                address account
                            )
                            internal 
                            returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

}   

contract FlightSuretyData {
    function registerAirline (address _airline) external;
    //function fund() public payable;
    //function regair(uint256 _timestamp) external;
    function buy(address _airline,uint256 _timestamp) external payable;
    function creditInsurees(address _airline,uint256 _timestamp) external;
    //function pay(uint256 amount)external;
    mapping(address => bool) public regairlines;
    mapping(address => bool) public paidairlines;
    //mapping (address => uint) credit;
    //mapping (bytes32 => uint) insuredamount;
    //mapping (bytes32 => address[]) insuredaccounts;
    //address [] public registeredair;
    function getnum() external returns(uint256 number);
}

