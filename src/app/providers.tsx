// src/app/providers.tsx
'use client'; // ต้องระบุว่าเป็น Client Component

import { SessionProvider } from 'next-auth/react';
import React, { ReactNode } from 'react';

interface NextAuthSessionProviderProps {
  children: ReactNode;
}

export default function NextAuthSessionProvider({ children }: NextAuthSessionProviderProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
