import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DeepModeWall } from './DeepModeWall';

export const DeepModePage = () => {
  const [open, setOpen] = useState(true);

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-6 sm:px-6">
      <header className="mb-4 rounded-3xl border border-[#e8d8cb] bg-[#fffaf5]/92 p-5 shadow-[0_18px_42px_rgba(104,84,70,0.12)]">
        <p className="text-xs uppercase tracking-[0.15em] text-[#9a7f6f]">Leela</p>
        <h1 className="mt-1 text-2xl font-semibold text-[#2f2521]">Глибока гра</h1>
        <p className="mt-2 text-sm text-[#6f6158]">
          Тут з’явиться окремий AI-рівень для глибших спостережень, питань та інтеграції вашого шляху.
        </p>
      </header>

      <section className="relative overflow-hidden rounded-3xl border border-[#e8d9cd] bg-[#fff9f4]/95 p-5 shadow-[0_18px_44px_rgba(99,75,61,0.12)]" data-testid="deep-mode-settings-panel">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-[#3a2c26]">Налаштування глибини</h2>
          <p className="text-sm text-[#6f6158]">Оберіть тон вашої подорожі та режим відображення, коли функція буде активована.</p>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#eadfd4] bg-[#f7efe6] p-3 text-sm text-[#5f4f44]">Персональні акценти інтерпретації</div>
            <div className="rounded-2xl border border-[#eadfd4] bg-[#f7efe6] p-3 text-sm text-[#5f4f44]">Ритм рефлексії після ключових клітин</div>
          </div>
        </div>

        <DeepModeWall open={open} onClose={() => setOpen(false)} />
      </section>

      <div className="mt-4">
        <Link to="/" className="text-sm text-[#8d6b5a] underline underline-offset-4">
          Повернутися на головну
        </Link>
      </div>
    </main>
  );
};
