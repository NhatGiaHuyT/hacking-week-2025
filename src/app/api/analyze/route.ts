import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🚀 [ANALYZE API] Starting analyze request');

  try {
    console.log('📥 [ANALYZE API] content-type:', request.headers.get('content-type'));

    // Get raw body and try to parse intelligently (helps debug non-json input)
    const raw = await request.text();
    console.log('📥 [ANALYZE API] Raw request body:', raw);

    let body;
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.warn('⚠️ [ANALYZE API] Could not parse JSON body; using raw text as query');
      body = { query: raw };
    }

    const { query } = body;
    console.log('📝 [ANALYZE API] Received query:', query);

    if (!query || (typeof query === 'string' && query.trim().length === 0)) {
      console.log('❌ [ANALYZE API] Query parameter missing');
      return NextResponse.json({ success: false, error: "Query is required" }, { status: 400 });
    }

    // If external API expects query as a string, ensure it's stringified
    const externalQueryPayload = typeof query === 'string' ? query : JSON.stringify(query);

    const externalApiUrl = 'https://monroe-paludal-standoffishly.ngrok-free.dev/api/v1/analyze';
    console.log('🌐 [ANALYZE API] Calling external API:', externalApiUrl);

    const response = await fetch(externalApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: externalQueryPayload }),
    });

    console.log('📊 [ANALYZE API] External API response status:', response.status);

    // Always read raw text for diagnostics, then try to parse
    const responseText = await response.text();
    console.log('📥 [ANALYZE API] External raw response body:', responseText);

    if (!response.ok) {
      let parsed;
      try { parsed = JSON.parse(responseText); } catch {}
      console.error('❌ [ANALYZE API] External API error:', response.status, response.statusText, parsed || responseText);
      return NextResponse.json({
        success: false,
        error: `External API error: ${response.status} ${response.statusText}`,
        details: parsed || responseText
      }, { status: response.status });
    }

    let externalResponse;
    try {
      externalResponse = JSON.parse(responseText);
    } catch (e) {
      console.error('⚠️ [ANALYZE API] External response not valid JSON');
      return NextResponse.json({ success: false, error: 'External API returned non-JSON' }, { status: 502 });
    }

    // Map and return
    const mappedResponse = {
      success: true,
      answer: externalResponse.answer,
      answer_draft: externalResponse.answer_draft || externalResponse.answer, // Include answer_draft
      nba: externalResponse.nba,
      proposed_questions: externalResponse.proposed_questions || externalResponse.proposed || [], // Include proposed_questions
      similar: externalResponse.similar
    };

    console.log('📤 [ANALYZE API] Mapped response:', {
      hasAnswer: !!mappedResponse.answer,
      hasAnswerDraft: !!mappedResponse.answer_draft,
      hasNba: !!mappedResponse.nba,
      hasProposedQuestions: !!mappedResponse.proposed_questions,
      proposedQuestionsLength: Array.isArray(mappedResponse.proposed_questions) ? mappedResponse.proposed_questions.length : 0,
      nbaLength: Array.isArray(mappedResponse.nba) ? mappedResponse.nba.length : 0
    });

    return NextResponse.json(mappedResponse);
  } catch (error) {
    console.error('💥 [ANALYZE API] Critical error occurred:', error);
    return NextResponse.json({ success: false, error: "Analysis failed" }, { status: 500 });
  }
}
