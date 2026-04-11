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
