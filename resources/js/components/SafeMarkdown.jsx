import React from 'react';

/**
 * Safely renders text with markdown-style formatting
 * Supports: **bold**, bullet points, numbered lists
 */
const SafeMarkdown = ({ text }) => {
  if (!text) return null;

  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    // Skip empty lines
    if (!line.trim()) {
      return <br key={`br-${lineIndex}`} />;
    }

    // Parse bold text (**text**)
    const renderLine = (text) => {
      const parts = [];
      let lastIndex = 0;
      const boldRegex = /\*\*(.*?)\*\*/g;
      let match;

      while ((match = boldRegex.exec(text)) !== null) {
        // Add text before the bold part
        if (match.index > lastIndex) {
          parts.push(text.slice(lastIndex, match.index));
        }
        // Add the bold part
        parts.push(<strong key={`bold-${match.index}`}>{match[1]}</strong>);
        lastIndex = match.index + match[0].length;
      }

      // Add remaining text
      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
      }

      return parts.length > 0 ? parts : text;
    };

    // Handle bullet points
    if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
      const content = line.replace(/^[•\-]\s*/, '');
      return (
        <li key={`li-${lineIndex}`} style={{ marginLeft: '20px' }}>
          {renderLine(content)}
        </li>
      );
    }

    // Handle numbered lists
    if (/^\d+\./.test(line.trim())) {
      const content = line.replace(/^\d+\.\s*/, '');
      return (
        <li key={`li-${lineIndex}`} style={{ marginLeft: '20px', listStyleType: 'decimal' }}>
          {renderLine(content)}
        </li>
      );
    }

    // Regular paragraph
    return (
      <p key={`p-${lineIndex}`}>
        {renderLine(line)}
      </p>
    );
  });
};

export default SafeMarkdown;
