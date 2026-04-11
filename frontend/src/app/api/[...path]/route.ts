import { NextRequest, NextResponse } from 'next/server';

function normalizeBackendBaseUrl(rawUrl: string) {
    const parsed = new URL(rawUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid backend URL protocol');
    }

    const trimmed = parsed.toString().replace(/\/$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

function getBackendBaseUrlCandidates() {
    const candidates = [
        process.env.BACKEND_API_URL,
        process.env.NEXT_PUBLIC_API_URL,
        'http://127.0.0.1:5000/api',
        'http://localhost:5000/api',
    ].filter(Boolean) as string[];

    const normalized: string[] = [];
    for (const candidate of candidates) {
        try {
            normalized.push(normalizeBackendBaseUrl(candidate));
        } catch {
            // Ignore invalid candidate and continue with others.
        }
    }

    return Array.from(new Set(normalized));
}

async function proxyRequest(req: NextRequest, pathSegments: string[]) {
    const safeSegments = (pathSegments || []).map(segment => encodeURIComponent(segment));
    const path = safeSegments.join('/');

    const headers = new Headers(req.headers);
    headers.delete('host');

    const init: RequestInit = {
        method: req.method,
        headers,
        cache: 'no-store',
    };

    if (!['GET', 'HEAD'].includes(req.method)) {
        init.body = await req.text();
    }

    const backendCandidates = getBackendBaseUrlCandidates();
    let lastError: unknown = null;

    for (const baseUrl of backendCandidates) {
        const targetUrl = `${baseUrl}/${path}`;
        try {
            const response = await fetch(targetUrl, init);
            const responseHeaders = new Headers(response.headers);
            return new NextResponse(response.body, {
                status: response.status,
                headers: responseHeaders,
            });
        } catch (error) {
            lastError = error;
        }
    }

    const isDev = process.env.NODE_ENV !== 'production';
    return NextResponse.json(
        {
            success: false,
            message: isDev
                ? 'API proxy is unavailable. Backend may be down. Start backend on localhost:5000.'
                : 'API proxy is unavailable.',
            ...(isDev ? { detail: String(lastError || 'Unknown proxy error') } : {}),
        },
        { status: 502 }
    );
}

export async function GET(req: NextRequest, { params }: { params: { path?: string[] } }) {
    return proxyRequest(req, params.path || []);
}

export async function POST(req: NextRequest, { params }: { params: { path?: string[] } }) {
    return proxyRequest(req, params.path || []);
}

export async function PUT(req: NextRequest, { params }: { params: { path?: string[] } }) {
    return proxyRequest(req, params.path || []);
}

export async function PATCH(req: NextRequest, { params }: { params: { path?: string[] } }) {
    return proxyRequest(req, params.path || []);
}

export async function DELETE(req: NextRequest, { params }: { params: { path?: string[] } }) {
    return proxyRequest(req, params.path || []);
}

export async function OPTIONS(req: NextRequest, { params }: { params: { path?: string[] } }) {
    return proxyRequest(req, params.path || []);
}
