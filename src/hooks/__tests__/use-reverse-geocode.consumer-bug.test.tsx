/**
 * Bug Condition Exploration Test - Consumer Display
 *
 * **Validates: Requirements 1.2, 1.3**
 *
 * Property 1: Bug Condition — Consumers Display Blank on Geocode Failure
 *
 * This test is EXPECTED TO FAIL on unfixed code, proving the bug exists:
 * - HomeScreen shows blank location when geocoding error occurs
 * - GigOverview TalentCard shows blank location when geocoding error occurs
 *
 * The expected behavior (after fix) is that consumers display formatCoordinates(lat, lng)
 * when error: true.
 */
import { render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formatCoordinates } from "@/utils/coordinates";

const TEST_COORDS = { latitude: -12.0553, longitude: -77.0311 };
const EXPECTED_FALLBACK = formatCoordinates(TEST_COORDS.latitude, TEST_COORDS.longitude);

// Mock react-router
vi.mock("react-router", () => ({
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: "test-gig-id" }),
}));

// Mock the api utility
vi.mock("@/utils/api", () => ({
    api: vi.fn().mockImplementation((path: string) => {
        if (path.includes("/api/auth/user/")) {
            return Promise.resolve({
                username: "testuser",
                email: "test@test.com",
                location: `SRID=4326;POINT (${TEST_COORDS.longitude} ${TEST_COORDS.latitude})`,
            });
        }
        if (path.includes("/api/profile/retrieve/")) {
            return Promise.resolve({
                first_name: "Test",
                last_name: "User",
                profile_pic: null,
            });
        }
        if (path.includes("/api/gigs/search/")) {
            return Promise.resolve({ results: [] });
        }
        if (path.includes("/api/gigs/retrieve/")) {
            return Promise.resolve({
                id: "test-gig-id",
                talent: "t1",
                name: "Test Gig",
                description: "A test gig",
                price: 50,
                is_active: true,
                tags: [],
                created_at: "2024-01-01",
                updated_at: "2024-01-01",
                price_type: "Fijo",
                talent_info: {
                    first_name: "Talent",
                    last_name: "Person",
                    bio: "I do things",
                    location: {
                        type: "Point",
                        coordinates: [TEST_COORDS.longitude, TEST_COORDS.latitude],
                    },
                },
            });
        }
        if (path.includes("/api/reviews/list/")) {
            return Promise.resolve({ results: [] });
        }
        return Promise.resolve({});
    }),
}));

// Mock untitledui icons to avoid import issues
vi.mock("@untitledui/icons", () => ({
    MarkerPin01: (props: Record<string, unknown>) => React.createElement("span", { "data-testid": "marker-icon", ...props }),
    SearchLg: (props: Record<string, unknown>) => React.createElement("span", props),
    User01: (props: Record<string, unknown>) => React.createElement("span", props),
    ChevronLeft: (props: Record<string, unknown>) => React.createElement("span", props),
    ChevronRight: (props: Record<string, unknown>) => React.createElement("span", props),
    InfoCircle: (props: Record<string, unknown>) => React.createElement("span", props),
    Star01: (props: Record<string, unknown>) => React.createElement("span", props),
    ShieldTick: (props: Record<string, unknown>) => React.createElement("span", props),
    MessageChatCircle: (props: Record<string, unknown>) => React.createElement("span", props),
}));

// Mock motion
vi.mock("motion/react", () => ({
    motion: {
        div: React.forwardRef(({ children, ...props }: Record<string, unknown>, ref: React.Ref<HTMLDivElement>) =>
            React.createElement("div", { ...props, ref }, children as React.ReactNode),
        ),
    },
}));

// Mock carousel
vi.mock("@/components/application/carousel/carousel-base", () => ({
    Carousel: {
        Root: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
        Content: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
        Item: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
        PrevTrigger: ({ children }: { children: React.ReactNode }) => React.createElement("button", null, children),
        NextTrigger: ({ children }: { children: React.ReactNode }) => React.createElement("button", null, children),
        IndicatorGroup: () => null,
        Indicator: () => null,
    },
}));

// Mock ServiceCard
vi.mock("@/components/application/service-card/service-card", () => ({
    ServiceCard: () => React.createElement("div", { "data-testid": "service-card" }),
}));

// Mock Button
vi.mock("@/components/base/buttons/button", () => ({
    Button: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) =>
        React.createElement("button", props, children),
}));

describe("Bug Condition: Consumers display blank when geocoding fails", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.useFakeTimers();
        // Mock global fetch to return 429 for Nominatim requests
        fetchMock = vi.fn().mockImplementation((url: string) => {
            if (url.includes("nominatim.openstreetmap.org")) {
                return Promise.resolve({
                    ok: false,
                    status: 429,
                    json: () => Promise.resolve({}),
                });
            }
            // For other fetch calls (api utility), allow through
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({}),
            });
        });
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("HomeScreen should display formatted coordinates when reverse geocoding fails", async () => {
        // EXPECTED BEHAVIOR (after fix): shows "-12.0553, -77.0311" as fallback
        // BUG: On unfixed code, shows "Obteniendo ubicación..." or nothing
        const { HomeScreen } = await import("@/pages/home-screen");

        const { act } = await import("@testing-library/react");

        let container: HTMLElement;
        await act(async () => {
            const result = render(React.createElement(HomeScreen));
            container = result.container;
        });

        // Allow API calls and timers to settle
        await act(async () => {
            vi.advanceTimersByTime(500);
        });
        await act(async () => {
            await vi.runAllTimersAsync();
        });

        // The expected fallback text when geocoding fails
        // On unfixed code: this text won't be present (bug: shows blank or placeholder)
        const locationElements = container!.querySelectorAll("span");
        const locationTexts = Array.from(locationElements).map(el => el.textContent);
        const hasExpectedFallback = locationTexts.some(
            text => text?.includes(EXPECTED_FALLBACK),
        );

        // EXPECTED: formatted coordinates are displayed as fallback
        // BUG: unfixed code does NOT display this — shows "Obteniendo ubicación..." instead
        expect(hasExpectedFallback).toBe(true);
    });

    it("GigOverview TalentCard should display formatted coordinates when reverse geocoding fails", async () => {
        // EXPECTED BEHAVIOR (after fix): TalentCard shows "-12.0553, -77.0311"
        // BUG: On unfixed code, TalentCard shows "Cerca de ti" (default when shortAddress is null)
        const { GigOverview } = await import("@/pages/gig-overview");

        const { act } = await import("@testing-library/react");

        let container: HTMLElement;
        await act(async () => {
            const result = render(React.createElement(GigOverview));
            container = result.container;
        });

        // Allow API calls and timers to settle
        await act(async () => {
            vi.advanceTimersByTime(500);
        });
        await act(async () => {
            await vi.runAllTimersAsync();
        });

        // Wait for gig data to load
        await act(async () => {
            vi.advanceTimersByTime(100);
        });

        // The expected fallback text when geocoding fails for TalentCard
        const allSpans = container!.querySelectorAll("span");
        const allTexts = Array.from(allSpans).map(el => el.textContent);
        const hasExpectedFallback = allTexts.some(
            text => text?.includes(EXPECTED_FALLBACK),
        );

        // EXPECTED: formatted coordinates shown as fallback in TalentCard
        // BUG: unfixed code shows "Cerca de ti" (the default when address is null)
        expect(hasExpectedFallback).toBe(true);
    });
});
