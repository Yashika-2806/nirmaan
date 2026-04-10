import { NextRequest, NextResponse } from 'next/server';

const JUDGE0_BASE_URL = process.env.JUDGE0_API_URL || 'https://ce.judge0.com';

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

        const response = await fetch(`${JUDGE0_BASE_URL.replace(/\/$/, '')}/submissions?base64_encoded=false&wait=true`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                source_code: sourceCode,
                language_id: languageId,
                stdin: stdin || '',
            }),
        });

        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
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
