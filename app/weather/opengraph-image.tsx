import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const alt = "SkyCast — Live Weather & Forecast";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** OG card for the decoy page — looks like a plain weather service. */
export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background:
            "linear-gradient(180deg, #0f1e4d 0%, #1e3a8a 40%, #2563eb 75%, #38bdf8 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 70,
            right: 130,
            width: 150,
            height: 150,
            borderRadius: 9999,
            background: "#fbbf24",
            boxShadow: "0 0 90px rgba(253, 224, 71, 0.9)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-end",
            marginBottom: 34,
          }}
        >
          <div
            style={{
              width: 240,
              height: 66,
              borderRadius: 60,
              background: "rgba(255,255,255,0.92)",
            }}
          />
          <div
            style={{
              width: 120,
              height: 84,
              borderRadius: 9999,
              background: "rgba(255,255,255,0.92)",
              marginLeft: -36,
              marginBottom: -24,
            }}
          />
        </div>
        <div
          style={{
            fontSize: 84,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: -2,
          }}
        >
          SkyCast
        </div>
        <div style={{ marginTop: 22, fontSize: 36, color: "rgba(255,255,255,0.92)" }}>
          Live Weather &amp; 7-day Forecast
        </div>
      </div>
    ),
    { ...size },
  );
}