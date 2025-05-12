import React, { useState } from 'react';
import { useWriteContract, useTransaction } from 'wagmi';
import { createWalletClient, custom, parseEther } from 'viem';
import { hardhat } from 'viem/chains';
import { INVOICE_CONTRACT_ADDRESS, InvoiceContractABI } from '../constants/contractABIs';
import { INVOICE_CONTRACT_ADDRESS as CONTRACT_ADDRESS } from '../constants/contractAddresses';

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
      console.log('Using contract address:', CONTRACT_ADDRESS);
      console.log('Using ABI:', JSON.stringify(InvoiceContractABI).substring(0, 100) + '...');
      console.log('Using account:', account);
      
      const txHash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: InvoiceContractABI,
        functionName: 'createInvoice',
        args: [
          formData.clientAddress ? 
            formData.clientAddress as `0x${string}` : 
            '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as `0x${string}`,
          parseEther(formData.total.toString()),
          formData.items[0]?.description || 'Invoice',
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
    <div className="w-full bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 bg-gradient-to-r from-blue-500 to-indigo-600">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Create New Invoice</h2>
        <p className="text-blue-100 mt-1 text-sm sm:text-base">Fill out the details below to create a blockchain invoice</p>
      </div>
      
      {/* Transaction status indicators */}
      {(isWritePending || isTxLoading) && (
        <div className="mx-4 sm:mx-6 md:mx-8 my-3 sm:my-4 flex p-3 sm:p-4 bg-blue-50 rounded-md">
          <svg className="animate-spin h-5 w-5 mr-2 sm:mr-3 text-blue-500 flex-shrink-0" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div>
            <p className="font-medium text-blue-800 text-sm sm:text-base">Creating invoice on blockchain...</p>
            <p className="text-xs sm:text-sm text-blue-600">Please confirm the transaction in your wallet</p>
          </div>
        </div>
      )}
      
      {isTxSuccess && (
        <div className="mx-4 sm:mx-6 md:mx-8 my-3 sm:my-4 p-3 sm:p-4 bg-green-50 border border-green-100 rounded-md">
          <div className="flex">
            <svg className="h-5 w-5 text-green-500 mr-2 sm:mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="font-medium text-green-800 text-sm sm:text-base">Invoice created successfully!</p>
              <p className="text-xs sm:text-sm text-green-600 mt-1">
                Transaction hash: {txHash?.substring(0, 6)}...{txHash?.substring(txHash?.length - 6)}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {writeError && (
        <div className="mx-4 sm:mx-6 md:mx-8 my-3 sm:my-4 p-3 sm:p-4 bg-red-50 border border-red-100 rounded-md">
          <div className="flex">
            <svg className="h-5 w-5 text-red-500 mr-2 sm:mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-red-800 text-sm sm:text-base">Error creating invoice</p>
              <p className="text-xs sm:text-sm text-red-600 mt-1">{writeError.message || 'Transaction failed'}</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8">
        {/* Invoice Details Section */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 pb-2 border-b border-gray-200 mb-3 sm:mb-4">Invoice Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Number
              </label>
              <input
                id="invoiceNumber"
                type="text"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                required
              />
            </div>
            
            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Currency
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="ETH">Ethereum (ETH)</option>
                <option value="USDC">USD Coin (USDC)</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Issue Date
              </label>
              <input
                id="date"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                required
              />
            </div>
            
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                id="dueDate"
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                required
              />
            </div>
          </div>
        </div>
        
        {/* Client Information section */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 pb-2 border-b border-gray-200 mb-3 sm:mb-4">Client Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
                Client Name
              </label>
              <input
                id="clientName"
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                required
              />
            </div>
            
            <div>
              <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Client Email
              </label>
              <input
                id="clientEmail"
                type="email"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="clientAddress" className="block text-sm font-medium text-gray-700 mb-1">
                Client Wallet Address <span className="text-gray-500 text-xs">(recipient)</span>
              </label>
              <input
                id="clientAddress"
                type="text"
                name="clientAddress"
                value={formData.clientAddress}
                onChange={handleInputChange}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                The wallet address that will receive this invoice (default: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8)
              </p>
            </div>
          </div>
        </div>
        
        {/* Invoice Items */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 pb-2 border-b border-gray-200 mb-3 sm:mb-4">Invoice Items</h3>
          
          {/* Mobile view for invoice items (Visible on small screens) */}
          <div className="md:hidden space-y-4 mb-4">
            {formData.items.map((item, index) => (
              <div key={`mobile-item-${index}`} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                <div className="mb-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="Item description"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-right text-sm"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Rate</label>
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-right text-sm"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Amount</label>
                    <div className="w-full px-2 py-1 border border-gray-300 bg-gray-100 rounded-md shadow-sm text-right text-sm">
                      {item.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => removeLineItem(index)}
                    className="text-xs text-red-600 hover:text-red-900 disabled:opacity-50"
                    disabled={formData.items.length === 1}
                  >
                    Remove Item
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Desktop view for invoice items (Visible on medium screens and up) */}
          <div className="hidden md:block overflow-x-auto bg-gray-50 rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Quantity
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Rate
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Amount
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formData.items.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="Item description"
                        required
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-right text-sm"
                        min="1"
                        required
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-right text-sm"
                        min="0"
                        step="0.01"
                        required
                      />
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      {item.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 text-sm"
                        disabled={formData.items.length === 1}
                      >
                        Remove
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
            className="mt-4 inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="-ml-1 mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Item
          </button>
        </div>
        
        {/* Notes */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 pb-2 border-b border-gray-200 mb-3 sm:mb-4">Additional Information</h3>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              placeholder="Payment terms, delivery information, or any other notes to the client..."
            ></textarea>
          </div>
        </div>
        
        {/* Totals */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-gray-50 p-4 sm:p-6 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-2 sm:mb-3">
              <span className="text-sm text-gray-600">Subtotal:</span>
              <span className="text-sm sm:text-base text-gray-900 font-medium">{formData.subtotal.toFixed(2)} {formData.paymentMethod}</span>
            </div>
            
            <div className="flex justify-between items-center mb-2 sm:mb-3">
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">Tax (%):</span>
                <input
                  type="number"
                  value={formData.tax}
                  onChange={handleTaxChange}
                  className="w-14 sm:w-16 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-right text-sm"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
              <span className="text-sm sm:text-base text-gray-900 font-medium">
                {(formData.subtotal * (formData.tax / 100)).toFixed(2)} {formData.paymentMethod}
              </span>
            </div>
            
            <div className="pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-gray-200 flex justify-between items-center">
              <span className="text-base sm:text-lg font-semibold text-gray-900">Total:</span>
              <span className="text-lg sm:text-xl font-bold text-indigo-600">
                {formData.total.toFixed(2)} {formData.paymentMethod}
              </span>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-4">
          <button
            type="button"
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save as Draft
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isWritePending || isTxLoading}
          >
            {isWritePending || isTxLoading ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
      
      <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-gray-50 border-t border-gray-200 text-xs sm:text-sm text-gray-500">
        Creating invoice from wallet: {userAddress ? 
          `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}` : 
          'Not connected'
        }
      </div>
    </div>
  );
}

export default InvoiceForm;
