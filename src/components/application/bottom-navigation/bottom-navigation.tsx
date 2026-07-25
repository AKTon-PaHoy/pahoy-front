import type { FC, HTMLAttributes } from "react";
import { Briefcase02, ClipboardCheck, Home02, SearchLg, User01 } from "@untitledui/icons";
import { useLocation, useNavigate } from "react-router";

import { cx } from "@/utils/cx";

interface NavItem {
    label: string;
    path: string;
    icon: FC<HTMLAttributes<HTMLOrSVGElement>>;
}

const navItems: NavItem[] = [
    { label: "Inicio", path: "/home", icon: Home02 },
    { label: "Buscar", path: "/search", icon: SearchLg },
    { label: "Contratos", path: "/contracts", icon: ClipboardCheck },
    { label: "Mis Gigs", path: "/gigs", icon: Briefcase02 },
    { label: "Perfil", path: "/profile", icon: User01 },
];

export function BottomNavigation() {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white pb-safe">
            <div className="flex items-center justify-around px-2 pt-2 pb-2">
                {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={cx(
                                "flex flex-col items-center gap-1 rounded-lg px-3 py-1 transition-colors",
                                isActive
                                    ? "text-brand-600"
                                    : "text-neutral-500",
                            )}
                            aria-label={item.label}
                            aria-current={isActive ? "page" : undefined}
                        >
                            <Icon
                                className={cx(
                                    "size-6",
                                    isActive && "stroke-[2.5px]",
                                )}
                            />
                            <span
                                className={cx(
                                    "text-xs",
                                    isActive && "font-semibold",
                                )}
                            >
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
