pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false

    mapping(address => bool) public authorised;
    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                ) 
                                public 
    {
        contractOwner = msg.sender;
    }



    mapping(address => bool) public regairlines;
    mapping(address => bool) public paidairlines;
    address [] public registeredair;

    //getter function to get length of the registeredair

    function getnum() external returns(uint256 number) {
        return registeredair.length;
    }

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
        require(operational, "Contract is currently not operational");
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

    modifier isregistered() {
        require(regairlines[msg.sender] == true);
        _;
    }

    modifier ispaid() {
        require(paidairlines[msg.sender] == true);
        _;
    }


    function authorisecontract (address _address) public requireContractOwner() requireIsOperational() {
        authorised[_address] = true;
    }

    function deauthorisecontract (address _address) public requireContractOwner() requireIsOperational() {
        authorised[_address] = false;
    }

    modifier isauthorised() {
        require(authorised[msg.sender] = true);
        _;
    }
    

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() 
                            public 
                            view 
                            returns(bool) 
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
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
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    event airlineregistered(address airline, bool status);
    //decide where to slot in the modifier
    function registerAirline (address _airline) requireIsOperational() isauthorised()
                            external
    {
        regairlines[_airline] = true;
        registeredair.push(_airline);
        emit airlineregistered(_airline, regairlines[_airline]);
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    event airlinepaid(address airline, bool status);
    //decide where to slot in the modifier   
    function fund() isregistered() requireIsOperational() public
                            payable
    {
        require (msg.value >= 10 ether, "Insufficeint amount, min payment is 10 ether");
        paidairlines[msg.sender] = true;
        emit airlinepaid(msg.sender, paidairlines[msg.sender]);
    }

   function checkreg(address _airline) public view returns (bool) {
       return regairlines[_airline];
   }

   function checkpaid(address _airline) public view returns (bool) {
       return paidairlines[_airline];
   }

   /**
    * @dev Buy insurance for a flight
    *
    */
    mapping (address => uint) credit;
    mapping (bytes32 => uint) insuredamount;
    mapping (bytes32 => address[]) insuredaccounts;

    event flightinsured(address customer, address airline, uint256 timestamp);

    function buy
                            (
                                address _airline,
                                uint256 _timestamp
                            ) requireIsOperational()
                            external
                            payable
    {
        bytes32 account = keccak256(abi.encodePacked(tx.origin, _airline, _timestamp));
        insuredamount[account] = uint(msg.value);
        bytes32 key = keccak256(abi.encodePacked(_airline, _timestamp));
        insuredaccounts[key].push(tx.origin);
        emit flightinsured(tx.origin, _airline, _timestamp);
    }

    function checkinsured(address customer, address airline, uint256 timestamp) public view returns (bool){
        bytes32 account = keccak256(abi.encodePacked(customer, airline, timestamp));
        if (insuredamount[account]>0) {
            return true;
            }
            else
            {
                return false;
            }
    }

    function checkcredit(address customer) public view returns (uint){
        return credit[customer];
    }

    function checkinsuredamount(address customer, address airline, uint256 timestamp) public view returns (uint){
        bytes32 account = keccak256(abi.encodePacked(customer, airline, timestamp));
        return insuredamount[account];
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (                                
                                address _airline,
                                uint256 _timestamp
                                ) requireIsOperational() 
                                isauthorised()
                                external  
                                //There is a danger here for someone to call this and give them lots of credit - need to think through this
    {
        bytes32 key = keccak256(abi.encodePacked(_airline, _timestamp));
        require (insuredaccounts[key].length>0, "This flight is not insured");
        for (uint c=0; c<insuredaccounts[key].length; c++){
            address iaddresses = insuredaccounts[key][c];
            bytes32 account = keccak256(abi.encodePacked(iaddresses, _airline, _timestamp));
            uint256 insuredsum = insuredamount[account];
            uint256 addcredit = insuredsum.mul(3).div(2);
            insuredamount[account] = 0;
            credit[iaddresses] = credit[iaddresses].add(addcredit); 
            addcredit = 0;           
        }
    }


    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    
    function pay(uint256 amount) requireIsOperational()
                            external
    {
        require (msg.sender == tx.origin, "Contracts not allowed");
        require (credit[msg.sender] >= amount, "Insufficient fund");
        credit[msg.sender] = credit[msg.sender].sub(amount);
        msg.sender.transfer(amount);
    }
    

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() 
                            external 
                            payable 
    {
        fund();
    }


}

