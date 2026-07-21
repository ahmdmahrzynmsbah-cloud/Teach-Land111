import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { ShoppingBag, Loader2, FileText, Printer, Calendar, CreditCard, Box, Download, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function StudentPurchases({ userData }: { userData: any }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsMap, setItemsMap] = useState<Record<string, any>>({});
  
  useEffect(() => {
    if (userData?.id) {
      loadPurchases();
    }
  }, [userData?.id]);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const qOrders = query(
        collection(db, 'store_orders'),
        where('studentId', '==', userData.id)
      );
      const orderSnap = await getDocs(qOrders);
      let orderList = orderSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      
      // Sort by date descending
      orderList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setOrders(orderList);

      // Fetch item details
      const itemsData: Record<string, any> = {};
      const itemIds = [...new Set(orderList.map(o => o.itemId))];
      
      for (const iId of itemIds) {
        if (!iId) continue;
        const iDoc = await getDoc(doc(db, 'store_items', iId));
        if (iDoc.exists()) {
          itemsData[iId] = iDoc.data();
        }
      }
      
      setItemsMap(itemsData);
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء تحميل المشتريات');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintInvoice = (order: any) => {
    const item = itemsMap[order.itemId] || { title: order.itemTitle };
    const date = new Date(order.date).toLocaleString('ar-EG', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>فاتورة شراء #${order.id.slice(0, 8)}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1f2937; background: #fff; }
            .invoice-box { max-width: 800px; margin: auto; padding: 40px; border: 1px solid #e5e7eb; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: 900; color: #00B4D8; }
            .invoice-title { font-size: 24px; font-weight: bold; color: #374151; }
            .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .info-block { flex: 1; }
            .info-label { font-size: 12px; color: #6b7280; font-weight: bold; margin-bottom: 4px; text-transform: uppercase; }
            .info-value { font-size: 14px; font-weight: 600; color: #111827; }
            .table-container { margin-bottom: 40px; }
            table { w-full; width: 100%; border-collapse: collapse; }
            th { text-align: right; padding: 12px; border-bottom: 2px solid #e5e7eb; color: #374151; font-size: 14px; font-weight: bold; }
            td { text-align: right; padding: 16px 12px; border-bottom: 1px solid #f3f4f6; color: #4b5563; font-size: 14px; }
            .item-col { display: flex; align-items: center; gap: 16px; }
            .item-img { width: 60px; height: 60px; object-fit: cover; border-radius: 8px; background: #f3f4f6; }
            .total-row { display: flex; justify-content: space-between; padding: 20px 12px; background: #f9fafb; border-radius: 12px; margin-top: 20px; }
            .total-label { font-size: 16px; font-weight: bold; color: #374151; }
            .total-amount { font-size: 24px; font-weight: 900; color: #00B4D8; }
            .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            
            @media print {
              body { padding: 0; background: #fff; }
              .invoice-box { border: none; box-shadow: none; padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; text-align: left;">
            <button onclick="window.print()" style="background: #00B4D8; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; font-family: inherit;">طباعة الفاتورة</button>
          </div>
          
          <div class="invoice-box">
            <div class="header">
              <div>
                <div class="logo">Teachland</div>
                <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">منصة التعلم الذكي</div>
              </div>
              <div style="text-align: left;">
                <div class="invoice-title">فاتورة شراء</div>
                <div style="font-size: 14px; color: #6b7280; margin-top: 8px;">#${order.id}</div>
              </div>
            </div>
            
            <div class="details">
              <div class="info-block">
                <div class="info-label">معلومات الطالب</div>
                <div class="info-value">${userData.name}</div>
                <div class="info-value" style="font-size: 12px; color: #6b7280; margin-top: 2px;">${userData.email || 'بدون بريد'}</div>
              </div>
              <div class="info-block" style="text-align: left;">
                <div class="info-label">تاريخ الشراء</div>
                <div class="info-value">${date}</div>
                <div class="info-label" style="margin-top: 12px;">حالة الطلب</div>
                <div class="info-value" style="color: #10b981; display: flex; align-items: center; justify-content: flex-end; gap: 4px;">
                  مكتمل <span style="font-size: 16px;">✓</span>
                </div>
              </div>
            </div>
            
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>المنتج</th>
                    <th style="text-align: center;">الكمية</th>
                    <th style="text-align: left;">السعر</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div class="item-col">
                        ${item.imageUrl ? "<img src='" + item.imageUrl + "' class='item-img' />" : "<div class='item-img'></div>"}
                        <div>
                          <div style="font-weight: bold; color: #111827;">${order.itemTitle}</div>
                          ${item.description ? "<div style='font-size: 12px; color: #6b7280; margin-top: 4px; max-width: 300px;'>" + item.description + "</div>" : ''}
                        </div>
                      </div>
                    </td>
                    <td style="text-align: center; font-weight: bold;">1</td>
                    <td style="text-align: left; font-weight: bold; color: #111827;">${order.amount} ج.م</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="total-row">
              <div class="total-label">الإجمالي المدفوع</div>
              <div class="total-amount">${order.amount} ج.م</div>
            </div>
            
            <div class="footer">
              <p>شكراً لشرائك من متجر Teachland.</p>
              <p>تم الدفع عبر المحفظة الإلكترونية.</p>
            </div>
          </div>
          
          <script>
            // Auto print dialog when loaded
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 border border-gray-200 dark:border-[#2D2D3D] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-[#2D2D3D] pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center shrink-0">
              <ShoppingBag className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">مشترياتي</h2>
              <p className="text-gray-500 font-bold text-sm mt-1">تتبع المنتجات التي قمت بشرائها من المتجر واستعرض الفواتير</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col justify-center items-center gap-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-gray-500 font-bold">جاري تحميل مشترياتك...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 flex flex-col justify-center items-center gap-4 bg-gray-50 dark:bg-[#0D0D12] rounded-2xl mt-6 border border-dashed border-gray-200 dark:border-[#2D2D3D]">
            <div className="w-20 h-20 bg-white dark:bg-[#1A1A24] rounded-full flex items-center justify-center shadow-sm">
              <Box className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-black text-gray-800 dark:text-gray-200 mt-2">لم تقم بشراء أي منتجات بعد</h3>
            <p className="text-gray-500 text-sm font-bold text-center max-w-sm">
              تصفح المتجر واشترِ المنتجات التي تحتاجها باستخدام رصيد محفظتك وستظهر هنا.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {orders.map(order => {
              const item = itemsMap[order.itemId];
              const formattedDate = new Date(order.date).toLocaleDateString('ar-EG', {
                year: 'numeric', month: 'long', day: 'numeric'
              });
              
              return (
                <div key={order.id} className="bg-white dark:bg-[#12121A] border border-gray-150 dark:border-[#2D2D3D]/50 rounded-2xl p-3.5 hover:bg-gray-50/50 dark:hover:bg-[#15151F]/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative pl-4 pr-5 overflow-hidden group">
                  
                  {/* Status Indicator */}
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500 dark:bg-emerald-600"></div>
                  
                  {/* Item Image & Title & Date */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-[#1A1A24] rounded-xl overflow-hidden shrink-0 flex items-center justify-center relative border border-gray-100 dark:border-[#2D2D3D]">
                      {item?.imageUrl ? (
                        <img src={item.imageUrl} alt={order.itemTitle} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                    
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white truncate mb-1">{order.itemTitle}</h3>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 dark:text-gray-500">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Left Side Controls: Price, Status, Print Button */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-6 justify-between sm:justify-end">
                    
                    {/* Amount */}
                    <div className="text-right sm:text-left">
                      <span className="block text-[10px] text-gray-400 font-bold mb-0.5 uppercase tracking-wider">المبلغ المدفوع</span>
                      <div className="flex items-center sm:justify-end gap-1 text-base font-black text-[#00B4D8] dark:text-[#D4AF37] font-mono">
                        {order.amount} 
                        <span className="text-xs font-black">ج.م</span>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="shrink-0">
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/10 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        مكتمل
                      </span>
                    </div>

                    {/* Print Button */}
                    <button
                      onClick={() => handlePrintInvoice(order)}
                      className="w-full sm:w-auto px-4 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-[#1A1A24] dark:hover:bg-[#2D2D3D] text-gray-700 dark:text-gray-300 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border border-gray-200 dark:border-[#2D2D3D] transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      عرض وطباعة الفاتورة
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
