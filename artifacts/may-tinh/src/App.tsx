import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { Calculator } from 'lucide-react';

const queryClient = new QueryClient();
type Operator = '+' | '−' | '×' | '÷';

function formatResult(value: number): string {
  if (!Number.isFinite(value)) return 'Lỗi';
  const rounded = Number(value.toPrecision(12));
  return String(rounded);
}

function Home() {
  const [display, setDisplay] = useState('0');
  const [stored, setStored] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [expression, setExpression] = useState('');
  const [error, setError] = useState('');
  const [justCalculated, setJustCalculated] = useState(false);

  const clear = useCallback(() => {
    setDisplay('0');
    setStored(null);
    setOperator(null);
    setWaitingForOperand(false);
    setExpression('');
    setError('');
    setJustCalculated(false);
  }, []);

  const enterDigit = useCallback((digit: string) => {
    setError('');
    if (display === 'Lỗi') setExpression('');
    setJustCalculated(false);
    if (waitingForOperand || display === '0' || display === 'Lỗi') {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else if (display.replace('-', '').length < 14) {
      setDisplay((current) => current + digit);
    }
  }, [display, waitingForOperand]);

  const enterDecimal = useCallback(() => {
    setError('');
    if (display === 'Lỗi') setExpression('');
    setJustCalculated(false);
    if (waitingForOperand || display === 'Lỗi') {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) setDisplay((current) => `${current}.`);
  }, [display, waitingForOperand]);

  const calculate = (left: number, right: number, op: Operator): number | null => {
    if (op === '+') return left + right;
    if (op === '−') return left - right;
    if (op === '×') return left * right;
    if (right === 0) return null;
    return left / right;
  };

  const chooseOperator = useCallback((nextOperator: Operator) => {
    setError('');
    setJustCalculated(false);
    const input = Number(display);
    if (operator && stored !== null && !waitingForOperand) {
      const result = calculate(stored, input, operator);
      if (result === null) {
        setDisplay('Lỗi');
        setExpression('Không thể chia cho 0');
        setError('Không thể chia cho 0');
        setStored(null);
        setOperator(null);
        setWaitingForOperand(true);
        return;
      }
      const formatted = formatResult(result);
      setDisplay(formatted);
      setStored(result);
      setExpression(`${formatted} ${nextOperator}`);
    } else {
      setStored(input);
      setExpression(`${display} ${nextOperator}`);
    }
    setOperator(nextOperator);
    setWaitingForOperand(true);
  }, [display, operator, stored, waitingForOperand]);

  const equals = useCallback(() => {
    if (operator === null || stored === null || waitingForOperand) return;
    const right = Number(display);
    const result = calculate(stored, right, operator);
    if (result === null) {
      setDisplay('Lỗi');
      setExpression(`${stored} ${operator} ${display} =`);
      setError('Không thể chia cho 0');
      setStored(null);
      setOperator(null);
      setWaitingForOperand(true);
      setJustCalculated(true);
      return;
    }
    const formatted = formatResult(result);
    setExpression(`${stored} ${operator} ${display} =`);
    setDisplay(formatted);
    setStored(null);
    setOperator(null);
    setWaitingForOperand(true);
    setJustCalculated(true);
    setError('');
  }, [display, operator, stored, waitingForOperand]);

  const backspace = useCallback(() => {
    if (error || justCalculated || waitingForOperand) return;
    setDisplay((current) => {
      if (current.length <= 1 || (current.length === 2 && current.startsWith('-'))) return '0';
      return current.slice(0, -1);
    });
  }, [error, justCalculated, waitingForOperand]);

  const press = useCallback((key: string) => {
    if (/^\d$/.test(key)) {
      if (justCalculated && !operator) clear();
      enterDigit(key);
      return;
    }
    if (key === '.' || key === ',') {
      if (justCalculated && !operator) clear();
      enterDecimal();
      return;
    }
    const opMap: Record<string, Operator> = { '+': '+', '-': '−', '*': '×', '/': '÷' };
    if (key in opMap) {
      if (error) return;
      chooseOperator(opMap[key]);
      return;
    }
    if (key === '=' || key === 'Enter') {
      if (!error) equals();
      return;
    }
    if (key === 'Backspace') {
      backspace();
      return;
    }
    if (key === 'Escape' || key === 'Delete') clear();
  }, [backspace, chooseOperator, clear, enterDecimal, enterDigit, equals, error, justCalculated]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const recognized = /^[0-9.+\-*/=,]$/.test(event.key) ||
        ['Enter', 'Backspace', 'Escape', 'Delete'].includes(event.key);
      if (!recognized) return;
      event.preventDefault();
      press(event.key);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [press]);

  const keys: { label: ReactNode; value: string; style: string; test: string; aria?: string }[] = [
    { label: 'AC', value: 'clear', style: 'utility', test: 'button-clear' },
    { label: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 4H8l-5 8 5 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z" /><path d="m18 9-6 6" /><path d="m12 9 6 6" /></svg>, value: 'backspace', style: 'utility', test: 'button-backspace', aria: 'Xóa một chữ số' },
    { label: '÷', value: '/', style: 'operator', test: 'button-divide', aria: 'Chia' },
    { label: '×', value: '*', style: 'operator', test: 'button-multiply', aria: 'Nhân' },
    { label: '7', value: '7', style: 'number', test: 'button-digit-7' },
    { label: '8', value: '8', style: 'number', test: 'button-digit-8' },
    { label: '9', value: '9', style: 'number', test: 'button-digit-9' },
    { label: '−', value: '-', style: 'operator', test: 'button-subtract', aria: 'Trừ' },
    { label: '4', value: '4', style: 'number', test: 'button-digit-4' },
    { label: '5', value: '5', style: 'number', test: 'button-digit-5' },
    { label: '6', value: '6', style: 'number', test: 'button-digit-6' },
    { label: '+', value: '+', style: 'operator', test: 'button-add', aria: 'Cộng' },
    { label: '1', value: '1', style: 'number', test: 'button-digit-1' },
    { label: '2', value: '2', style: 'number', test: 'button-digit-2' },
    { label: '3', value: '3', style: 'number', test: 'button-digit-3' },
  ];

  const keyClass = (style: string) => {
    if (style === 'operator') return `bg-[#e7eee9] text-[#246b5d] hover:bg-[#dce9e1] ${operator && expression.endsWith(operator) ? 'ring-1 ring-[#246b5d]/30' : ''}`;
    if (style === 'utility') return 'bg-[#eeeae0] text-[#53635d] hover:bg-[#e7e1d5]';
    return 'bg-[#f8f6f0] text-[#213a35] hover:bg-white shadow-[0_2px_0_rgba(35,59,53,0.05)]';
  };

  return (
    <main className="calculator-shell min-h-[100dvh] w-full flex items-center justify-center px-4 py-8 sm:px-8">
      <div className="w-full max-w-[410px] animate-[appear_420ms_ease-out_both]">
        <header className="mb-7 flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-[14px] bg-[#246b5d] text-[#fbf8ee] shadow-[0_5px_12px_rgba(36,107,93,0.18)]">
              <Calculator size={19} strokeWidth={1.8} aria-hidden="true" />
            </div>
            <div>
              <p className="text-[15px] font-extrabold tracking-[-0.04em] text-[#203a34]">Tính nhanh</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.17em] text-[#728079]">MÁY TÍNH CƠ BẢN</p>
            </div>
          </div>
          <span className="rounded-full border border-[#d7d4c8] bg-[#f8f6ef]/75 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-[#718078]">SẴN SÀNG</span>
        </header>

        <section className="overflow-hidden rounded-[28px] border border-[#dcd8cb] bg-[#f7f5ee] p-4 shadow-[0_24px_65px_rgba(54,72,62,0.12),0_3px_9px_rgba(54,72,62,0.05)] sm:p-5" aria-label="Máy tính">
          <div className="mb-4 flex min-h-[158px] flex-col justify-between rounded-[20px] border border-[#e4e0d5] bg-[#eeece3] px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.19em] text-[#818981]">KẾT QUẢ</span>
              <span className="size-2 rounded-full bg-[#4c9b78] shadow-[0_0_0_4px_rgba(76,155,120,0.12)]" aria-hidden="true" />
            </div>
            <div className="min-h-[22px] text-right text-[13px] font-medium tracking-wide text-[#8a9189]" data-testid="text-expression" aria-live="polite">
              {error || expression || ' '}
            </div>
            <div className={`display-value min-w-0 overflow-hidden text-right text-[clamp(2.75rem,13vw,4.15rem)] leading-none font-normal text-[#203a34] ${error ? 'text-[#a4473d]' : ''}`} data-testid="text-display" aria-live="polite" aria-atomic="true">
              {display}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2.5 sm:gap-3" aria-label="Bàn phím máy tính">
            {keys.map((key) => (
              <button
                key={key.test}
                type="button"
                data-testid={key.test}
                aria-label={key.aria || (typeof key.label === 'string' ? key.label : undefined)}
                onClick={() => key.value === 'clear' ? clear() : key.value === 'backspace' ? backspace() : press(key.value)}
                className={`key-button flex h-[62px] items-center justify-center rounded-[17px] border border-[#e0ddd2] text-[21px] font-semibold shadow-[0_2px_0_rgba(46,63,54,0.03)] outline-none focus-visible:ring-2 focus-visible:ring-[#246b5d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f5ee] sm:h-[66px] ${keyClass(key.style)} ${key.style === 'utility' ? 'text-[13px] font-bold tracking-[0.03em]' : ''}`}
              >
                {key.label}
              </button>
            ))}
            <button
              type="button"
              data-testid="button-digit-0"
              onClick={() => press('0')}
              className="key-button col-span-2 flex h-[62px] items-center justify-start rounded-[17px] border border-[#e0ddd2] bg-[#f8f6f0] pl-7 text-[21px] font-semibold text-[#213a35] shadow-[0_2px_0_rgba(35,59,53,0.05)] outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-[#246b5d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f5ee] sm:h-[66px]"
            >
              0
            </button>
            <button
              type="button"
              data-testid="button-decimal"
              aria-label="Dấu thập phân"
              onClick={() => press('.')}
              className={`key-button flex h-[62px] items-center justify-center rounded-[17px] border border-[#e0ddd2] text-[21px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#246b5d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f5ee] sm:h-[66px] ${keyClass('number')}`}
            >
              ,
            </button>
            <button
              type="button"
              data-testid="button-equals"
              onClick={() => press('=')}
              className="key-button flex h-[62px] items-center justify-center rounded-[17px] border border-[#246b5d] bg-[#246b5d] text-[23px] font-medium text-[#fbf8ee] shadow-[0_4px_10px_rgba(36,107,93,0.2)] outline-none hover:bg-[#1d5f52] focus-visible:ring-2 focus-visible:ring-[#246b5d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f5ee] sm:h-[66px]"
            >
              =
            </button>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 border-t border-[#e4e0d5] pt-4 text-[11px] text-[#818981]" data-testid="text-keyboard-help">
            <kbd className="rounded border border-[#d9d6cb] bg-[#efede5] px-1.5 py-0.5 font-mono text-[10px] text-[#6c7972]">0–9</kbd>
            <span>Nhập bằng bàn phím</span>
            <span className="mx-0.5 text-[#c0bdb2]">·</span>
            <kbd className="rounded border border-[#d9d6cb] bg-[#efede5] px-1.5 py-0.5 font-mono text-[10px] text-[#6c7972]">Esc</kbd>
            <span>để xóa</span>
          </div>
        </section>
        <p className="mt-5 text-center text-[11px] font-medium tracking-[0.025em] text-[#8b928b]">Đơn giản cho mọi phép tính thường ngày.</p>
      </div>
      <style>{`@keyframes appear { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </main>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
