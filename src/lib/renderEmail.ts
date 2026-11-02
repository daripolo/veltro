import { VerifyEmail } from './../app/emails/verify-email';
import { ResetPassword } from './../app/emails/reset-password';
import { render } from "@react-email/render"

interface VerifyEmailProps {
  email: string;
  name: string;
  url: string;
}

interface ResetPasswordProps {
  email: string;
  name: string;
  url: string;
}

export const renderVerifyEmail = async ({email, name, url}: VerifyEmailProps) => {
  return await render(VerifyEmail({email,name,url}))
}

export const renderResetPasswordEmail = async ({email, name, url}: ResetPasswordProps) => {
  return await render(ResetPassword({email,name,url}))
}

