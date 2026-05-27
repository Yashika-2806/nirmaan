import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const plusJakarta = Plus_Jakarta_Sans({
    subsets: ['latin'],
    variable: '--font-body',
});

const spaceGrotesk = Space_Grotesk({
    subsets: ['latin'],
    variable: '--font-display',
});

export const metadata: Metadata = {
    title: 'Nirmaan - Placement Acceleration Platform',
    description: 'Daily placement sprints, AI mentor guidance, and interview prep for faster shortlist outcomes.',
    icons: {
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%2307c" width="100" height="100"/><text x="50" y="70" font-size="60" font-weight="bold" text-anchor="middle" fill="white" font-family="sans-serif">N</text></svg>',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${plusJakarta.variable} ${spaceGrotesk.variable}`}>
                {children}
                <ThemeToggle variant="floating" />
                <Toaster position="top-right" />
            </body>
        </html>
    );
}
