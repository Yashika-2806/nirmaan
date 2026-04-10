import { NextRequest, NextResponse } from 'next/server';

function getBackendBaseUrl() {
    const configured = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
    const trimmed = configured.replace(/\/$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

async function proxyRequest(req: NextRequest, pathSegments: string[]) {
    const path = pathSegments.join('/');
    const targetUrl = `${getBackendBaseUrl()}/${path}`;

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

    try {
        const response = await fetch(targetUrl, init);
        const responseHeaders = new Headers(response.headers);
        return new NextResponse(response.body, {
            status: response.status,
            headers: responseHeaders,
        });
    } catch {
        return NextResponse.json(
            {
                success: false,
                message: 'API proxy is unavailable. Set BACKEND_API_URL on the hosting server.',
            },
            { status: 502 }
        );
    }
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
