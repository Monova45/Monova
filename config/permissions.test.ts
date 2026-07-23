import { describe, expect, it } from "vitest";
import { hasPermission } from "@/config/permissions";

describe("hasPermission", () => {
  it("permite al owner gestionar facturación", () => {
    expect(hasPermission("owner", "billing.manage")).toBe(true);
  });

  it("impide al viewer publicar contenido", () => {
    expect(hasPermission("viewer", "content.publish")).toBe(false);
  });

  it("permite al community manager responder mensajes", () => {
    expect(hasPermission("community_manager", "messages.reply")).toBe(true);
  });
});
