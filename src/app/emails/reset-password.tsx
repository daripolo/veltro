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

interface ResetPasswordProps {
  email: string;
  name: string;
  url: string;
}

export const ResetPassword = ({ email, name, url }: ResetPasswordProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your Veltro password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <table align="center" role="presentation">
              <tr>
                <td>
                  <span style={brandName}>Veltro</span>
                </td>
              </tr>
            </table>
          </Section>
          
          <Heading style={heading}>Reset your password</Heading>
          
          <Text style={text}>Hello {name},</Text>
          
          <Text style={text}>
            Someone recently requested a password change for your Veltro account.
            If this was you, you can set a new password here:
          </Text>
          
          <Section style={buttonContainer}>
            <a style={button} href={url}>
              Reset password
            </a>
          </Section>
          
          <Text style={text}>
            If you don't want to change your password or didn't request this, just
            ignore and delete this message.
          </Text>
          
          <Text style={text}>
            To keep your account secure, please don't forward this email to anyone.
          </Text>
          
          <Hr style={hr} />
          
          <Text style={footer}>
            © {new Date().getFullYear()} Veltro. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default ResetPassword;

const main = {
  backgroundColor: "#0f0f0f",
  fontFamily: "Inter, system-ui, sans-serif",
  color: "#ffffff",
  padding: "16px",
};

const container = {
  maxWidth: "465px",
  margin: "40px auto",
  backgroundColor: "#1a1a1a",
  borderRadius: "8px",
  padding: "24px",
  border: "1px solid rgba(255,255,255,0.1)",
};

const logoSection = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const logoIcon = {
  width: 32,
  height: 32,
  borderRadius: "50%",
  backgroundColor: "#ea580c",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginRight: 8,
};

const logoText = {
  fontSize: 18,
  fontWeight: "bold",
  color: "#000",
};

const brandName = {
  fontSize: 20,
  fontWeight: "bold",
  color: "#ffffff",
  letterSpacing: "0.5px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "400",
  textAlign: "center" as const,
  margin: "24px 0",
  color: "#ffffff",
};

const text = {
  color: "#A1A1AA",
  fontSize: "14px",
  lineHeight: "24px",
  marginBottom: "16px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#ea580c",
  color: "#0b0b0b",
  padding: "12px 22px",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: 500,
  textDecoration: "none",
  display: "inline-block",
};

const hr = {
  borderColor: "rgba(255,255,255,0.1)",
  margin: "20px 0",
};

const footer = {
  color: "#A1A1AA",
  fontSize: "12px",
  textAlign: "center" as const,
};
