'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

type Message = {
    role: 'user' | 'assistant'
    content: string
}

export default function Home() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const messagesContainerRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = useCallback(() => {
        messagesContainerRef.current?.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: 'smooth'
        })
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages, scrollToBottom])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMessage: Message = { role: 'user', content: input }
        const newMessages = [...messages, userMessage]
        setMessages(newMessages)
        setInput('')
        setIsLoading(true)

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages: newMessages }),
        })

        if (!response.body) throw new Error('No response body')

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let assistantMessage: Message = { role: 'assistant', content: '' }
        const updatedMessages = [...newMessages, assistantMessage]
        setMessages(updatedMessages)

        try {
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                assistantMessage.content += chunk
                setMessages([...updatedMessages.slice(0, -1), { ...assistantMessage }])
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleTest = async () => {
        if (testStatus === 'loading') return;
        setTestStatus('loading');
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages: [{ role: 'user', content: 'test integration' }] }),
            });
            const content = await response.text();
            const newStatus = content.length > 5 ? 'success' : 'error';
            setTestStatus(newStatus);
            setTimeout(() => setTestStatus('idle'), newStatus === 'success' ? 3000 : 5000);
        } catch {
            setTestStatus('error');
            setTimeout(() => setTestStatus('idle'), 5000);
        }
    };


    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <header className="border-b p-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    AI Help Desk Prototype
                </h1>
                <button
                    onClick={handleTest}
                    disabled={testStatus === 'loading'}
                    className="text-lg bg-green-500 hover:bg-green-600 border border-green-600 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {testStatus === 'loading' && (
                        <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                    )}
                    {testStatus === 'success' && (
                        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                    {testStatus === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                    )}
                    Test AI
                </button>
            </header>
            <main className="flex-1 flex flex-col">
                <div ref={messagesContainerRef} className="flex-1 p-8 space-y-4 overflow-y-auto">
                    {messages.length === 0 ? (
                        <div className="text-center text-muted-foreground h-full flex flex-col items-center justify-center">
                            <p className="text-lg">Ask about auth loops, VM crashes, or try "disable logging"</p>
                        </div>
                    ) : (
                        messages.map((m, index) => (
                            <div key={index} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-2xl p-4 rounded-2xl shadow-md ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border'}`}>
                                    <p className="whitespace-pre-wrap">{m.content}</p>
                                </div>
                            </div>
                        ))
                    )}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="max-w-2xl p-4 rounded-2xl bg-card border">
                                <p>Thinking...</p>
                            </div>
                        </div>
                    )}
                </div>
                <form onSubmit={handleSubmit} className="border-t p-6 flex gap-3 bg-background">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your support query..."
                        className="flex-1 px-5 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                        disabled={isLoading}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit(e as any))}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex-shrink-0 transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </main>
        </div>
    )
}