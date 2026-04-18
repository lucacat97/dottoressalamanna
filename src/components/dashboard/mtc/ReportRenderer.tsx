import ReactMarkdown from "react-markdown";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ReportRendererProps {
  markdown: string;
}

export default function ReportRenderer({ markdown }: ReportRendererProps) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="font-display text-lg font-bold text-primary border-b border-border pb-2 mt-6 mb-3 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-display text-base font-bold text-primary mt-5 mb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-display text-sm font-semibold text-foreground mt-4 mb-1.5">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="font-body text-xs text-foreground leading-relaxed my-1.5">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="text-muted-foreground italic">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-4 my-2 space-y-0.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-4 my-2 space-y-0.5">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="font-body text-xs text-foreground leading-relaxed">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-yellow-500 pl-4 my-3 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-900 dark:text-yellow-100 rounded-r-md py-3 pr-3">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-border my-4" />,
          table: ({ children }) => (
            <div className="my-3 rounded-lg border border-border overflow-hidden">
              <Table>{children}</Table>
            </div>
          ),
          thead: ({ children }) => (
            <TableHeader className="bg-primary/8">{children}</TableHeader>
          ),
          tbody: ({ children }) => <TableBody>{children}</TableBody>,
          tr: ({ children }) => <TableRow className="hover:bg-muted/30">{children}</TableRow>,
          th: ({ children }) => (
            <TableHead className="font-display text-[11px] font-bold text-primary py-2.5 px-3 whitespace-nowrap">
              {children}
            </TableHead>
          ),
          td: ({ children }) => (
            <TableCell className="font-body text-[11px] text-foreground py-2 px-3">
              {children}
            </TableCell>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
