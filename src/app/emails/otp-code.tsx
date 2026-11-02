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

interface OtpCodeEmailProps {
  email: string;
  name: string;
  code: string;
}

export const OtpCodeEmail = ({ email, name, code }: OtpCodeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your OTP Code for Veltro</Preview>

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
            Your One-Time Password
          </Heading>

          <Text style={{ color: "#A1A1AA", fontSize: 14 }}>
            Hello {name},
          </Text>

          <Text style={{ color: "#A1A1AA", fontSize: 14 }}>
            Please use the following OTP code to verify your action:
          </Text>

          {/* Code Display */}
          <Section style={{ textAlign: "center", margin: "32px 0" }}>
            <div
              style={{
                backgroundColor: "rgba(234, 88, 12, 0.12)",
                color: "#fb923c",
                padding: "16px 24px",
                borderRadius: "8px",
                fontSize: "32px",
                fontWeight: "bold",
                letterSpacing: "4px",
                display: "inline-block",
                border: "1px solid rgba(212, 175, 55, 0.3)",
              }}
            >
              {code}
            </div>
          </Section>
          
          <Text style={{ color: "#A1A1AA", fontSize: 14 }}>
            This code is valid for 10 minutes. Do not share this code with anyone.
          </Text>

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

export default OtpCodeEmail;
