// Lightweight client-side token store with event emitter pattern
type TokenBalanceListener = (balance: number) => void;

class TokenStore {
  private balance: number = 0;
  private listeners: Set<TokenBalanceListener> = new Set();

  /**
   * Subscribe to token balance changes
   */
  subscribe(listener: TokenBalanceListener): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Set the token balance and notify all listeners
   */
  setBalance(balance: number): void {
    if (this.balance !== balance) {
      this.balance = balance;
      this.notifyListeners();
    }
  }

  /**
   * Get current token balance
   */
  getBalance(): number {
    return this.balance;
  }

  /**
   * Apply a delta to the balance (optimistic update)
   */
  applyDelta(delta: number): void {
    this.balance = Math.max(0, this.balance + delta);
    this.notifyListeners();
  }

  /**
   * Notify all listeners of balance change
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.balance);
      } catch (error) {
        console.error('Error in token balance listener:', error);
      }
    });
  }
}

// Export singleton instance
export const tokenStore = new TokenStore();
