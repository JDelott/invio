// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract InvoiceContract is Ownable {
    // USDC token contract
    IERC20 public usdcToken;
    
    struct Invoice {
        uint256 id;
        address creator;
        address recipient;
        uint256 amount;
        string description;
        string ipfsHash; // For off-chain data storage
        bool isPaid;
        uint256 createdAt;
        uint256 paidAt;
    }
    
    // Keep track of invoices
    mapping(uint256 => Invoice) public invoices;
    uint256 public nextInvoiceId = 1;
    
    // Track invoices per user
    mapping(address => uint256[]) public userInvoicesCreated;
    mapping(address => uint256[]) public userInvoicesPending;
    
    // Events
    event InvoiceCreated(
        uint256 indexed id,
        address indexed creator,
        address indexed recipient,
        uint256 amount,
        string description,
        string ipfsHash
    );
    
    event InvoicePaid(
        uint256 indexed id,
        address indexed payer,
        address indexed recipient,
        uint256 amount,
        string paymentMethod
    );
    
    constructor(address _usdcAddress) Ownable(msg.sender) {
        usdcToken = IERC20(_usdcAddress);
    }
    
    // Create a new invoice
    function createInvoice(
        address recipient,
        uint256 amount,
        string memory description,
        string memory ipfsHash
    ) external returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        require(recipient != address(0), "Invalid recipient address");
        
        uint256 invoiceId = nextInvoiceId;
        nextInvoiceId++;
        
        Invoice storage newInvoice = invoices[invoiceId];
        newInvoice.id = invoiceId;
        newInvoice.creator = msg.sender;
        newInvoice.recipient = recipient;
        newInvoice.amount = amount;
        newInvoice.description = description;
        newInvoice.ipfsHash = ipfsHash;
        newInvoice.isPaid = false;
        newInvoice.createdAt = block.timestamp;
        
        // Add to user's created invoices
        userInvoicesCreated[msg.sender].push(invoiceId);
        
        // Add to recipient's pending invoices
        userInvoicesPending[recipient].push(invoiceId);
        
        emit InvoiceCreated(
            invoiceId,
            msg.sender,
            recipient,
            amount,
            description,
            ipfsHash
        );
        
        return invoiceId;
    }
    
    // Pay invoice with ETH
    function payInvoiceWithEth(uint256 invoiceId) external payable {
        Invoice storage invoice = invoices[invoiceId];
        
        require(invoice.id == invoiceId, "Invoice does not exist");
        require(!invoice.isPaid, "Invoice already paid");
        require(msg.value == invoice.amount, "Incorrect payment amount");
        
        // Mark as paid
        invoice.isPaid = true;
        invoice.paidAt = block.timestamp;
        
        // Send ETH to recipient
        (bool success, ) = invoice.recipient.call{value: msg.value}("");
        require(success, "ETH transfer failed");
        
        emit InvoicePaid(
            invoiceId,
            msg.sender,
            invoice.recipient,
            invoice.amount,
            "ETH"
        );
    }
    
    // Pay invoice with USDC
    function payInvoiceWithUsdc(uint256 invoiceId) external {
        Invoice storage invoice = invoices[invoiceId];
        
        require(invoice.id == invoiceId, "Invoice does not exist");
        require(!invoice.isPaid, "Invoice already paid");
        
        // Mark as paid
        invoice.isPaid = true;
        invoice.paidAt = block.timestamp;
        
        // Transfer USDC from sender to recipient
        bool success = usdcToken.transferFrom(msg.sender, invoice.recipient, invoice.amount);
        require(success, "USDC transfer failed");
        
        emit InvoicePaid(
            invoiceId,
            msg.sender,
            invoice.recipient,
            invoice.amount,
            "USDC"
        );
    }
    
    // Get all invoices created by a user
    function getInvoicesByUser(address user) external view returns (Invoice[] memory) {
        uint256[] memory ids = userInvoicesCreated[user];
        Invoice[] memory result = new Invoice[](ids.length);
        
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = invoices[ids[i]];
        }
        
        return result;
    }
    
    // Get all pending invoices for a user
    function getPendingInvoices(address user) external view returns (Invoice[] memory) {
        uint256[] memory ids = userInvoicesPending[user];
        uint256 pendingCount = 0;
        
        // Count pending invoices
        for (uint256 i = 0; i < ids.length; i++) {
            if (!invoices[ids[i]].isPaid) {
                pendingCount++;
            }
        }
        
        Invoice[] memory result = new Invoice[](pendingCount);
        uint256 resultIndex = 0;
        
        // Fill result array with pending invoices
        for (uint256 i = 0; i < ids.length; i++) {
            if (!invoices[ids[i]].isPaid) {
                result[resultIndex] = invoices[ids[i]];
                resultIndex++;
            }
        }
        
        return result;
    }
    
    // Update USDC address (admin only)
    function setUsdcAddress(address _usdcAddress) external onlyOwner {
        usdcToken = IERC20(_usdcAddress);
    }
}
