import { Router, type IRouter } from "express";
import { createRegistry } from "../providers/registry";
import type { BookingRequest } from "../providers/types";

const router: IRouter = Router();
const registry = createRegistry();

/**
 * POST /v1/book
 *
 * Book a specific item from a provider. The provider + providerRef identify
 * which item; the rest is traveler info.
 *
 * For commission-based providers (TravelPayouts, Viator, Klook, GetYourGuide),
 * booking means redirecting to the affiliate link — the response returns a
 * `bookingUrl` that the mobile app opens in a webview.
 *
 * For direct-booking providers (Amadeus, Fluxir, OpenTable), the server
 * handles the booking API call and returns a confirmation reference.
 */
router.post("/v1/book", async (req, res) => {
  const body = req.body as Partial<BookingRequest>;

  if (!body.provider || !body.providerRef || !body.type) {
    return res.status(400).json({ error: "provider, providerRef, and type are required" });
  }

  const bookReq: BookingRequest = {
    provider: body.provider,
    providerRef: body.providerRef,
    type: body.type,
    travelers: body.travelers ?? 1,
    contactEmail: body.contactEmail ?? "",
    contactPhone: body.contactPhone,
    passengerNames: body.passengerNames,
    passportNumber: body.passportNumber,
    paymentMethodId: body.paymentMethodId,
  };

  const result = await registry.book(bookReq);
  return res.json(result);
});

export default router;
