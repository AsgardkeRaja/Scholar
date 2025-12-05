import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from 'react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function Markdown({ content }: { content: string }): React.ReactElement {
  // A simple and basic markdown to HTML converter
  const html = content
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>') // Basic unordered list support
    .replace(/^\- (.*$)/gim, '<ul><li>$1</li></ul>') // Basic unordered list support
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n/gim, '<br />')
    // Clean up multiple <ul> tags
    .replace(/<\/ul><br \/><ul>/g, '');

  return React.createElement('div', {
    className: 'prose dark:prose-invert max-w-none',
    dangerouslySetInnerHTML: { __html: html },
  });
}
