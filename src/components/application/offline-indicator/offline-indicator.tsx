import { AnimatePresence, motion } from "motion/react";

import { useOnlineStatus } from "@/hooks/use-online-status";

export function OfflineIndicator() {
    const isOnline = useOnlineStatus();

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ opacity: 0, y: -32 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -32 }}
                    transition={{ duration: 0.2 }}
                    className="fixed top-0 right-0 left-0 z-50 bg-neutral-800 py-2 text-center text-sm text-white"
                    role="status"
                    aria-live="polite"
                >
                    Sin conexión — mostrando datos guardados
                </motion.div>
            )}
        </AnimatePresence>
    );
}
