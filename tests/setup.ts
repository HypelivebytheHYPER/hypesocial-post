// Vitest setup file
import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
    set: vi.fn(),
  }),
  usePathname: () => "/",
}));

// Mock next-auth
vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: null,
    status: "unauthenticated",
  }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));
