"use client";

import { FaMountain, FaPaperPlane, FaCopy, FaChartBar, FaComments, FaSearch } from "react-icons/fa";
import { useState, FormEvent, ChangeEvent, useRef, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import Modal from "./modal";
import Ragsubmit from "./ragsubmit";
import { IoSettingsSharp } from "react-icons/io5";
import { TaskContext } from "../context/taskContext";
import LanguageSelector from './languageSelector';
import AnalyticsDashboard from './AnalyticsDashboard';
import AdvancedSearch from './AdvancedSearch';
import RealtimeChat from './RealtimeChat';

type GetResponseResult = {
  success: boolean;
  answer?: string;
  answer_raw?: any;
  answerDraft?: string;
  answerDrafts?: string;
  answer_draft?: string;
  nba?: string[];
  proposed_qs?: any;
  proposed_question?: any;
  proposed_questions?: string[];
  proposedQuestions?: string[];
  proposedQuestionsNormalized?: string[];
  proposed?: any;
  similar?: any[];
  suggested?: string;
  _raw?: any;
};

interface Ticket {
  id: string;
  ticket_id: string;
  title: string;
  date: string;
  relevance: number;
  link: string;
  issueDesc: string;
  resolveCommentCS: string[];
  snippet?: string;
  priority?: string | number;
  createdAt?: string;
  screenId?: string;
  imageUrl?: string[];
}

// Convert file to base64
const toBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const GetResponse = async (
  messageToSend: string,
  taskType: string,
  language: string,
  media: string[]
): Promise<GetResponseResult> => {
  const data = { query: messageToSend, taskType, language, media };
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
    });

    // Try parsing with res.json() first, fallback to robust salvage if that fails
    let json: any = {};
    let rawText: string | undefined;
    try {
      // try direct json parse (fast path)
      json = await res.clone().json();
      console.log('[GetResponse] res.json() ok');
    } catch (eJson) {
      console.warn('[GetResponse] res.json() failed, falling back to text parse:', eJson);
      rawText = await res.text();
      console.log('[GetResponse] rawText (first 2000 chars):', rawText?.slice ? rawText.slice(0, 2000) : rawText);

      // find the first JSON-like block anywhere (non-greedy)
      try {
        const maybe = rawText?.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (maybe && maybe[0]) {
          json = JSON.parse(maybe[0]);
          console.warn('[GetResponse] salvage JSON parse succeeded (first JSON-like block)');
        } else {
          // try parse raw as whole JSON (sometimes it's already clean)
          try {
            json = JSON.parse(rawText || '{}');
            console.warn('[GetResponse] parsed rawText as JSON (fallback)');
          } catch (e2) {
            console.error('[GetResponse] salvage parse: no JSON-like substring found and raw parse failed', e2);
            json = {};
          }
        }
      } catch (e2) {
        console.error('[GetResponse] salvage parse failed:', e2);
        json = {};
      }
    }

    console.log('[GetResponse] parsed json keys:', Object.keys(json));

    // helper to read many possible nested locations & key variants
    const readAny = (obj: any, keys: string[]) => {
      if (!obj) return undefined;
      for (const k of keys) {
        if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] != null) return obj[k];
      }
      // common nested containers
      if (obj.data) {
        for (const k of keys) if (Object.prototype.hasOwnProperty.call(obj.data, k) && obj.data[k] != null) return obj.data[k];
      }
      if (obj.response) {
        for (const k of keys) if (Object.prototype.hasOwnProperty.call(obj.response, k) && obj.response[k] != null) return obj.response[k];
      }
      if (obj.result) {
        for (const k of keys) if (Object.prototype.hasOwnProperty.call(obj.result, k) && obj.result[k] != null) return obj.result[k];
      }
      return undefined;
    };

    // Helper to coerce answer-like value into a string
    const extractString = (val: any): string => {
      if (val == null) return '';
      if (typeof val === 'string') return val.trim();
      if (typeof val === 'number' || typeof val === 'boolean') return String(val);
      if (Array.isArray(val)) {
        // if array of strings, join; if objects, stringify
        const first = val.find(x => typeof x === 'string' && x.trim());
        if (first) return first.trim();
        return val.map(x => (typeof x === 'string' ? x : JSON.stringify(x))).join('\n\n').trim();
      }
      if (typeof val === 'object') {
        // look for common nested text fields
        const nested = val.text ?? val.content ?? val.answer ?? val.message ?? val.body ?? val.summary ?? val.suggested ?? val.resolution;
        if (nested) return extractString(nested);
        try { return JSON.stringify(val); } catch { return String(val); }
      }
      return String(val).trim();
    };

    // ----- ANSWER EXTRACTION -----
    const answerCandidates = [
      'answer_draft', 'answerDraft', 'answer', 'body', 'response', 'message',
      'suggested_resolution', 'suggestion', 'resolution', 'recommended', 'summary'
    ];
    let answerRaw: any = readAny(json, answerCandidates) ?? '';

    // --- NEW: if there is an explicit answer_draft anywhere, take it raw and don't try to parse/transform it ---
    const deepFindExact = (obj: any, keyToFind: string, depth = 0): any => {
      if (!obj || depth > 8) return undefined;
      if (typeof obj !== 'object') return undefined;
      for (const k of Object.keys(obj)) {
        try {
          if (k.toLowerCase() === keyToFind.toLowerCase()) {
            if (obj[k] != null) return obj[k];
          }
        } catch {}
      }
      for (const k of Object.keys(obj)) {
        try {
          const v = obj[k];
          if (typeof v === 'object') {
            const found = deepFindExact(v, keyToFind, depth + 1);
            if (found != null) return found;
          }
        } catch {}
      }
      return undefined;
    };

    const explicitAnswerDraft = deepFindExact(json, 'answer_draft');
    let skipAnswerParsing = false;
    if (explicitAnswerDraft !== undefined) {
      answerRaw = explicitAnswerDraft; // take exactly what's provided
      skipAnswerParsing = true;
      console.log('[GetResponse] using explicit answer_draft without parsing');
    }

    // sanity logs
    console.log('[GetResponse] after readAny answerRaw:', answerRaw);

    // if empty, try direct top-level check for common keys (defensive)
    if (!answerRaw) {
      for (const k of answerCandidates) {
        if (Object.prototype.hasOwnProperty.call(json, k) && json[k]) { answerRaw = json[k]; break; }
        if (json.data && Object.prototype.hasOwnProperty.call(json.data, k) && json.data[k]) { answerRaw = json.data[k]; break; }
        if (json.response && Object.prototype.hasOwnProperty.call(json.response, k) && json.response[k]) { answerRaw = json.response[k]; break; }
      }
      console.log('[GetResponse] after top-level checks answerRaw:', answerRaw);
    }

    // if still empty and json is a string, try parsing it
    if ((!answerRaw || answerRaw === '') && typeof json === 'string') {
      try {
        const inner = JSON.parse(json);
        answerRaw = readAny(inner, answerCandidates) ?? answerRaw;
        console.log('[GetResponse] found inside stringified json:', answerRaw);
      } catch (e) {
        console.log('[GetResponse] json is string but not parseable as JSON');
      }
    }

    // deep-ish search: look for keys that contain 'answer' or 'draft' or 'suggest'
    const deepFindKey = (obj: any, keysToMatch: string[], depth = 0): any => {
      if (!obj || depth > 6) return undefined;
      if (typeof obj !== 'object') return undefined;
      for (const k of Object.keys(obj)) {
        try {
          const lower = k.toLowerCase();
          if (keysToMatch.some(sub => lower.includes(sub))) {
            if (obj[k] != null && obj[k] !== '') return obj[k];
          }
        } catch {}
      }
      for (const k of Object.keys(obj)) {
        try {
          const v = obj[k];
          if (typeof v === 'object') {
            const found = deepFindKey(v, keysToMatch, depth + 1);
            if (found != null && found !== '') return found;
          }
        } catch {}
      }
      return undefined;
    };

    if ((!answerRaw || answerRaw === '') && !skipAnswerParsing) {
      const found = deepFindKey(json, ['answer', 'draft', 'response', 'suggest', 'resolution', 'recommend']);
      if (found) {
        answerRaw = found;
        console.log('[GetResponse] found by deepFindKey:', answerRaw);
      } else {
        console.log('[GetResponse] deepFindKey didnt locate an answer-like key');
      }
    }

    // Final coercion: if we explicitly used answer_draft, preserve it but still ensure it's a string
    const answer = skipAnswerParsing ? (typeof answerRaw === 'string' ? answerRaw : JSON.stringify(answerRaw)) : extractString(answerRaw);
    console.log('[GetResponse] final extracted answer (first 1000 chars):', answer ? (answer as string).slice(0,1000) : '(empty)');

    // NBA detection
    const nbaRaw = readAny(json, ['nba', 'next_best_actions', 'nextBestActions', 'actions', 'nbas']);
    let nba: string[] = [];
    if (Array.isArray(nbaRaw)) nba = nbaRaw.map(String);
    else if (typeof nbaRaw === 'string' && nbaRaw.trim()) nba = nbaRaw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    console.log('[GetResponse] parsed nba:', nba);

    // ----- PROPOSED QUESTIONS: flexible parsing -----
    let proposed_questions: string[] = [];

    // First, check for explicit proposed_question(s) and take them as-is (do not parse/split strings automatically)
    const explicitProposedSingle = deepFindExact(json, 'proposed_question');
    const explicitProposedPlural = deepFindExact(json, 'proposed_questions') ?? deepFindExact(json, 'proposed_qs') ?? deepFindExact(json, 'proposedQuestions');
    console.log('[GetResponse] explicit proposed_question found:', explicitProposedSingle);
    console.log('[GetResponse] explicit proposed_questions found:', explicitProposedPlural);

    if (explicitProposedSingle !== undefined) {
      // if it's an array keep it, if it's a string keep it as a single raw string (do not split on commas/newlines)
      if (Array.isArray(explicitProposedSingle)) proposed_questions = explicitProposedSingle.map(String).filter(Boolean);
      else proposed_questions = [typeof explicitProposedSingle === 'string' ? explicitProposedSingle : JSON.stringify(explicitProposedSingle)];
      console.log('[GetResponse] using explicit proposed_question raw without parsing');
    } else if (explicitProposedPlural !== undefined) {
      if (Array.isArray(explicitProposedPlural)) proposed_questions = explicitProposedPlural.map(String).filter(Boolean);
      else proposed_questions = [typeof explicitProposedPlural === 'string' ? explicitProposedPlural : JSON.stringify(explicitProposedPlural)];
      console.log('[GetResponse] using explicit proposed_questions raw without splitting');
    } else {
      // fallback to previous flexible parsing if no explicit keys found
      let pqRaw = readAny(json, ['proposed_questions', 'proposedQuestions', 'proposed_qs', 'proposed_question', 'proposed', 'questions', 'followup_questions', 'followups', 'clarifying_questions', 'suggested_questions', 'suggestions', 'recommendations']);
      console.log('[GetResponse] proposed_questions raw before normalize (fallback path):', pqRaw);

      if (Array.isArray(pqRaw)) {
        proposed_questions = pqRaw.map(String).filter(Boolean);
      } else if (typeof pqRaw === 'string') {
        // maybe it's a JSON-encoded array string
        try {
          const parsed = JSON.parse(pqRaw);
          if (Array.isArray(parsed)) proposed_questions = parsed.map(String).filter(Boolean);
          else proposed_questions = pqRaw.split(/\r?\n|;|,/).map(s => s.trim()).filter(Boolean);
        } catch {
          proposed_questions = pqRaw.split(/\r?\n|;|,/).map(s => s.trim()).filter(Boolean);
        }
      } else if (pqRaw) {
        const possible = extractString(pqRaw);
        if (possible) proposed_questions = possible.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      }
      console.log('[GetResponse] parsed proposed_questions (first pass, fallback):', proposed_questions);

      // Fallback deep search for question-like fields if none found
      if (proposed_questions.length === 0 && json) {
        const deepCollectQuestions = (obj: any, depth = 0): string[] => {
          if (!obj || depth > 6) return [];
          let results: string[] = [];
          if (typeof obj === "object") {
            for (const [k, v] of Object.entries(obj)) {
              try {
                const lower = String(k).toLowerCase();
                if (lower.includes("question") || lower.includes("followup") || lower.includes("clarify") || lower.includes("suggest") || lower.includes("recommend")) {
                  if (Array.isArray(v)) results.push(...v.map(String).filter(Boolean));
                  else if (typeof v === "string" && v.trim()) {
                    try {
                      const parsed = JSON.parse(v);
                      if (Array.isArray(parsed)) results.push(...parsed.map(String).filter(Boolean));
                      else results.push(v.trim());
                    } catch {
                      results.push(v.trim());
                    }
                  } else if (typeof v === 'object') {
                    // if object looks like { text: "..." } or { question: "..." }
                    const nested = (v as any).text ?? (v as any).content ?? (v as any).question ?? (v as any).message;
                    if (nested) {
                      if (Array.isArray(nested)) results.push(...nested.map(String).filter(Boolean));
                      else if (typeof nested === 'string') results.push(nested.trim());
                    }
                  }
                }
              } catch {}
              // recurse
              try {
                if (typeof v === 'object') results.push(...deepCollectQuestions(v, depth + 1));
              } catch {}
            }
          }
          return results;
        };
        const deepFound = deepCollectQuestions(json);
        if (deepFound.length > 0) {
          proposed_questions = deepFound;
          console.log("[GetResponse] fallback deepCollectQuestions found:", proposed_questions);
        } else {
          console.log("[GetResponse] deepCollectQuestions found nothing");
        }
      }
    }

    // Similar items (safest)
    const similar = Array.isArray(json.similar) ? json.similar : (Array.isArray(json.similarity) ? json.similarity : []);

    // If we still don't have an answer, try other likely keys (suggested/resolution)
    let suggested = '';
    if (!answer) {
      const suggestedRaw = readAny(json, ['suggested_resolution', 'resolution', 'suggestion', 'recommended', 'summary', 'recommendation', 'advice']) ?? deepFindKey(json, ['suggested', 'resolution', 'recommend', 'advice']);
      if (suggestedRaw) suggested = extractString(suggestedRaw);
      if (suggested) console.log('[GetResponse] found suggested fallback:', suggested.slice(0,500));
    }

    const normalized: GetResponseResult = {
      success: true,
      answer: answer || suggested || '',
      answer_raw: answerRaw,
      answerDraft: answer || '',
      nba,
      proposed_questions,
      proposedQuestions: proposed_questions,
      proposedQuestionsNormalized: proposed_questions,
      similar,
      suggested: suggested || undefined,
      _raw: json
    };

    console.log('[GetResponse] normalized summary:', { answerLen: (normalized.answer || '').length, nbaCount: nba.length, proposedCount: proposed_questions.length, similarCount: Array.isArray(similar) ? similar.length : 0 });

    return normalized;
  } catch (e) {
    console.error('[GetResponse] network/error:', e);
    return { success: false };
  }
};

