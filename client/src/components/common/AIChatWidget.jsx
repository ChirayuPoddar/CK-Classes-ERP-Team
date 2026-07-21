import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Bot, User, X, Trash2, Loader2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { queryAI } from '@/services/aiService'
import { useAuth } from '@/contexts/AuthContext'

export const AIChatWidget = () => {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hello ${user?.firstName || 'there'}! I am your C.K. ERP AI Assistant. How can I help you today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speakingIndex, setSpeakingIndex] = useState(null)
  const [autoRead, setAutoRead] = useState(false)

  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  // Stop speech synthesis when closing widget or unmounting
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const suggestedPrompts = [
    "What announcements were published recently?",
    "Check my upcoming homework assignments",
    "What is my current fee status?",
    "When are the next scheduled exams?"
  ]

  const speakText = (text, index) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.')
      return
    }

    if (speakingIndex === index) {
      window.speechSynthesis.cancel()
      setSpeakingIndex(null)
      return
    }

    window.speechSynthesis.cancel()

    // Strip markdown formatting symbols before speaking
    const cleanText = text.replace(/[*#_`~-]/g, '').trim()
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.lang = 'en-US'

    utterance.onstart = () => {
      setSpeakingIndex(index)
    }

    utterance.onend = () => {
      setSpeakingIndex(null)
    }

    utterance.onerror = () => {
      setSpeakingIndex(null)
    }

    window.speechSynthesis.speak(utterance)
  }

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser. Please try Chrome, Edge, or Safari.')
      return
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        if (transcript) {
          setInput(transcript)
        }
        setIsListening(false)
      }

      recognition.onerror = (err) => {
        console.error('Speech recognition error:', err)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    } catch (err) {
      console.error('Speech recognition failure:', err)
      setIsListening(false)
    }
  }

  const handleSend = async (textToSend) => {
    const queryText = textToSend || input
    if (!queryText || !queryText.trim() || isLoading) return

    const userMsg = {
      role: 'user',
      text: queryText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages((prev) => [...prev, userMsg])
    if (!textToSend) setInput('')
    setIsLoading(true)

    try {
      const data = await queryAI(queryText.trim())
      const botResponse = data?.response || 'I received your request, but no response was generated.'

      const newIndex = messages.length + 1
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: botResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])

      if (autoRead) {
        speakText(botResponse, newIndex)
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Error: ${error.message || 'Unable to connect to AI service. Please try again later.'}`,
          isError: true,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const clearChat = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setSpeakingIndex(null)
    setMessages([
      {
        role: 'assistant',
        text: `Chat cleared. How else can I assist you, ${user?.firstName || 'there'}?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ])
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="mb-4 w-[360px] sm:w-[410px] h-[520px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 p-4 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-semibold text-base leading-tight">C.K. ERP AI Assistant</h3>
                  <p className="text-xs text-indigo-100 flex items-center gap-1.5 mt-0.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block animate-ping" />
                    Active Context Powered
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Auto Read Toggle */}
                <button
                  onClick={() => setAutoRead(!autoRead)}
                  title={autoRead ? "Disable auto-speak responses" : "Enable auto-speak responses"}
                  className={`p-1.5 rounded-lg transition ${
                    autoRead ? 'bg-amber-400 text-slate-900 font-bold' : 'hover:bg-white/20 text-indigo-100 hover:text-white'
                  }`}
                >
                  <Volume2 className="h-4 w-4" />
                </button>
                <button
                  onClick={clearChat}
                  title="Clear Conversation"
                  className="p-1.5 rounded-lg hover:bg-white/20 transition text-indigo-100 hover:text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
                    setSpeakingIndex(null)
                    setIsOpen(false)
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition text-indigo-100 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-3.5">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-200">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`relative group max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : msg.isError
                        ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-none'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    
                    <div className="flex items-center justify-between mt-1 pt-0.5 border-t border-black/5">
                      <span
                        className={`text-[10px] ${
                          msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'
                        }`}
                      >
                        {msg.time}
                      </span>

                      {/* Speaker Button on Assistant Messages */}
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => speakText(msg.text, idx)}
                          title={speakingIndex === idx ? "Stop speaking" : "Read out loud"}
                          className={`ml-2 text-xs p-1 rounded-md transition ${
                            speakingIndex === idx
                              ? 'text-indigo-600 bg-indigo-100 font-bold animate-pulse'
                              : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
                          }`}
                        >
                          {speakingIndex === idx ? (
                            <VolumeX className="h-3.5 w-3.5" />
                          ) : (
                            <Volume2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="h-7 w-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2.5 justify-start">
                  <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-200">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-white border border-slate-200/80 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2 text-slate-500 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}

              {isListening && (
                <div className="flex gap-2.5 justify-end">
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl rounded-br-none px-4 py-2.5 shadow-sm flex items-center gap-2 text-xs font-medium">
                    <Mic className="h-4 w-4 text-red-600 animate-pulse" />
                    <span>Listening to your voice... Speak now</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggested Chips (show if fewer than 4 messages) */}
            {messages.length <= 3 && !isLoading && (
              <div className="px-3 py-2 bg-slate-100/70 border-t border-slate-200/60 overflow-x-auto flex gap-1.5 scrollbar-none">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="whitespace-nowrap text-xs bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1 font-medium transition active:scale-95 shadow-2xs"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Footer */}
            <div className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening to voice..." : "Ask ERP Assistant..."}
                disabled={isLoading}
                className="flex-1 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-slate-800 text-sm rounded-xl px-3.5 py-2.5 outline-none border border-transparent focus:border-indigo-500 transition"
              />

              {/* Voice Mic Button */}
              <button
                type="button"
                onClick={startVoiceInput}
                disabled={isLoading}
                title={isListening ? "Stop listening" : "Start voice query"}
                className={`h-10 w-10 rounded-xl flex items-center justify-center transition active:scale-95 shrink-0 border ${
                  isListening
                    ? 'bg-red-500 text-white border-red-600 animate-bounce'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                }`}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="h-10 w-10 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition active:scale-95 shadow-sm shrink-0"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white shadow-xl hover:shadow-2xl flex items-center justify-center border-2 border-white/40 cursor-pointer relative group"
      >
        <Sparkles className="h-6 w-6 text-amber-300 group-hover:rotate-12 transition-transform duration-300" />
        <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-white" />
      </motion.button>
    </div>
  )
}

export default AIChatWidget
