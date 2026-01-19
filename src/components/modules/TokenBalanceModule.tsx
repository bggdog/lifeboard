import { useEffect, useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';

const TokenBalanceModule = () => {
  const { state } = useApp();
  const [displayBalance, setDisplayBalance] = useState(state.tokenBalance);
  const [isPulsing, setIsPulsing] = useState(false);
  const previousBalanceRef = useRef(state.tokenBalance);

  useEffect(() => {
    if (state.tokenBalance !== previousBalanceRef.current) {
      const difference = state.tokenBalance - previousBalanceRef.current;
      
      // Pulse animation when balance increases
      if (difference > 0) {
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 600);
      }

      // Animate count up/down
      const startBalance = previousBalanceRef.current;
      const endBalance = state.tokenBalance;
      const duration = 500; // ms
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentBalance = Math.round(startBalance + (endBalance - startBalance) * easeOutQuart);
        
        setDisplayBalance(currentBalance);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayBalance(endBalance);
        }
      };

      animate();
      previousBalanceRef.current = state.tokenBalance;
    }
  }, [state.tokenBalance]);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-neutral-600 mb-1">Token Balance</h3>
        <div className="text-3xl font-bold text-neutral-900">
          {displayBalance} <span className="text-2xl">💰</span>
        </div>
      </div>
      <div 
        className={`w-16 h-16 bg-gradient-to-br from-yellow-400/20 to-amber-500/20 rounded-full flex items-center justify-center border-2 border-yellow-300/30 transition-transform duration-300 ${
          isPulsing ? 'animate-pulse-subtle scale-110' : ''
        }`}
      >
        <span className="text-3xl">💰</span>
      </div>
    </div>
  );
};

export default TokenBalanceModule;
