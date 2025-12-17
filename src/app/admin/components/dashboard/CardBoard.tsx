import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const CardBoard: React.FC<CardProps> = ({ className = "", children, ...props }) => (
  <div
    className={`rounded-2xl border border-gray-200 bg-white shadow-sm hover:scale-[1.02] hover:shadow-md transition-transform duration-200 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<CardProps> = ({ className = "", children, ...props }) => (
  <div className={`border-b border-gray-100 p-4 font-semibold ${className}`} {...props}>
    {children}
  </div>
);

export const CardContent: React.FC<CardProps> = ({ className = "", children, ...props }) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<CardProps> = ({ className = "", children, ...props }) => (
  <div className={`border-t border-gray-100 p-4 text-sm text-gray-500 ${className}`} {...props}>
    {children}
  </div>
);
