"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

export const SearchInput = forwardRef<HTMLInputElement, Props>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      type="text"
      name="q"
      className={`search-input ${className}`}
      {...props}
    />
  ),
);
SearchInput.displayName = "SearchInput";
