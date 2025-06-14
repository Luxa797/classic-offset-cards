// src/components/products/ProductMaster.tsx
import React, { useState, useEffect, useCallback } from 'react';
import ProductForm from './ProductForm';
import ProductTable from './ProductTable';
import ProductViewModal from './ProductViewModal'; // View Modal-ஐ இறக்குமதி செய்யவும்
import ConfirmationModal from '../ui/ConfirmationModal'; // உறுதிப்படுத்தல் Modal-ஐ இறக்குமதி செய்யவும்
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

// இந்த பக்கத்திற்கு மட்டும் பொதுவான Product வகை
export interface Product {
  id: number;
  name: string;
  unit_price: number;
  category: string;
  description?: string;
  created_at?: string;
}

const ProductMaster: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSave = async (productData: Omit<Product, 'id' | 'created_at'>) => {
    setFormLoading(true);
    const promise = editingProduct
      ? supabase.from('products').update(productData).eq('id', editingProduct.id)
      : supabase.from('products').insert(productData);

    toast.promise(
      promise.then(({ error }) => {
        if (error) throw error;
      }),
      {
        loading: editingProduct ? 'Updating product...' : 'Adding product...',
        success: `Product "${productData.name}" ${editingProduct ? 'updated' : 'added'}!`,
        error: (err) => err.message || 'Failed to save product.',
      }
    );

    try {
      await promise;
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      // Toast ஏற்கெனவே பிழையைக் காட்டிவிடும்
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    document.getElementById('product-form-card')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleDeleteRequest = (product: Product) => {
    setProductToDelete(product);
  };
  
  const confirmDelete = async () => {
    if (!productToDelete) return;
    setFormLoading(true);
    
    const promise = supabase.from('products').delete().eq('id', productToDelete.id);
    toast.promise(promise, {
        loading: 'Deleting product...',
        success: `Product "${productToDelete.name}" deleted.`,
        error: (err) => err.message || 'Failed to delete product.'
    });

    try {
        await promise;
        fetchProducts();
    } catch (err) {
      // Toast ஏற்கெனவே பிழையைக் காட்டிவிடும்
    } finally {
        setFormLoading(false);
        setProductToDelete(null);
    }
  };

  const handleView = (product: Product) => {
    setViewingProduct(product);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">📦 Products & Services</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Manage all items you offer to customers.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
           <ProductTable 
                products={products}
                loading={loading}
                onView={handleView}
                onEdit={handleEdit} 
                onDelete={handleDeleteRequest}
            />
        </div>
        <div className="lg:col-span-1" id="product-form-card">
            <ProductForm
                editingProduct={editingProduct}
                onSave={handleSave}
                onCancel={() => setEditingProduct(null)}
                isLoading={formLoading}
            />
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        description={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={formLoading}
      />

      <ProductViewModal
        isOpen={!!viewingProduct}
        onClose={() => setViewingProduct(null)}
        product={viewingProduct}
      />
    </div>
  );
};

export default ProductMaster;