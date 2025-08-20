'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, onInput, ...props }, ref) => {
    const innerRef = React.useRef<HTMLTextAreaElement>(null);
    React.useImperativeHandle(
      ref,
      () => innerRef.current as HTMLTextAreaElement,
    );

    const resize = (el: HTMLTextAreaElement) => {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    };

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      resize(e.currentTarget);
      onInput?.(e);
    };

    React.useEffect(() => {
      if (innerRef.current) {
        resize(innerRef.current);
      }
    }, []);

    return (
      <textarea
        ref={innerRef}
        onInput={handleInput}
        className={cn(
          'w-full min-h-[200px] resize-none overflow-hidden rounded border bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';

export default Textarea;
