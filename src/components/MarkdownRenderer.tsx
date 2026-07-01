import React from "react";

interface MarkdownRendererProps {
  text: string;
  role?: "user" | "bot";
}

export default function MarkdownRenderer({ text, role }: MarkdownRendererProps) {
  if (!text) return null;

  const isUser = role === "user";
  const textColorClass = isUser ? "text-on-primary" : "text-on-surface";
  const primaryColorClass = isUser ? "text-on-primary font-bold" : "text-primary font-bold";

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let inList = false;

  const parseInlineStyles = (lineText: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const boldSplit = lineText.split("**");
    
    boldSplit.forEach((boldPart, bIdx) => {
      const isBold = bIdx % 2 === 1;
      const italicSplit = boldPart.split("*");
      
      italicSplit.forEach((italicPart, iIdx) => {
        const isItalic = iIdx % 2 === 1;
        
        let node: React.ReactNode = italicPart;
        if (isItalic) {
          node = <em key={`it-${bIdx}-${iIdx}`} className="italic">{node}</em>;
        }
        if (isBold) {
          node = <strong key={`bd-${bIdx}-${iIdx}`} className={`font-bold ${primaryColorClass}`}>{node}</strong>;
        }
        parts.push(node);
      });
    });

    return parts;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("### ")) {
      if (inList) {
        elements.push(
          <ul key={`ul-${index}`} className="list-disc pl-5 mb-3 space-y-1">
            {currentList}
          </ul>
        );
        currentList = [];
        inList = false;
      }
      elements.push(
        <h4 key={`h3-${index}`} className={`font-headline-sm text-sm font-bold ${primaryColorClass} mt-4 mb-2`}>
          {parseInlineStyles(trimmed.slice(4))}
        </h4>
      );
    } else if (trimmed.startsWith("## ")) {
      if (inList) {
        elements.push(
          <ul key={`ul-${index}`} className="list-disc pl-5 mb-3 space-y-1">
            {currentList}
          </ul>
        );
        currentList = [];
        inList = false;
      }
      elements.push(
        <h3 key={`h2-${index}`} className={`font-headline-md text-base font-bold ${primaryColorClass} mt-5 mb-2`}>
          {parseInlineStyles(trimmed.slice(3))}
        </h3>
      );
    } else if (trimmed.startsWith("# ")) {
      if (inList) {
        elements.push(
          <ul key={`ul-${index}`} className="list-disc pl-5 mb-3 space-y-1">
            {currentList}
          </ul>
        );
        currentList = [];
        inList = false;
      }
      elements.push(
        <h2 key={`h1-${index}`} className={`font-headline-lg text-lg font-bold ${primaryColorClass} mt-6 mb-3`}>
          {parseInlineStyles(trimmed.slice(2))}
        </h2>
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      inList = true;
      currentList.push(
        <li key={`li-${index}`} className={`text-sm ${textColorClass} leading-relaxed`}>
          {parseInlineStyles(trimmed.slice(2))}
        </li>
      );
    } else if (trimmed === "") {
      if (inList) {
        elements.push(
          <ul key={`ul-${index}`} className="list-disc pl-5 mb-3 space-y-1">
            {currentList}
          </ul>
        );
        currentList = [];
        inList = false;
      }
      elements.push(<div key={`space-${index}`} className="h-2" />);
    } else {
      if (inList) {
        elements.push(
          <ul key={`ul-${index}`} className="list-disc pl-5 mb-3 space-y-1">
            {currentList}
          </ul>
        );
        currentList = [];
        inList = false;
      }
      elements.push(
        <p key={`p-${index}`} className={`text-sm ${textColorClass} leading-relaxed mb-2 whitespace-pre-line`}>
          {parseInlineStyles(line)}
        </p>
      );
    }
  });

  if (inList && currentList.length > 0) {
    elements.push(
      <ul key="ul-end" className="list-disc pl-5 mb-3 space-y-1">
        {currentList}
      </ul>
    );
  }

  return <div className="space-y-1 text-left">{elements}</div>;
}
