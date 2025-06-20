'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of our context value
interface CartCountContextType {
  count: number;
  setCounter: (value: number) => void;
  increment: () => void;
  decrement: () => void;
}

// Create the context with a default undefined value
const CartCountContext = createContext<CartCountContextType | undefined>(undefined);

// Provider component to wrap your application or parts of it
interface CartCountProviderProps {
  children: ReactNode;
}

export function CartCountProvider({ children }: CartCountProviderProps) {
  const [count, setCount] = useState<number>(0);

  const setCounter = (value: number) => {
    setCount(value);
  };

  const increment = () => {
    setCount(prevCount => prevCount + 1);
  };

  const decrement = () => {
    setCount(prevCount => Math.max(0, prevCount - 1)); // Ensure count doesn't go below 0
  };

  return (
    <CartCountContext.Provider value={{ count, setCounter, increment, decrement }}>
      {children}
    </CartCountContext.Provider>
  );
}

// Custom hook to consume the context
export function useCounter() {
  const context = useContext(CartCountContext);
  if (context === undefined) {
    throw new Error('useCounter must be used within a CartCountProvider');
  }
  return context;
}
