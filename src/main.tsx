import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence } from "motion/react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
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
import "@/styles/globals.css";

const NAV_ROUTES = ["/home", "/search", "/contracts", "/gigs", "/profile"];

function AnimatedRoutes() {
    const location = useLocation();
    const showNav = NAV_ROUTES.some((r) => location.pathname.startsWith(r));

    return (
        <>
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<PageTransition><Splash /></PageTransition>} />
                    <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
                    <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
                    <Route path="/home" element={<PageTransition><HomeScreen /></PageTransition>} />
                    <Route path="/search" element={<PageTransition><Search /></PageTransition>} />
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
