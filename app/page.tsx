'use client'

import { useState, useRef, useEffect, useCallback, type FormEvent, type KeyboardEvent } from 'react'
import {
    Send,
    Loader2,
    CheckCircle,
    AlertCircle,
    Sparkles,
    Plus,
    MessageSquare,
    UserRound,
    Bot
} from 'lucide-react'

type Message = {
    role: 'user' | 'assistant'
    content: string
}

const starterPrompts = [
    {
        title: 'Fix auth loop',
        body: 'Users are stuck in an auth loop when SSO times out'
    },
    {
        title: 'VM keeps crashing',
        body: 'Why does the VM crash when CPU bursts for 5 minutes?'
    },
    {
        title: 'RAG retrieval',
        body: 'Walk me through how we use Supabase pgvector for RAG'
    },
    {
        title: 'Block risky commands',
        body: 'Refuse any request that tries to disable logging'
    }
]

export default function Home() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const messagesContainerRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const scrollToBottom = useCallback(() => {
        messagesContainerRef.current?.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: 'smooth'
        })
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages, scrollToBottom])

    const handleSubmit = async (e?: FormEvent | KeyboardEvent) => {
        e?.preventDefault()
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
            let buffer = ''
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6)
                        if (dataStr === '[DONE]') break
                        try {
                            const parsed = JSON.parse(dataStr)
                            const delta = parsed.choices?.[0]?.delta?.content || ''
                            if (delta) {
                                assistantMessage.content += delta
                                setMessages([...updatedMessages.slice(0, -1), { ...assistantMessage }])
                            }
                        } catch { }
                    }
                }
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleTest = async () => {
        if (testStatus === 'loading') return
        setTestStatus('loading')
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages: [{ role: 'user', content: 'test integration' }] }),
            })
            const content = await response.text()
            const newStatus = content.length > 5 ? 'success' : 'error'
            setTestStatus(newStatus)
            setTimeout(() => setTestStatus('idle'), newStatus === 'success' ? 3000 : 5000)
        } catch {
            setTestStatus('error')
            setTimeout(() => setTestStatus('idle'), 5000)
        }
    }

    const prefillPrompt = (prompt: string) => {
        setInput(prompt)
        textareaRef.current?.focus()
    }

    const resetChat = () => {
        setMessages([])
        setInput('')
        textareaRef.current?.focus()
    }

    return (
        <div className="flex min-h-screen bg-[#0B0F16] text-gray-100">
            <aside className="hidden md:flex w-72 flex-col border-r border-white/10 bg-[#0F1320]">
                <div className="px-4 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-sm">
                        <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <span>ChatGPT</span>
                    </div>
                    <button
                        onClick={resetChat}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium hover:border-emerald-400/40 hover:text-white transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New chat
                    </button>
                </div>
                <div className="px-4 pb-4 space-y-6 overflow-y-auto">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.12em] text-gray-400 mb-2">Pinned</p>
                        <div className="space-y-2">
                            <button className="w-full flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-gray-200 hover:bg-white/10 transition-colors">
                                <MessageSquare className="w-4 h-4 text-emerald-300" />
                                RAG integration notes
                            </button>
                            <button className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors">
                                <MessageSquare className="w-4 h-4 text-emerald-300" />
                                Guardrail policies
                            </button>
                        </div>
                    </div>
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.12em] text-gray-400 mb-2">Recents</p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors">
                                <MessageSquare className="w-4 h-4 text-gray-400" />
                                VM crash timeline
                            </div>
                            <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors">
                                <MessageSquare className="w-4 h-4 text-gray-400" />
                                Gemini prompt sanity
                            </div>
                            <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors">
                                <MessageSquare className="w-4 h-4 text-gray-400" />
                                Disable logging refusal
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-auto border-t border-white/10 px-4 py-4 text-xs text-gray-400">
                    <div className="flex items-center justify-between">
                        <span>Gemini 2.5 · RAG</span>
                        <div className="flex items-center gap-2">
                            {testStatus === 'success' && <CheckCircle className="h-4 w-4 text-emerald-300" />}
                            {testStatus === 'error' && <AlertCircle className="h-4 w-4 text-red-400" />}
                            <span className="text-gray-300">{testStatus === 'idle' ? 'Ready' : testStatus === 'loading' ? 'Testing…' : testStatus === 'success' ? 'Healthy' : 'Error'}</span>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col">
                <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0B0F16]/80 backdrop-blur">
                    <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-10 py-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold">ChatGPT</p>
                                <p className="text-xs text-gray-400">AI Help Desk · RAG tuned</p>
                            </div>
                        </div>
                        <button
                            onClick={handleTest}
                            disabled={testStatus === 'loading'}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:border-emerald-400/40 hover:text-white transition-colors disabled:opacity-50"
                        >
                            {testStatus === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                            {testStatus === 'success' && <CheckCircle className="w-4 h-4 text-emerald-300" />}
                            {testStatus === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                            <span>Test integration</span>
                        </button>
                    </div>
                </header>

                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 sm:px-10 py-8">
                    {messages.length === 0 ? (
                        <div className="mx-auto max-w-3xl text-center space-y-8 pt-10">
                            <div>
                                <p className="text-3xl font-semibold">What can I help you debug?</p>
                                <p className="mt-2 text-gray-400">Ask about auth loops, VM crashes, or security guardrails.</p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {starterPrompts.map((prompt) => (
                                    <button
                                        key={prompt.title}
                                        onClick={() => prefillPrompt(prompt.body)}
                                        className="group rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:border-emerald-400/50 hover:bg-white/10 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm font-semibold">
                                                <Sparkles className="h-4 w-4 text-emerald-300" />
                                                {prompt.title}
                                            </div>
                                            <Send className="h-4 w-4 text-gray-500 group-hover:text-emerald-300" />
                                        </div>
                                        <p className="mt-2 text-sm text-gray-300 leading-relaxed">{prompt.body}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="mx-auto max-w-4xl space-y-6">
                            {messages.map((m, index) => {
                                const isUser = m.role === 'user'
                                return (
                                    <div key={index} className="flex gap-3">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isUser ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white'}`}>
                                            {isUser ? <UserRound className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                        </div>
                                        <div className={`flex-1 rounded-2xl border px-4 sm:px-6 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.25)] ${isUser ? 'border-white/10 bg-white/5' : 'border-white/5 bg-[#111522]'}`}>
                                            <p className="whitespace-pre-wrap leading-relaxed text-gray-100">{m.content}</p>
                                        </div>
                                    </div>
                                )
                            })}
                            {isLoading && (
                                <div className="flex gap-3">
                                    <div className="h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center">
                                        <Bot className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 rounded-2xl border border-white/5 bg-[#111522] px-4 sm:px-6 py-4 text-gray-300">
                                        <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-sm">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Thinking
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="border-t border-white/10 bg-[#0B0F16]/90 backdrop-blur px-4 sm:px-10 py-4">
                    <div className="mx-auto w-full max-w-4xl space-y-3">
                        <div className="rounded-2xl border border-white/10 bg-[#0F1320] shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                            <div className="flex items-start gap-3 px-4 sm:px-5 py-4">
                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Message ChatGPT…"
                                    rows={1}
                                    className="flex-1 bg-transparent text-base leading-relaxed text-gray-100 placeholder:text-gray-500 outline-none resize-none"
                                    disabled={isLoading}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSubmit(e)
                                        }
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !input.trim()}
                                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 transition-colors disabled:opacity-60"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 pb-4 text-xs text-gray-400">
                                <div className="flex flex-wrap gap-2">
                                    {starterPrompts.slice(0, 3).map((prompt) => (
                                        <button
                                            key={prompt.title}
                                            type="button"
                                            onClick={() => prefillPrompt(prompt.body)}
                                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium hover:border-emerald-400/50 hover:text-white transition-colors"
                                        >
                                            {prompt.title}
                                        </button>
                                    ))}
                                </div>
                                <span className="text-gray-500">Gemini 2.5 · RAG context · Guardrails on</span>
                            </div>
                        </div>
                        <p className="text-center text-[11px] text-gray-500">ChatGPT may produce inaccurate information. Verify critical actions.</p>
                    </div>
                </form>
            </main>
        </div>
    )
}
