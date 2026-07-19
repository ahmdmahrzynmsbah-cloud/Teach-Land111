#!/bin/bash
awk '
/button className="w-10 h-10 bg-gray-50 dark:bg-\\[#0D0D12\\] rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-\\[#222230\\] transition-colors"/ {
    print "              <div className=\"relative\">"
    print "                <button "
    print "                  onClick={() => setShowNotifications(!showNotifications)}"
    print "                  className=\"w-10 h-10 bg-gray-50 dark:bg-[#0D0D12] rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-[#222230] transition-colors relative\""
    print "                >"
    print "                   <Bell className=\"w-5 h-5\" />"
    print "                   {notifications.filter(n => !n.read).length > 0 && ("
    print "                     <span className=\"absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#1A1A24]\"></span>"
    print "                   )}"
    print "                </button>"
    print "                <AnimatePresence>"
    print "                  {showNotifications && ("
    print "                    <motion.div"
    print "                      initial={{ opacity: 0, y: 10, scale: 0.95 }}"
    print "                      animate={{ opacity: 1, y: 0, scale: 1 }}"
    print "                      exit={{ opacity: 0, y: 10, scale: 0.95 }}"
    print "                      className=\"absolute left-0 mt-2 w-80 bg-white dark:bg-[#222230] rounded-2xl shadow-xl border border-gray-100 dark:border-[#2D2D3D] z-50 overflow-hidden\""
    print "                    >"
    print "                      <div className=\"p-4 border-b border-gray-100 dark:border-[#2D2D3D] flex items-center justify-between\">"
    print "                        <h3 className=\"font-bold text-gray-900 dark:text-white\">الإشعارات</h3>"
    print "                        <span className=\"text-xs bg-[#00B4D8]/10 text-[#00B4D8] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] px-2 py-1 rounded-full font-bold\">"
    print "                          {notifications.filter(n => !n.read).length} جديد"
    print "                        </span>"
    print "                      </div>"
    print "                      <div className=\"max-h-80 overflow-y-auto\">"
    print "                        {notifications.length > 0 ? ("
    print "                          notifications.map((notif) => ("
    print "                            <div "
    print "                              key={notif.id} "
    print "                              onClick={() => !notif.read && markNotificationAsRead(notif.id)}"
    print "                              className={`p-4 border-b border-gray-50 dark:border-[#2D2D3D]/50 hover:bg-gray-50 dark:hover:bg-[#2A2A38] transition-colors cursor-pointer ${!notif.read ? \"bg-[#00B4D8]/5 dark:bg-[#D4AF37]/5\" : \"\"}`}"
    print "                            >"
    print "                              <h4 className=\"text-sm font-bold text-gray-900 dark:text-white mb-1\">{notif.title}</h4>"
    print "                              <p className=\"text-xs text-gray-500 dark:text-gray-400\">{notif.message}</p>"
    print "                              <span className=\"text-[10px] text-gray-400 mt-2 block\">"
    print "                                {new Date(notif.createdAt).toLocaleDateString(\"ar-EG\")}"
    print "                              </span>"
    print "                            </div>"
    print "                          ))"
    print "                        ) : ("
    print "                          <div className=\"p-8 text-center text-gray-500 dark:text-gray-400 text-sm\">"
    print "                            لا توجد إشعارات حالياً"
    print "                          </div>"
    print "                        )}"
    print "                      </div>"
    print "                    </motion.div>"
    print "                  )}"
    print "                </AnimatePresence>"
    print "              </div>"
    next
}
/Bell className="w-5 h-5"/ {
    next
}
/<\/button>/ {
    if (in_button) {
        in_button = 0
        next
    }
}
{
    if (match($0, /button className="w-10 h-10 bg-gray-50/)) {
        in_button = 1
    }
    print
}
' src/components/Dashboard.tsx > src/components/Dashboard_temp.tsx
mv src/components/Dashboard_temp.tsx src/components/Dashboard.tsx
