export function ScrollArea({ children }: { children: React.ReactNode }) {
    return (
        <div className="w-full h-full overflow-hidden \
             mask-t-from-95% mask-t-to-100% \
             mask-b-from-95% mask-b-to-100%">
            <div className="flex flex-col py-1.5 gap-1 w-full h-full overflow-y-auto">
                {children}
            </div >
        </div>
    )
}
