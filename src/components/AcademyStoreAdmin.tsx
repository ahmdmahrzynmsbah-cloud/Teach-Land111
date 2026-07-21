import React, { useState, useEffect } from 'react';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { uploadFileToFirebase } from '../lib/upload';
import { Package, Plus, Edit2, Trash2, Tag, DollarSign, Image as ImageIcon, Box, Save, X, BarChart, TrendingUp, Wallet, ShoppingCart, History, User, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
}

interface Item {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  purchasePrice: number;
  sellingPrice: number;
  imageUrl: string;
  stock: number;
  salesCount: number;
}

export default function AcademyStoreAdmin({ userData }: { userData: any }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<'items' | 'categories' | 'analytics' | 'orders'>('items');

  // Form states
  const [catName, setCatName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  
  const [itemTitle, setItemTitle] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemCat, setItemCat] = useState('');
  const [itemPurchase, setItemPurchase] = useState('');
  const [itemSelling, setItemSelling] = useState('');
  const [itemImageFile, setItemImageFile] = useState<File | null>(null);
  const [itemStock, setItemStock] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!userData?.id || userData.role !== 'admin') return;

    const qCats = query(collection(db, 'store_categories'));
    const unsubCats = onSnapshot(qCats, (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    });

    const qItems = query(collection(db, 'store_items'));
    const unsubItems = onSnapshot(qItems, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as Item)));
    });

    const qOrders = query(collection(db, 'store_orders'), orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(qOrders, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubCats();
      unsubItems();
      unsubOrders();
    };
  }, [userData?.id, userData?.role]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      await addDoc(collection(db, 'store_categories'), {
        name: catName,
        createdAt: serverTimestamp()
      });
      setCatName('');
      toast.success('تمت إضافة الفئة بنجاح');
    } catch (err) {
      toast.error('حدث خطأ');
    }
  };

  const handleSaveEditCategory = async (id: string) => {
    if (!editingCategoryName.trim()) return;
    try {
      await updateDoc(doc(db, 'store_categories', id), {
        name: editingCategoryName
      });
      setEditingCategoryId(null);
      setEditingCategoryName('');
      toast.success('تم التعديل بنجاح');
    } catch (err) {
      toast.error('حدث خطأ');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle || !itemCat || !itemPurchase || !itemSelling || !itemStock) {
      toast.error('يرجى تعبئة الحقول الأساسية');
      return;
    }
    
    setIsUploading(true);
    let uploadedImageUrl = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400';

    try {
      if (itemImageFile) {
        toast.success("جاري رفع الصورة للمنصة...");
        uploadedImageUrl = await uploadFileToFirebase(itemImageFile, () => {});
      }

      await addDoc(collection(db, 'store_items'), {
        title: itemTitle,
        description: itemDesc,
        categoryId: itemCat,
        purchasePrice: Number(itemPurchase),
        sellingPrice: Number(itemSelling),
        stock: Number(itemStock),
        salesCount: 0,
        imageUrl: uploadedImageUrl,
        createdAt: serverTimestamp()
      });
      setItemTitle(''); setItemDesc(''); setItemPurchase(''); setItemSelling(''); setItemImageFile(null); setItemStock('');
      toast.success('تم إضافة الصنف بنجاح');
    } catch (err) {
      toast.error('حدث خطأ');
    } finally {
      setIsUploading(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteDoc(doc(db, 'store_categories', categoryToDelete));
      toast.success('تم الحذف');
      setCategoryToDelete(null);
    } catch (err) {
      toast.error('حدث خطأ');
    }
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await deleteDoc(doc(db, 'store_items', itemToDelete));
      toast.success('تم الحذف');
      setItemToDelete(null);
    } catch (err) {
      toast.error('حدث خطأ');
    }
  };

  if (userData?.role !== 'admin') return null;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1A1A24] p-6 rounded-3xl border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">مخزن الأكاديمية</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mt-1">إدارة الأصناف، الكتب، المذكرات والأسعار</p>
            </div>
          </div>
          
          <div className="flex bg-gray-100 dark:bg-[#0D0D12] p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('items')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'items' 
                  ? 'bg-white dark:bg-[#2D2D3D] text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              الأصناف
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'categories' 
                  ? 'bg-white dark:bg-[#2D2D3D] text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              الفئات
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'analytics' 
                  ? 'bg-white dark:bg-[#2D2D3D] text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              الإحصائيات والأرباح
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'orders' 
                  ? 'bg-white dark:bg-[#2D2D3D] text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              سجل الطلبات
            </button>
          </div>
        </div>

        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 dark:bg-[#0D0D12] p-5 rounded-2xl border border-gray-100 dark:border-[#2D2D3D]">
              <h3 className="font-black mb-4 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-500" /> إضافة فئة جديدة
              </h3>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">اسم الفئة</label>
                  <input
                    type="text"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="w-full bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2.5 outline-none focus:border-purple-500 dark:text-white text-sm font-bold"
                    placeholder="مثال: مذكرات الفيزياء"
                    required
                  />
                </div>
                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl transition-colors">
                  إضافة الفئة
                </button>
              </form>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-black mb-4 dark:text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-gray-400" /> الفئات الحالية
              </h3>
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between bg-white dark:bg-[#12121A] p-4 rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                  {editingCategoryId === cat.id ? (
                    <div className="flex items-center gap-2 flex-1 ml-4">
                      <input
                        type="text"
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        className="flex-1 bg-gray-50 dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-lg px-3 py-1.5 outline-none focus:border-purple-500 dark:text-white text-sm font-bold"
                        autoFocus
                      />
                      <button onClick={() => handleSaveEditCategory(cat.id)} className="text-emerald-500 hover:text-emerald-600 p-1">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingCategoryId(null)} className="text-gray-400 hover:text-rose-500 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{cat.name}</span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setEditingCategoryId(cat.id);
                            setEditingCategoryName(cat.name);
                          }} 
                          className="text-gray-400 hover:text-purple-500 transition-colors p-1"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setCategoryToDelete(cat.id)} className="text-gray-400 hover:text-rose-500 transition-colors p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {categories.length === 0 && <p className="text-gray-500 text-sm font-bold">لا توجد فئات بعد.</p>}
            </div>
          </div>
        )}

        {activeTab === 'items' && (
          <div className="space-y-8">
            <form onSubmit={handleAddItem} className="bg-gray-50 dark:bg-[#0D0D12] p-5 rounded-2xl border border-gray-100 dark:border-[#2D2D3D] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-3 mb-2">
                <h3 className="font-black dark:text-white flex items-center gap-2">
                  <Box className="w-5 h-5 text-purple-500" /> إضافة صنف جديد
                </h3>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">اسم الصنف</label>
                <input type="text" value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} className="w-full bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2 outline-none focus:border-purple-500 dark:text-white text-sm font-bold" required />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">الفئة</label>
                <select value={itemCat} onChange={(e) => setItemCat(e.target.value)} className="w-full bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2 outline-none focus:border-purple-500 dark:text-white text-sm font-bold" required>
                  <option value="">اختر الفئة...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">صورة الصنف (اختياري)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setItemImageFile(e.target.files?.[0] || null)} 
                  className="w-full bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2 outline-none focus:border-purple-500 dark:text-white text-sm font-bold file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-600 hover:file:bg-purple-100 cursor-pointer" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">سعر الشراء (التكلفة)</label>
                <input type="number" value={itemPurchase} onChange={(e) => setItemPurchase(e.target.value)} className="w-full bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2 outline-none focus:border-purple-500 dark:text-white text-sm font-bold font-mono" required />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">سعر البيع للطالب</label>
                <input type="number" value={itemSelling} onChange={(e) => setItemSelling(e.target.value)} className="w-full bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2 outline-none focus:border-purple-500 dark:text-white text-sm font-bold font-mono" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">عدد النسخ (المخزون)</label>
                <input type="number" value={itemStock} onChange={(e) => setItemStock(e.target.value)} className="w-full bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2 outline-none focus:border-purple-500 dark:text-white text-sm font-bold font-mono" required />
              </div>
              
              <div className="lg:col-span-3">
                <label className="block text-xs font-bold text-gray-500 mb-1">وصف الصنف</label>
                <textarea value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} className="w-full bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-4 py-2 outline-none focus:border-purple-500 dark:text-white text-sm font-bold h-20 resize-none" />
              </div>

              <div className="lg:col-span-3">
                <button 
                  type="submit" 
                  disabled={isUploading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-2.5 px-6 rounded-xl transition-colors"
                >
                  {isUploading ? 'جاري الإضافة والرفع...' : 'إضافة الصنف'}
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map(item => {
                const cat = categories.find(c => c.id === item.categoryId);
                return (
                  <div key={item.id} className="bg-white dark:bg-[#12121A] border border-gray-150 dark:border-[#2D2D3D] rounded-2xl overflow-hidden hover:shadow-md transition-shadow group">
                    <div className="h-40 bg-gray-100 dark:bg-[#0D0D12] relative">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-lg font-bold">
                        {cat?.name || 'بدون فئة'}
                      </div>
                      <button 
                        onClick={() => setItemToDelete(item.id)}
                        className="absolute top-2 left-2 bg-white/90 dark:bg-black/60 text-rose-500 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-4 space-y-3">
                      <h4 className="font-black text-gray-900 dark:text-white line-clamp-1">{item.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[32px]">{item.description}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-[#2D2D3D]">
                        <div className="text-xs">
                          <span className="text-gray-400 block mb-0.5">شراء</span>
                          <span className="font-mono font-bold text-gray-600 dark:text-gray-300">{item.purchasePrice} ج</span>
                        </div>
                        <div className="text-xs text-left">
                          <span className="text-gray-400 block mb-0.5">بيع</span>
                          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{item.sellingPrice} ج</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-[#2D2D3D] text-xs">
                        <div className="text-gray-500">
                          <span className="block mb-0.5 text-gray-400">المخزون</span>
                          <span className={`font-mono font-bold ${item.stock > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-500'}`}>{item.stock || 0}</span>
                        </div>
                        <div className="text-gray-500 text-left">
                          <span className="block mb-0.5 text-gray-400">المبيعات</span>
                          <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{item.salesCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {items.length === 0 && <p className="text-gray-500 text-center py-10 font-bold">لم يتم إضافة أي أصناف بعد.</p>}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="bg-white dark:bg-[#12121A] p-3 rounded-2xl border border-gray-100 dark:border-[#2D2D3D]">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 shrink-0 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">إجمالي الأصناف</p>
                    <p className="text-base font-black dark:text-white">{items.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-[#12121A] p-3 rounded-2xl border border-gray-100 dark:border-[#2D2D3D]">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 shrink-0 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">المبيعات (نسخة)</p>
                    <p className="text-base font-black dark:text-white">{items.reduce((acc, item) => acc + (item.salesCount || 0), 0)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-[#12121A] p-3 rounded-2xl border border-gray-100 dark:border-[#2D2D3D]">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 shrink-0 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">إجمالي الإيرادات</p>
                    <p className="text-base font-black dark:text-white font-mono">{items.reduce((acc, item) => acc + (item.sellingPrice * (item.salesCount || 0)), 0)} <span className="text-[10px]">ج.م</span></p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-[#12121A] p-3 rounded-2xl border border-gray-100 dark:border-[#2D2D3D]">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 shrink-0 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-600">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">إجمالي التكاليف</p>
                    <p className="text-base font-black dark:text-white font-mono">{items.reduce((acc, item) => acc + (item.purchasePrice * (item.salesCount || 0)), 0)} <span className="text-[10px]">ج.م</span></p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-[#12121A] p-3 rounded-2xl border border-gray-100 dark:border-[#2D2D3D]">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 shrink-0 bg-rose-50 dark:bg-rose-900/20 rounded-xl flex items-center justify-center text-rose-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">صافي الأرباح</p>
                    <p className="text-base font-black dark:text-white font-mono">{items.reduce((acc, item) => acc + ((item.sellingPrice - item.purchasePrice) * (item.salesCount || 0)), 0)} <span className="text-[10px]">ج.م</span></p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-[#12121A] p-5 rounded-2xl border border-gray-100 dark:border-[#2D2D3D]">
              <h3 className="font-black dark:text-white mb-4 flex items-center gap-2">
                <BarChart className="w-5 h-5 text-purple-500" />
                الأصناف الأكثر مبيعاً
              </h3>
              <div className="space-y-3">
                {items.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0)).slice(0, 5).map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#0D0D12] rounded-xl border border-gray-100 dark:border-[#2D2D3D]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white dark:bg-[#1A1A24] rounded-lg flex items-center justify-center font-bold text-gray-400">
                        {index + 1}
                      </div>
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 dark:border-[#2D2D3D]">
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{item.title}</h4>
                        <p className="text-xs text-gray-500">{categories.find(c => c.id === item.categoryId)?.name || 'بدون فئة'}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-purple-600 dark:text-purple-400 text-sm">{item.salesCount || 0} نسخة</p>
                      <p className="text-xs text-emerald-500 font-mono font-bold">+{(item.sellingPrice - item.purchasePrice) * (item.salesCount || 0)} ج</p>
                    </div>
                  </div>
                ))}
                {items.length === 0 && <p className="text-gray-500 text-sm font-bold text-center py-4">لا توجد بيانات متاحة.</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white dark:bg-[#12121A] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-[#2D2D3D] flex items-center justify-between">
              <h3 className="font-black dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-purple-500" />
                سجل الطلبات والمشتريات
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#0D0D12] text-right">
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400">الطالب</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400">الصنف المشتراة</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400">المبلغ</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400">التاريخ</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 text-left">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#2D2D3D]">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-[#1A1A24] transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-900 dark:text-white">{order.studentName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{order.itemTitle}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{order.amount} ج.م</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-500 font-mono" dir="ltr">
                          {new Date(order.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-left">
                        <span className="inline-block px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg">
                          مكتمل
                        </span>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500 font-bold text-sm">
                        لا توجد طلبات بعد.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Category Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative border border-gray-200 dark:border-[#2D2D3D]">
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">تأكيد الحذف</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-6">
                هل أنت متأكد من رغبتك في حذف هذه الفئة؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setCategoryToDelete(null)}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-[#2D2D3D] dark:hover:bg-[#3D3D52] text-gray-700 dark:text-white rounded-xl font-bold transition-colors text-sm"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmDeleteCategory}
                  className="flex-1 px-4 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-rose-500/20 text-sm flex items-center justify-center gap-2"
                >
                  نعم، احذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative border border-gray-200 dark:border-[#2D2D3D]">
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">تأكيد الحذف</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-6">
                هل أنت متأكد من رغبتك في حذف هذا الصنف؟ لا يمكن التراجع عن هذا الإجراء وسيتم حذفه من المتجر.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-[#2D2D3D] dark:hover:bg-[#3D3D52] text-gray-700 dark:text-white rounded-xl font-bold transition-colors text-sm"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmDeleteItem}
                  className="flex-1 px-4 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-rose-500/20 text-sm flex items-center justify-center gap-2"
                >
                  نعم، احذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
