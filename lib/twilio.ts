import twilio from "twilio";

export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function sendWhatsAppMessage(to: string, body: string) {
  return twilioClient.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM!,
    to: to.startsWith("whatsapp:") ? to : `whatsapp:${to}`,
    body,
  });
}

export function validateTwilioWebhook(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  return twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    url,
    params
  );
}
