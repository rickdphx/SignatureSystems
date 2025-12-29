import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The Signature Chair - Book Your Appointment',
  description: 'Professional barber services - Book your appointment online',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="bg-white shadow-sm">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex justify-between items-center">
                <a href="/" className="text-2xl font-bold text-primary-600">
                  The Signature Chair
                </a>
                <div className="space-x-6">
                  <a href="/services" className="hover:text-primary-600">
                    Services
                  </a>
                  <a href="/book" className="btn btn-primary">
                    Book Now
                  </a>
                </div>
              </div>
            </nav>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="bg-gray-900 text-white py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <p>&copy; 2025 The Signature Chair. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
