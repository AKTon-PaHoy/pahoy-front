import { motion } from "motion/react";

import { Button } from "@/components/base/buttons/button";

export function Splash() {
    return (
        <div className="flex min-h-dvh flex-col bg-brand-600">
            {/* Logo section - centered in the upper area */}
            <div className="flex flex-1 items-center justify-center">
                <motion.img
                    src="/splash-logo.png"
                    alt="Pa·Hoy"
                    className="w-60"
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 15,
                        mass: 0.8,
                    }}
                />
            </div>

            {/* Subtitle text */}
            <p className="mb-4 text-center text-sm text-brand-200">
                El talento de tu comunidad, pa&apos; hoy mismo
            </p>

            {/* Bottom card with buttons */}
            <div className="rounded-t-3xl border-t border-[#E4D5B2] bg-white px-4 pb-8 pt-6">
                <div className="flex flex-col gap-3">
                    <Button color="primary" size="xl" className="w-full">
                        Crear mi cuenta
                    </Button>
                    <Button color="secondary" size="xl" className="w-full">
                        Ya tengo cuenta
                    </Button>
                </div>
            </div>
        </div>
    );
}
