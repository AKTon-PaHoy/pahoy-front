import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence } from "motion/react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router";
import { BottomNavigation } from "@/components/application/bottom-navigation/bottom-navigation";
import { PageTransition } from "@/components/application/page-transition/page-transition";
import { HomeScreen } from "@/pages/home-screen";
import { Login } from "@/pages/login";
import { NotFound } from "@/pages/not-found";
import { Search } from "@/pages/search";
import { Signup } from "@/pages/signup";
import { Splash } from "@/pages/splash";
import { RouteProvider } from "@/providers/router-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { validateToken } from "@/utils/api";
import { getToken } from "@/utils/auth";
import "@/styles/globals.css";

const NAV_ROUTES = ["/home", "/search", "/contracts", "/gigs", "/profile"];
const AUTH_ROUTES = ["/home", "/search", "/contracts", "/gigs", "/profile"];

/** Splash route that auto-redirects to /home if a valid token exists */
function SplashGuard() {
    const [checking, setChecking] = useState(() => !!getToken());
    const [isValid, setIsValid] = useState(false);

    useEffect(() => {
        if (!getToken()) {
            setChecking(false);
            return;
        }
        validateToken().then((valid) => {
            setIsValid(valid);
            setChecking(false);
        });
    }, []);

    if (checking) return null;
    if (isValid) return <Navigate to="/home" replace />;
    return <PageTransition><Splash /></PageTransition>;
}

/** Protects routes that require authentication */
function RequireAuth({ children }: { children: React.ReactNode }) {
    if (!getToken()) {
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
}

function AnimatedRoutes() {
    const location = useLocation();
    const showNav = NAV_ROUTES.some((r) => location.pathname.startsWith(r));

    return (
        <>
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<SplashGuard />} />
                    <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
                    <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
                    <Route path="/home" element={<RequireAuth><PageTransition><HomeScreen /></PageTransition></RequireAuth>} />
                    <Route path="/search" element={<RequireAuth><PageTransition><Search /></PageTransition></RequireAuth>} />
                    <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
                </Routes>
            </AnimatePresence>
            {showNav && <BottomNavigation />}
        </>
    );
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider>
            <BrowserRouter>
                <RouteProvider>
                    <AnimatedRoutes />
                </RouteProvider>
            </BrowserRouter>
        </ThemeProvider>
    </StrictMode>,
);
