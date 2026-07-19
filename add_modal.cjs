const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// Add State
const stateToAdd = `  const [viewImageModalOpen, setViewImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);`;

code = code.replace("  // Rejection modal state", stateToAdd + "\n  // Rejection modal state");

// Update onClick
code = code.replace(
  "onClick={() => payment.screenshotUrl && !['uploading...', 'failed'].includes(payment.screenshotUrl) && window.open(payment.screenshotUrl, '_blank')}",
  "onClick={() => { if(payment.screenshotUrl && !['uploading...', 'failed'].includes(payment.screenshotUrl)) { setSelectedImageUrl(payment.screenshotUrl); setViewImageModalOpen(true); } }}"
);

// Add Modal JSX
const modalJsx = `      {/* Image Viewer Modal */}
      <AnimatePresence>
        {viewImageModalOpen && selectedImageUrl && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setViewImageModalOpen(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-4xl w-full flex flex-col items-center justify-center z-10"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setViewImageModalOpen(false)}
                className="absolute -top-12 right-0 md:-right-12 text-white/70 hover:text-white bg-black/50 hover:bg-black p-2 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <img src={selectedImageUrl} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
              <div className="mt-4 flex gap-4">
                <a 
                  href={selectedImageUrl} 
                  download="screenshot.jpg" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#00B4D8] text-white font-bold rounded-lg hover:bg-[#0096B4] transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  تحميل الصورة
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Rejection Modal */}`;

code = code.replace("{/* Payment Rejection Modal */}", modalJsx);

// We need to make sure Download icon is imported.
if (!code.includes("Download,")) {
  code = code.replace("Archive,", "Archive, Download,");
}

fs.writeFileSync('src/components/AdminPanel.tsx', code);
