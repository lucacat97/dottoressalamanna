import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAutomaticCephalometryAccess } from "@/hooks/useAutomaticCephalometryAccess";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  onAuthStateChange: vi.fn(),
  unsubscribe: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: mocks.rpc, auth: { onAuthStateChange: mocks.onAuthStateChange } },
}));

describe("accesso Cefalometria Automatica per email abilitata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: mocks.unsubscribe } } });
  });

  it("ammette esclusivamente l'autorizzazione esplicita del server", async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    const { result } = renderHook(useAutomaticCephalometryAccess);
    expect(result.current).toBe(false);
    await waitFor(() => expect(result.current).toBe(true));
    expect(mocks.rpc).toHaveBeenCalledWith("can_use_automatic_cephalometry");
  });

  it("nega l'accesso alle email non abilitate", async () => {
    mocks.rpc.mockResolvedValue({ data: false, error: null });
    const { result } = renderHook(useAutomaticCephalometryAccess);
    await act(async () => {});
    expect(result.current).toBe(false);
  });

  it("nega l'accesso anche in caso di errore nel controllo", async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: { message: "Accesso negato" } });
    const { result } = renderHook(useAutomaticCephalometryAccess);
    await act(async () => {});
    expect(result.current).toBe(false);
  });

  it("revoca l'accesso al logout senza riutilizzare l'autorizzazione precedente", async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    const { result } = renderHook(useAutomaticCephalometryAccess);
    await waitFor(() => expect(result.current).toBe(true));
    const callback = mocks.onAuthStateChange.mock.calls[0][0];
    act(() => callback("SIGNED_OUT", null));
    expect(result.current).toBe(false);
  });
});