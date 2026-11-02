import { NextResponse } from "next/server";

function normalizeIban(raw: string) {
  return raw.replace(/\s+/g, "").toUpperCase();
}

function normalizeAbaRoutingNumber(raw: string) {
  return raw.replace(/[^\d]/g, "");
}

function isLikelyIban(raw: string) {
  const iban = normalizeIban(raw);
  return /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban);
}

function isLikelyAbaRoutingNumber(raw: string) {
  const digits = normalizeAbaRoutingNumber(raw);
  return /^\d{9}$/.test(digits);
}

const IBAN_COUNTRY_CODES = new Set([
  "AD",
  "AE",
  "AL",
  "AT",
  "AZ",
  "BA",
  "BE",
  "BG",
  "BH",
  "BR",
  "BY",
  "CH",
  "CR",
  "CY",
  "CZ",
  "DE",
  "DK",
  "DO",
  "EE",
  "ES",
  "FI",
  "FO",
  "FR",
  "GB",
  "GE",
  "GI",
  "GL",
  "GR",
  "GT",
  "HR",
  "HU",
  "IE",
  "IL",
  "IQ",
  "IS",
  "IT",
  "JO",
  "KW",
  "KZ",
  "LB",
  "LC",
  "LI",
  "LT",
  "LU",
  "LV",
  "MC",
  "MD",
  "ME",
  "MK",
  "MR",
  "MT",
  "MU",
  "NL",
  "NO",
  "PK",
  "PL",
  "PS",
  "PT",
  "QA",
  "RO",
  "RS",
  "SA",
  "SC",
  "SE",
  "SI",
  "SK",
  "SM",
  "ST",
  "SV",
  "TL",
  "TN",
  "TR",
  "UA",
  "VA",
  "VG",
  "XK",
]);

type ResolveRequest = {
  account: string;
  name?: string;
  currency?: string;
};

export async function POST(req: Request) {
  let body: ResolveRequest | null = null;
  try {
    body = (await req.json()) as ResolveRequest;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const account = typeof body?.account === "string" ? body.account.trim() : "";
  if (!account) {
    return NextResponse.json({ ok: false, error: "Missing account" }, { status: 400 });
  }

  const currency =
    typeof body?.currency === "string" ? body.currency.trim().toUpperCase() : "";

  const normalizedIbanCandidate = normalizeIban(account);
  const supportedIbanCandidate =
    isLikelyIban(normalizedIbanCandidate) &&
    IBAN_COUNTRY_CODES.has(normalizedIbanCandidate.slice(0, 2));

  const shouldUseAba =
    (currency === "USD" || !currency) && isLikelyAbaRoutingNumber(account);
  const shouldUseIban = supportedIbanCandidate;

  if (shouldUseAba) {
    const routingNumber = normalizeAbaRoutingNumber(account);
    if (!isLikelyAbaRoutingNumber(routingNumber)) {
      return NextResponse.json({
        ok: true,
        kind: "aba",
        input: account,
        routingNumber,
        valid: false,
        messages: ["Invalid routing number. Must be a valid 9-digit ABA routing number."],
        bank: null,
        holder: null,
        nameMatch: null,
      });
    }

    try {
      const url = `https://bankrouting.io/api/v1/aba/${encodeURIComponent(routingNumber)}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        return NextResponse.json(
          { ok: false, error: "Resolve service unavailable" },
          { status: 502 },
        );
      }

      const data = (await res.json()) as any;
      const status = typeof data?.status === "string" ? data.status : "";
      if (status !== "success") {
        const errMsg =
          typeof data?.error?.message === "string"
            ? data.error.message
            : "Invalid routing number";
        return NextResponse.json({
          ok: true,
          kind: "aba",
          input: account,
          routingNumber,
          valid: false,
          messages: [errMsg].filter((m) => typeof m === "string" && m.length > 0).slice(0, 4),
          bank: null,
          holder: null,
          nameMatch: null,
        });
      }

      const bankName =
        typeof data?.data?.bank_name === "string"
          ? data.data.bank_name
          : typeof data?.data?.bankName === "string"
            ? data.data.bankName
            : null;

      return NextResponse.json({
        ok: true,
        kind: "aba",
        input: account,
        routingNumber,
        valid: true,
        messages: [],
        bank: bankName ? { name: bankName } : null,
        holder: null,
        nameMatch: null,
      });
    } catch {
      return NextResponse.json(
        { ok: false, error: "Resolve service unavailable" },
        { status: 502 },
      );
    }
  }

  if (!shouldUseIban) {
    return NextResponse.json({
      ok: true,
      kind: "unknown",
      input: account,
      valid: false,
      messages: [],
      bank: null,
      holder: null,
      nameMatch: null,
    });
  }

  const isIban = isLikelyIban(account);
  if (!isIban) {
    return NextResponse.json({
      ok: true,
      kind: "unknown",
      input: account,
      valid: false,
      messages: [],
      bank: null,
      holder: null,
      nameMatch: null,
    });
  }

  const iban = normalizeIban(account);

  let bank: { name?: string | null; bic?: string | null; bankCode?: string | null } | null = null;
  let valid = false;
  let messages: string[] = [];

  try {
    const url = `https://openiban.com/validate/${encodeURIComponent(
      iban,
    )}?getBIC=true&validateBankCode=true`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: "Resolve service unavailable" },
        { status: 502 },
      );
    }

    const data = (await res.json()) as any;
    valid = data?.valid === true;
    messages = Array.isArray(data?.messages)
      ? data.messages.filter((m: unknown) => typeof m === "string").slice(0, 4)
      : [];

    const bankData = data?.bankData ?? data?.bank_data ?? null;
    if (bankData && typeof bankData === "object") {
      bank = {
        name:
          typeof bankData?.name === "string"
            ? bankData.name
            : typeof bankData?.bank === "string"
              ? bankData.bank
              : null,
        bic: typeof bankData?.bic === "string" ? bankData.bic : null,
        bankCode:
          typeof bankData?.bankCode === "string"
            ? bankData.bankCode
            : typeof bankData?.bank_code === "string"
              ? bankData.bank_code
              : null,
      };
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: "Resolve service unavailable" },
      { status: 502 },
    );
  }

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  let nameMatch: string | null = null;

  const bavKey = process.env.IBAN_BAV_API_KEY;
  if (bavKey && name) {
    try {
      const res = await fetch("https://api.iban.com/clients/api/verify/v3/", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": bavKey,
        },
        body: JSON.stringify({ IBAN: iban, name }),
      });
      if (res.ok) {
        const data = (await res.json()) as any;
        const rawMatch = data?.result?.name_match;
        if (typeof rawMatch === "string") nameMatch = rawMatch;
      }
    } catch {}
  }

  return NextResponse.json({
    ok: true,
    kind: "iban",
    input: account,
    iban,
    valid,
    messages,
    bank,
    holder: null,
    nameMatch,
  });
}
