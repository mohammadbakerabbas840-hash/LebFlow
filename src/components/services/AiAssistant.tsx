import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, MessageCircle } from 'lucide-react';
import { L, useI18n } from '../../i18n';
import { apiRequest, ApiError } from '../../services/backend';
import { useAuth } from '../../features/auth/AuthProvider';
import { services } from '../../data/services';
import { getGuide } from '../../data/serviceGuides';
import './ai-assistant.css';

const copy = {
  title: L('Ask LebFlow', 'اسأل LebFlow', 'Demander à LebFlow'),
  welcome: L(
    'What would you like to prepare?',
    'ما المعاملة التي تريد التحضير لها؟',
    'Quelle démarche souhaitez-vous préparer ?',
  ),
  answer: L('LebFlow’s answer', 'إجابة LebFlow', 'Réponse de LebFlow'),
  openPage: L(
    'Open the AI assistant page',
    'فتح صفحة المساعد الذكي',
    'Ouvrir la page de l’assistant IA',
  ),
  suggestions: L('Try a question', 'جرّب أحد هذه الأسئلة', 'Essayez une question'),
  research: L(
    'Research official sources (may take up to 75 seconds)',
    'البحث في المصادر الرسمية (قد يستغرق ٧٥ ثانية)',
    'Rechercher dans les sources officielles (jusqu’à 75 secondes)',
  ),
  researching: L(
    'Searching and comparing official sources…',
    'جارٍ البحث ومقارنة المصادر الرسمية…',
    'Recherche et comparaison des sources officielles…',
  ),
  researchNotice: L(
    'This option sends your question to OpenAI’s web search. Findings may be incomplete and are not automatically added to the reviewed catalogue.',
    'يرسل هذا الخيار سؤالك إلى البحث على الويب لدى OpenAI. قد تكون النتائج غير مكتملة ولا تُضاف تلقائيًا إلى الأدلة المراجعة.',
    'Cette option transmet votre question à la recherche web d’OpenAI. Les résultats peuvent être incomplets et ne sont pas ajoutés automatiquement au catalogue révisé.',
  ),
  notice: L(
    'Answers use sourced guides and may be incomplete or outdated. Your question and up to six recent messages are sent to OpenAI; account details and identity files are not included. Do not enter sensitive information. This conversation stays only in this screen’s memory.',
    'تستند الإجابات إلى أدلة موثّقة وقد تكون ناقصة أو قديمة. يُرسل سؤالك وما يصل إلى ست رسائل سابقة إلى OpenAI، من دون بيانات الحساب أو ملفات الهوية. لا تُدخل معلومات حسّاسة. تُحفظ المحادثة مؤقتًا في ذاكرة هذه الشاشة فقط.',
    'Les réponses utilisent des guides sourcés, parfois incomplets ou anciens. Votre question et jusqu’à six messages récents sont envoyés à OpenAI, sans données du compte ni justificatifs. Ne saisissez pas d’informations sensibles. La conversation reste uniquement dans la mémoire de cet écran.',
  ),
  login: L(
    'Sign in to ask a question',
    'سجّل الدخول لطرح سؤال',
    'Connectez-vous pour poser une question',
  ),
  service: L('Service (optional)', 'الخدمة (اختياري)', 'Service (facultatif)'),
  automatic: L(
    'Find from my question',
    'تحديد الخدمة من سؤالي',
    'Déterminer à partir de ma question',
  ),
  question: L('Your question', 'سؤالك', 'Votre question'),
  ask: L('Ask', 'اسأل', 'Envoyer'),
  working: L(
    'Checking the service guides…',
    'جارٍ مراجعة أدلة الخدمات…',
    'Consultation des guides…',
  ),
  error: L(
    'The assistant is unavailable. Try again, or use the service guides.',
    'المساعد غير متاح حالياً. حاول مجدداً أو راجع أدلة الخدمات.',
    'L’assistant est indisponible. Réessayez ou consultez les guides.',
  ),
  limit: L(
    'Too many questions. Please wait a minute before trying again.',
    'أرسلت أسئلة كثيرة. انتظر دقيقة ثم حاول مجدداً.',
    'Trop de questions. Patientez une minute avant de réessayer.',
  ),
  sources: L('Sources used', 'المصادر المستخدمة', 'Sources utilisées'),
  partial: L(
    'Preparation template; confirm with the authority.',
    'دليل تحضيري؛ أكّد المتطلبات لدى الجهة المختصّة.',
    'Guide de préparation à confirmer auprès de l’autorité.',
  ),
  review: L('Last reviewed', 'آخر مراجعة', 'Dernière révision'),
  unknown: L(
    'Review date not recorded',
    'تاريخ المراجعة غير مسجّل',
    'Date de révision non renseignée',
  ),
  gap: L(
    'The stored information is insufficient for a complete answer.',
    'المعلومات المحفوظة لا تكفي لتقديم إجابة كاملة.',
    'Les informations enregistrées ne permettent pas une réponse complète.',
  ),
};
type Reply = {
  answer: string;
  status: 'answered' | 'insufficient_evidence' | 'researched';
  annotations?: { start: number; end: number; url: string; title: string }[];
  citations: {
    id: string;
    title: string;
    evidenceLevel: string;
    lastReviewedAt: string | null;
    sources: { title: string; url: string }[];
    content: { scope?: string; sourceNote?: string };
  }[];
};
const examples = [
  {
    service: 'passport',
    question: L(
      'What do I need to renew my passport?',
      'ما المستندات المطلوبة لتجديد جواز سفري؟',
      'Quels documents faut-il pour renouveler mon passeport ?',
    ),
  },
  {
    service: 'identity',
    question: L(
      'How do I apply for my child’s first ID?',
      'كيف أقدّم طلب بطاقة هوية لطفلي للمرة الأولى؟',
      'Comment demander la première carte d’identité de mon enfant ?',
    ),
  },
  {
    service: 'civil',
    question: L(
      'Where can I request an individual civil-status extract?',
      'أين يمكنني طلب إخراج قيد فردي؟',
      'Où demander un extrait individuel d’état civil ?',
    ),
  },
];

