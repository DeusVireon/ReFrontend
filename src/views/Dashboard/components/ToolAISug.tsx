import { Bot } from "lucide-react"
export function ToolAISug() {
    return (
        <div className="relative p-3 rounded-md bg-gray-2/50 text-text">
            <span className="absolute right-1.5 top-1.5 flex">
                <span className="absolute inline-flex size-2.5 animate-ping rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex size-2.5 rounded-full bg-accent"></span>
            </span>
            <Bot />
        </div>
    )
}