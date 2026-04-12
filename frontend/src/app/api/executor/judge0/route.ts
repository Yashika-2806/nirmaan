import { NextRequest, NextResponse } from 'next/server';

function getJudge0BaseUrlCandidates() {
    const candidates = [
        process.env.JUDGE0_API_URL,
        process.env.NEXT_PUBLIC_JUDGE0_API_URL,
        'https://ce.judge0.com',
        'https://judge0-ce.p.rapidapi.com',
    ].filter(Boolean) as string[];

    return Array.from(new Set(candidates.map((value) => value.replace(/\/$/, ''))));
}

function getJudge0Headers() {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    const rapidApiKey = process.env.RAPIDAPI_KEY || process.env.JUDGE0_RAPIDAPI_KEY;
    const rapidApiHost = process.env.RAPIDAPI_HOST || process.env.JUDGE0_RAPIDAPI_HOST || 'judge0-ce.p.rapidapi.com';

    if (rapidApiKey) {
        headers['X-RapidAPI-Key'] = rapidApiKey;
        headers['X-RapidAPI-Host'] = rapidApiHost;
    }

    return headers;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { sourceCode, languageId, stdin } = body || {};

        if (!sourceCode || !languageId) {
            return NextResponse.json(
                { success: false, message: 'sourceCode and languageId are required' },
                { status: 400 }
            );
        }

        const payload = JSON.stringify({
            source_code: sourceCode,
            language_id: languageId,
            stdin: stdin || '',
        });

        const candidates = getJudge0BaseUrlCandidates();
        const headers = getJudge0Headers();
        let lastError: unknown = null;
        let lastFailure: { status: number; message: string; provider: string } | null = null;

        for (const baseUrl of candidates) {
            try {
                const response = await fetch(`${baseUrl}/submissions?base64_encoded=false&wait=true`, {
                    method: 'POST',
                    headers,
                    body: payload,
                });

                const data = await response.json().catch(() => ({}));

                if (response.ok) {
                    return NextResponse.json(data, { status: 200 });
                }

                lastFailure = {
                    status: response.status,
                    message: data?.message || data?.error || `Judge0 provider failed with status ${response.status}`,
                    provider: baseUrl,
                };
            } catch (error) {
                lastError = error;
            }
        }

        if (lastFailure) {
            return NextResponse.json(
                {
                    success: false,
                    message: `${lastFailure.message} (provider: ${lastFailure.provider})`,
                },
                { status: 502 }
            );
        }

        throw lastError || new Error('All Judge0 providers failed');
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                message: error?.message || 'Judge0 proxy failed',
            },
            { status: 502 }
        );
    }
}