const Chatbox = () => {
  const [issueDescription, setIssueDescription] = useState<string>("");
  const [aiSummary, setAiSummary] = useState<string>("");
  const [nbaSteps, setNbaSteps] = useState<string[]>([]);
  const [proposedQuestions, setProposedQuestions] = useState<string[]>([]);
  const [relatedTickets, setRelatedTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState("Vietnamese");
  const [currentView, setCurrentView] = useState<"main" | "analytics" | "search" | "chat">("main");
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);

  // states for tasks selection
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("TaskContext not within provider");
  }
  const { taskType } = context;

  const router = useRouter();

  // Fetch related tickets from API (kept for completeness)
  const fetchRelatedTickets = async (): Promise<Ticket[]> => {
    try {
      const response = await fetch('/api/tickets?limit=5');
      const data = await response.json();
      if (data.success) {
        return data.data.map((ticket: any) => ({
          id: ticket.id,
          ticket_id: ticket.id,
          title: ticket.screenId,
          snippet: (ticket.description || '').substring(0, 100) + '...',
          date: ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'N/A',
          priority: ticket.priority,
          relevance: Math.floor(Math.random() * 20) + 80, // Simulate relevance
          link: `/tickets/${ticket.id}`,
          issueDesc: ticket.description || '(no description)',
          resolveCommentCS: Array.isArray(ticket.resolveCommentCS) ? ticket.resolveCommentCS : [],
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching tickets:', error);
      return [];
    }
  };

  // Get relevance style
  const getRelevanceStyle = (relevance: number) => {
    if (typeof relevance !== 'number' || isNaN(relevance)) {
      return { borderLeft: '4px solid #d1d5db' }; // gray-300
    }
    if (relevance >= 90) return { borderLeft: '4px solid #10b981' }; // green-500
    if (relevance >= 80) return { borderLeft: '4px solid #f59e0b' }; // yellow-500
    return { borderLeft: '4px solid #d1d5db' };
  };

  const handleQueryAI = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!issueDescription.trim()) return;

    setIsLoading(true);
    setAiSummary('');
    setRelatedTickets([]);
    setNbaSteps([]);
    setProposedQuestions([]);

    try {
      const mediaBase64 = await Promise.all(selectedMedia.map(toBase64));
      console.log('[handleQueryAI] selectedMedia count:', selectedMedia.length, 'base64 sizes (chars):', mediaBase64.map(s => s.length));
      const response = await GetResponse(issueDescription, taskType, selectedLanguage, mediaBase64);

      console.log('[handleQueryAI] GetResponse returned raw _raw:', response?._raw ?? '(no raw)');
      console.log('[handleQueryAI] GetResponse top-level fields:', { success: response.success, answerLen: response.answer?.length ?? 0, nbaCount: response.nba?.length ?? 0, proposedCount: response.proposed_questions?.length ?? 0, similarCount: response.similar?.length ?? 0 });

      if (response && response.success) {
        // Prefer normalized answer (which already attempts multiple fallbacks)
        const answerText = (response.answer && response.answer.toString().trim()) || (response.suggested && response.suggested.toString().trim()) || '';
        console.log('[handleQueryAI] chosen answerText (first 1000 chars):', answerText ? answerText.slice(0,1000) : '(empty)');
        setAiSummary(answerText);

        // NBA (keep same)
        if (Array.isArray(response.nba) && response.nba.length > 0) {
          console.log('[handleQueryAI] nba steps:', response.nba);
          setNbaSteps(response.nba.map(String));
        } else if (response._raw && Array.isArray(response._raw.nba)) {
          setNbaSteps(response._raw.nba.map(String));
        } else {
          setNbaSteps([]);
        }

        // Proposed questions - prefer normalized field, then fallback to deep in _raw if empty
        let pqResolved: string[] = [];
        if (Array.isArray(response.proposed_questions) && response.proposed_questions.length > 0) {
          pqResolved = response.proposed_questions.map(String);
        } else if (Array.isArray(response.proposedQuestions) && response.proposedQuestions.length > 0) {
          pqResolved = response.proposedQuestions.map(String);
        } else if (Array.isArray((response as any).proposedQuestionsNormalized) && (response as any).proposedQuestionsNormalized.length > 0) {
          pqResolved = (response as any).proposedQuestionsNormalized.map(String);
        } else if (response._raw) {
          // deep search in _raw as a last resort (similar algorithm to GetResponse)
          const deepCollectQuestions = (obj: any, depth = 0): string[] => {
            if (!obj || depth > 6) return [];
            let results: string[] = [];
            if (typeof obj === "object") {
              for (const [k, v] of Object.entries(obj)) {
                try {
                  const lower = String(k).toLowerCase();
                  if (lower.includes("question") || lower.includes("followup") || lower.includes("clarify") || lower.includes("suggest") || lower.includes("recommend")) {
                    if (Array.isArray(v)) results.push(...v.map(String).filter(Boolean));
                    else if (typeof v === "string" && v.trim()) {
                      try {
                        const parsed = JSON.parse(v);
                        if (Array.isArray(parsed)) results.push(...parsed.map(String).filter(Boolean));
                        else results.push(v.trim());
                      } catch {
                        results.push(v.trim());
                      }
                    } else if (typeof v === 'object') {
                      const nested = (v as any).text ?? (v as any).content ?? (v as any).question ?? (v as any).message;
                      if (nested) {
                        if (Array.isArray(nested)) results.push(...nested.map(String).filter(Boolean));
                        else if (typeof nested === 'string') results.push(nested.trim());
                      }
                    }
                  }
                } catch {}
                try { if (typeof v === 'object') results.push(...deepCollectQuestions(v, depth + 1)); } catch {}
              }
            }
            return results;
          };
          pqResolved = deepCollectQuestions(response._raw);
        }
        // final normalization
        pqResolved = Array.from(new Set((pqResolved || []).map(String).map(s => s.trim()).filter(Boolean)));
        console.log('[handleQueryAI] resolved proposed questions:', pqResolved);
        setProposedQuestions(pqResolved);

        // Map similar -> relatedTickets if present
        if (response.similar && Array.isArray(response.similar) && response.similar.length > 0) {
          const mapped: Ticket[] = response.similar.map((item: any, idx: number) => {
            const ticketId = item.ticket_id ?? item.ticketId ?? item.id ?? `sim-${idx}`;
            const issueDesc = item.issueDesc ?? item.issue_desc ?? item.description ?? item.title ?? '(no description)';
            let relevancePercent = 0;
            if (typeof item.relevance_score === 'number') relevancePercent = Math.round(item.relevance_score * 100);
            else if (typeof item.relevance === 'number') relevancePercent = Math.round(item.relevance);
            else if (typeof item.relevance_score === 'string') {
              const parsed = parseFloat(item.relevance_score);
              if (!isNaN(parsed)) relevancePercent = Math.round(parsed * 100);
            }
            const link = item.link ?? item.url ?? '#';
            const resolveCommentCS = Array.isArray(item.resolveCommentCS) ? item.resolveCommentCS : (item.resolveCommentCS ? [String(item.resolveCommentCS)] : []);
            const imageUrl = (() => {
              try {
                if (!item.imageUrl) return [] as string[];
                if (Array.isArray(item.imageUrl)) return item.imageUrl;
                if (typeof item.imageUrl === 'string') {
                  const parsed = JSON.parse(item.imageUrl);
                  if (Array.isArray(parsed)) return parsed as string[];
                }
              } catch { /* ignore */ }
              return [] as string[];
            })();
            return {
              id: ticketId,
              ticket_id: ticketId,
              title: issueDesc,
              issueDesc,
              date: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A',
              relevance: isNaN(relevancePercent) ? 0 : relevancePercent,
              link,
              resolveCommentCS,
              snippet: (issueDesc || '').substring(0, 120),
              createdAt: item.createdAt,
              screenId: item.screenId,
              imageUrl,
            } as Ticket;
          });
          console.log('[handleQueryAI] mapped relatedTickets preview:', mapped.slice(0,5).map(t => ({ id: t.id, relevance: t.relevance, title: t.title.slice(0,120) })));
          setRelatedTickets(mapped);
        } else {
          setRelatedTickets([]);
        }
      } else {
        console.error('[handleQueryAI] GetResponse returned success:false or null', response);
        setAiSummary('There was an error generating the AI response. Please try again.');
        setNbaSteps([]);
        setProposedQuestions([]);
      }
    } catch (error) {
      console.error('[handleQueryAI] error:', error);
      setAiSummary('An error occurred while processing your request.');
    } finally {
      setIsLoading(false);
      setSelectedMedia([]);
    }
  };

  // Copy AI summary to clipboard
  const copyToClipboard = async () => {
    if (aiSummary) {
      try {
        await navigator.clipboard.writeText(aiSummary);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  };

  // Copy a single NBA step
  const copyNbaStep = async (step: string) => {
    try {
      await navigator.clipboard.writeText(step);
    } catch (err) {
      console.error('Failed to copy NBA step:', err);
    }
  };

  // Append a proposed question to the input
  const applyProposedQuestion = (q: string) => {
    setIssueDescription(prev => (prev ? prev + ' ' + q : q));
  };

  // Render sub-views (analytics / search / chat) kept same as before
  if (currentView === "analytics") {
    return (
      <div className="flex flex-col h-screen bg-gray-50 w-full">
        <div className="flex items-center justify-between bg-blue-600 text-white px-4 py-3 shadow-md">
          <div className="flex items-center gap-3">
            <img src="/images/Icon.jpeg" alt="fireSpot" width={40} height={40} />
            <h2 className="text-xl font-medium">CS AI Assistant - Analytics</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentView("main")} className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors">
              <FaComments size={16} /> Back to Tool
            </button>
            <LanguageSelector selectedLanguage={selectedLanguage} setSelectedLanguage={setSelectedLanguage} />
            <button onClick={() => setOpenModal(true)} className="p-2 hover:bg-brand-primary rounded-lg transition-colors">
              <IoSettingsSharp size={24} />
            </button>
            <Modal open={openModal} onClose={() => setOpenModal(false)}>
              <div className="px-2 py-6"><Ragsubmit /></div>
            </Modal>
          </div>
        </div>
        <AnalyticsDashboard />
      </div>
    );
  }

  if (currentView === "search") {
    return (
      <div className="flex flex-col h-screen bg-gray-50 w-full">
        <div className="flex items-center justify-between bg-blue-600 text-white px-4 py-3 shadow-md">
          <div className="flex items-center gap-3">
            <img src="/images/Icon.jpeg" alt="logo" width={40} height={40} style={{ borderRadius: '8px', objectFit: 'cover' }} />
            <h2 className="text-xl font-medium">CS AI Assistant - Advanced Search</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentView("main")} className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors">
              <FaComments size={16} /> Back to Tool
            </button>
            <LanguageSelector selectedLanguage={selectedLanguage} setSelectedLanguage={setSelectedLanguage} />
            <button onClick={() => setOpenModal(true)} className="p-2 hover:bg-blue-700 rounded-lg transition-colors">
              <IoSettingsSharp size={24} />
            </button>
            <Modal open={openModal} onClose={() => setOpenModal(false)}>
              <div className="px-2 py-6"><Ragsubmit /></div>
            </Modal>
          </div>
        </div>
        <AdvancedSearch />
      </div>
    );
  }

  if (currentView === "chat") {
    return (
      <div className="flex flex-col h-screen bg-gray-50 w-full">
        <div className="flex items-center justify-between bg-blue-600 text-white px-4 py-3 shadow-md">
          <div className="flex items-center gap-3">
            <img src="/images/Icon.jpeg" alt="logo" width={40} height={40} style={{ borderRadius: '8px', objectFit: 'cover' }} />
            <h2 className="text-xl font-medium">CS AI Assistant - Live Chat</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentView("main")} className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors">
              <FaComments size={16} /> Back to Tool
            </button>
            <LanguageSelector selectedLanguage={selectedLanguage} setSelectedLanguage={setSelectedLanguage} />
            <button onClick={() => setOpenModal(true)} className="p-2 hover:bg-blue-700 rounded-lg transition-colors">
              <IoSettingsSharp size={24} />
            </button>
            <Modal open={openModal} onClose={() => setOpenModal(false)}>
              <div className="px-2 py-6"><Ragsubmit /></div>
            </Modal>
          </div>
        </div>
        <RealtimeChat />
      </div>
    );
  }

  // Main UI
  return (
    <div className="flex flex-col h-screen bg-gray-50 w-full">
      <div className="flex items-center justify-between bg-brand-primary text-white px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <img src="/images/Icon.jpeg" alt="logo" width={40} height={40} style={{ borderRadius: '8px', objectFit: 'cover' }} />
          <h2 className="text-xl font-medium">Trợ lý chăm sóc khách hàng thông minh</h2>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector selectedLanguage={selectedLanguage} setSelectedLanguage={setSelectedLanguage} />
          <button onClick={() => setOpenModal(true)} className="p-2 bg-brand-secondary text-black rounded-lg transition-colors">
            <IoSettingsSharp size={24} />
          </button>
          <Modal open={openModal} onClose={() => setOpenModal(false)}>
            <div className="px-2 py-6"><Ragsubmit /></div>
          </Modal>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 lg:flex-[1] p-4 lg:p-6 border-b lg:border-b-0 lg:border-r border-gray-200 overflow-y-auto">
          <form onSubmit={handleQueryAI} className="h-full flex flex-col">
            <div className="mb-4">
              <label className="block text-lg font-medium text-gray-700 mb-2">Miêu Tả Vấn Đề Khách Hàng:</label>
              <textarea value={issueDescription} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setIssueDescription(e.target.value)} placeholder="Nhập chi tiết vấn đề của khách hàng..." className="w-full h-64 lg:h-21 p-4 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-secondary bg-white shadow-sm hover:shadow-md transition-all duration-300" rows={8} />
            </div>

            <div className="mb-6">
              <label className="block text-lg font-semibold text-gray-700 mb-3">📎 Upload Phương Tiện (optional)</label>

              <div className="relative">
                <input type="file" multiple accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  if (e.target.files) setSelectedMedia(Array.from(e.target.files));
                }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" id="media-upload" />

                <label htmlFor="media-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 cursor-pointer group">
                  <div className="flex flex-col items-center justify-center text-center p-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Drop images here</p>
                    <p className="text-xs text-gray-400 mt-1">or click to browse files</p>
                  </div>
                </label>
              </div>

              {selectedMedia.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">Selected Files ({selectedMedia.length})</h4>
                    <button onClick={() => setSelectedMedia([])} className="text-xs text-red-500 hover:text-red-700 transition-colors">Clear all</button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {selectedMedia.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all duration-300 shadow-lg hover:shadow-xl">
                          {file.type.startsWith('image/') ? (
                            <img src={URL.createObjectURL(file)} alt={`preview-${index}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                              <div className="text-center">
                                <svg className="w-8 h-8 text-purple-600 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <p className="text-xs text-gray-600 font-medium">Video</p>
                              </div>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg" />
                          <button onClick={() => setSelectedMedia(selectedMedia.filter((_, i) => i !== index))} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center text-xs hover:bg-red-600">×</button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate px-1">{file.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto">
              <button type="submit" disabled={isLoading || !issueDescription.trim()} className="w-full lg:w-auto px-8 py-4 bg-brand-primary  disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:shadow-none flex items-center justify-center gap-3 text-lg">
                {isLoading ? (
                  <>
                    <div className="w-full lg:w-auto bg-brand-primary hover:bg-brand-secondary disabled:bg-brand-primary text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"></div>
                    <span>Chờ xíu nhé...</span>
                  </>
                ) : (
                  <>
                    <div className="p-1 bg-white bg-opacity-20 rounded-lg"><FaPaperPlane size={18} /></div>
                    <span>Hỏi bé AI</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="flex-1 lg:flex-[1] flex flex-col overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 lg:p-6 border-b border-gray-200">
            {/* Answer Box */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-700">Đề Xuất Câu Trả Lời</h3>
                {aiSummary && (
                  <button onClick={copyToClipboard} className="p-2 text-gray-500 hover:text-blue-600 transition-colors" title="Copy to clipboard"><FaCopy size={16} /></button>
                )}
              </div>

              <div className="overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-primary border-t-transparent"></div>
                      <p className="text-gray-500 font-medium">Đang Giải Quyết...</p>
                    </div>
                  </div>
                ) : aiSummary ? (
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{aiSummary}</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <p className="font-medium">Hướng giải quyết sẽ hiện ở đây</p>
                      <p className="text-sm text-gray-300 mt-1">Hãy mô tả vấn đề và cho bé AI giải quyết dùm bạn nhé!</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* NBA & Proposed Questions column */}
            <div className="flex flex-col gap-4">
              {/* NBA Box */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 h-1/2 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-semibold text-gray-700">Hành Động Tiếp Theo</h4>
                  {nbaSteps.length > 0 && <span className="text-xs text-gray-500">{nbaSteps.length} steps</span>}
                </div>
                {nbaSteps.length > 0 ? (
                  <ol className="list-decimal list-inside text-sm text-gray-700 space-y-2">
                    {nbaSteps.map((step, idx) => (
                      <li key={idx} className="whitespace-pre-wrap flex items-start justify-between gap-2">
                        <span className="flex-1">{step}</span>
                        <div className="flex items-center gap-2 ml-3">
                          <button onClick={() => copyNbaStep(step)} className="text-xs text-gray-500 hover:text-blue-600">Copy</button>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-gray-400">Các bước hành động sẽ được bé AI khuyến nghị tại đây.</p>
                )}
              </div>

              {/* Proposed Questions Box */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 h-1/2 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-semibold text-gray-700">Câu Hỏi Đề Ra</h4>
                  {proposedQuestions.length > 0 && <span className="text-xs text-gray-500">{proposedQuestions.length} suggestions</span>}
                </div>
                {proposedQuestions.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {proposedQuestions.map((q, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{q}</p>
                        <div className="flex items-center gap-2">
                          <button onClick={() => navigator.clipboard.writeText(q)} className="text-xs text-gray-500 hover:text-blue-600">Copy</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Câu hỏi mở có thể mở rộng ngữ cảnh vấn đề.</p>
                )}
              </div>
            </div>
          </div>

          {/* Related Past Tickets Section */}
          <div className="flex-1 p-4 lg:p-6">
            <div className="h-full flex flex-col">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Tickets Cũ Liên Quan</h3>
              <div className="flex-1 bg-white border-2 border-gray-200 rounded-xl overflow-y-auto shadow-sm hover:shadow-md transition-all duration-300">
                {relatedTickets.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {relatedTickets.map((ticket, index) => (
                      <div key={ticket.id} className="p-5 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-sm" style={{ animationDelay: `${index * 100}ms`, ...getRelevanceStyle(ticket.relevance) }} onClick={() => router.push(ticket.link)}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full text-xs">{ticket.id}</span>
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${ticket.relevance >= 90 ? 'bg-green-500' : ticket.relevance >= 80 ? 'bg-yellow-500' : 'bg-gray-400'}`}></div>
                              <span className="text-xs text-gray-500 font-medium">{ticket.relevance}% khớp</span>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{ticket.date}</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm">{ticket.title}</h4>
                        <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r-lg mb-3">
                          <p className="text-xs text-red-700 font-medium">Vấn Đề: {ticket.issueDesc}</p>
                        </div>
                        <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded-r-lg">
                          <p className="text-xs text-green-700 font-medium">Phương Án: {ticket.resolveCommentCS.join(', ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <p className="font-medium">Lịch sử các tickets cũ liên quan sẽ hiện ở đây sau khi được xử lý</p>
                      <p className="text-sm text-gray-300 mt-1">AI sẽ truy vấn các vấn đề tương tự giúp bạn, chill nhé!</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbox;
