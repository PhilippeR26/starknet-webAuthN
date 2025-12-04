import React from 'react';
import './globals.css';
import { Provider } from "@/components/ui/provider";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Starknet-WebAuthN',
  description: 'Demo of Starknet.js webAuthN signature',
  icons: {
    icon: "./favicon.ico",
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  return (
    <html suppressHydrationWarning>
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  )
}
