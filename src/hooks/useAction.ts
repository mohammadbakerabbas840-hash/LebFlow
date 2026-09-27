import { useState } from 'react';
import { useI18n, L } from '../i18n';
export function useAction() {
  const { locale } = useI18n();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  async function run(action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setMessage('');
    setFailed(false);
    try {
      await action();
      setMessage(L('Saved.', 'تم الحفظ.', 'Enregistré.')[locale]);
    } catch {
      setFailed(true);
      setMessage(
        L(
          'Unable to save. Check your entries and connection, then try again.',
          'تعذّر الحفظ. تحقّق من البيانات والاتصال ثم حاول مجددًا.',
          'Enregistrement impossible. Vérifiez les champs et la connexion, puis réessayez.',
        )[locale],
      );
    } finally {
      setBusy(false);
    }
  }
  return { busy, message, failed, run };
}
