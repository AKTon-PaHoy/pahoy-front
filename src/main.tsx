import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence } from "motion/react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router";
import { BottomNavigation } from "@/components/application/bottom-navigation/bottom-navigation";
import { PageTransition } from "@/components/application/page-transition/page-transition";
import { CompleteProfile } from "@/pages/complete-profile";
import { GigOverview } from "@/pages/gig-overview";
import { HomeScreen } from "@/pages/home-screen";
import { Login } from "@/pages/login";
import { NotFound } from "@/pages/not-found";
import { Search } from "@/pages/search";
import { Signup } from "@/pages/signup";
import { Splash } from "@/pages/splash";
import { RouteProvider } from "@/providers/router-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { api, validateToken } from "@/utils/api";
import { getToken } from "@/utils/auth";
import "@/styles/globals.css";

const NAV_ROUTES = ["/home", "/search", "/contracts", "/gigs", "/profile"];

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

/** Redirects to /complete-profile if user hasn't completed onboarding */
function RequireOnboarding({ children }: { children: React.ReactNode }) {
    const [checking, setChecking] = useState(true);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);

    useEffect(() => {
        api<{ onboarding_complete: boolean }>("/api/profile/retrieve/")
            .then((profile) => {
                setNeedsOnboarding(!profile.onboarding_complete);
            })
            .catch(() => {
                // If profile fetch fails, allow through (auth guard handles 401)
                setNeedsOnboarding(false);
            })
            .finally(() => setChecking(false));
    }, []);

    if (checking) return null;
    if (needsOnboarding) return <Navigate to="/complete-profile" replace />;
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
                    <Route path="/home" element={<RequireAuth><RequireOnboarding><PageTransition><HomeScreen /></PageTransition></RequireOnboarding></RequireAuth>} />
                    <Route path="/search" element={<RequireAuth><RequireOnboarding><PageTransition><Search /></PageTransition></RequireOnboarding></RequireAuth>} />
                    <Route path="/gig/:id" element={<RequireAuth><RequireOnboarding><PageTransition><GigOverview /></PageTransition></RequireOnboarding></RequireAuth>} />
                    <Route path="/complete-profile" element={<RequireAuth><PageTransition><CompleteProfile /></PageTransition></RequireAuth>} />
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
                    <div className="mx-auto max-w-[750px]">
                        <AnimatedRoutes />
                    </div>
                </RouteProvider>
            </BrowserRouter>
        </ThemeProvider>
    </StrictMode>,
);
