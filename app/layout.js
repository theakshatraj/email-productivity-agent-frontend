import './globals.css';
import { EmailProvider } from '@/context/EmailContext';
import AppShell from '@/components/AppShell';
import { ToastProvider } from '@/context/ToastContext';

export const metadata = {
  title: 'Email Productivity Agent',
  description: 'Prompt-driven agent for inbox categorization, actions, and drafting',
  viewport: 'width=device-width, initial-scale=1',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <EmailProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
          <div id="toast-root" />
        </EmailProvider>
      </body>
    </html>
  );
}
