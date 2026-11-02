import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Img,
} from "@react-email/components";

interface VerifyEmailProps {
  email: string;
  name: string;
  url: string;
}

export const VerifyEmail = ({ email, name, url }: VerifyEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Verify your email address for Veltro</Preview>

      <Body
        style={{
          backgroundColor: "#0f0f0f",
          fontFamily: "Inter, system-ui, sans-serif",
          color: "#ffffff",
          padding: "16px",
        }}
      >
        <Container
          style={{
            maxWidth: "465px",
            margin: "40px auto",
            backgroundColor: "#1a1a1a",
            borderRadius: "8px",
            padding: "24px",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {/* Logo */}
          <Section style={{ textAlign: "center", marginBottom: "24px" }}>
            <table align="center" role="presentation">
              <tr>
                <td>
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      color: "#ffffff",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Veltro
                  </span>
                </td>
              </tr>
            </table>
          </Section>

          <Heading
            style={{
              fontSize: 24,
              fontWeight: 400,
              textAlign: "center",
              margin: "24px 0",
            }}
          >
            Verify your email address
          </Heading>

          <Text style={{ color: "#A1A1AA", fontSize: 14 }}>Hello {name},</Text>

          <Text style={{ color: "#A1A1AA", fontSize: 14 }}>
            Thanks for starting the Veltro account creation process. Please
            verify your email to continue.
          </Text>

          {/* CTA */}
          <Section style={{ textAlign: "center", margin: "32px 0" }}>
            <a
              href={url}
              style={{
                backgroundColor: "#ea580c",
                color: "#0b0b0b",
                padding: "12px 22px",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: 500,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Verify Email Address
            </a>
          </Section>

          <Hr style={{ borderColor: "rgba(255,255,255,0.1)" }} />

          <Text style={{ color: "#A1A1AA", fontSize: 12 }}>
            This email was intended for{" "}
            <span style={{ color: "#ffffff" }}>{email}</span>.
          </Text>

          <Text style={{ color: "#A1A1AA", fontSize: 12 }}>
            © {new Date().getFullYear()} Veltro. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default VerifyEmail;
