"use client";

import React from "react";

export function WhatsAppFloatingButton({
  phone = "2347049948582",
  message,
}: {
  phone?: string;
  message?: string;
}) {
  const url = message
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${phone}`;

  return (
    <aside
      aria-label="Direct WhatsApp Support"
      className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-30 group print:hidden"
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp with EasyLife Support"
        className="flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-3 focus:ring-[#25D366]/40"
      >
        {/* Official WhatsApp SVG Icon */}
        <svg
          className="w-6 h-6 fill-current shrink-0"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12.031 2C6.5 2 2 6.5 2 12.031c0 1.953.563 3.781 1.531 5.344L2.094 22l4.75-1.406A9.97 9.97 0 0 0 12.031 22C17.562 22 22 17.5 22 12.031 22 6.5 17.562 2 12.031 2Zm-.031 18.25a8.2 8.2 0 0 1-4.281-1.188l-.313-.187-2.812.844.844-2.75-.219-.344A8.187 8.187 0 0 1 3.844 12.03c0-4.5 3.687-8.187 8.156-8.187 4.5 0 8.156 3.687 8.156 8.188 0 4.5-3.656 8.219-8.156 8.219Zm4.5-6.187c-.25-.125-1.469-.719-1.719-.813-.219-.094-.375-.125-.531.125-.156.25-.625.813-.781.969-.156.187-.282.187-.532.062-.25-.125-1.062-.375-2.031-1.25-.75-.656-1.25-1.468-1.406-1.718-.157-.25-.032-.375.093-.5.125-.126.25-.282.376-.438.125-.156.156-.25.25-.438.062-.187.031-.343-.032-.468-.062-.125-.531-1.282-.718-1.75-.188-.469-.375-.407-.532-.407-.156 0-.312-.031-.468-.031-.157 0-.407.062-.625.312-.219.25-.844.813-.844 2 0 1.156.875 2.282.969 2.438.125.156 1.719 2.625 4.156 3.687.594.25 1.063.407 1.407.532.593.187 1.125.156 1.562.093.469-.062 1.469-.593 1.688-1.187.218-.594.218-1.094.156-1.188-.063-.094-.219-.156-.469-.281Z" />
        </svg>

        <span className="hidden sm:inline font-bold text-xs tracking-wide">
          Chat on WhatsApp
        </span>
      </a>
    </aside>
  );
}
