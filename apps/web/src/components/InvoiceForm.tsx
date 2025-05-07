import React, { useState } from 'react';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Invoice data:', formData);
    // Here you would typically send the data to your backend or blockchain
    alert('Invoice created successfully!');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Create New Invoice</h2>
      
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
          >
            Create Invoice
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
