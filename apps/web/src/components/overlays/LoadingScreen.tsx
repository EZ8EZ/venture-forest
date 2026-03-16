import { useForestStore } from '@/stores/forest-store';
import { motion, AnimatePresence } from 'framer-motion';

export function LoadingScreen() {
  const isLoading = useForestStore((s) => s.isLoading);
  const loadProgress = useForestStore((s) => s.loadProgress);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0c10]"
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-3xl font-light tracking-[0.3em] text-overlay-text/90 mb-2">
              VENTURE FOREST
            </h1>
            <p className="text-sm text-overlay-muted/60 tracking-widest uppercase mb-12">
              Mapping the startup ecosystem
            </p>

            <div className="w-48 h-[1px] bg-overlay-border mx-auto mb-3 overflow-hidden">
              <motion.div
                className="h-full bg-overlay-accent/60"
                initial={{ width: '0%' }}
                animate={{ width: `${loadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <p className="text-xs text-overlay-muted/40 tracking-wider">
              {loadProgress < 50 ? 'Loading forest data' : 'Growing trees'}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
