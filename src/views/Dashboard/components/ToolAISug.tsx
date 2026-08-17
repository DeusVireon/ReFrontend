import { Bot, Info, CircleOff, SquareArrowOutDownLeft } from "lucide-react"
import { MarkerIcon } from "@/components/ui/marker"
import { Input } from "@/components/ui/input"
import { useAISugMessage } from "../stores/AISugMessage";
import { useShallow } from 'zustand/react/shallow';
import { DatabaseSearch, ArrowUpIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Marker, MarkerContent } from "@/components/ui/marker";

export function ToolAISug() {

    const [isExpanded, setExpanded] = useState(false);

    return (
        <div className="relative rounded-md text-text">
            {isExpanded && <ToolAISubChat onChatClose={() => setExpanded(false)} />}
            {!isExpanded && <ToolAISugBtn onClick={() => setExpanded(true)} />}
        </div>
    )
}

function ToolAISugBtn({ onClick }: { onClick: () => void }) {
    return (
        <div className="relative flex flex-row items-center">
            <Button variant="ghost" className="bg-theme-2/50 size-12 rounded-md" onClick={onClick}>
                <Bot className="size-lg" />
                <span className="absolute ml-7 mb-7 size-2.5 animate-ping rounded-full bg-accent opacity-75"></span>
                <span className="absolute ml-7 mb-7 size-2.5 rounded-full bg-accent"></span>
            </Button>
            <div className="flex items-center animate-expand-right">
                <div
                    className=" -left-3 top-1/2 w-3 h-6 bg-theme-2/75 translate-x-px"
                    style={{
                        clipPath: 'polygon(0% 50%, 100% 0%, 100% 100%)'
                    }}
                />
                <div className="flex px-2 py-1.5 rounded-md bg-theme-2/75 animate-pulse-brightness">
                    <Info className="p-0.5 mr-1" />智能体有新的建议
                </div>
            </div>

        </div>
    )
}



function MessageBubble({ id }: { id: number }) {

    const message = useAISugMessage(useShallow((state) => state.messageByID[id]));

    if (!message) {
        return null;
    }

    if (message.type === "assistant") {
        return (
            <Bubble variant="outline">
                <BubbleContent >
                    {message.content}
                </BubbleContent>
            </Bubble>
        )
    } else if (message.type === "user") {
        return (
            <Bubble variant="default" align="end">
                <BubbleContent >
                    {message.content}
                </BubbleContent>
            </Bubble>
        )
    } else if (message.type === "tool-query") {
        return (
            <Marker className="bg-theme-2/50 pl-2 pr-4 py-1 rounded-sm w-fit">
                <MarkerIcon>
                    <DatabaseSearch />
                </MarkerIcon>
                <MarkerContent>{message.content}</MarkerContent>
            </Marker>
        )
    }
}



function ToolAISubChat({ onChatClose }: { onChatClose?: () => void }) {

    const messages = useAISugMessage(useShallow((state) => state.idList));

    const [input, updateInput] = useState("");
    const [sendBtnDisabled, setSendBtnDisabled] = useState(true);

    const sendMsg = () => {
        updateInput("")
        setSendBtnDisabled(true)
        const saveMsg = useAISugMessage.getState().addMessage;
        const newMsg = {
            id: Date.now(),
            type: "user",
            content: input,
            timestamp: new Date().toISOString(),
        };
        saveMsg(newMsg);
    }

    return (
        <div className="flex flex-col w-90 h-fit rounded-md bg-theme-2/75 \
        backdrop-blur-sm shadow-2xl overflow-hidden">
            <div className="flex items-center px-4 py-2 text-lg font-bold border-b border-white ">
                <Bot className="mr-2" />
                <div >嵌入式智能体建议</div>
                <Button variant="ghost" size="icon" className="ml-auto font-bold" onClick={onChatClose}>
                    <SquareArrowOutDownLeft />
                </Button>
            </div>
            <div className="flex flex-col gap-3 p-4 max-h-[50vh] min-h-25 overflow-auto">
                {messages.map((item) => (
                    <MessageBubble key={item} id={item} />
                ))}
                {
                    messages.length === 0 && (
                        <div className="flex flex-col p-2 items-center justify-center text-sm text-gray-7">
                            <CircleOff className="mb-2" />
                            <div>历史记录为空</div>
                            <div>嵌入式智能体可以辅助分析与决策</div>
                        </div>
                    )
                }
            </div>

            <form className="flex items-end gap-2 bg-theme-2/50 w-full p-2" onSubmit={(e) => {
                e.preventDefault();
                sendMsg();
            }}>
                <Input placeholder="询问嵌入式智能体以辅助分析与决策"
                    value={input}
                    onChange={(e) => {
                        if (e.target.value.length <= 0) {
                            setSendBtnDisabled(true);
                            updateInput("");
                        } else {
                            setSendBtnDisabled(false);
                            updateInput(e.target.value);
                        }
                    }} />
                <Button size="icon"
                    disabled={sendBtnDisabled}
                    onClick={() => {
                        sendMsg();
                    }}>
                    <ArrowUpIcon />
                </Button></form>

        </div>
    )
}
