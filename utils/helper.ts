function randomString(length: number, chars: string) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  }
  
  
  export const randomBytes = (length: number) => {
    let rString = randomString(length, '0123456789abcdefghijklmnopqrstuvwxyz');
    const buf1 = Buffer.from(rString, 'hex');
    return buf1
  }

  export function randomU64(): number {
    // JavaScript's Number can represent integers accurately up to 2^53 - 1.
    // So, we'll generate two 32-bit numbers and combine them to simulate a 64-bit number.
    const upper = Math.floor(Math.random() * 0x100000000); // Random 32-bit number
    const lower = Math.floor(Math.random() * 0x100000000); // Random 32-bit number

    // Combine the two 32-bit numbers
    return upper * 0x100000000 + lower;
}
