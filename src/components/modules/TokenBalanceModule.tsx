import { useApp } from '../../context/AppContext';

const TokenBalanceModule = () => {
  const { state } = useApp();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-neutral-600 mb-1">Token Balance</h3>
        <div className="text-3xl font-bold text-neutral-900">
          {state.tokenBalance} <span className="text-2xl">💰</span>
        </div>
      </div>
      <div className="w-16 h-16 bg-gradient-to-br from-yellow-400/20 to-amber-500/20 rounded-full flex items-center justify-center border-2 border-yellow-300/30">
        <span className="text-3xl">💰</span>
      </div>
    </div>
  );
};

export default TokenBalanceModule;
