import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import TextArea from '../ui/TextArea';
import { Package, ShoppingCart, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface StockItem {
  id: string;
  item_name: string;
  balance: number;
  unit_of_measurement: string;
  source: 'existing_stock' | 'materials';
  category?: string;
  supplier_name?: string;
  storage_location?: string;
}

const UseStockForm: React.FC = () => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [selectedSource, setSelectedSource] = useState<'existing_stock' | 'materials' | 'all'>('all');
  const [stockId, setStockId] = useState('');
  const [usedQuantity, setUsedQuantity] = useState('');
  const [usedFor, setUsedFor] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingItems, setFetchingItems] = useState(true);
  const [message, setMessage] = useState('');

  const fetchStockList = async () => {
    setFetchingItems(true);
    try {
      const stockPromises = [];

      // Fetch existing stock if needed
      if (selectedSource === 'all' || selectedSource === 'existing_stock') {
        stockPromises.push(
          supabase
            .from('stock')
            .select('id, item_name, quantity_in, quantity_used, category')
            .then(({ data, error }) => {
              if (error) throw error;
              return (data || []).map((item) => ({
                id: `existing_${item.id}`,
                item_name: `${item.item_name} (Existing Stock)`,
                balance: (item.quantity_in || 0) - (item.quantity_used || 0),
                unit_of_measurement: 'pieces',
                source: 'existing_stock' as const,
                category: item.category,
                storage_location: 'Existing Stock'
              }));
            })
        );
      }

      // Fetch materials if needed
      if (selectedSource === 'all' || selectedSource === 'materials') {
        stockPromises.push(
          supabase
            .from('materials_with_details')
            .select('id, material_name, current_quantity, unit_of_measurement, category_name, supplier_name, storage_location')
            .then(({ data, error }) => {
              if (error) throw error;
              return (data || []).map((item) => ({
                id: `material_${item.id}`,
                item_name: `${item.material_name} (Materials)`,
                balance: item.current_quantity || 0,
                unit_of_measurement: item.unit_of_measurement || 'pieces',
                source: 'materials' as const,
                category: item.category_name,
                supplier_name: item.supplier_name,
                storage_location: item.storage_location
              }));
            })
        );
      }

      const results = await Promise.all(stockPromises);
      const combinedItems = results.flat().filter(item => item.balance > 0);
      
      // Sort by item name
      combinedItems.sort((a, b) => a.item_name.localeCompare(b.item_name));
      
      setStockItems(combinedItems);
    } catch (error) {
      console.error('Error fetching stock list:', error);
      setMessage('❌ Failed to load stock items. Please try again.');
    } finally {
      setFetchingItems(false);
    }
  };

  useEffect(() => {
    fetchStockList();
  }, [selectedSource]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const selected = stockItems.find((s) => s.id === stockId);
    if (!selected) {
      setMessage('❌ Please select a valid stock item.');
      setLoading(false);
      return;
    }

    const usedQty = Number(usedQuantity);
    if (usedQty <= 0) {
      setMessage('❌ Quantity must be greater than zero.');
      setLoading(false);
      return;
    }

    if (usedQty > selected.balance) {
      setMessage('❌ Cannot use more than available balance.');
      setLoading(false);
      return;
    }

    try {
      if (selected.source === 'existing_stock') {
        // Handle existing stock usage
        const originalId = selected.id.replace('existing_', '');
        
        // 1. Add to usage log (existing stock)
        const { error: logError } = await supabase.from('stock_usage_log').insert([
          {
            stock_id: parseInt(originalId),
            used_quantity: usedQty,
            used_for: usedFor,
            notes: notes || null,
          },
        ]);

        if (logError) throw logError;

        // 2. Update quantity_used in stock table
        const { error: updateError } = await supabase.rpc('increment_quantity_used', {
          stock_id_input: parseInt(originalId),
          additional_used: usedQty,
        });

        if (updateError) throw updateError;

      } else {
        // Handle materials usage
        const materialId = selected.id.replace('material_', '');
        
        // Add transaction to material_transactions
        const { error: transactionError } = await supabase.from('material_transactions').insert([
          {
            material_id: materialId,
            transaction_type: 'OUT',
            quantity: usedQty,
            notes: `Used for: ${usedFor}${notes ? ` | Notes: ${notes}` : ''}`,
          },
        ]);

        if (transactionError) throw transactionError;
      }

      setMessage('✅ Stock usage recorded successfully!');
      setStockId('');
      setUsedQuantity('');
      setUsedFor('');
      setNotes('');
      fetchStockList(); // Refresh the list
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(''), 3000);

    } catch (error: any) {
      console.error('Error recording stock usage:', error);
      setMessage(`❌ Failed to record usage: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const selectedItem = stockItems.find(item => item.id === stockId);

  return (
    <Card>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            📤 Record Stock Usage
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Track consumption from both existing stock and materials inventory
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Source Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Stock Source
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedSource('all')}
                className={`p-2 text-xs rounded-lg border transition-colors ${
                  selectedSource === 'all'
                    ? 'bg-primary-100 border-primary-300 text-primary-700 dark:bg-primary-900/30 dark:border-primary-600 dark:text-primary-300'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                }`}
              >
                <Package className="w-4 h-4 mx-auto mb-1" />
                All Sources
              </button>
              <button
                type="button"
                onClick={() => setSelectedSource('existing_stock')}
                className={`p-2 text-xs rounded-lg border transition-colors ${
                  selectedSource === 'existing_stock'
                    ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-300'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                }`}
              >
                <Package className="w-4 h-4 mx-auto mb-1" />
                Existing Stock
              </button>
              <button
                type="button"
                onClick={() => setSelectedSource('materials')}
                className={`p-2 text-xs rounded-lg border transition-colors ${
                  selectedSource === 'materials'
                    ? 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900/30 dark:border-purple-600 dark:text-purple-300'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                }`}
              >
                <ShoppingCart className="w-4 h-4 mx-auto mb-1" />
                Materials
              </button>
            </div>
          </div>

          {/* Item Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Item *
            </label>
            {fetchingItems ? (
              <div className="flex items-center justify-center py-3 border rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm text-gray-500">Loading stock items...</span>
              </div>
            ) : (
              <select
                value={stockId}
                onChange={(e) => setStockId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="">-- Select Item --</option>
                {stockItems.map((stock) => (
                  <option key={stock.id} value={stock.id}>
                    {stock.item_name} | Available: {stock.balance} {stock.unit_of_measurement}
                    {stock.category && ` | ${stock.category}`}
                  </option>
                ))}
              </select>
            )}
            {stockItems.length === 0 && !fetchingItems && (
              <p className="text-sm text-gray-500 mt-1">
                No stock items available for the selected source.
              </p>
            )}
          </div>

          {/* Selected Item Details */}
          {selectedItem && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Selected Item Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Available:</span>
                  <span className="font-semibold ml-1">{selectedItem.balance} {selectedItem.unit_of_measurement}</span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Source:</span>
                  <span className="ml-1">{selectedItem.source === 'existing_stock' ? 'Existing Stock' : 'Materials'}</span>
                </div>
                {selectedItem.category && (
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Category:</span>
                    <span className="ml-1">{selectedItem.category}</span>
                  </div>
                )}
                {selectedItem.supplier_name && (
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Supplier:</span>
                    <span className="ml-1">{selectedItem.supplier_name}</span>
                  </div>
                )}
                {selectedItem.storage_location && (
                  <div className="col-span-2">
                    <span className="text-blue-700 dark:text-blue-300">Location:</span>
                    <span className="ml-1">{selectedItem.storage_location}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <Input
            label="Quantity Used *"
            name="used_quantity"
            type="number"
            step="0.01"
            min="0.01"
            value={usedQuantity}
            onChange={(e) => setUsedQuantity(e.target.value)}
            placeholder="Enter quantity used"
            required
          />

          <Input
            label="Used For *"
            name="used_for"
            placeholder="e.g., Order #123, Production Batch A, Maintenance"
            value={usedFor}
            onChange={(e) => setUsedFor(e.target.value)}
            required
          />

          <TextArea
            id="notes"
            label="Additional Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional details about this usage..."
            rows={3}
          />

          <Button 
            type="submit" 
            disabled={loading || fetchingItems || !stockId}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Recording Usage...
              </>
            ) : (
              'Record Stock Usage'
            )}
          </Button>

          {message && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              message.includes('✅') 
                ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700'
                : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'
            }`}>
              {message.includes('✅') ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>{message}</span>
            </div>
          )}
        </form>
      </div>
    </Card>
  );
};

export default UseStockForm;