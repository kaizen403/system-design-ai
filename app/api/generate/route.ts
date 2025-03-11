// app/api/generate/route.ts

import { NextResponse } from "next/server";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGroq } from "@langchain/groq";
import plantumlEncoder from "plantuml-encoder";

// Hardcoded GROQ API key (consider moving this to environment variables)
const apiKey = "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";

// Primary chain to generate the initial PlantUML code
const llm = new ChatGroq({
  apiKey: apiKey,
  model: "deepseek-r1-distill-llama-70b",
  temperature: 0,
  maxTokens: undefined,
  maxRetries: 2,
});

const generationPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a system design expert. Given an idea, generate a high-level architecture plan in PlantUML code only—do not include any extra text or internal reasoning. If any component is not connected (i.e., a box is not pointing anywhere), do not include it. Make it organized and clean.

Requirements:
- important thing is that you need to group things. use straight arrows to show the flow also along with others.
- Plan the overall system architecture at a high level.
- Use emojis as icons to represent key components (each on a new line).
- Organize the diagram into clear sections.
- Use arrows to indicate the flow and explain interactions.
- Instead of generic service names, use specific technology names where applicable (e.g., AWS S3, PostgreSQL, Docker, Kubernetes), but only include them if they are relevant.
- Output only valid PlantUML code between @startuml and @enduml, with no markdown wrappers.
- Always make it high level and fancy.
- Dont use emojis in aliases. and use space insread of new line in aliases.
- IMPORTANT: For any component names that span multiple lines, use the newline escape sequence (\\n) instead of literal newlines.
- I want them organised not clutered here and there. try to group services

Here is an example for reference:
@startuml
title WebRTC Study Group Call Architecture

' Client Side
component "Web Browser\n📱" as client
component "WebRTC\n📹" as webrtc_client
component "React Web App\n📱" as web_app

' Backend Services
component "Node.js (Signaling Server)\n🛡️" as signaling_server
component "WebSocket\n📦" as websocket
component "Express.js\n📊" as express

component "PostgreSQL\n📁" as db
component "AWS S3\n📂" as s3
component "Matching Service\n🤖" as matching_service
component "Media Server\n🎥" as media_server

' WebRTC Interaction
client --> webrtc_client : Initialize
webrtc_client --> signaling_server : Register/Connect
signaling_server --> webrtc_client : Negotiate Connection
webrtc_client --> webrtc_client : Establish Peer Connection

' User Flow
client --> web_app : Join/Create Room
web_app --> signaling_server : Join Room Request
signaling_server --> matching_service : Find/Create Room
matching_service --> signaling_server : Assign Room
signaling_server --> web_app : Room Assignment

' Data Flow
db --> signaling_server : Store/Retrieve Room Data
s3 --> signaling_server : Store/Retrieve Recordings
webrtc_client --> s3 : Upload Recording

' Media Handling
webrtc_client --> media_server : Stream Media
media_server --> s3 : Store Recording

@enduml

Idea: {idea}`,
  ],
  ["human", "Idea: {idea}"],
]);

const generationChain = generationPrompt.pipe(llm);

// Secondary prompt to fix the PlantUML code if it fails rendering
const fixPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a system design expert. The following PlantUML code produced an error when rendering: "{error}". Please inspect the code and correct it so that it generates a valid PlantUML diagram. Output only the corrected PlantUML code between @startuml and @enduml with no extra text or internal reasoning. Make sure to use the newline escape sequence (\\n) for multi-line component names.`,
  ],
  ["human", "PlantUML Code: {code}"],
]);

const fixChain = fixPrompt.pipe(llm);

// Function to encode and fetch the SVG from Kroki using the proper deflate + Base64 encoding
async function fetchSVG(
  plantUmlCode: string,
): Promise<{ ok: boolean; svg?: string; errorMessage?: string }> {
  const encoded = plantumlEncoder.encode(plantUmlCode);
  const krokiUrl = `https://kroki.io/plantuml/svg/${encoded}`;
  const krokiRes = await fetch(krokiUrl);
  if (krokiRes.ok) {
    const svg = await krokiRes.text();
    return { ok: true, svg };
  } else {
    return {
      ok: false,
      errorMessage: `Kroki API responded with status ${krokiRes.status}`,
    };
  }
}

export async function POST(request: Request) {
  let plantUmlCode = "";
  try {
    const { idea } = await request.json();
    if (!idea) {
      return NextResponse.json({ error: "Idea is required" }, { status: 400 });
    }

    // Generate initial PlantUML code
    const result = await generationChain.invoke({ idea });
    const output: string =
      typeof result === "object" && "content" in result
        ? (result as { content: string }).content
        : String(result);

    const match = output.match(/(@startuml[\s\S]*@enduml)/i);
    plantUmlCode = match ? match[1].trim() : output.trim();

    // Try to fetch the SVG; if it fails, iteratively send the code back to the AI to fix it.
    const maxAttempts = 3;
    let attempt = 0;
    let svgResult = await fetchSVG(plantUmlCode);
    while (!svgResult.ok && attempt < maxAttempts) {
      attempt++;
      // Call fixChain with the error and current code to get corrected code
      const fixResult = await fixChain.invoke({
        error: svgResult.errorMessage,
        code: plantUmlCode,
      });
      const fixedOutput: string =
        typeof fixResult === "object" && "content" in fixResult
          ? (fixResult as { content: string }).content
          : String(fixResult);
      const fixMatch = fixedOutput.match(/(@startuml[\s\S]*@enduml)/i);
      plantUmlCode = fixMatch ? fixMatch[1].trim() : fixedOutput.trim();

      svgResult = await fetchSVG(plantUmlCode);
    }

    if (!svgResult.ok) {
      // If still failing after max attempts, return the last error along with the code
      return NextResponse.json(
        { error: svgResult.errorMessage, code: plantUmlCode },
        { status: 500 },
      );
    }

    return NextResponse.json({ svg: svgResult.svg });
  } catch (error: unknown) {
    let message = "Something went wrong";
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json(
      { error: message, code: plantUmlCode },
      { status: 500 },
    );
  }
}
