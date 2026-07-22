import { useAuth } from '../../contexts/AuthContext';
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Printer, Copy, Check, FileText, Key, Loader2, BookOpen } from 'lucide-react'
import { generateQuiz } from '@/services/aiService'

export const AIQuizGeneratorModal = ({ isOpen, onClose, initialResource = null }) => {
  const { user } = useAuth();
  const [topic, setTopic] = useState(initialResource?.title || '')
  const [className, setClassName] = useState(initialResource?.class || 'Class 10')
  const [count, setCount] = useState(5)
  const [difficulty, setDifficulty] = useState('Medium')
  const [isLoading, setIsLoading] = useState(false)
  const [quizData, setQuizData] = useState(null)
  const [activeTab, setActiveTab] = useState('paper') // 'paper' | 'answers'
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleGenerate = async (e) => {
    e?.preventDefault()
    setIsLoading(true)
    setQuizData(null)

    try {
      const result = await generateQuiz({
        resourceId: initialResource?._id,
        topic: topic || initialResource?.title || 'General Studies',
        className,
        count,
        difficulty
      })

      let parsed = result?.data || result
      if ((!parsed?.questions || parsed.questions.length === 0) && parsed?.rawText) {
        try {
          const firstBrace = parsed.rawText.indexOf('{')
          const lastBrace = parsed.rawText.lastIndexOf('}')
          if (firstBrace !== -1 && lastBrace > firstBrace) {
            const extracted = JSON.parse(parsed.rawText.substring(firstBrace, lastBrace + 1))
            if (extracted?.questions) {
              parsed = extracted
            }
          }
        } catch (e) {}
      }

      setQuizData(parsed)
      setActiveTab('paper')
    } catch (err) {
      alert(`Failed to generate quiz: ${err.message || 'Error connecting to AI service'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleCopy = () => {
    if (!quizData) return
    const text = JSON.stringify(quizData, null, 2)
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden my-auto"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-tight">AI Test & Quiz Generator</h3>
              <p className="text-xs text-indigo-100">Instantly generate exam papers from ERP study resources</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition text-indigo-100 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-slate-50/50">
          {/* Options Form */}
          <form onSubmit={handleGenerate} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Topic / Subject</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Quadratic Equations"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Class</label>
                <select
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:bg-white focus:border-indigo-500 outline-none"
                >
                  <option value="Class 9">Class 9</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 11 Science">Class 11 Science</option>
                  <option value="Class 11 Commerce">Class 11 Commerce</option>
                  <option value="Class 12 Science">Class 12 Science</option>
                  <option value="Class 12 Commerce">Class 12 Commerce</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Questions</label>
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:bg-white focus:border-indigo-500 outline-none"
                >
                  <option value={3}>3 Questions (Quick Quiz)</option>
                  <option value={5}>5 Questions (Unit Test)</option>
                  <option value={10}>10 Questions (Full Test Paper)</option>
                  <option value={15}>15 Questions (Standard Exam)</option>
                  <option value={20}>20 Questions (Grand Mock Exam)</option>
                  <option value={30}>30 Questions (Full Term Exam)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty Level</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:bg-white focus:border-indigo-500 outline-none"
                >
                  <option value="Easy">Easy (Conceptual)</option>
                  <option value="Medium">Medium (Standard Exam)</option>
                  <option value="Hard">Hard (Advanced Problem Solving)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Test Paper...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    Generate Test Paper
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Generated Result Container */}
          {quizData && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-none">
              {/* Toolbar */}
              <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('paper')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                      activeTab === 'paper'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Student Question Paper
                  </button>
                  <button
                    onClick={() => setActiveTab('answers')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                      activeTab === 'answers'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Key className="h-3.5 w-3.5" />
                    Teacher Answer Key
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="p-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1 transition"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy JSON'}
                  </button>
                  <button
                    onClick={handlePrint}
                    className="p-1.5 text-xs bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 text-indigo-700 font-medium flex items-center gap-1 transition"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print / PDF
                  </button>
                </div>
              </div>

              {/* Printable Question Paper */}
              <div className="p-6 space-y-6">
                {/* Institutional Header */}
                <div className="text-center border-b border-slate-200 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">{user?.tenantName ? user.tenantName.toUpperCase() + ' ACADEMIC ASSESSMENT' : 'ACADEMIC ASSESSMENT'}</h2>
                  <p className="text-sm font-semibold text-indigo-600 mt-0.5">{quizData.title || `${quizData.topic} Test Paper`}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100">
                    <span><strong>Class:</strong> {quizData.className}</span>
                    <span><strong>Topic:</strong> {quizData.topic}</span>
                    <span><strong>Max Marks:</strong> {quizData.totalMarks || 20}</span>
                    <span><strong>Difficulty:</strong> {quizData.difficulty}</span>
                  </div>
                </div>

                {/* Candidate Info Box */}
                <div className="border border-slate-200 rounded-lg p-3 grid grid-cols-2 gap-4 text-xs text-slate-600 bg-slate-50/50 print:bg-transparent">
                  <div><strong>Student Name:</strong> ______________________</div>
                  <div><strong>Roll Number:</strong> ______________________</div>
                  <div><strong>Date:</strong> ______________________</div>
                  <div><strong>Invigilator Sign:</strong> ______________________</div>
                </div>

                {/* Tab Content: Paper vs Answer Key */}
                {activeTab === 'paper' ? (
                  <div className="space-y-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1">Question Paper</h4>
                    {quizData.questions && quizData.questions.length > 0 ? (
                      quizData.questions.map((q, i) => (
                        <div key={i} className="space-y-2 text-sm">
                          <div className="flex justify-between items-start font-medium text-slate-800">
                            <span>Q{i + 1}. {q.question}</span>
                            <span className="text-xs font-semibold text-slate-400 shrink-0 ml-2">[{q.marks || 2} Marks]</span>
                          </div>

                          {q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4 pt-1">
                              {q.options.map((opt, optIdx) => (
                                <div key={optIdx} className="text-xs text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-100">
                                  {opt}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-600 whitespace-pre-wrap">{quizData.rawText}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-5 bg-indigo-50/30 p-4 rounded-xl border border-indigo-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 border-b border-indigo-200 pb-1">Teacher Answer Key & Explanations</h4>
                    {quizData.questions && quizData.questions.length > 0 ? (
                      quizData.questions.map((q, i) => (
                        <div key={i} className="space-y-1.5 text-sm bg-white p-3 rounded-lg border border-indigo-100 shadow-2xs">
                          <p className="font-semibold text-slate-900">Q{i + 1}. {q.question}</p>
                          <p className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded inline-block">
                            Correct Answer: {q.answer}
                          </p>
                          {q.explanation && (
                            <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 mt-1">
                              <strong>Explanation:</strong> {q.explanation}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{quizData.rawText}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default AIQuizGeneratorModal
