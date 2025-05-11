import React, { useState } from 'react';
import { useWriteContract, useTransaction } from 'wagmi';
import { createWalletClient, custom, parseEther } from 'viem';
import { hardhat } from 'viem/chains';
import { INVOICE_CONTRACT_ADDRESS, InvoiceContractABI } from '../constants/contractABIs';

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceFormData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  paymentMethod: 'ETH' | 'USDC';
  items: LineItem[];
  notes: string;
  subtotal: number;
  tax: number;
  total: number;
}

interface InvoiceFormProps {
  userAddress?: string;
}

const initialFormData: InvoiceFormData = {
  invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  clientName: '',
  clientEmail: '',
  clientAddress: '',
  paymentMethod: 'ETH',
  items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
  notes: '',
  subtotal: 0,
  tax: 0,
  total: 0
};

function InvoiceForm({ userAddress }: InvoiceFormProps) {
  const [formData, setFormData] = useState<InvoiceFormData>(initialFormData);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  // Use wagmi hooks for contract interaction
  const { 
    writeContract, 
    isPending: isWritePending,
    isSuccess: isWriteSuccess,
    error: writeError 
  } = useWriteContract();
  
  // Track transaction status
  const { 
    isLoading: isTxLoading, 
    isSuccess: isTxSuccess 
  } = useTransaction({ 
    hash: txHash as `0x${string}` | undefined
  });
  
  console.log('Contract ABI:', InvoiceContractABI);
  console.log('Contract Address:', INVOICE_CONTRACT_ADDRESS);

  // Look for functions matching 'createInvoice'
  const createInvoiceFunctions = InvoiceContractABI.filter((item: any) => 
    item.name === 'createInvoice'
  );
  console.log('Create Invoice functions in ABI:', createInvoiceFunctions);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleItemChange = (index: number, field: keyof LineItem, value: string | number) => {
    const updatedItems = [...formData.items];
    
    if (field === 'quantity' || field === 'rate') {
      const numValue = parseFloat(value as string) || 0;
      updatedItems[index][field] = numValue;
      updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].rate;
    } else if (field === 'description') {
      updatedItems[index].description = value as string;
    } else {
      throw new Error(`Invalid field: ${field}`);
    }
    
    const subtotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotal * (formData.tax / 100);
    
    setFormData({
      ...formData,
      items: updatedItems,
      subtotal,
      total: subtotal + taxAmount
    });
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, rate: 0, amount: 0 }]
    });
  };

  const removeLineItem = (index: number) => {
    if (formData.items.length === 1) return;
    
    const updatedItems = formData.items.filter((_, i) => i !== index);
    const subtotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotal * (formData.tax / 100);
    
    setFormData({
      ...formData,
      items: updatedItems,
      subtotal,
      total: subtotal + taxAmount
    });
  };

  const handleTaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const taxRate = parseFloat(e.target.value) || 0;
    const taxAmount = formData.subtotal * (taxRate / 100);
    
    setFormData({
      ...formData,
      tax: taxRate,
      total: formData.subtotal + taxAmount
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userAddress) {
      alert('Please connect your wallet first');
      return;
    }
    
    try {
      // Get provider from window.ethereum (MetaMask)
      if (!window.ethereum) {
        alert('MetaMask not found');
        return;
      }
      
      // Create a wallet client using the injected provider
      const walletClient = createWalletClient({
        chain: hardhat,
        transport: custom(window.ethereum)
      });
      
      // Get the account to use
      const [account] = await walletClient.getAddresses();
      console.log('Using account:', account);
      
      // Create a simple transaction to the contract
      const txHash = await walletClient.writeContract({
        address: INVOICE_CONTRACT_ADDRESS as `0x${string}`,
        abi: InvoiceContractABI,
        functionName: 'createInvoice',
        args: [
          // Using account #1 as recipient
          '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as `0x${string}`,
          // Small amount for testing
          parseEther('0.01'),
          // Simple description
          'Test Invoice',
          // Empty ipfs hash
          '',
        ],
        account,
      });
      
      console.log('Transaction submitted:', txHash);
      setTxHash(txHash);
    } catch (error: any) {
      console.error('Transaction error:', error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Create New Invoice</h2>
      
      {/* Show blockchain transaction status */}
      {(isWritePending || isTxLoading) && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          Creating invoice on the blockchain... Please confirm the transaction in your wallet.
        </div>
      )}
      
      {isTxSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Invoice created successfully on the blockchain! Transaction hash: {txHash}
        </div>
      )}
      
      {writeError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {writeError.message || 'Transaction failed'}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 mb-2">Invoice Number</label>
            <input
              type="text"
              name="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Payment Method</label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="ETH">Ethereum (ETH)</option>
              <option value="USDC">USD Coin (USDC)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Client Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Client Name</label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2">Client Email</label>
              <input
                type="email"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-2">Client Address</label>
              <textarea
                name="clientAddress"
                value={formData.clientAddress}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                rows={2}
              />
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Invoice Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full mb-4">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 text-left">Description</th>
                  <th className="p-2 text-right">Quantity</th>
                  <th className="p-2 text-right">Rate</th>
                  <th className="p-2 text-right">Amount</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => (
                  <tr key={index}>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="Item description"
                        required
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-right"
                        min="1"
                        required
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-right"
                        min="0"
                        step="0.01"
                        required
                      />
                    </td>
                    <td className="p-2 text-right">
                      {item.amount.toFixed(2)}
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="text-red-500 hover:text-red-700"
                        disabled={formData.items.length === 1}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <button
            type="button"
            onClick={addLineItem}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            + Add Line Item
          </button>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded"
            rows={3}
            placeholder="Payment terms, additional notes to client..."
          />
        </div>
        
        <div className="flex flex-col items-end mb-6">
          <div className="w-full md:w-1/3">
            <div className="flex justify-between mb-2">
              <span>Subtotal:</span>
              <span>{formData.subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <span>Tax (%):</span>
              <input
                type="number"
                value={formData.tax}
                onChange={handleTaxChange}
                className="w-20 p-1 border border-gray-300 rounded text-right"
                min="0"
                max="100"
                step="0.01"
              />
            </div>
            
            <div className="flex justify-between font-bold text-lg">
              <span>Total ({formData.paymentMethod}):</span>
              <span>{formData.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded mr-2"
          >
            Save as Draft
          </button>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded"
            disabled={isWritePending || isTxLoading}
          >
            {isWritePending || isTxLoading ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
      
      <p className="mt-4 text-sm text-gray-500">
        Creating invoice from wallet: {userAddress ? 
          `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}` : 
          'Not connected'
        }
      </p>
    </div>
  );
}

export default InvoiceForm;
