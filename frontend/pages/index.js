import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { SquarePlus, MessageCircleMore, RefreshCcw, PauseCircle } from "lucide-react";
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/auth");
    } else {
      setLoading(false);
      fetchSessions();
    }
  }, [router.pathname]);

  const fetchSessions = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("http://127.0.0.1:8000/chat/sessions/", {
        headers: { Authorization: `Bearer ${token}` }
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
        headers: { Authorization: `Bearer ${token}` }
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
      if (axios.isCancel(err) || err.name === "AbortError") {
        console.log("Generation paused by user.");
      } else {
        console.error(err);
        setMessages((prev) => [
          ...prev,
          { prompt: prompt.trim(), response: "Error generating content. Please try again." }
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
        <p className="text-lg font-semibold">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-black bg-opacity-40 p-4 space-y-4 rounded-r-3xl shadow-lg">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 bg-blue-700 text-white py-3 rounded-full hover:bg-blue-800 transition-all"
        >
          <SquarePlus size={20} /> New Chat
        </button>
        <div className="space-y-2 overflow-y-auto max-h-[80vh] pr-1 custom-scrollbar">
          {sessions.map((session) => (
            <button
              key={session.session_id}
              onClick={() => fetchSessionMessages(session.session_id)}
              className={`w-full flex items-center gap-2 px-4 py-3 rounded-full transition-all ${
                currentSession === session.session_id
                  ? "bg-blue-600 text-white shadow"
                  : "bg-gray-700 text-gray-200 hover:bg-gray-600"
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
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white px-4 pb-24 flex flex-col rounded-l-3xl">
        <div className="flex-grow flex flex-col items-center justify-center max-w-6xl mx-auto w-full">
          {!messages.length && !inputFocused && (
            <div className="text-center mb-8">
              <h1 className="text-6xl font-extrabold mb-2">Content Generator</h1>
              <div className="h-[1px] w-full bg-white opacity-40 mb-4" />
              <p className="text-2xl text-gray-300 font-semibold">
                Start creating awesome content effortlessly.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                {starterPrompts.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPrompt(example);
                      setTimeout(() => {
                        document.querySelector("form")?.requestSubmit();
                      }, 0);
                    }}
                    className="bg-white/10 hover:bg-white/20 text-white py-3 px-6 rounded-xl text-left shadow transition"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={`w-full max-w-4xl mb-8 space-y-4 overflow-auto flex flex-col ${messages.length > 0 ? 'bg-black p-6 rounded-3xl shadow-xl' : ''}`}>
            {messages.map((msg, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-end">
                  <div className="bg-blue-600 p-4 rounded-3xl max-w-[75%] shadow-md">
                    <p className="text-white">{msg.prompt}</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-gray-800 p-4 rounded-3xl max-w-[75%] shadow-md whitespace-pre-wrap">
                    <p className="text-white">{msg.response}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="fixed bottom-4 left-64 right-0 max-w-6xl mx-auto px-4 flex space-x-4 items-center"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Type your prompt here..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={generating}
            className="flex-grow rounded-full p-4 text-gray-900 text-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-100"
            autoComplete="off"
            spellCheck={false}
            onFocus={() => setInputFocused(true)}
            onBlur={() => !prompt && setInputFocused(false)}
          />
          {generating ? (
            <button
              type="button"
              onClick={handlePause}
              className="bg-red-600 text-white font-semibold px-6 py-3 rounded-full shadow-md hover:bg-red-700 transition"
            >
              <PauseCircle className="h-6 w-6 mx-auto" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!prompt.trim()}
              className="bg-blue-800 text-white font-semibold px-6 py-3 rounded-full shadow-md hover:bg-blue-900 transition disabled:opacity-50"
            >
              Generate
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
