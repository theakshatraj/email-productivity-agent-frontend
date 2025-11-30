"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useEmail } from "@/context/EmailContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  Bot,
  Send,
  LoaderCircle,
  Copy,
  RefreshCcw,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ListChecks,
  Mail,
  Bell,
  X,
} from "lucide-react";
import * as api from "@/lib/api";

const formatTime = (d) => {
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return "Just now";
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return `${h} hr ago`;
};

export default function EmailAgent({ selectedEmail = null, onDraftGenerated, onEmailsFound, initialMessages = null, onMessagesChange }) {
  const { selectedEmail: ctxEmail, emails } = useEmail();
  const activeEmail = selectedEmail || ctxEmail || null;
  const [messages, setMessages] = useState(
    initialMessages && Array.isArray(initialMessages) && initialMessages.length
      ? initialMessages
      : [
          {
            role: "agent",
            content:
              "Welcome. I can summarize your inbox, surface urgent emails, extract tasks, and draft replies. Try: ‘Summarize my inbox’ or ‘What tasks do I have?’.",
            timestamp: new Date(),
          },
        ]
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [context, setContext] = useState({ emailId: activeEmail?.id || null, filters: {} });
  const limit = 1000;
  const typingRef = useRef(null);

  useEffect(() => {
    setContext((c) => ({ ...c, emailId: activeEmail?.id || null }));
  }, [activeEmail]);

  const send = async (text, ctx = context) => {
    if (!text.trim()) return;
    const userMsg = { role: "user", content: text.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setMessages((prev) => [...prev, { role: "agent", content: "", typing: true, timestamp: new Date() }]);
    try {
      const res = await api.chatWithAgent(text.trim(), ctx.filters?.urgent ? "urgent" : ctx.emailId ? "specific_email" : "all_emails", ctx.emailId || null);
      const output = res.success ? String(res.data?.reply || res.data || "") : `Error: ${res.error}`;
      setMessages((prev) => {
        const next = [...prev];
        const idx = next.findIndex((m) => m.typing);
        if (idx >= 0) next[idx] = { role: "agent", content: output, timestamp: new Date() };
        return next;
      });
    } catch (e) {
      setMessages((prev) => {
        const next = [...prev];
        const idx = next.findIndex((m) => m.typing);
        if (idx >= 0) next[idx] = { role: "agent", content: `Error: ${e.message}`, timestamp: new Date() };
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (onMessagesChange) onMessagesChange(messages);
  }, [messages, onMessagesChange]);

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input, context);
      setInput("");
    }
  };

  const quick = [
    { label: "Summarize my inbox", icon: MessageSquare, payload: "Summarize my inbox" },
    { label: "Show urgent emails", icon: Bell, payload: "Show urgent emails" },
    { label: "What tasks do I have?", icon: ListChecks, payload: "What tasks do I have?" },
    { label: "Show unread messages", icon: Mail, payload: "Show unread messages" },
    {
      label: "Draft reply to selected email",
      icon: Bot,
      payload: activeEmail ? `Draft a reply to email ${activeEmail.id}` : "Draft a reply",
    },
  ];

  const copyContent = (text) => navigator.clipboard.writeText(text);
  const regenerate = (content) => send(content, context);

  const msgClass = (role) =>
    role === "user"
      ? "ml-auto bg-primary text-white"
      : "mr-auto bg-slate-100 text-slate-800";

  const avatar = (role) =>
    role === "user" ? (
      <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-xs">You</div>
    ) : (
      <div className="h-8 w-8 rounded-full bg-secondary text-white flex items-center justify-center">
        <Bot className="h-4 w-4" />
      </div>
    );

  const sidebar = (
    <div className={`fixed inset-y-0 right-0 z-40 w-80 transform transition-transform ${contextOpen ? "translate-x-0" : "translate-x-full"}`}>
      <div className="h-full bg-white border-l border-slate-200 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Context</p>
          <button type="button" onClick={() => setContextOpen(false)} className="rounded-full border border-slate-200 p-2"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-slate-500">Selected email</p>
          {activeEmail ? (
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-sm font-semibold">{activeEmail.subject}</p>
              <p className="text-xs text-slate-500">{activeEmail.sender}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-500">None</p>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-xs text-slate-500">Filters</p>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={Boolean(context.filters?.urgent)}
              onChange={(e) => setContext((c) => ({ ...c, filters: { ...c.filters, urgent: e.target.checked } }))}
            />
            Urgent only
          </label>
          <button type="button" onClick={() => setContext({ emailId: null, filters: {} })} className="rounded-full border border-slate-200 px-3 py-2 text-xs">Clear context</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="section-title">Agent chat</p>
            <p className="text-lg font-semibold text-slate-900">Conversational automation</p>
          </div>
        </div>
        <button type="button" onClick={() => setContextOpen(true)} className="rounded-full border border-slate-200 px-3 py-2 text-sm">Context</button>
      </div>

      <div className="p-6 space-y-3">
        <div className="flex flex-wrap gap-2">
          {quick.map((q) => (
            <button key={q.label} type="button" onClick={() => send(q.payload)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs">
              <q.icon className="h-3 w-3" />
              {q.label}
            </button>
          ))}
        </div>

        <div className="space-y-3 max-h-[28rem] overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`flex items-start gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role !== "user" && avatar(m.role)}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msgClass(m.role)}`}>
                {m.typing ? (
                  <div className="flex items-center gap-2">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    <span className="text-xs">Typing…</span>
                  </div>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{m.content}</ReactMarkdown>
                )}
                <div className="mt-2 flex items-center gap-2 text-xs opacity-70">
                  <span>{formatTime(new Date(m.timestamp))}</span>
                  {m.role === "agent" && !m.typing && (
                    <>
                      <button type="button" onClick={() => copyContent(m.content)} className="hover:opacity-100"><Copy className="h-3 w-3" /></button>
                      <button type="button" onClick={() => regenerate(m.content)} className="hover:opacity-100"><RefreshCcw className="h-3 w-3" /></button>
                      <ThumbsUp className="h-3 w-3" />
                      <ThumbsDown className="h-3 w-3" />
                    </>
                  )}
                </div>
              </div>
              {m.role === "user" && avatar(m.role)}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, limit))}
              onKeyDown={onKeyDown}
              rows={1}
              className="flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-primary"
              placeholder="Ask the agent…"
            />
            <button
              type="button"
              onClick={() => {
                send(input, context);
                setInput("");
              }}
              className="inline-flex items-center gap-2 rounded-full bg-primary text-white px-4 py-2 text-sm"
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{input.length}/{limit}</span>
            {loading && <span className="inline-flex items-center gap-1"><LoaderCircle className="h-3 w-3 animate-spin" /> Processing…</span>}
          </div>
        </div>
      </div>

      {sidebar}
    </div>
  );
}
