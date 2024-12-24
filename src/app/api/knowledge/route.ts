import { NextResponse } from 'next/server';
import { KnowledgeExtractor } from '@/services/knowledgeExtractor';

const knowledgeExtractor = new KnowledgeExtractor(process.env.OPENAI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { websiteContent, messages } = await request.json();

    const knowledge = await knowledgeExtractor.updateKnowledge(
      websiteContent,
      messages
    );

    return NextResponse.json({ knowledge });
  } catch (error) {
    console.error('Knowledge Extraction Error:', error);
    return NextResponse.json(
      { error: 'Failed to extract knowledge' },
      { status: 500 }
    );
  }
}
