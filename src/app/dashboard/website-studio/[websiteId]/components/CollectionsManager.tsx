'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Layers,
  Edit,
  Trash2,
  Package,
  ArrowRight,
  X,
  Check,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import { Collection, Product } from '../commerce-types';
import CollectionFormModal from './CollectionFormModal';

interface CollectionsManagerProps {
  collections: Collection[];
  products: Product[];
  onSaveCollection: (collectionData: Partial<Collection>) => Promise<void>;
  onDeleteCollection: (collectionId: string) => Promise<void>;
  onSaveProduct: (productData: Partial<Product>) => Promise<void>;
}

export default function CollectionsManager({
  collections,
  products,
  onSaveCollection,
  onDeleteCollection,
  onSaveProduct
}: CollectionsManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Add Product to Collection Drawer/Modal
  const [isAddProductsOpen, setIsAddProductsOpen] = useState(false);

  // Search filter
  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q)
      );
    });
  }, [collections, searchQuery]);

  // Selected collection for detail view
  const activeCollection = useMemo(() => {
    if (!selectedCollectionId) return null;
    return collections.find((c) => c.id === selectedCollectionId) || null;
  }, [collections, selectedCollectionId]);

  // Products belonging to active collection
  const activeCollectionProducts = useMemo(() => {
    if (!activeCollection) return [];
    return products.filter((p) =>
      activeCollection.productIds.includes(p.id) || (p.collections || []).includes(activeCollection.id)
    );
  }, [activeCollection, products]);

  // Products NOT in active collection (for "Add Products" picker)
  const availableProductsToAdd = useMemo(() => {
    if (!activeCollection) return [];
    return products.filter((p) => !activeCollection.productIds.includes(p.id));
  }, [activeCollection, products]);

  const handleCreate = () => {
    setEditingCollection(null);
    setIsModalOpen(true);
  };

  const handleEdit = (c: Collection) => {
    setEditingCollection(c);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeleteCollection(id);
      if (selectedCollectionId === id) setSelectedCollectionId(null);
      setDeleteConfirmId(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Remove a product from active collection
  const handleRemoveProductFromCollection = async (productId: string) => {
    if (!activeCollection) return;
    const updatedProductIds = activeCollection.productIds.filter((id) => id !== productId);
    await onSaveCollection({
      id: activeCollection.id,
      productIds: updatedProductIds
    });
  };

  // Add products to active collection
  const handleAddProductToActiveCollection = async (productId: string) => {
    if (!activeCollection) return;
    if (activeCollection.productIds.includes(productId)) return;
    const updatedProductIds = [...activeCollection.productIds, productId];
    await onSaveCollection({
      id: activeCollection.id,
      productIds: updatedProductIds
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-indigo-600" /> Collections
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Curate and group your products into collections (e.g. Summer Collection, Best Sellers, New Arrivals).
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Collection
        </button>
      </div>

      {/* Detail View of a Selected Collection */}
      {activeCollection ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {/* Header Banner */}
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-indigo-50/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={activeCollection.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=200'}
                alt={activeCollection.title}
                className="w-16 h-16 rounded-2xl object-cover border border-gray-200 shadow-xs"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-gray-900">{activeCollection.title}</h3>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                    {activeCollectionProducts.length} Products
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 max-w-lg">
                  {activeCollection.description || 'No description provided.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => setIsAddProductsOpen(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Products
              </button>
              <button
                onClick={() => handleEdit(activeCollection)}
                className="p-2 border border-gray-200 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors"
                title="Edit Collection"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedCollectionId(null)}
                className="px-3 py-1.5 border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-semibold text-gray-700 transition-colors"
              >
                Back to All
              </button>
            </div>
          </div>

          {/* Products List inside Collection */}
          <div className="p-6">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-4">
              Products in this Collection ({activeCollectionProducts.length})
            </h4>

            {activeCollectionProducts.length === 0 ? (
              <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-700">No products in this collection yet</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Click "Add Products" above to include products in this collection.
                </p>
                <button
                  onClick={() => setIsAddProductsOpen(true)}
                  className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Select Products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {activeCollectionProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3 bg-white rounded-xl border border-gray-200 hover:border-indigo-200 transition-all shadow-xs flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-100 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{prod.name}</p>
                        <p className="text-[11px] text-indigo-600 font-semibold">${prod.price.toFixed(2)}</p>
                        <p className="text-[10px] text-gray-400">{prod.stock} in stock</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveProductFromCollection(prod.id)}
                      className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove from collection"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Search bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search collections by title or description..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Collections Grid */}
          {filteredCollections.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 shadow-xs">
              <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-gray-800">No collections found</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                {searchQuery ? 'No collection matched your search.' : 'Create your first collection to organize products.'}
              </p>
              <button
                onClick={handleCreate}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Create Collection
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredCollections.map((col) => {
                const count = products.filter((p) =>
                  col.productIds.includes(p.id) || (p.collections || []).includes(col.id)
                ).length;

                return (
                  <div
                    key={col.id}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col group"
                  >
                    {/* Collection Image */}
                    <div
                      onClick={() => setSelectedCollectionId(col.id)}
                      className="h-36 w-full relative bg-gray-100 cursor-pointer overflow-hidden"
                    >
                      <img
                        src={col.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800'}
                        alt={col.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-black text-gray-800 shadow-xs">
                        {count} {count === 1 ? 'Product' : 'Products'}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4
                          onClick={() => setSelectedCollectionId(col.id)}
                          className="font-bold text-sm text-gray-900 group-hover:text-indigo-600 cursor-pointer transition-colors"
                        >
                          {col.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {col.description || 'Curated collection.'}
                        </p>
                      </div>

                      <div className="pt-4 mt-3 border-t border-gray-100 flex items-center justify-between">
                        <button
                          onClick={() => setSelectedCollectionId(col.id)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                        >
                          View Products <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(col)}
                            className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(col.id)}
                            className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Add Products to Active Collection Modal */}
      {isAddProductsOpen && activeCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-sm font-bold text-gray-900">
                Add Products to {activeCollection.title}
              </h3>
              <button
                onClick={() => setIsAddProductsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {availableProductsToAdd.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">
                  All available products are already in this collection!
                </p>
              ) : (
                availableProductsToAdd.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-xl border border-gray-200 flex items-center justify-between hover:bg-indigo-50/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={p.image} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{p.name}</p>
                        <p className="text-[10px] text-gray-400">${p.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddProductToActiveCollection(p.id)}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end mt-4">
              <button
                onClick={() => setIsAddProductsOpen(false)}
                className="px-4 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collection Form Modal */}
      <CollectionFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCollection(null);
        }}
        onSave={onSaveCollection}
        collection={editingCollection}
        products={products}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Delete Collection?</h3>
            <p className="text-xs text-gray-500 mt-1">
              Are you sure? Products in this collection will not be deleted, but they will no longer belong to this collection.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
