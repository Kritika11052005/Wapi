import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { audio, languageCode, mimeType } = await request.json();
    const apiKey = process.env.GOOGLE_SPEECH_TO_TEXT_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_SPEECH_TO_TEXT_API_KEY is not configured in backend env." },
        { status: 500 }
      );
    }

    if (!audio) {
      return NextResponse.json(
        { error: "Audio payload is empty." },
        { status: 400 }
      );
    }

    // Determine encoding based on MIME type
    let encoding = "WEBM_OPUS";
    let sampleRateHertz = 48000;

    if (mimeType?.includes("ogg")) {
      encoding = "OGG_OPUS";
    } else if (mimeType?.includes("mp4") || mimeType?.includes("aac") || mimeType?.includes("m4a")) {
      encoding = "MP3";
      sampleRateHertz = 16000;
    }

    const payload = {
      config: {
        encoding,
        sampleRateHertz,
        languageCode: "en-US",
        alternativeLanguageCodes: ["hi-IN", "mr-IN", "es-ES"],
      },
      audio: {
        content: audio,
      },
    };

    console.log(`Sending to Google STT: lang=${languageCode}, encoding=${encoding}, sampleRate=${sampleRateHertz}`);

    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error("Google Speech API error response:", data.error);
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    const transcription = data.results
      ?.map((result: any) => result.alternatives?.[0]?.transcript)
      .join("\n");

    return NextResponse.json({ transcription: transcription || "" });
  } catch (error: any) {
    console.error("Error in speech-to-text Next.js endpoint:", error);
    return NextResponse.json(
      { error: error.message || "Failed to transcribe audio." },
      { status: 500 }
    );
  }
}
