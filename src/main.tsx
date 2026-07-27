import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { AnimatePresence } from "motion/react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router";
import { BottomNavigation } from "@/components/application/bottom-navigation/bottom-navigation";
import { PageTransition } from "@/components/application/page-transition/page-transition";
import { ChambasScreen } from "@/pages/chambas-screen";
import { ChatList } from "@/pages/chat-list";
import { ChatConversation } from "@/pages/chat-conversation";
import { CompleteProfile } from "@/pages/complete-profile";
import { GigOverview } from "@/pages/gig-overview";
import { HomeScreen } from "@/pages/home-screen";
import { Login } from "@/pages/login";
import { EditChambaScreen } from "@/pages/edit-chamba-screen";
import { NuevaChambaScreen } from "@/pages/nueva-chamba-screen";
import { NotFound } from "@/pages/not-found";
import { Search } from "@/pages/search";
import { Signup } from "@/pages/signup";
import { Splash } from "@/pages/splash";
import { Profile } from "@/pages/profile";
import { ProfileEdit } from "@/pages/profile-edit";
import { ChangeEmail } from "@/pages/change-email";
import { ChangePassword } from "@/pages/change-password";
import { ContractsListPage } from "@/pages/contracts-list";
import { ContractConfirmationPage } from "@/pages/contract-confirmation";
import { ContractDetailPage } from "@/pages/contract-detail";
import { OfflineIndicator } from "@/components/application/offline-indicator/offline-indicator";
import { RouteProvider } from "@/providers/router-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { api, validateToken } from "@/utils/api";
import { getToken } from "@/utils/auth";
import { initializeNativeApp, setupDeepLinkListener } from "@/utils/capacitor";
import "@/styles/globals.css";

const NAV_ROUTES = ["/home", "/search", "/contracts", "/messages", "/profile", "/gigs"];
const NO_NAV_ROUTES = ["/gigs/new", "/gigs/", "/profile/edit", "/profile/change-email", "/messages/", "/contracts/"];

/** Check if a path should have navigation hidden */
function shouldHideNav(pathname: string): boolean {
    return NO_NAV_ROUTES.some((r) => pathname.startsWith(r)) && pathname !== "/messages";
}

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
    if (isValid) {
        const deepLinkTarget = sessionStorage.getItem("deepLinkTarget");
        if (deepLinkTarget) {
            sessionStorage.removeItem("deepLinkTarget");
            return <Navigate to={deepLinkTarget} replace />;
        }
        return <Navigate to="/home" replace />;
    }
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
    const navigate = useNavigate();
    const showNav = NAV_ROUTES.some((r) => location.pathname.startsWith(r)) && !shouldHideNav(location.pathname);

    useEffect(() => {
        initializeNativeApp();
    }, []);

    useEffect(() => {
        setupDeepLinkListener((path) => {
            if (!getToken()) {
                sessionStorage.setItem("deepLinkTarget", path);
                navigate("/login", { replace: true });
            } else {
                navigate(path, { replace: true });
            }
        });
    }, [navigate]);

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
                    <Route path="/gigs" element={<RequireAuth><RequireOnboarding><PageTransition><ChambasScreen /></PageTransition></RequireOnboarding></RequireAuth>} />
                    <Route path="/gigs/new" element={<RequireAuth><RequireOnboarding><PageTransition><NuevaChambaScreen /></PageTransition></RequireOnboarding></RequireAuth>} />
                    <Route path="/gigs/:id/edit" element={<RequireAuth><RequireOnboarding><PageTransition><EditChambaScreen /></PageTransition></RequireOnboarding></RequireAuth>} />
                    <Route path="/messages" element={<RequireAuth><RequireOnboarding><PageTransition><ChatList /></PageTransition></RequireOnboarding></RequireAuth>} />
                    <Route path="/messages/:roomId" element={<RequireAuth><RequireOnboarding><PageTransition><ChatConversation /></PageTransition></RequireOnboarding></RequireAuth>} />
                    <Route path="/contracts" element={<RequireAuth><RequireOnboarding><PageTransition><ContractsListPage /></PageTransition></RequireOnboarding></RequireAuth>} />
                    <Route path="/contracts/:contractId" element={<RequireAuth><RequireOnboarding><PageTransition><ContractDetailPage /></PageTransition></RequireOnboarding></RequireAuth>} />
                    <Route path="/contracts/:contractId/confirm" element={<RequireAuth><RequireOnboarding><PageTransition><ContractConfirmationPage /></PageTransition></RequireOnboarding></RequireAuth>} />
                    <Route path="/profile" element={<RequireAuth><RequireOnboarding><PageTransition><Profile /></PageTransition></RequireOnboarding></RequireAuth>} />
                    <Route path="/profile/change-password" element={<RequireAuth><PageTransition><ChangePassword /></PageTransition></RequireAuth>} />
                    <Route path="/profile/edit" element={<RequireAuth><RequireOnboarding><PageTransition><ProfileEdit /></PageTransition></RequireOnboarding></RequireAuth>} />
                    <Route path="/profile/change-email" element={<RequireAuth><RequireOnboarding><PageTransition><ChangeEmail /></PageTransition></RequireOnboarding></RequireAuth>} />
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
                    <OfflineIndicator />
                    <div className="mx-auto max-w-[750px]">
                        <AnimatedRoutes />
                    </div>
                </RouteProvider>
            </BrowserRouter>
        </ThemeProvider>
    </StrictMode>,
);

registerSW({
    onRegisteredSW(swUrl) {
        if (import.meta.env.DEV) {
            console.log("[SW] Registered:", swUrl);
        }
    },
    onRegisterError(error) {
        if (import.meta.env.DEV) {
            console.error("[SW] Registration failed:", error);
        }
    },
});
