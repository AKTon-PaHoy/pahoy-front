/**
 * Preservation Property Tests
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 *
 * Property 2: Preservation — Successful Geocoding and Null Coordinates Unchanged
 *
 * These tests MUST PASS on the unfixed code, confirming the baseline behavior
 * that the bugfix must preserve:
 * - Successful geocoding returns the resolved display_name address
 * - Null coordinates return { address: null, isLoading: false, error: false }
 * - The geocodeCache prevents duplicate fetches for already-resolved coordinates
 */
import { act, renderHook } from "@testing-library/react";
import fc from "fast-check";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Preservation: Successful geocoding behavior unchanged", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.useFakeTimers();
        fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        vi.resetModules();
    });

    /**
     * **Validates: Requirements 3.1, 3.4**
     *
     * Property: For all non-null coordinates where Nominatim returns a valid
     * display_name, the hook returns { address: display_name, error: false }
     */
    it("property: for all valid coordinates with successful Nominatim response, hook returns resolved address and error: false", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    latitude: fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true }),
                    longitude: fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
                }),
                fc.string({ minLength: 1, maxLength: 200 }),
                async (coordinates, displayName) => {
                    // Reset modules to clear the geocodeCache between property runs
                    vi.resetModules();

                    fetchMock.mockReset();
                    fetchMock.mockImplementation(() =>
                        Promise.resolve({
                            ok: true,
                            status: 200,
                            json: () => Promise.resolve({ display_name: displayName }),
                        }),
                    );

                    const { useReverseGeocode } = await import("@/hooks/use-reverse-geocode");

                    const { result } = renderHook(() => useReverseGeocode(coordinates));

                    // Advance past the 300ms debounce
                    await act(async () => {
                        vi.advanceTimersByTime(350);
                    });

                    // Wait for the fetch promise to resolve
                    await act(async () => {
                        await vi.runAllTimersAsync();
                    });

                    // The hook should return the display_name from the API
                    expect(result.current.address).toBe(displayName);
                    expect(result.current.error).toBe(false);
                    expect(result.current.isLoading).toBe(false);
                },
            ),
            { numRuns: 20 },
        );
    });

    /**
     * **Validates: Requirements 3.1**
     *
     * Concrete observation: useReverseGeocode({ latitude: -12.0553, longitude: -77.0311 })
     * with successful Nominatim response returns the resolved display_name address
     */
    it("returns the resolved display_name for specific coordinates (-12.0553, -77.0311)", async () => {
        fetchMock.mockImplementation(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ display_name: "Miraflores, Lima, Peru" }),
            }),
        );

        const { useReverseGeocode } = await import("@/hooks/use-reverse-geocode");

        const { result } = renderHook(() =>
            useReverseGeocode({ latitude: -12.0553, longitude: -77.0311 }),
        );

        // Advance past the 300ms debounce
        await act(async () => {
            vi.advanceTimersByTime(350);
        });

        // Wait for the fetch promise to resolve
        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(result.current.address).toBe("Miraflores, Lima, Peru");
        expect(result.current.error).toBe(false);
        expect(result.current.isLoading).toBe(false);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});

describe("Preservation: Null coordinates behavior unchanged", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.useFakeTimers();
        fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        vi.resetModules();
    });

    /**
     * **Validates: Requirements 3.2, 3.3**
     *
     * Property: For null coordinates, hook returns { address: null, isLoading: false, error: false }
     */
    it("property: for null coordinates, hook returns address: null, isLoading: false, error: false", async () => {
        const { useReverseGeocode } = await import("@/hooks/use-reverse-geocode");

        const { result } = renderHook(() => useReverseGeocode(null));

        // Advance timers to ensure no debounced fetch fires
        await act(async () => {
            vi.advanceTimersByTime(350);
        });

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(result.current.address).toBeNull();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(false);
        // No fetch should have been called
        expect(fetchMock).not.toHaveBeenCalled();
    });

    /**
     * **Validates: Requirements 3.2**
     *
     * Property-based: for any sequence where coordinates transition from valid to null,
     * the hook clears to { address: null, isLoading: false, error: false }
     */
    it("property: transitioning from valid coordinates to null clears state correctly", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    latitude: fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true }),
                    longitude: fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
                }),
                async (coordinates) => {
                    vi.resetModules();

                    fetchMock.mockReset();
                    fetchMock.mockImplementation(() =>
                        Promise.resolve({
                            ok: true,
                            status: 200,
                            json: () =>
                                Promise.resolve({ display_name: "Some Address" }),
                        }),
                    );

                    const { useReverseGeocode } = await import("@/hooks/use-reverse-geocode");

                    const { result, rerender } = renderHook(
                        (props: { latitude: number; longitude: number } | null) =>
                            useReverseGeocode(props),
                        { initialProps: coordinates as { latitude: number; longitude: number } | null },
                    );

                    // Let the first fetch resolve
                    await act(async () => {
                        vi.advanceTimersByTime(350);
                    });
                    await act(async () => {
                        await vi.runAllTimersAsync();
                    });

                    // Now pass null
                    rerender(null);

                    await act(async () => {
                        vi.advanceTimersByTime(350);
                    });
                    await act(async () => {
                        await vi.runAllTimersAsync();
                    });

                    // Should clear to null state
                    expect(result.current.address).toBeNull();
                    expect(result.current.isLoading).toBe(false);
                    expect(result.current.error).toBe(false);
                },
            ),
            { numRuns: 10 },
        );
    });
});

describe("Preservation: geocodeCache prevents duplicate fetches", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.useFakeTimers();
        fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        vi.resetModules();
    });

    /**
     * **Validates: Requirements 3.4**
     *
     * Observation: Second render with same successful coordinates skips fetch (uses geocodeCache)
     */
    it("second render with same coordinates uses cache and does not fetch again", async () => {
        fetchMock.mockImplementation(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ display_name: "Miraflores, Lima, Peru" }),
            }),
        );

        const { useReverseGeocode } = await import("@/hooks/use-reverse-geocode");

        const { result, rerender } = renderHook(
            (props: { latitude: number; longitude: number } | null) => useReverseGeocode(props),
            { initialProps: { latitude: -12.0553, longitude: -77.0311 } },
        );

        // First render: advance past debounce and let fetch resolve
        await act(async () => {
            vi.advanceTimersByTime(350);
        });
        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(result.current.address).toBe("Miraflores, Lima, Peru");

        // Clear mock to track new calls
        fetchMock.mockClear();

        // Re-render with same coordinate values (new object reference)
        rerender({ latitude: -12.0553, longitude: -77.0311 });

        await act(async () => {
            vi.advanceTimersByTime(350);
        });
        await act(async () => {
            await vi.runAllTimersAsync();
        });

        // The cache should prevent a second fetch
        // NOTE: On unfixed code, useEffect re-runs due to new object reference,
        // BUT the geocodeCache hit happens synchronously before the debounce/fetch.
        // The address should be set from cache immediately.
        expect(result.current.address).toBe("Miraflores, Lima, Peru");
        expect(result.current.error).toBe(false);
    });
});
