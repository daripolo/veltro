import { OtpCodeEmail } from "@/app/emails/otp-code";
import { getResend } from "@/lib/resend";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, name, code } = await request.json();

    const { data, error } = await getResend().emails.send({
      from: "Veltro <onboarding@veltroonline.online>",
      to: [email],
      subject: "Your OTP Code",
      react: OtpCodeEmail({ email, name, code }),
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
