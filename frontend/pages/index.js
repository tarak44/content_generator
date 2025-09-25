import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { SquarePlus, MessageCircleMore, PauseCircle } from "lucide-react";
import { motion } from "framer-motion";
import { starterPrompts } from "../components/starterprompts";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState("");
  const inputRef = useRef(null);
  const controllerRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.replace("/auth");
    else {
      setLoading(false);
      fetchSessions();
    }
  }, [router.pathname]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchSessions = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("http://127.0.0.1:8000/chat/sessions/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(res.data);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  };

  const fetchSessionMessages = async (sessionId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`http://127.0.0.1:8000/chat/session/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
      setCurrentSession(sessionId);
    } catch (err) {
      console.error("Failed to fetch session messages:", err);
    }
  };

  const handleNewChat = () => {
    const newSessionId = crypto.randomUUID();
    setCurrentSession(newSessionId);
    setMessages([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    if (!currentSession) handleNewChat();
    setGenerating(true);

    const newPrompt = prompt.trim();
    setMessages((prev) => [...prev, { prompt: newPrompt, response: "" }]);
    controllerRef.current = new AbortController();

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://127.0.0.1:8000/generate/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: newPrompt, session_id: currentSession || crypto.randomUUID() }),
        signal: controllerRef.current.signal,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].response = fullText;
          return updated;
        });
      }

      fetchSessions();
    } catch (err) {
      if (err.name === "AbortError") console.log("Generation paused by user.");
      else {
        console.error(err);
        setMessages((prev) => [
          ...prev,
          { prompt: prompt.trim(), response: "Error generating content. Please try again." },
        ]);
      }
    } finally {
      setGenerating(false);
      setPrompt("");
      inputRef.current?.blur();
      setInputFocused(false);
    }
  };

  const handlePause = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
        <svg
          className="animate-spin h-12 w-12 mb-4 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <p className="text-lg font-semibold animate-pulse">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-black/30 backdrop-blur-lg p-4 space-y-4 rounded-r-3xl shadow-xl flex flex-col">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 bg-blue-700 py-3 rounded-full hover:bg-blue-800 transition-all text-white font-medium shadow-md"
        >
          <SquarePlus size={20} /> New Chat
        </button>

        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-transparent">
          {sessions.map((session) => (
            <button
              key={session.session_id}
              onClick={() => fetchSessionMessages(session.session_id)}
              className={`w-full flex items-center gap-2 px-4 py-3 rounded-2xl transition-all font-medium ${
                currentSession === session.session_id
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                  : "bg-gray-900/50 text-gray-200 hover:bg-gray-800/70"
              }`}
            >
              <MessageCircleMore size={18} />
              {session.first_prompt
                ? session.first_prompt.length > 20
                  ? session.first_prompt.slice(0, 20) + "..."
                  : session.first_prompt
                : session.session_id.slice(0, 8)}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col justify-end px-6 py-6 relative">
        <div className="flex-grow overflow-y-auto mb-4 flex flex-col gap-4 max-w-4xl mx-auto">
          {!messages.length && !inputFocused && (
            <div className="text-center opacity-80">
              <h1 className="text-5xl sm:text-6xl font-extrabold mb-4 drop-shadow-lg">Content Generator</h1>
              <p className="text-xl sm:text-2xl mb-6">Start creating awesome content effortlessly</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {starterPrompts.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPrompt(example);
                      setTimeout(() => document.querySelector("form")?.requestSubmit(), 0);
                    }}
                    className="bg-white/10 hover:bg-white/20 text-white py-3 px-6 rounded-2xl shadow-md backdrop-blur-sm transition-all font-medium text-left"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-2"
              >
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-4 rounded-3xl max-w-[75%] shadow-lg text-white whitespace-pre-wrap break-words">
                    {msg.prompt}
                  </div>
                </div>

                {/* Bot Response */}
                <div className="flex justify-start">
                  <div className="bg-gradient-to-r from-gray-800/90 to-gray-700/80 backdrop-blur-md p-4 rounded-3xl max-w-[75%] shadow-lg text-white whitespace-pre-wrap break-words">
                    {msg.response}
                  </div>
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="fixed bottom-6 left-64 right-0 max-w-4xl mx-auto flex space-x-4 items-center px-4"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Type your prompt here..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={generating}
            className="flex-grow rounded-full p-4 text-gray-900 text-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/90 backdrop-blur-sm placeholder-gray-400"
            autoComplete="off"
            spellCheck={false}
            onFocus={() => setInputFocused(true)}
            onBlur={() => !prompt && setInputFocused(false)}
          />
          {generating ? (
            <button
              type="button"
              onClick={handlePause}
              className="bg-red-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:bg-red-700 transition-all"
            >
              <PauseCircle className="h-6 w-6 mx-auto" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!prompt.trim()}
              className="bg-blue-800 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:bg-blue-900 transition-all disabled:opacity-80"
            >
              Generate
            </button>
          )}
        </form>
      </main>
    </div>
  );
}
