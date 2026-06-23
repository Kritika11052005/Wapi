import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { rateLimiters, applyRateLimit } from "@/lib/rate-limit";
import { sanitiseDocumentContent } from "@/lib/sanitise";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Helper function to split text into overlapping character chunks
function chunkText(text: string, chunkSize = 1000, overlap = 150): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const chunk = text.slice(i, i + chunkSize);
    chunks.push(chunk);
    i += chunkSize - overlap;
  }
  return chunks;
}

export async function POST(request: Request) {
  // 1. Authenticate User Session
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Fetch Business ID
  const { data: business, error: bizErr } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (bizErr || !business) {
    return NextResponse.json({ error: "Business profile not found" }, { status: 404 });
  }

  const businessId = business.id;

  // 3. Apply Documents Rate Limiter
  const rateLimitResponse = await applyRateLimit(rateLimiters.documents, businessId);
  if (rateLimitResponse) return rateLimitResponse;

  // 4. Parse Request Body
  let body: any;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { filename, content } = body;
  if (!content) {
    return NextResponse.json({ error: "Missing document content" }, { status: 400 });
  }

  // Sanitise document input
  let sanitisedContent = "";
  try {
    sanitisedContent = sanitiseDocumentContent(content);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (!genAI) {
    return NextResponse.json({ error: "Gemini AI is not configured" }, { status: 500 });
  }

  // 5. Delete previous documents to avoid RAG duplicate crowding
  await supabase
    .from("documents")
    .delete()
    .eq("business_id", businessId);

  // Insert Document into Database (Status: Processing)
  const { data: document, error: docErr } = await supabase
    .from("documents")
    .insert({
      business_id: businessId,
      filename: filename || "Untitled pasted document",
      content: sanitisedContent,
      file_size: Buffer.byteLength(sanitisedContent, "utf8"),
      status: "processing",
    })
    .select()
    .single();

  if (docErr || !document) {
    console.error("Error creating document record:", docErr);
    return NextResponse.json({ error: "Failed to store document record" }, { status: 500 });
  }

  // Initialize admin client for bypassing RLS during bulk chunk inserts
  const adminClient = createSupabaseAdminClient();

  try {
    // 6. Split Content into Chunks
    const textChunks = chunkText(sanitisedContent, 1000, 150);
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

    // 7. Process Embeddings & Insert chunks
    const chunkPromises = textChunks.map(async (chunk, index) => {
      // Generate Embedding vector
      const embedResult = await embeddingModel.embedContent({
        content: { role: "user", parts: [{ text: chunk }] },
      });
      const embedding = embedResult.embedding.values;

      // Insert chunk
      return adminClient.from("document_chunks").insert({
        document_id: document.id,
        business_id: businessId,
        content: chunk,
        embedding: embedding,
        chunk_index: index,
      });
    });

    const results = await Promise.all(chunkPromises);
    const errorChunk = results.find(r => r.error);
    
    if (errorChunk) {
      throw errorChunk.error;
    }

    // 8. Update Document Status to Indexed
    await supabase
      .from("documents")
      .update({
        status: "indexed",
        chunk_count: textChunks.length,
      })
      .eq("id", document.id);

    return NextResponse.json({
      success: true,
      documentId: document.id,
      chunksCount: textChunks.length,
    }, { status: 201 });

  } catch (err: any) {
    console.error("Error in document embedding pipeline:", err);
    // Mark document as error
    await supabase
      .from("documents")
      .update({ status: "error" })
      .eq("id", document.id);

    return NextResponse.json({ error: "Failed to process document chunks: " + err.message }, { status: 500 });
  }
}
