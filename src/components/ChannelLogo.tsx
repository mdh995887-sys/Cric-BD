import React, { useEffect, useState } from 'react';

interface ChannelLogoProps {
  name: string;
  category: string;
  logo?: string;
  mobileImage?: string;
  compact?: boolean;
  className?: string;
}

const getFallbackLogoUrl = (name: string): string | undefined => {
  const n = name.trim().toLowerCase();
  if (n.includes('t sports') || n.includes('t-sports')) return 'https://i.imgur.com/2JzlorD.png';
  if (n.includes('ananda')) return 'https://i.imgur.com/jkbo7Qe.png';
  if (n.includes('asian')) return 'https://i.imgur.com/k2adSjA.png';
  if (n.includes('asports')) return 'https://i.imgur.com/EVJuFRs.png';
  if (n.includes('atn bangla')) return 'https://i.imgur.com/K1HmMRz.png';
  if (n.includes('atn news')) return 'https://i.imgur.com/4qZQKjo.png';
  if (n.includes('bijoy')) return 'https://i.imgur.com/Faetm0C.png';
  if (n.includes('boishakhi')) return 'https://i.imgur.com/gxL05Y4.png';
  if (n.includes('btv world')) return 'https://i.imgur.com/sSnrg7o.png';
  if (n.includes('btv')) return 'https://i.imgur.com/5OE2FDt.png';
  if (n.includes('channel 9')) return 'https://i.imgur.com/Xf5YuoE.png';
  if (n.includes('channel i')) return 'https://i.imgur.com/X0JJlOX.png';
  if (n.includes('dbc')) return 'https://i.imgur.com/Qbt6q4z.png';
  if (n.includes('desh')) return 'https://i.imgur.com/ItrZok1.png';
  if (n.includes('duronto')) return 'https://i.imgur.com/gXsddRK.png';
  if (n.includes('ekattor') || n.includes('ekator')) return 'https://i.imgur.com/zoLwwUK.png';
  if (n.includes('gazi') || n.includes('gtv')) return 'https://i.imgur.com/2Lzhiq6.png';
  if (n.includes('jamuna')) return 'https://www.jamuna.tv/wp-content/themes/jtv-news/img/logo.png';
  if (n.includes('maasranga')) return 'https://i.imgur.com/uVZJMed.png';
  if (n.includes('my tv')) return 'https://i.imgur.com/475qK5T.png';
  if (n.includes('ntv')) return 'https://i.imgur.com/l75bDTx.png';
  if (n.includes('satv') || n.includes('sa tv')) return 'https://i.imgur.com/tL9kxxB.png';
  if (n.includes('deepto')) return 'https://i.imgur.com/F62GUqS.png';
  if (n.includes('willow')) return 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/willow-us.png';
  if (n.includes('zee bangla cinema') || n.includes('zb cinema')) return 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/zee-bangla-cinema-in.png';
  if (n.includes('zee bangla')) return 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/zee-bangla-hd-in.png';
  if (n.includes('star jalsha')) return 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/star-jalsha-hd-in.png';
  if (n.includes('star sports select 1')) return 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/star-sports-select-1-in.png';
  if (n.includes('star sports select 2')) return 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/star-sports-select-2-in.png';
  if (n.includes('star sports 2')) return 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/star-sports-2-in.png';
  if (n.includes('star sports')) return 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/star-sports-1-in.png';
  if (n.includes('sony ten 1')) return 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/sony-ten-1-hd-in.png';
  if (n.includes('sony ten 2')) return 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/sony-ten-2-hd-in.png';
  if (n.includes('sony ten 5')) return 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/sony-ten-5-hd-in.png';
  if (n.includes('geo super')) return 'https://upload.wikimedia.org/wikipedia/en/5/5f/Geo_Super_logo.png';
  if (n.includes('movie bangla') || n.includes('movie banbla')) return 'https://www.jagobd.com/wp-content/uploads/2016/02/moviebangla.jpg?x50681';
  if (n.includes('pogo')) return 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/pogo-in.png';
  if (n.includes('cartoon network')) return 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/cartoon-network-in.png';
  if (n.includes('goldmines')) return 'https://i.imgur.com/oqqChlH.png';
  if (n.includes('star gold')) return 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/star-gold-hd-in.png';
  if (n.includes('star plus')) return 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/star-plus-hd-in.png';
  if (n.includes('star movies')) return 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/star-movies-hd-in.png';
  if (n.includes('colors bangla cinema')) return 'https://jiotvimages.cdn.jio.com/dare_images/images/Colors_Bangla_Cinema.png';
  if (n.includes('colors bangla')) return 'https://jiotvimages.cdn.jio.com/dare_images/images/Colors_Bengali_HD.png';
  if (n.includes('colors')) return 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/india/colors-hd-in.png';
  if (n.includes('sky sports main event')) return 'https://d2n0069hmnqmmx.cloudfront.net/epgdata/1.0/newchanlogos/512/512/skychb1301.png';
  if (n.includes('sky sports news')) return 'https://d2n0069hmnqmmx.cloudfront.net/epgdata/1.0/newchanlogos/512/512/skychb1314.png';
  if (n.includes('sky sports football')) return 'https://d2n0069hmnqmmx.cloudfront.net/epgdata/1.0/newchanlogos/512/512/skychb3838.png';
  if (n.includes('sky sports cricket')) return 'https://d2n0069hmnqmmx.cloudfront.net/epgdata/1.0/newchanlogos/512/512/skychb1302.png';
  if (n.includes('tnt sports')) return 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/tnt-sports-6-uk.png';
  return undefined;
};

