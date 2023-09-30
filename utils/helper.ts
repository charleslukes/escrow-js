function randomString(length: number, chars: string) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  }
  
  
  export const randomBytes = (length: number) => {
    var rString = randomString(length, '0123456789abcdefghijklmnopqrstuvwxyz');
    const buf1 = Buffer.from(rString, 'hex');
    return buf1
  }