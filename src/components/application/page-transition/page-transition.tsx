import type { PropsWithChildren } from "react";
import { motion } from "motion/react";
import { useLocation } from "react-router";

export function PageTransition({ children }: PropsWithChildren) {
    const location = useLocation();

    return (
        <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
        >
            {children}
        </motion.div>
    );
}