export function AiAssistant({
  serviceId,
  onSignIn,
  onOpenPage,
  presentation = 'embedded',
}: {
  serviceId?: string;
  onSignIn: () => void;
  onOpenPage?: () => void;
  presentation?: 'page' | 'embedded';
}) {
  const { locale } = useI18n();
  const { user } = useAuth();
  const t = (key: keyof typeof copy) => copy[key][locale];
  const [message, setMessage] = useState('');
  const [service, setService] = useState(serviceId ?? '');
  const [reply, setReply] = useState<Reply | null>(null);
  const [busy, setBusy] = useState(false);
  const [research, setResearch] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [feedback, setFeedback] = useState(false);
  const [lastQuestion, setLastQuestion] = useState('');
  const input = useRef<HTMLTextAreaElement>(null);
  const answer = useRef<HTMLElement>(null);
  const isPage = presentation === 'page';
  const Container = isPage ? 'section' : 'details';
  useEffect(() => {
    if (isPage && reply) answer.current?.scrollIntoView({ block: 'start' });
  }, [isPage, reply]);
  return (
    <Container className={`ai-assistant panel ${isPage ? 'ai-assistant--page' : ''}`} key={locale}>
      {isPage ? (
        <div className="assistant-intro">
          <span className="service-icon">
            <MessageCircle size={24} aria-hidden="true" />
          </span>
          <h2>{t('welcome')}</h2>
        </div>
      ) : (
        <summary>{t('title')}</summary>
      )}
      {onOpenPage && (
        <button type="button" className="assistant-open-page" onClick={onOpenPage}>
          {t('openPage')} <ArrowUpRight size={16} aria-hidden="true" />
        </button>
      )}
      <p className="info-note">{t('notice')}</p>
      {isPage && user && !history.length && !serviceId && (
        <section className="assistant-examples" aria-label={t('suggestions')}>
          <h3>{t('suggestions')}</h3>
          <div>
            {examples.map((example) => (
              <button
                type="button"
                key={example.service}
                disabled={busy}
                onClick={() => {
                  setService(example.service);
                  setMessage(example.question[locale]);
                  setError('');
                  input.current?.focus();
                }}
              >
                {example.question[locale]}
              </button>
            ))}
          </div>
        </section>
      )}
      {!user ? (
        <button type="button" className="primary" onClick={onSignIn}>
          {t('login')}
        </button>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy || message.trim().length < 3) return;
            setBusy(true);
            setError('');
            setReply(null);
            try {
              const result = await apiRequest<Reply>('ai/chat', {
                method: 'POST',
                body: JSON.stringify({
                  message: message.trim(),
                  locale,
                  research,
                  history: history.slice(-6),
                  ...(service ? { serviceId: service } : {}),
                }),
              });
              setReply(result);
              setLastQuestion(message.trim());
              setFeedback(false);
              setHistory((previous) =>
                [
                  ...previous,
                  { role: 'user' as const, content: message.trim() },
                  { role: 'assistant' as const, content: result.answer.slice(0, 2000) },
                ].slice(-6),
              );
              setMessage('');
            } catch (error) {
              setError(
                t(
                  error instanceof ApiError && error.status === 429
                    ? 'limit'
                    : error instanceof ApiError && error.status === 401
                      ? 'login'
                      : 'error',
                ),
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="form-field">
            {t('service')}
            <select
              value={service}
              disabled={busy}
              onChange={(e) => {
                setService(e.target.value);
                setHistory([]);
                setReply(null);
                setError('');
                setFeedback(false);
              }}
            >
              <option value="">{t('automatic')}</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {getGuide(s.id, locale).title}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            {t('question')}
            <textarea
              ref={input}
              required
              minLength={3}
              maxLength={2000}
              rows={3}
              value={message}
              disabled={busy}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
          <button className="primary" disabled={busy || message.trim().length < 3}>
            {t(busy ? (research ? 'researching' : 'working') : 'ask')}
          </button>
          <label className="preference-toggle">
            <input
              type="checkbox"
              checked={research}
              disabled={busy}
              onChange={(e) => setResearch(e.target.checked)}
            />
            {t('research')}
          </label>
          {research && <p className="small-note">{t('researchNotice')}</p>}
        </form>
      )}
      {busy && <p role="status">{t(research ? 'researching' : 'working')}</p>}
      {!!history.length && (
        <details>
          <summary>
            {L('Recent conversation', 'المحادثة الأخيرة', 'Conversation récente')[locale]}
          </summary>
          {history.slice(0, -1).map((turn, index) => (
            <p key={index}>
              <strong>
                {turn.role === 'user' ? L('You', 'أنت', 'Vous')[locale] : 'LebFlow'}:{' '}
              </strong>
              {turn.content}
            </p>
          ))}
          <button
            disabled={busy}
            onClick={() => {
              setHistory([]);
              setReply(null);
              setFeedback(false);
              setMessage('');
              setError('');
            }}
          >
            {L('Clear conversation', 'مسح المحادثة', 'Effacer la conversation')[locale]}
          </button>
        </details>
      )}
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      {reply && (
        <section ref={answer} aria-live="polite" className="ai-answer">
          <div className="ai-question">
            <strong>{t('question')}</strong>
            <p>{lastQuestion}</p>
          </div>
          <h3>{t('answer')}</h3>
          <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            <ResearchText reply={reply} />
          </p>
          {reply.status === 'insufficient_evidence' && <p className="info-note">{t('gap')}</p>}
          {!!reply.citations.length && <h3>{t('sources')}</h3>}
          {reply.citations.map((c) => (
            <article key={c.id}>
              <h4>{c.title}</h4>
              {c.evidenceLevel !== 'core' && <p>{t('partial')}</p>}
              <p>{c.lastReviewedAt ? `${t('review')}: ${c.lastReviewedAt}` : t('unknown')}</p>
              <p>{c.content.sourceNote}</p>
              <ul>
                {c.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </article>
          ))}
          <div className="assistant-feedback">
            <p className="small-note">
              {
                L(
                  'Reporting saves your last question and this answer for administrator review.',
                  'يحفظ الإبلاغ سؤالك الأخير وهذه الإجابة لمراجعة المسؤول.',
                  'Le signalement enregistre votre dernière question et cette réponse pour vérification par un administrateur.',
                )[locale]
              }
            </p>
            <button
              disabled={busy || feedback}
              onClick={async () => {
                try {
                  await apiRequest('ai/feedback', {
                    method: 'POST',
                    body: JSON.stringify({
                      serviceId: service || null,
                      category: 'incorrect',
                      comment:
                        (history
                          .filter((h) => h.role === 'user')
                          .at(-1)
                          ?.content.slice(0, 900) ?? '') +
                        '\n' +
                        reply.answer.slice(0, 1000),
                    }),
                  });
                  setFeedback(true);
                } catch {
                  setError(t('error'));
                }
              }}
            >
              {
                L(
                  feedback ? 'Report received' : 'Report an incorrect answer',
                  feedback ? 'تم استلام البلاغ' : 'الإبلاغ عن إجابة غير صحيحة',
                  feedback ? 'Signalement reçu' : 'Signaler une réponse incorrecte',
                )[locale]
              }
            </button>
          </div>
        </section>
      )}
    </Container>
  );
}

function ResearchText({ reply }: { reply: Reply }) {
  const characters = Array.from(reply.answer);
  let end = 0;
  const parts = (reply.annotations ?? []).flatMap((citation, index) => {
    const before = characters.slice(end, citation.start).join('');
    end = citation.end;
    return [
      before,
      <a key={index} href={citation.url} target="_blank" rel="noreferrer" title={citation.title}>
        [{index + 1}: {citation.title}]
      </a>,
    ];
  });
  return (
    <>
      {parts}
      {characters.slice(end).join('')}
    </>
  );
}
