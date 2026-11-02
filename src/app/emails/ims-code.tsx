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
  Img
} from "@react-email/components";

interface ImsCodeEmailProps {
  email: string;
  name: string;
  code: string;
}

export const ImsCodeEmail = ({ email, name, code }: ImsCodeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your IMS Code for Veltro</Preview>

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
            Your IMS Code
          </Heading>

          <Text style={{ color: "#A1A1AA", fontSize: 14 }}>
            Hello {name},
          </Text>

          <Text style={{ color: "#A1A1AA", fontSize: 14 }}>
            You have requested an IMS code. Please use the following code to proceed:
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
            If you did not request this code, please ignore this email or contact support if you have concerns.
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

export default ImsCodeEmail;
