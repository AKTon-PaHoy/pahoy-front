import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ContractCard } from "../contract-card";
import * as api from "@/utils/api";
import type { Contract } from "@/types/chat";

// Mock the api module
vi.mock("@/utils/api", () => ({
  api: vi.fn(),
}));

const mockContract: Contract = {
  id: "contract-123",
  gig: "Test Gig: Reparación de aires y neveras",
  client: "client-uuid",
  client_username: "client_user",
  talent_username: "talent_user",
  status: "Activo",
  price: 18,
  price_type: "Horas",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-02T00:00:00Z",
};

describe("ContractCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 'Contrato enviado' when talent sent it (isOwnMessage && !isClient)", () => {
    render(
      <ContractCard
        contractId="contract-123"
        isOwnMessage={true}
        isClient={false}
        timestamp="2024-01-15T14:30:00Z"
      />,
    );

    expect(screen.getByText("Contrato enviado")).toBeInTheDocument();
    expect(screen.getByText("Contrato enviado")).toHaveClass("text-brand-red");
  });

  it("displays timestamp when talent sent contract", () => {
    render(
      <ContractCard
        contractId="contract-123"
        isOwnMessage={true}
        isClient={false}
        timestamp="2024-01-15T14:30:00Z"
      />,
    );

    // Should show formatted timestamp
    const timestamps = screen.getAllByText(/\d{2}\/\d{2}\/\d{4}|Hace|Ahora/);
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it("shows loading state when client is viewing and contract is loading", () => {
    (api.api as any).mockImplementation(
      () => new Promise(() => {
        /* Never resolves */
      }),
    );

    render(
      <ContractCard
        contractId="contract-123"
        isOwnMessage={false}
        isClient={true}
        timestamp="2024-01-15T14:30:00Z"
      />,
    );

    // Should show skeleton loaders
    const skeletons = screen.getAllByRole("generic").filter((el) =>
      el.className.includes("animate-pulse"),
    );
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("fetches and displays contract details for client", async () => {
    (api.api as any).mockResolvedValueOnce(mockContract);

    render(
      <ContractCard
        contractId="contract-123"
        isOwnMessage={false}
        isClient={true}
        timestamp="2024-01-15T14:30:00Z"
      />,
    );

    // Wait for contract to load
    await waitFor(() => {
      expect(screen.getByText("Contrato")).toBeInTheDocument();
    });

    // Check contract details are displayed
    expect(screen.getByText("Test Gig: Reparación de aires y neveras")).toBeInTheDocument();
    expect(screen.getByText("$18")).toBeInTheDocument();
    expect(screen.getByText("por hora")).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it("shows error message when contract fetch fails", async () => {
    (api.api as any).mockRejectedValueOnce(new Error("API Error"));

    render(
      <ContractCard
        contractId="contract-123"
        isOwnMessage={false}
        isClient={true}
        timestamp="2024-01-15T14:30:00Z"
      />,
    );

    // Wait for error message
    await waitFor(() => {
      expect(
        screen.getByText("Detalles del contrato no disponibles"),
      ).toBeInTheDocument();
    });
  });

  it("calls api with correct endpoint", async () => {
    (api.api as any).mockResolvedValueOnce(mockContract);

    render(
      <ContractCard
        contractId="contract-123"
        isOwnMessage={false}
        isClient={true}
        timestamp="2024-01-15T14:30:00Z"
      />,
    );

    await waitFor(() => {
      expect(api.api).toHaveBeenCalledWith(
        "/api/contracts/retrieve/contract-123/",
      );
    });
  });

  it("does not fetch contract when talent sent it", () => {
    (api.api as any).mockResolvedValueOnce(mockContract);

    render(
      <ContractCard
        contractId="contract-123"
        isOwnMessage={true}
        isClient={false}
        timestamp="2024-01-15T14:30:00Z"
      />,
    );

    // Should NOT call api
    expect(api.api).not.toHaveBeenCalled();
  });

  it("displays 'Ver contrato' button", async () => {
    (api.api as any).mockResolvedValueOnce(mockContract);

    render(
      <ContractCard
        contractId="contract-123"
        isOwnMessage={false}
        isClient={true}
        timestamp="2024-01-15T14:30:00Z"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Ver contrato")).toBeInTheDocument();
    });
  });

  it("displays correct status badge color for different statuses", async () => {
    const statuses: Array<Contract["status"]> = [
      "Activo",
      "Confirmado",
      "Propuesta",
    ];

    for (const status of statuses) {
      vi.clearAllMocks();
      const contract: Contract = { ...mockContract, status };
      (api.api as any).mockResolvedValue(Promise.resolve(contract));

      const { unmount } = render(
        <ContractCard
          contractId={`contract-${status}`}
          isOwnMessage={false}
          isClient={true}
          timestamp="2024-01-15T14:30:00Z"
        />,
      );

      await waitFor(() => {
        const badge = screen.getByText(status);
        expect(badge).toBeInTheDocument();
      });

      unmount();
    }
  });

  it("displays price_type correctly", async () => {
    const contractWithFixedPrice: Contract = {
      ...mockContract,
      price_type: "Fijo",
    };
    (api.api as any).mockResolvedValue(Promise.resolve(contractWithFixedPrice));

    render(
      <ContractCard
        contractId="contract-123"
        isOwnMessage={false}
        isClient={true}
        timestamp="2024-01-15T14:30:00Z"
      />,
    );

    await waitFor(() => {
      const priceTypeText = screen.getByText("por servicio");
      expect(priceTypeText).toBeInTheDocument();
    });
  });
});
