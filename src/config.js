export const API_KEY = import.meta.env.VITE_HENRIK_KEY; // đặt trong .env, không commit
export const GOLD = '#D4AF37';
export const PURPLE = '#8A2BE2';
export const FALLBACK_IMG = 'https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/smallart.png';

// img: 'AGENT:Jett' = lấy chân dung agent từ valorant-api
export const TEAM = [
  { name: 'MaPhiVu', tag: '1858', region: 'ap', img: 'AGENT:Jett' },
  { name: '59SG 丨 i a m ZP1', tag: 'KTBae', region: 'ap', img: '/image_54064b.jpg' },
  { name: 'Amour sans fin', tag: 'Tngo', region: 'ap', img: '/image_54060d.jpg' },
  { name: 'marty supreme', tag: 'xvx', region: 'ap', img: '/image_5406a2.jpg' },
  { name: 'BuomSoLong', tag: '2803', region: 'ap', img: '/image_5406ca.jpg' },
];

const skin = (id) => `https://media.valorant-api.com/weaponskinlevels/${id}/displayicon.png`;
export const WEAPONS = [
  { name: 'Vandal', img: skin('1e3b6e76-41fb-01fb-9407-74b8dc1c74dd') },
  { name: 'Phantom', img: skin('60fd423b-48c0-f844-3151-5ca1b162fbd6') },
  { name: 'Operator', img: skin('b02c81da-45d2-0941-0f72-7ba22b9b2da0') },
  { name: 'Sheriff', img: skin('6d3c3328-4ce6-10fb-3610-d09618175402') },
];
