import { useState } from 'react';
import { L, useI18n } from '../../i18n';
import { apiRequest } from '../../services/backend';
import { useAction } from '../../hooks/useAction';
export function PasswordRecovery() {
  const { locale } = useI18n();
  const text = (en: string, ar: string, fr: string) => L(en, ar, fr)[locale];
  const params = new URLSearchParams(location.hash.split('?')[1]);
  const token = params.get('reset');
  const [finished, setFinished] = useState(false);
  const action = useAction();
  return (
    <details className="panel" open={token ? true : undefined}>
      <summary>{text('Forgot password?', 'نسيت كلمة المرور؟', 'Mot de passe oublié ?')}</summary>
      {finished ? (
        <p role="status">
          {token
            ? text(
                'Password reset. Sign in with your new password.',
                'تم تغيير كلمة المرور. سجّل الدخول باستخدام كلمة المرور الجديدة.',
                'Mot de passe réinitialisé. Connectez-vous avec le nouveau mot de passe.',
              )
            : text(
                'If this account exists, a reset link will be sent. Check your inbox and spam folder.',
                'إذا كان الحساب موجودًا، سيُرسل رابط الاسترداد. تحقّق من البريد الوارد والبريد غير المرغوب فيه.',
                'Si ce compte existe, un lien sera envoyé. Vérifiez votre boîte de réception et vos indésirables.',
              )}
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fields = Object.fromEntries(new FormData(e.currentTarget));
            void action.run(async () => {
              await apiRequest(token ? 'auth/reset-password' : 'auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ ...fields, ...(token ? { token } : {}) }),
              });
              setFinished(true);
            });
          }}
        >
          <label className="form-field">
            {text('Email', 'البريد الإلكتروني', 'E-mail')}
            <input
              type="email"
              name="email"
              required
              defaultValue={params.get('email') ?? ''}
              autoComplete="username"
            />
          </label>
          {token && (
            <>
              <label className="form-field">
                {text(
                  'New password (12 characters minimum)',
                  'كلمة المرور الجديدة (١٢ حرفًا على الأقل)',
                  'Nouveau mot de passe (12 caractères minimum)',
                )}
                <input
                  type="password"
                  name="password"
                  required
                  minLength={12}
                  autoComplete="new-password"
                />
              </label>
              <label className="form-field">
                {text(
                  'Confirm new password',
                  'تأكيد كلمة المرور الجديدة',
                  'Confirmer le nouveau mot de passe',
                )}
                <input
                  type="password"
                  name="password_confirmation"
                  required
                  minLength={12}
                  autoComplete="new-password"
                />
              </label>
            </>
          )}
          <button disabled={action.busy}>{text('Continue', 'متابعة', 'Continuer')}</button>
        </form>
      )}
      {action.failed && <p role="alert">{action.message}</p>}
    </details>
  );
}
