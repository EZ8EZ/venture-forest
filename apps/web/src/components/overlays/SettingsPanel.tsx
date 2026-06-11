import { motion, AnimatePresence } from 'framer-motion';
import { X, Monitor, Accessibility, Tag } from 'lucide-react';
import { useForestStore, type QualityPreset } from '@/stores/forest-store';

const QUALITY_OPTIONS: { value: QualityPreset; label: string; hint: string }[] = [
  { value: 'low', label: 'Low', hint: 'No shadows or effects, reduced resolution' },
  { value: 'medium', label: 'Medium', hint: 'Shadows and effects, capped resolution' },
  { value: 'high', label: 'High', hint: 'Full shadows, effects, and resolution' },
];

export function SettingsPanel() {
  const showSettings = useForestStore((s) => s.showSettings);
  const toggleSettings = useForestStore((s) => s.toggleSettings);
  const quality = useForestStore((s) => s.quality);
  const setQuality = useForestStore((s) => s.setQuality);
  const reducedMotion = useForestStore((s) => s.reducedMotion);
  const setReducedMotion = useForestStore((s) => s.setReducedMotion);
  const showLabels = useForestStore((s) => s.showLabels);
  const setShowLabels = useForestStore((s) => s.setShowLabels);

  return (
    <AnimatePresence>
      {showSettings && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-4 top-16 z-40 w-[300px] max-w-[calc(100vw-2rem)]"
        >
          <div className="glass-panel-solid p-4 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-widest text-overlay-text/70">
                Settings
              </h3>
              <button
                onClick={toggleSettings}
                aria-label="Close settings"
                className="text-overlay-muted/40 hover:text-overlay-muted focus-ring"
              >
                <X size={14} />
              </button>
            </div>

            {/* Quality preset */}
            <div>
              <h4 className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-overlay-muted/40 mb-2">
                <Monitor size={11} />
                Render Quality
              </h4>
              <div className="space-y-1" role="radiogroup" aria-label="Render quality">
                {QUALITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    role="radio"
                    aria-checked={quality === opt.value}
                    onClick={() => setQuality(opt.value)}
                    className={`
                      w-full flex items-start gap-2.5 px-2.5 py-2 rounded-md text-left transition-all focus-ring
                      ${quality === opt.value ? 'bg-white/8 text-overlay-text' : 'text-overlay-muted/60 hover:bg-white/3'}
                    `}
                  >
                    <div
                      className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 border transition-colors ${
                        quality === opt.value
                          ? 'bg-overlay-accent border-overlay-accent'
                          : 'border-overlay-muted/40'
                      }`}
                    />
                    <div>
                      <p className="text-xs font-medium">{opt.label}</p>
                      <p className="text-[10px] text-overlay-muted/40">{opt.hint}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-1">
              <SettingsToggle
                icon={<Accessibility size={11} />}
                label="Reduced motion"
                hint="Skip the intro, freeze wind, instant transitions"
                checked={reducedMotion}
                onChange={setReducedMotion}
              />
              <SettingsToggle
                icon={<Tag size={11} />}
                label="Company labels"
                hint="Name tags above landmark trees"
                checked={showLabels}
                onChange={setShowLabels}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SettingsToggle({
  icon,
  label,
  hint,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-white/3 transition-colors focus-ring text-left"
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 text-overlay-muted/40">{icon}</span>
        <div>
          <p className="text-xs text-overlay-text/80 font-medium">{label}</p>
          <p className="text-[10px] text-overlay-muted/40">{hint}</p>
        </div>
      </div>
      <div
        className={`relative w-8 h-[18px] rounded-full transition-colors flex-shrink-0 ${
          checked ? 'bg-overlay-accent/60' : 'bg-white/10'
        }`}
      >
        <div
          className={`absolute top-[2px] w-3.5 h-3.5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-[16px]' : 'translate-x-[2px]'
          }`}
        />
      </div>
    </button>
  );
}
