// @ts-nocheck

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownContentProps {
    content: string;
}

const MarkdownContent = memo(({ content }: MarkdownContentProps) => {
    return (
        <ReactMarkdown
            className="break-words prose prose-slate dark:prose-invert max-w-none text-base"
            remarkPlugins={[remarkGfm]}
            components={{
                // Heading styles
                h1: ({ children }) => (
                    <h1 className="scroll-m-20 text-3xl font-bold tracking-tight mb-4">
                        {children}
                    </h1>
                ),
                h2: ({ children }) => (
                    <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-3">
                        {children}
                    </h2>
                ),
                h3: ({ children }) => (
                    <h3 className="scroll-m-20 text-xl font-semibold tracking-tight mb-2">
                        {children}
                    </h3>
                ),
                // Paragraph and text content
                p: ({ children }) => (
                    <p className="leading-7 [&:not(:first-child)]:mt-4">
                        {children}
                    </p>
                ),
                // Strong/Bold text
                strong: ({ children }) => (
                    <strong className="font-semibold">
                        {children}
                    </strong>
                ),
                // Emphasis/Italic text
                em: ({ children }) => (
                    <em className="italic">
                        {children}
                    </em>
                ),
                // Code formatting
                code({ node, inline, className, children, ...props }) {
                    return inline ? (
                        <code
                            className={cn(
                                "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm",
                                className
                            )}
                            {...props}
                        >
                            {children}
                        </code>
                    ) : (
                        <pre className="mt-4 mb-4 overflow-x-auto rounded-lg bg-muted p-4">
              <code className="relative font-mono text-sm" {...props}>
                {children}
              </code>
            </pre>
                    );
                },
                // List formatting
                ul({ children }) {
                    return (
                        <ul className="my-4 ml-6 list-disc [&>li]:mt-2">
                            {children}
                        </ul>
                    );
                },
                ol({ children }) {
                    return (
                        <ol className="my-4 ml-6 list-decimal [&>li]:mt-2">
                            {children}
                        </ol>
                    );
                },
                // List items
                li: ({ children }) => (
                    <li className="leading-7">
                        {children}
                    </li>
                ),
                // Blockquote styling
                blockquote({ children }) {
                    return (
                        <blockquote className="mt-4 mb-4 border-l-2 border-primary pl-6 italic">
                            {children}
                        </blockquote>
                    );
                },
                // Links
                a({ children, ...props }) {
                    return (
                        <a
                            className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                            target="_blank"
                            rel="noopener noreferrer"
                            {...props}
                        >
                            {children}
                        </a>
                    );
                },
                // Horizontal rule
                hr: () => <hr className="my-4 border-muted" />,
                // Table formatting
                table: ({ children }) => (
                    <div className="my-4 w-full overflow-y-auto">
                        <table className="w-full border-collapse border border-border">
                            {children}
                        </table>
                    </div>
                ),
                thead: ({ children }) => (
                    <thead className="bg-muted">
                    {children}
                    </thead>
                ),
                th: ({ children }) => (
                    <th className="border border-border px-4 py-2 text-left font-semibold">
                        {children}
                    </th>
                ),
                td: ({ children }) => (
                    <td className="border border-border px-4 py-2">
                        {children}
                    </td>
                ),
            }}
        >
            {content}
        </ReactMarkdown>
    );
});

MarkdownContent.displayName = "MarkdownContent";

export default MarkdownContent;