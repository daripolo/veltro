
import ImsNextStepEmail from "@/app/emails/ims-next-step";
import { getResend } from "@/lib/resend";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, name} = await request.json();

    const { data, error } = await getResend().emails.send({
      from: "Veltro <onboarding@veltroonline.online>",
      to: [email],
      subject: "Next Step Information",
      react: ImsNextStepEmail({email,name}),
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
