import { ImageResponse } from "next/og"
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site"

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/**
 * Social share card. Built with ImageResponse so it always matches the brand
 * tokens and never depends on an external image host.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "72px",
          background: "#0B0B0B",
          color: "#F2F0EC",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -140,
            width: 640,
            height: 640,
            borderRadius: 9999,
            background: "rgba(234, 88, 12, 0.16)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -40,
            right: 60,
            width: 360,
            height: 360,
            borderRadius: 9999,
            border: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "#EA580C",
              color: "#0B0B0B",
              fontSize: 62,
              fontWeight: 700,
              lineHeight: 1,
              paddingBottom: 10,
            }}
          >
            *
          </div>
          <div
            style={{
              display: "flex",
              marginLeft: 20,
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: -1.4,
            }}
          >
            {SITE_NAME}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              maxWidth: 920,
              fontSize: 74,
              fontWeight: 600,
              lineHeight: 1.04,
              letterSpacing: -3,
            }}
          >
            {SITE_TAGLINE}
          </div>
          <div
            style={{
              display: "flex",
              maxWidth: 780,
              marginTop: 24,
              fontSize: 28,
              lineHeight: 1.4,
              color: "#A3A39C",
            }}
          >
            {SITE_DESCRIPTION}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex" }}>
            {["Global transfers", "Multi-currency", "Smart cards"].map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  marginRight: 12,
                  padding: "10px 20px",
                  borderRadius: 9999,
                  border: "1px solid #2A2A2A",
                  background: "#141414",
                  fontSize: 22,
                  color: "#F2F0EC",
                }}
              >
                {label}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "#8A8A84" }}>
            {SITE_URL.replace(/^https?:\/\//, "")}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}
