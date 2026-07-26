/**
 * Bug Condition Exploration Test
 *
 * **Validates: Requirements 1.1, 1.2, 1.3**
 *
 * Property 1: Bug Condition — Reverse Geocode Retries and Blank Display on Failure
 *
 * This test is EXPECTED TO FAIL on unfixed code, proving the bug exists:
 * - The hook retries failed requests for the same coordinates on re-render
 * - Consumer components show blank location text when error is true
 *
 * Scoped PBT Approach: Mock Nominatim returning 429 for coordinates (-12.0553, -77.0311)
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Bug Condition: useReverseGeocode retries and blank display on failure", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.useFakeTimers();
        fetchMock = vi.fn().mockImplementation(() =>
            Promise.resolve({
                ok: false,
                status: 429,
                json: () => Promise.resolve({}),
            }),
        );
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        vi.resetModules();
    });

    it("should NOT retry fetch for the same coordinates after a failed response on re-render", async () => {
        // This test encodes EXPECTED behavior: after first failure, no retry for same coords
        // On UNFIXED code, the hook WILL retry → test FAILS (proving the bug)
        //
        // Key: we pass a NEW object each time (same values, different reference)
        // to simulate what happens in real components where coordinates are derived
        // from state/props and recreated on each render (e.g. fromGeoJSON(userData.location))
        const { useReverseGeocode } = await import("@/hooks/use-reverse-geocode");

        const { result, rerender } = renderHook(
            (props: { latitude: number; longitude: number } | null) => useReverseGeocode(props),
            { initialProps: { latitude: -12.0553, longitude: -77.0311 } },
        );

        // Advance past the 300ms debounce
        await act(async () => {
            vi.advanceTimersByTime(350);
        });

        // Wait for the fetch to resolve (with 429 error)
        await act(async () => {
            await vi.runAllTimersAsync();
        });

        // First fetch should have been called
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(result.current.error).toBe(true);
        expect(result.current.address).toBeNull();

        // Reset mock call count to isolate the re-render behavior
        fetchMock.mockClear();

        // Re-render with a NEW object with same coordinate values
        // In real-world usage, fromGeoJSON() creates a new object each render
        // React's useEffect sees a new dependency reference → re-runs the effect
        rerender({ latitude: -12.0553, longitude: -77.0311 });

        // Advance timers again to allow any debounced fetch to fire
        await act(async () => {
            vi.advanceTimersByTime(350);
        });

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        // EXPECTED BEHAVIOR (after fix): No second fetch for same failed coordinates
        // because the failure cache recognizes these coords already failed.
        //
        // BUG on unfixed code: The useEffect re-runs because the coordinates object
        // reference changed, and since there's no failure cache, it retries the request.
        // This assertion FAILS on unfixed code (fetchMock called 1+ times).
        expect(fetchMock).toHaveBeenCalledTimes(0);
    });

    it("should set error: true immediately for previously-failed coordinates without fetching", async () => {
        // This test verifies the hook immediately returns error for previously-failed coords
        // On UNFIXED code, the hook has no failure cache → retries → test FAILS
        const { useReverseGeocode } = await import("@/hooks/use-reverse-geocode");

        const { result, rerender } = renderHook(
            (props: { latitude: number; longitude: number } | null) => useReverseGeocode(props),
            { initialProps: { latitude: -12.0553, longitude: -77.0311 } },
        );

        // Advance past debounce and let fetch complete
        await act(async () => {
            vi.advanceTimersByTime(350);
        });
        await act(async () => {
            await vi.runAllTimersAsync();
        });

        // First call happened and errored
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(result.current.error).toBe(true);

        // Clear and re-render with new object (same values)
        fetchMock.mockClear();
        rerender({ latitude: -12.0553, longitude: -77.0311 });

        await act(async () => {
            vi.advanceTimersByTime(350);
        });
        await act(async () => {
            await vi.runAllTimersAsync();
        });

        // EXPECTED (after fix): error stays true immediately, no new fetch
        // BUG on unfixed code: hook re-runs effect, makes another request, error gets
        // reset to false during loading then set to true again after fetch fails.
        // The fetchMock call count will be > 0.
        expect(fetchMock).toHaveBeenCalledTimes(0);
        expect(result.current.error).toBe(true);
    });
});
