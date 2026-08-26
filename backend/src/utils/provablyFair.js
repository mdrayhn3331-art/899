const crypto = require('crypto');

class ProvablyFair {
  static generateServerSeed() {
    return crypto.randomBytes(32).toString('hex');
  }

  static generateHash(seed) {
    return crypto.createHash('sha256').update(seed).digest('hex');
  }

  static generateResult(serverSeed, clientSeed, nonce) {
    const combined = `${serverSeed}:${clientSeed}:${nonce}`;
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    
    // Convert first 8 characters to decimal
    const result = parseInt(hash.substr(0, 8), 16);
    return result;
  }

  static rollDice(serverSeed, clientSeed, nonce) {
    const result = this.generateResult(serverSeed, clientSeed, nonce);
    const diceRoll = (result % 100) + 1; // 1-100
    return diceRoll;
  }

  static flipCoin(serverSeed, clientSeed, nonce) {
    const result = this.generateResult(serverSeed, clientSeed, nonce);
    return result % 2 === 0 ? 'heads' : 'tails';
  }

  static spinSlots(serverSeed, clientSeed, nonce) {
    const symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣'];
    const reels = [];
    
    for (let i = 0; i < 3; i++) {
      const result = this.generateResult(serverSeed, clientSeed, nonce + i);
      const symbolIndex = result % symbols.length;
      reels.push(symbols[symbolIndex]);
    }
    
    return reels;
  }

  static calculateSlotPayout(reels, betAmount) {
    const [r1, r2, r3] = reels;
    
    // All three match
    if (r1 === r2 && r2 === r3) {
      const multipliers = {
        '7️⃣': 50,
        '💎': 25,
        '🍇': 15,
        '🍊': 10,
        '🍋': 8,
        '🍒': 5
      };
      return betAmount * multipliers[r1];
    }
    
    // Two match
    if (r1 === r2 || r2 === r3 || r1 === r3) {
      return betAmount * 2;
    }
    
    return 0;
  }
}

module.exports = ProvablyFair;
