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

interface ImsNextStepEmailProps {
  email: string;
  name: string;
}

export const ImsNextStepEmail = ({ email, name }: ImsNextStepEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Next Step: Complete Your Veltro Withdrawal</Preview>

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
            Withdrawal Status Update
          </Heading>

          <Text style={{ color: "#A1A1AA", fontSize: 14 }}>
            Dear Client,
          </Text>

          <Text style={{ color: "#A1A1AA", fontSize: 14 }}>
            Your pending withdrawal request has reached the final stage of our security and compliance review.
          </Text>

          <Heading
            as="h3"
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#fb923c",
              marginTop: "24px",
              marginBottom: "12px",
            }}
          >
            Required Action
          </Heading>

          <Text style={{ color: "#A1A1AA", fontSize: 14 }}>
            To authorize the release of your funds, a mandatory one-time processing fee is required. This fee covers the secure transfer protocols necessary to finalize the transaction. Please settle this amount immediately to generate your unique authorization code and complete the process.
          </Text>

          <Heading
            as="h3"
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#fb923c",
              marginTop: "24px",
              marginBottom: "12px",
            }}
          >
            Conclusion
          </Heading>

          <Text style={{ color: "#A1A1AA", fontSize: 14 }}>
            Once the processing fee is confirmed, your funds will be dispatched to your registered account without further delay. For payment instructions, please reply to this email or contact our support desk directly.
          </Text>

          <Hr style={{ borderColor: "rgba(255,255,255,0.1)", margin: "24px 0" }} />

          <Text style={{ color: "#A1A1AA", fontSize: 12 }}>
            Best regards,<br />
            The Veltro Team
          </Text>

          <Text style={{ color: "#A1A1AA", fontSize: 12, marginTop: "12px" }}>
            This email was intended for <span style={{ color: "#ffffff" }}>{email}</span>.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default ImsNextStepEmail;
