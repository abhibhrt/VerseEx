import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || ''
});

interface AskRequestBody {
    question: string;
    context: string;
    title: string;
}

export async function POST(req: NextRequest) {
    try {
        const body: AskRequestBody = await req.json();
        const { question, context, title } = body;

        if (!question || !context) {
            return NextResponse.json(
                { error: 'Question aur context dono required hain.' },
                { status: 400 }
            );
        }

        const prompt = `You are a helpful knowledge assistant. Answer the user's question clearly and concisely based on the following Wikipedia article about "${title}". (Without Bold or Italic) Avoid complex jargon and markdown syntax like asterisks.

Article Context:
"${context}"

User Question:
"${question}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash-lite',
            contents: prompt,
        });

        const answer = response.text ?? 'No response generated.';
        return NextResponse.json({ answer });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Ask API Error:', errorMessage);

        if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
            return NextResponse.json(
                { error: 'AI limit reached for now. Please wait a minute and retry.' },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to process the question. Please try again.' },
            { status: 500 }
        );
    }
}