// Brand color palette mapped per channel name or keyword
export const ChannelLogo: React.FC<ChannelLogoProps> = ({
  name,
  category,
  logo,
  mobileImage,
  compact = false,
  className = 'w-full h-full',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [logo, mobileImage, name]);

  const cleanName = name.trim().toLowerCase();
  const isRealLogoUrl = (url?: string) =>
    !!url && (url.startsWith('http') || url.startsWith('data:image/')) && !url.includes('placehold.co');
  const resolvedLogo = isRealLogoUrl(logo)
    ? logo
    : isRealLogoUrl(mobileImage)
    ? mobileImage
    : getFallbackLogoUrl(name);
  const resolvedBanner = !compact && isRealLogoUrl(mobileImage) ? mobileImage : undefined;

  // Custom styling profiles for iconic channels
  const getProfile = () => {
    // 1. T Sports (Bangladesh premier sports network)
    if (cleanName.includes('t sports') || cleanName.includes('t-sports')) {
      return {
        bg: 'from-red-700 via-rose-900 to-black',
        textColor: 'text-white',
        badge: 'BANGLADESH',
        tag: 'T SPORTS',
        accent: '#ef4444',
        symbol: 'T SPORTS HD'
      };
    }
    // Geo Super (from Screenshot 2)
    if (cleanName.includes('geo super') || cleanName.includes('geosuper')) {
      return {
        bg: 'from-emerald-700 via-teal-900 to-black',
        textColor: 'text-white',
        badge: 'LIVE SPORTS',
        tag: 'GEO',
        accent: '#10b981',
        symbol: 'GEO SUPER'
      };
    }
    // 2. Star Sports (1, 2, Select)
    if (cleanName.includes('star sports') || cleanName.includes('starsports')) {
      const sub = cleanName.includes('select 1')
        ? 'SELECT 1'
        : cleanName.includes('select 2')
        ? 'SELECT 2'
        : cleanName.includes('2')
        ? 'SPORTS 2'
        : 'SPORTS 1';
      return {
        bg: 'from-blue-700 via-indigo-900 to-slate-950',
        textColor: 'text-amber-300',
        badge: 'LIVE CRICKET',
        tag: 'STAR',
        accent: '#3b82f6',
        symbol: `STAR ${sub}`
      };
    }
    // 3. Sony Ten (1, 2, 5)
    if (cleanName.includes('sony ten') || cleanName.includes('ten 1') || cleanName.includes('ten 2') || cleanName.includes('ten 5')) {
      const num = cleanName.includes('1') ? 'TEN 1' : cleanName.includes('2') ? 'TEN 2' : 'TEN 5';
      return {
        bg: 'from-blue-900 via-cyan-950 to-black',
        textColor: 'text-cyan-300',
        badge: 'LIVE SPORTS HD',
        tag: 'SONY',
        accent: '#06b6d4',
        symbol: `SONY ${num}`
      };
    }
    // Hotstar Live
    if (cleanName.includes('hotstar') || cleanName.includes('hot star')) {
      return {
        bg: 'from-blue-900 via-emerald-950 to-black',
        textColor: 'text-amber-300',
        badge: 'DISNEY+ HOTSTAR',
        tag: 'HOTSTAR',
        accent: '#10b981',
        symbol: 'HOTSTAR LIVE'
      };
    }
    // Bongo Bangla Movies
    if (cleanName.includes('bongo')) {
      return {
        bg: 'from-red-600 via-rose-900 to-black',
        textColor: 'text-white',
        badge: 'BONGO BD MOVIES',
        tag: 'BONGO',
        accent: '#ef4444',
        symbol: 'বইঙ্গো মুভি'
      };
    }
    // Fancode
    if (cleanName.includes('fancode')) {
      return {
        bg: 'from-blue-700 via-indigo-900 to-black',
        textColor: 'text-amber-300',
        badge: 'FANCODE LIVE',
        tag: 'FANCODE',
        accent: '#f59e0b',
        symbol: 'FANCODE'
      };
    }
    // Mwsguy
    if (cleanName.includes('mwsguy')) {
      return {
        bg: 'from-emerald-700 via-teal-900 to-black',
        textColor: 'text-white',
        badge: 'MWSGUY LIVE',
        tag: 'MWSGUY',
        accent: '#10b981',
        symbol: 'MWSGUY'
      };
    }
    // VPLink
    if (cleanName.includes('vplink')) {
      return {
        bg: 'from-amber-600 via-orange-950 to-black',
        textColor: 'text-amber-200',
        badge: 'VPLINK LIVE CRICKET',
        tag: 'VPLINK',
        accent: '#f59e0b',
        symbol: 'VPLINK HD'
      };
    }
    // Hey Lookme
    if (cleanName.includes('hey lookme') || cleanName.includes('hey-lookme') || cleanName.includes('lookme')) {
      return {
        bg: 'from-cyan-700 via-blue-950 to-black',
        textColor: 'text-cyan-200',
        badge: 'HEY LOOKME LIVE',
        tag: 'LOOKME',
        accent: '#06b6d4',
        symbol: 'HEY-LOOKME'
      };
    }
    // G Direct / GTV Direct
    if (cleanName.includes('gtv direct') || cleanName.includes('g direct') || cleanName.includes('g dirig')) {
      return {
        bg: 'from-green-700 via-teal-900 to-black',
        textColor: 'text-emerald-200',
        badge: 'G DIRECT LIVE',
        tag: 'G DIRECT',
        accent: '#22c55e',
        symbol: 'GTV DIRECT'
      };
    }
    // Sky Sports UK
    if (cleanName.includes('sky sports') || cleanName.includes('sky-sports')) {
      const sub = cleanName.includes('main event')
        ? 'MAIN EVENT'
        : cleanName.includes('news')
        ? 'NEWS'
        : cleanName.includes('football')
        ? 'FOOTBALL'
        : cleanName.includes('action')
        ? 'ACTION'
        : cleanName.includes('+') || cleanName.includes('plus')
        ? 'PLUS +'
        : cleanName.includes('cricket')
        ? 'CRICKET'
        : cleanName.includes('play') || cleanName.includes('mix')
        ? 'PLAY'
        : 'LIVE UK';
      return {
        bg: 'from-red-800 via-blue-900 to-black',
        textColor: 'text-white',
        badge: 'UK SKY SPORTS',
        tag: 'SKY',
        accent: '#38bdf8',
        symbol: `SKY ${sub}`
      };
    }
    // TNT Sports UK
    if (cleanName.includes('tnt sports') || cleanName.includes('tnt')) {
      return {
        bg: 'from-fuchsia-800 via-purple-950 to-black',
        textColor: 'text-fuchsia-200',
        badge: 'UK TNT SPORTS',
        tag: 'TNT',
        accent: '#e879f9',
        symbol: 'TNT SPORTS 6'
      };
    }
    // Movie Bangla
    if (cleanName.includes('movie bangla') || cleanName.includes('moviebangla')) {
      return {
        bg: 'from-red-700 via-rose-950 to-black',
        textColor: 'text-yellow-300',
        badge: 'বাংলা মুভি',
        tag: 'MOVIE BANGLA',
        accent: '#f59e0b',
        symbol: 'মুভি বাংলা'
      };
    }
    // Star Movies
    if (cleanName.includes('star movies') || cleanName.includes('starmovies')) {
      return {
        bg: 'from-blue-800 via-indigo-950 to-black',
        textColor: 'text-amber-300',
        badge: 'HOLLYWOOD HD',
        tag: 'STAR',
        accent: '#f59e0b',
        symbol: 'STAR MOVIES'
      };
    }
    // B4U Movies
    if (cleanName.includes('b4u')) {
      return {
        bg: 'from-amber-700 via-red-900 to-black',
        textColor: 'text-amber-200',
        badge: 'HINDI MOVIES',
        tag: 'B4U',
        accent: '#f59e0b',
        symbol: 'B4U MOVIES'
      };
    }
    // Zee Bollywood
    if (cleanName.includes('zee bollywood') || cleanName.includes('zeebollywood')) {
      return {
        bg: 'from-pink-800 via-purple-950 to-black',
        textColor: 'text-pink-200',
        badge: 'BOLLYWOOD 100%',
        tag: 'ZEE',
        accent: '#ec4899',
        symbol: 'ZEE BOLLYWOOD'
      };
    }
    // Goldmines
    if (cleanName.includes('goldmines')) {
      const sub = cleanName.includes('sd') ? 'SD' : cleanName.includes('bollywood') ? 'BOLLYWOOD' : 'MOVIES';
      return {
        bg: 'from-amber-600 via-yellow-800 to-black',
        textColor: 'text-amber-100',
        badge: 'ACTION MOVIES',
        tag: 'GOLDMINES',
        accent: '#f59e0b',
        symbol: `GOLDMINES ${sub}`
      };
    }
    // 5. Star Gold
    if (cleanName.includes('star gold') || cleanName.includes('stargold')) {
      return {
        bg: 'from-amber-600 via-yellow-700 to-red-950',
        textColor: 'text-yellow-200',
        badge: 'BOLLYWOOD BLOCKBUSTERS',
        tag: 'STAR',
        accent: '#f59e0b',
        symbol: 'STAR GOLD'
      };
    }
    // 6. Nat Geo
    if (cleanName.includes('nat geo') || cleanName.includes('natgeo')) {
      return {
        bg: 'from-amber-500 via-stone-900 to-black',
        textColor: 'text-yellow-300',
        badge: 'WILD & NATURE',
        tag: 'NAT GEO',
        accent: '#eab308',
        symbol: 'NAT GEO'
      };
    }
    // 7. Sonic & Nick
    if (cleanName.includes('sonic')) {
      return {
        bg: 'from-orange-600 via-amber-700 to-rose-900',
        textColor: 'text-white',
        badge: 'KIDS TOONS',
        tag: 'SONIC',
        accent: '#f97316',
        symbol: 'SONIC HD'
      };
    }
    if (cleanName.includes('nick')) {
      return {
        bg: 'from-orange-600 via-orange-800 to-slate-950',
        textColor: 'text-white',
        badge: 'CARTOONS',
        tag: 'NICKELODEON',
        accent: '#ea580c',
        symbol: 'NICK'
      };
    }
    // 8. Sony BBC Earth
    if (cleanName.includes('earth') || cleanName.includes('bbc')) {
      return {
        bg: 'from-emerald-700 via-teal-900 to-cyan-950',
        textColor: 'text-emerald-200',
        badge: 'SCIENCE & NATURE',
        tag: 'SONY BBC',
        accent: '#10b981',
        symbol: 'BBC EARTH'
      };
    }
    // 9. MNX HD & Sony Pix
    if (cleanName.includes('mnx')) {
      return {
        bg: 'from-red-800 via-orange-950 to-black',
        textColor: 'text-rose-200',
        badge: 'HOLLYWOOD MOVIES',
        tag: 'MNX',
        accent: '#f43f5e',
        symbol: 'MNX HD'
      };
    }
    if (cleanName.includes('sony pix') || cleanName.includes('pix')) {
      return {
        bg: 'from-purple-900 via-indigo-950 to-black',
        textColor: 'text-purple-200',
        badge: 'MEGA MOVIES',
        tag: 'SONY',
        accent: '#a855f7',
        symbol: 'SONY PIX'
      };
    }
    // 10. Zee TV & Zee Telugu
    if (cleanName.includes('zee telugu')) {
      return {
        bg: 'from-violet-800 via-fuchsia-950 to-slate-950',
        textColor: 'text-violet-200',
        badge: 'TELUGU HD',
        tag: 'ZEE',
        accent: '#c084fc',
        symbol: 'ZEE TELUGU'
      };
    }
    if (cleanName.includes('zee tv') || cleanName.includes('zeetv')) {
      return {
        bg: 'from-purple-800 via-indigo-950 to-slate-950',
        textColor: 'text-purple-200',
        badge: 'HINDI SERIALS',
        tag: 'ZEE',
        accent: '#c084fc',
        symbol: 'ZEE TV'
      };
    }
    // 11. Dangal TV
    if (cleanName.includes('dangal')) {
      return {
        bg: 'from-amber-600 via-red-800 to-slate-950',
        textColor: 'text-amber-200',
        badge: 'HINDI DRAMA',
        tag: 'DANGAL',
        accent: '#f59e0b',
        symbol: 'DANGAL TV'
      };
    }
    // 12. Star Plus, Star Maa, Star Vijay
    if (cleanName.includes('star plus')) {
      return {
        bg: 'from-red-700 via-rose-950 to-slate-950',
        textColor: 'text-white',
        badge: 'FAMILY DRAMA',
        tag: 'STAR',
        accent: '#ef4444',
        symbol: 'STAR PLUS'
      };
    }
    if (cleanName.includes('star maa')) {
      return {
        bg: 'from-indigo-800 via-purple-950 to-slate-950',
        textColor: 'text-indigo-200',
        badge: 'TELUGU ENTERTAINMENT',
        tag: 'STAR',
        accent: '#818cf8',
        symbol: 'STAR MAA'
      };
    }
    if (cleanName.includes('star vijay')) {
      return {
        bg: 'from-blue-700 via-indigo-950 to-slate-950',
        textColor: 'text-sky-200',
        badge: 'TAMIL UK',
        tag: 'STAR',
        accent: '#38bdf8',
        symbol: 'STAR VIJAY'
      };
    }
    // 13. Jio Web / JioTV+
    if (cleanName.includes('jio')) {
      return {
        bg: 'from-blue-600 via-red-700 to-indigo-950',
        textColor: 'text-white',
        badge: 'LIVE PORTAL',
        tag: 'JIO TV',
        accent: '#3b82f6',
        symbol: cleanName.includes('+') ? 'JIOTV+ LIVE' : 'JIO WEB'
      };
    }

    // Existing BD Channels
    if (cleanName.includes('ananda')) {
      return {
        bg: 'from-amber-600 via-rose-600 to-red-700',
        textColor: 'text-amber-100',
        badge: 'আনন্দ',
        tag: 'ANANDA',
        accent: '#f59e0b',
        symbol: 'আনন্দ TV'
      };
    }
    if (cleanName.includes('asian')) {
      return {
        bg: 'from-emerald-700 via-teal-800 to-slate-900',
        textColor: 'text-emerald-100',
        badge: 'এশিয়ান',
        tag: 'ASIAN TV',
        accent: '#10b981',
        symbol: 'ASIAN'
      };
    }
    if (cleanName.includes('willow')) {
      return {
        bg: 'from-red-800 via-red-600 to-rose-900',
        textColor: 'text-white',
        badge: 'CRICKET HD',
        tag: 'WILLOW',
        accent: '#ef4444',
        symbol: 'WILLOW'
      };
    }
    if (cleanName.includes('asports')) {
      return {
        bg: 'from-blue-700 via-indigo-900 to-slate-950',
        textColor: 'text-cyan-200',
        badge: 'LIVE SPORTS',
        tag: 'A SPORTS',
        accent: '#06b6d4',
        symbol: 'A SPORTS'
      };
    }
    if (cleanName.includes('gazi') || cleanName.includes('gtv')) {
      return {
        bg: 'from-green-700 via-emerald-800 to-red-800',
        textColor: 'text-white',
        badge: 'GTV LIVE',
        tag: 'GAZI TV',
        accent: '#22c55e',
        symbol: 'GTV'
      };
    }
    if (cleanName.includes('atn bangla')) {
      return {
        bg: 'from-red-700 via-red-900 to-slate-950',
        textColor: 'text-amber-300',
        badge: 'বাংলা',
        tag: 'ATN',
        accent: '#f59e0b',
        symbol: 'ATN BANGLA'
      };
    }
    if (cleanName.includes('atn news')) {
      return {
        bg: 'from-sky-700 via-blue-900 to-slate-900',
        textColor: 'text-white',
        badge: '24/7 NEWS',
        tag: 'NEWS',
        accent: '#38bdf8',
        symbol: 'ATN NEWS'
      };
    }
    if (cleanName.includes('btv world') || cleanName.includes('btv')) {
      return {
        bg: 'from-emerald-800 via-green-900 to-red-900',
        textColor: 'text-emerald-200',
        badge: 'NATIONAL TV',
        tag: 'BTV',
        accent: '#10b981',
        symbol: cleanName.includes('world') ? 'BTV WORLD' : 'BTV'
      };
    }
    if (cleanName.includes('channel 9')) {
      return {
        bg: 'from-purple-800 via-indigo-900 to-blue-950',
        textColor: 'text-purple-200',
        badge: 'HD',
        tag: 'CH 9',
        accent: '#a855f7',
        symbol: 'CHANNEL 9'
      };
    }
    if (cleanName.includes('channel i')) {
      return {
        bg: 'from-emerald-700 via-teal-800 to-green-900',
        textColor: 'text-emerald-100',
        badge: 'হৃদয়ে বাংলাদেশ',
        tag: 'CHANNEL I',
        accent: '#34d399',
        symbol: 'CHANNEL I'
      };
    }
    if (cleanName.includes('dbc')) {
      return {
        bg: 'from-rose-800 via-red-950 to-slate-950',
        textColor: 'text-rose-200',
        badge: 'সংবাদ',
        tag: 'DBC',
        accent: '#f43f5e',
        symbol: 'DBC NEWS'
      };
    }
    if (cleanName.includes('ekattor') || cleanName.includes('ekator')) {
      return {
        bg: 'from-red-700 via-rose-900 to-black',
        textColor: 'text-white',
        badge: '৭১ সংবাদ',
        tag: 'EKATTOR',
        accent: '#e11d48',
        symbol: 'EKATTOR 71'
      };
    }
    if (cleanName.includes('satv') || cleanName.includes('sa tv')) {
      return {
        bg: 'from-red-800 via-rose-950 to-amber-950',
        textColor: 'text-amber-200',
        badge: 'এসএ টিভি',
        tag: 'SA TV',
        accent: '#f59e0b',
        symbol: 'SA TV'
      };
    }
    if (cleanName.includes('deepto') || cleanName.includes('deepto tv')) {
      return {
        bg: 'from-orange-600 via-amber-800 to-red-950',
        textColor: 'text-white',
        badge: 'দীপ্ত টিভি',
        tag: 'DEEPTO',
        accent: '#f97316',
        symbol: 'DEEPTO TV'
      };
    }
    if (cleanName.includes('maasranga')) {
      return {
        bg: 'from-cyan-700 via-blue-900 to-slate-950',
        textColor: 'text-cyan-200',
        badge: 'মাছরাঙা',
        tag: 'MAASRANGA',
        accent: '#06b6d4',
        symbol: 'MAASRANGA'
      };
    }
    if (cleanName.includes('bdix server') || cleanName.includes('bdix')) {
      return {
        bg: 'from-emerald-700 via-teal-900 to-black',
        textColor: 'text-emerald-200',
        badge: 'BDIX ♐✨✔️',
        tag: 'BDIX',
        accent: '#10b981',
        symbol: 'BDIX SERVER'
      };
    }
    if (cleanName.includes('jamuna')) {
      return {
        bg: 'from-blue-700 via-sky-900 to-slate-950',
        textColor: 'text-sky-200',
        badge: 'যমুনা ২৪',
        tag: 'JAMUNA',
        accent: '#38bdf8',
        symbol: 'JAMUNA TV'
      };
    }
    if (cleanName.includes('duronto')) {
      return {
        bg: 'from-amber-500 via-orange-600 to-rose-700',
        textColor: 'text-yellow-100',
        badge: 'দূরন্ত',
        tag: 'KIDS TV',
        accent: '#f59e0b',
        symbol: 'দুরন্ত TV'
      };
    }
    if (cleanName.includes('zee bangla')) {
      return {
        bg: 'from-purple-700 via-violet-900 to-slate-950',
        textColor: 'text-purple-200',
        badge: 'বাংলা এইচডি',
        tag: 'ZEE',
        accent: '#c084fc',
        symbol: 'ZEE BANGLA'
      };
    }
    if (cleanName.includes('goldmines')) {
      return {
        bg: 'from-amber-600 via-yellow-700 to-slate-950',
        textColor: 'text-yellow-200',
        badge: 'MOVIES HD',
        tag: 'GOLDMINES',
        accent: '#eab308',
        symbol: cleanName.includes('2') ? 'GOLDMINES 2' : 'GOLDMINES'
      };
    }
    if (cleanName.includes('star jalsha') || cleanName.includes('jalsha')) {
      return {
        bg: 'from-rose-700 via-red-900 to-slate-950',
        textColor: 'text-rose-100',
        badge: 'জলসা এইচডি',
        tag: 'STAR',
        accent: '#f43f5e',
        symbol: 'স্টার জলসা'
      };
    }
    if (cleanName.includes('colors')) {
      return {
        bg: 'from-fuchsia-700 via-purple-900 to-indigo-950',
        textColor: 'text-fuchsia-200',
        badge: 'COLORS HD',
        tag: 'COLORS',
        accent: '#d946ef',
        symbol: cleanName.includes('mena') ? 'COLORS MENA' : 'COLORS HD'
      };
    }

    // Default category fallback
    if (category.toLowerCase() === 'cricket' || category.toLowerCase() === 'sports') {
      return {
        bg: 'from-emerald-800 via-teal-900 to-slate-950',
        textColor: 'text-emerald-200',
        badge: 'SPORTS',
        tag: 'LIVE HD',
        accent: '#10b981',
        symbol: name.toUpperCase()
      };
    }
    if (category.toLowerCase() === 'news') {
      return {
        bg: 'from-red-800 via-slate-900 to-slate-950',
        textColor: 'text-red-200',
        badge: 'NEWS 24',
        tag: 'LIVE',
        accent: '#ef4444',
        symbol: name.toUpperCase()
      };
    }

    return {
      bg: 'from-slate-800 via-zinc-900 to-black',
      textColor: 'text-slate-200',
      badge: 'TV',
      tag: category.toUpperCase(),
      accent: '#64748b',
      symbol: name.toUpperCase()
    };
  };

  const profile = getProfile();

  if (resolvedLogo && !imgFailed) {
    if (compact) {
      return (
        <div
          className={`relative flex items-center justify-center bg-white/95 p-0.5 overflow-hidden border border-white/15 shadow-sm ${className}`}
        >
          <img
            src={resolvedLogo}
            alt={name}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-contain"
          />
        </div>
      );
    }

    return (
      <div
        className={`relative flex items-center justify-center px-2 py-1.5 bg-gradient-to-br ${profile.bg} overflow-hidden ${className}`}
      >
        {resolvedBanner && (
          <img
            src={resolvedBanner}
            alt=""
            referrerPolicy="no-referrer"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
        )}
        <div className="relative z-10 h-10 w-16 sm:h-11 sm:w-20 rounded-md bg-white/95 p-1 shadow-md flex items-center justify-center">
          <img
            src={resolvedLogo}
            alt={name}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div
        className={`relative flex items-center justify-center p-0.5 bg-gradient-to-br ${profile.bg} overflow-hidden ${className}`}
      >
        <span
          className={`text-[8px] font-black tracking-tight uppercase text-center leading-none ${profile.textColor} truncate px-0.5`}
        >
          {profile.tag}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col items-center justify-center p-2 bg-gradient-to-br ${profile.bg} overflow-hidden ${className}`}>
      {/* Background ambient pattern */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:10px_10px]" />

      {/* Center Channel Brand Symbol */}
      <div className="text-center z-10 px-1 my-auto">
        <div className={`text-xs sm:text-sm font-black tracking-wider uppercase drop-shadow-md ${profile.textColor} font-['Teko',sans-serif] leading-tight`}>
          {profile.symbol}
        </div>
        <div className="text-[8px] text-white/60 font-semibold tracking-wider uppercase">
          {profile.badge}
        </div>
      </div>
    </div>
  );
};

