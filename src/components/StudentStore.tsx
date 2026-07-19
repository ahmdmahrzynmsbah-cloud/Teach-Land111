import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ShoppingCart, Tag, AlertCircle, CheckCircle2, Ticket, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Item {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  sellingPrice: number;
  imageUrl: string;
  stock: number;
  salesCount: number;
}

interface Category {
  id: string;
  name: string;
}

export default function StudentStore({ userData, setUserData }: { userData: any, setUserData: (data: any) => void }) {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [purchasedItemIds, setPurchasedItemIds] = useState<Set<string>>(new Set());
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  useEffect(() => {
    if (!userData?.id || userData.role !== 'student') return;

    const qCats = query(collection(db, 'store_categories'));
    const unsubCats = onSnapshot(qCats, (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    });

    const qItems = query(collection(db, 'store_items'));
    const unsubItems = onSnapshot(qItems, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as Item)));
    });

    const qOrders = query(collection(db, 'store_orders'), where('studentId', '==', userData.id));
    const unsubOrders = onSnapshot(qOrders, (snap) => {
      const purchasedIds = new Set<string>();
      snap.forEach(doc => {
        const data = doc.data();
        if (data.status !== 'cancelled') {
           purchasedIds.add(data.itemId);
        }
      });
      setPurchasedItemIds(purchasedIds);
    });

    return () => {
      unsubCats();
      unsubItems();
      unsubOrders();
    };
  }, [userData?.id, userData?.role]);

  const handlePurchase = async (item: Item) => {
    const balance = userData?.balance || 0;
    
    if (item.stock <= 0) {
      toast.error('نفذت الكمية من هذا الصنف.');
      return;
    }

    if (balance < item.sellingPrice) {
      toast.error('رصيد المحفظة غير كافٍ. يرجى شحن رصيدك.');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Deduct from wallet
      const newBalance = balance - item.sellingPrice;
      await updateDoc(doc(db, 'users', userData.id), {
        balance: newBalance
      });
      
      // Update local state
      setUserData({ ...userData, balance: newBalance });

      // 2. Add wallet transaction
      await addDoc(collection(db, 'wallet_transactions'), {
        userId: userData.id,
        userName: userData.name,
        amount: -item.sellingPrice,
        type: 'store_purchase',
        description: `شراء من المتجر: ${item.title}`,
        createdAt: new Date().toISOString()
      });

      // 3. Create store order / invoice
      await addDoc(collection(db, 'store_orders'), {
        studentId: userData.id,
        studentName: userData.name,
        linkedParentId: userData.linkedParentId || null,
        itemId: item.id,
        itemTitle: item.title,
        amount: item.sellingPrice,
        date: new Date().toISOString(),
        status: 'completed',
        createdAt: serverTimestamp()
      });

      // 4. Update item stock and sales count
      const newStock = (item.stock || 0) - 1;
      await updateDoc(doc(db, 'store_items', item.id), {
        stock: newStock,
        salesCount: (item.salesCount || 0) + 1
      });

      // 5. Check if stock reached threshold and notify admins
      if (newStock === 5 || newStock === 0) {
        try {
          const adminQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
          const adminDocs = await getDocs(adminQuery);
          
          adminDocs.forEach(async (adminDoc) => {
            await addDoc(collection(db, 'notifications'), {
              userId: adminDoc.id,
              title: newStock === 0 ? "نفاد كمية صنف بالمخزن 🚨" : "تنبيه: انخفاض مخزون صنف ⚠️",
              message: newStock === 0 
                ? `نفذت كمية الصنف "${item.title}" من المتجر بالكامل.` 
                : `الصنف "${item.title}" انخفض مخزونه إلى ${newStock} نسخة فقط. يرجى مراجعة المتجر.`,
              read: false,
              createdAt: new Date().toISOString(),
              type: "system"
            });
          });
        } catch (error) {
          console.error("Failed to notify admins about low stock:", error);
        }
      }

      toast.success('تمت عملية الشراء بنجاح');
      setSelectedItem(null);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء إتمام عملية الشراء');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredItems = selectedCat === 'all' ? items : items.filter(i => i.categoryId === selectedCat);

  if (userData?.role !== 'student') return null;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#00B4D8]/10 text-[#00B4D8] rounded-2xl flex items-center justify-center">
              <ShoppingCart className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">متجر الأكاديمية</h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">اشترِ المذكرات والكتب باستخدام رصيد محفظتك</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#12121A] p-3 rounded-2xl border border-gray-100 dark:border-[#2D2D3D]">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-500">الرصيد المتاح</span>
              <span className="block text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">{userData?.balance || 0} ج.م</span>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
          <button
            onClick={() => setSelectedCat('all')}
            className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              selectedCat === 'all'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                : 'bg-gray-100 dark:bg-[#2D2D3D] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3D3D52]'
            }`}
          >
            الكل
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                selectedCat === cat.id
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                  : 'bg-gray-100 dark:bg-[#2D2D3D] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3D3D52]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => {
            const catName = categories.find(c => c.id === item.categoryId)?.name || 'غير مصنف';
            const isPurchased = purchasedItemIds.has(item.id);
            
            return (
              <div key={item.id} className="bg-white dark:bg-[#12121A] border border-gray-150 dark:border-[#2D2D3D] rounded-3xl overflow-hidden hover:shadow-lg transition-all group flex flex-col">
                <div className="h-48 bg-gray-100 dark:bg-[#0D0D12] relative overflow-hidden">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md text-white text-[10px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5">
                    <Tag className="w-3 h-3" /> {catName}
                  </div>
                  {isPurchased && (
                    <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[2px] flex items-center justify-center z-10">
                      <div className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold transform -rotate-12 border-2 border-white shadow-xl flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        تم الشراء
                      </div>
                    </div>
                  )}
                  {!isPurchased && item.stock <= 5 && item.stock > 0 && (
                    <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 animate-pulse">
                      باقي {item.stock} فقط
                    </div>
                  )}
                  {!isPurchased && item.stock <= 0 && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                      <div className="bg-rose-500 text-white px-4 py-2 rounded-xl font-bold transform -rotate-12 border-2 border-white dark:border-[#12121A] shadow-xl">
                        نفذت الكمية
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-black text-gray-900 dark:text-white mb-2 line-clamp-1">{item.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 flex-1 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-[#2D2D3D]">
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">{item.sellingPrice} ج.م</span>
                    <button
                      onClick={() => setSelectedItem(item)}
                      disabled={item.stock <= 0 || isPurchased}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-lg ${isPurchased ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 cursor-not-allowed shadow-none' : item.stock <= 0 ? 'bg-gray-300 dark:bg-[#2D2D3D] text-gray-500 cursor-not-allowed shadow-none' : 'bg-[#00B4D8] hover:bg-[#0096B4] text-white shadow-[#00B4D8]/20'}`}
                    >
                      {isPurchased ? 'تم الشراء' : item.stock <= 0 ? 'غير متاح' : 'شراء الآن'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredItems.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-50 dark:bg-[#12121A] rounded-full flex items-center justify-center mb-4">
              <Package className="w-10 h-10 text-gray-400 opacity-50" />
            </div>
            <h3 className="text-lg font-black text-gray-800 dark:text-white mb-1">لا توجد منتجات</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">لم يتم العثور على أي منتجات في هذا القسم حالياً.</p>
          </div>
        )}
      </div>

      {/* Purchase Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative border border-gray-200 dark:border-[#2D2D3D]">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#00B4D8]/10 text-[#00B4D8] rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">تأكيد الشراء</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-6">
                هل أنت متأكد من رغبتك في شراء "{selectedItem.title}"؟
              </p>
              
              <div className="bg-gray-50 dark:bg-[#12121A] rounded-2xl p-4 mb-6 text-right">
                <div className="flex justify-between items-center mb-3 text-sm">
                  <span className="text-gray-500 font-bold">سعر المنتج:</span>
                  <span className="font-black text-gray-900 dark:text-white font-mono">{selectedItem.sellingPrice} ج.م</span>
                </div>
                <div className="flex justify-between items-center mb-3 text-sm">
                  <span className="text-gray-500 font-bold">رصيدك الحالي:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">{userData?.balance || 0} ج.م</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-[#2D2D3D] text-sm">
                  <span className="text-gray-500 font-bold">الرصيد المتبقي:</span>
                  <span className={`font-black font-mono ${(userData?.balance || 0) >= selectedItem.sellingPrice ? 'text-gray-900 dark:text-white' : 'text-rose-500'}`}>
                    {(userData?.balance || 0) - selectedItem.sellingPrice} ج.م
                  </span>
                </div>
              </div>

              {(userData?.balance || 0) < selectedItem.sellingPrice && (
                <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-3 rounded-xl flex items-center gap-2 text-xs font-bold mb-6 text-right">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  رصيدك غير كافٍ لإتمام عملية الشراء. يرجى شحن محفظتك.
                </div>
              )}
              {selectedItem.stock <= 0 && (
                <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-3 rounded-xl flex items-center gap-2 text-xs font-bold mb-6 text-right">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  عذراً، لقد نفذت الكمية من هذا الصنف.
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedItem(null)}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-[#2D2D3D] dark:hover:bg-[#3D3D52] text-gray-700 dark:text-white rounded-xl font-bold transition-colors text-sm"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => handlePurchase(selectedItem)}
                  disabled={isProcessing || (userData?.balance || 0) < selectedItem.sellingPrice || selectedItem.stock <= 0}
                  className="flex-1 px-4 py-3 bg-[#00B4D8] hover:bg-[#0096B4] disabled:bg-gray-300 dark:disabled:bg-[#2D2D3D] disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors shadow-lg shadow-[#00B4D8]/20 text-sm flex items-center justify-center gap-2"
                >
                  {isProcessing ? 'جاري الشراء...' : 'تأكيد الشراء'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
