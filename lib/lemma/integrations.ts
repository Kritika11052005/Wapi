import { LemmaIntegration } from "@lemma/sdk";

export const whatsappIntegration = new LemmaIntegration({
  name: "meta-whatsapp",
  type: "webhook",
  config: {
    baseUrl: "https://graph.facebook.com/v20.0",
    authToken: process.env.WHATSAPP_ACCESS_TOKEN!,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
  },
  send: async (to: string, message: string) => {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      console.warn("WhatsApp integration cannot send message - missing tokens");
      return { warning: "Unconfigured Meta credentials" };
    }

    try {
      const res = await fetch(
        `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body: message },
          }),
        }
      );
      const resJson = await res.json();
      console.log("Meta API Response status:", res.status, "body:", JSON.stringify(resJson));
      return resJson;
    } catch (err) {
      console.error("Failed to send Meta WhatsApp Message:", err);
      throw err;
    }
  },
});
