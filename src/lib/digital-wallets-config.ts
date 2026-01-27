/**
 * Digital Wallets & Banks Configuration
 * Country-based payment support with official branding
 * Supports 27+ countries with real bank/wallet logos
 */

export type AccountType = 'bank' | 'digital_wallet' | 'crypto';
export type AddAccountStep = 'country' | 'type' | 'bank' | 'wallet' | 'details';

export interface Country {
  code: string;
  name: string;
  flag: string;
  position: number;
  currency: string;
  tier: 'top' | 'second' | 'third';
}

export interface Bank {
  code: string;
  name: string;
  logo: string;
  color: string;
}

export interface DigitalWallet {
  code: string;
  label: string;
  logo: string;
  color: string;
  bgColor: string;
  inputLabel: string;
  placeholder: string;
}

export interface AccountTypeConfig {
  code: AccountType;
  label: string;
  icon: string;
  description: string;
  previewLogos: string[];
}

// All 27+ countries sorted by priority (freelancer countries first)
export const SUPPORTED_COUNTRIES: Country[] = [
  // TOP TIER (1-6) - Major freelancer countries
  { code: 'US', name: 'United States', flag: 'https://flagcdn.com/w80/us.png', position: 1, currency: 'USD', tier: 'top' },
  { code: 'BD', name: 'Bangladesh', flag: 'https://flagcdn.com/w80/bd.png', position: 2, currency: 'BDT', tier: 'top' },
  { code: 'IN', name: 'India', flag: 'https://flagcdn.com/w80/in.png', position: 3, currency: 'INR', tier: 'top' },
  { code: 'PK', name: 'Pakistan', flag: 'https://flagcdn.com/w80/pk.png', position: 4, currency: 'PKR', tier: 'top' },
  { code: 'GB', name: 'United Kingdom', flag: 'https://flagcdn.com/w80/gb.png', position: 5, currency: 'GBP', tier: 'top' },
  { code: 'CA', name: 'Canada', flag: 'https://flagcdn.com/w80/ca.png', position: 6, currency: 'CAD', tier: 'top' },
  
  // SECOND TIER (7-15)
  { code: 'EU', name: 'European Union', flag: 'https://flagcdn.com/w80/eu.png', position: 7, currency: 'EUR', tier: 'second' },
  { code: 'AU', name: 'Australia', flag: 'https://flagcdn.com/w80/au.png', position: 8, currency: 'AUD', tier: 'second' },
  { code: 'AE', name: 'UAE', flag: 'https://flagcdn.com/w80/ae.png', position: 9, currency: 'AED', tier: 'second' },
  { code: 'SA', name: 'Saudi Arabia', flag: 'https://flagcdn.com/w80/sa.png', position: 10, currency: 'SAR', tier: 'second' },
  { code: 'NG', name: 'Nigeria', flag: 'https://flagcdn.com/w80/ng.png', position: 11, currency: 'NGN', tier: 'second' },
  { code: 'PH', name: 'Philippines', flag: 'https://flagcdn.com/w80/ph.png', position: 12, currency: 'PHP', tier: 'second' },
  { code: 'ID', name: 'Indonesia', flag: 'https://flagcdn.com/w80/id.png', position: 13, currency: 'IDR', tier: 'second' },
  { code: 'MY', name: 'Malaysia', flag: 'https://flagcdn.com/w80/my.png', position: 14, currency: 'MYR', tier: 'second' },
  { code: 'VN', name: 'Vietnam', flag: 'https://flagcdn.com/w80/vn.png', position: 15, currency: 'VND', tier: 'second' },
  
  // THIRD TIER (16-27)
  { code: 'TH', name: 'Thailand', flag: 'https://flagcdn.com/w80/th.png', position: 16, currency: 'THB', tier: 'third' },
  { code: 'EG', name: 'Egypt', flag: 'https://flagcdn.com/w80/eg.png', position: 17, currency: 'EGP', tier: 'third' },
  { code: 'KE', name: 'Kenya', flag: 'https://flagcdn.com/w80/ke.png', position: 18, currency: 'KES', tier: 'third' },
  { code: 'ZA', name: 'South Africa', flag: 'https://flagcdn.com/w80/za.png', position: 19, currency: 'ZAR', tier: 'third' },
  { code: 'BR', name: 'Brazil', flag: 'https://flagcdn.com/w80/br.png', position: 20, currency: 'BRL', tier: 'third' },
  { code: 'MX', name: 'Mexico', flag: 'https://flagcdn.com/w80/mx.png', position: 21, currency: 'MXN', tier: 'third' },
  { code: 'NP', name: 'Nepal', flag: 'https://flagcdn.com/w80/np.png', position: 22, currency: 'NPR', tier: 'third' },
  { code: 'LK', name: 'Sri Lanka', flag: 'https://flagcdn.com/w80/lk.png', position: 23, currency: 'LKR', tier: 'third' },
  { code: 'JP', name: 'Japan', flag: 'https://flagcdn.com/w80/jp.png', position: 24, currency: 'JPY', tier: 'third' },
  { code: 'KR', name: 'South Korea', flag: 'https://flagcdn.com/w80/kr.png', position: 25, currency: 'KRW', tier: 'third' },
  { code: 'SG', name: 'Singapore', flag: 'https://flagcdn.com/w80/sg.png', position: 26, currency: 'SGD', tier: 'third' },
  { code: 'CH', name: 'Switzerland', flag: 'https://flagcdn.com/w80/ch.png', position: 27, currency: 'CHF', tier: 'third' },
  
  // DEFAULT for unlisted countries
  { code: 'DEFAULT', name: 'Other Countries', flag: 'https://cdn-icons-png.flaticon.com/512/814/814513.png', position: 99, currency: 'USD', tier: 'third' }
];

// Account type categories with preview logos
export const ACCOUNT_TYPES: AccountTypeConfig[] = [
  {
    code: 'bank',
    label: 'Bank Account',
    icon: 'bank',
    description: 'Traditional bank transfer',
    previewLogos: [
      'https://logo.clearbit.com/chase.com',
      'https://logo.clearbit.com/hdfcbank.com',
      'https://logo.clearbit.com/barclays.co.uk'
    ]
  },
  {
    code: 'digital_wallet',
    label: 'Digital Wallet',
    icon: 'wallet',
    description: 'Mobile money & e-wallets',
    previewLogos: [
      'https://logo.clearbit.com/paypal.com',
      'https://logo.clearbit.com/wise.com',
      'https://logo.clearbit.com/venmo.com'
    ]
  },
  {
    code: 'crypto',
    label: 'Crypto',
    icon: 'crypto',
    description: 'Cryptocurrency wallet',
    previewLogos: [
      'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
      'https://cryptologos.cc/logos/tether-usdt-logo.png',
      'https://cryptologos.cc/logos/ethereum-eth-logo.png'
    ]
  }
];

// Comprehensive bank lists per country with official logos
export const COUNTRY_BANKS: Record<string, Bank[]> = {
  // USA Banks
  US: [
    { code: 'chase', name: 'Chase', logo: 'https://logo.clearbit.com/chase.com', color: '#117ACA' },
    { code: 'bofa', name: 'Bank of America', logo: 'https://logo.clearbit.com/bankofamerica.com', color: '#012169' },
    { code: 'wellsfargo', name: 'Wells Fargo', logo: 'https://logo.clearbit.com/wellsfargo.com', color: '#D71E28' },
    { code: 'citi', name: 'Citibank', logo: 'https://logo.clearbit.com/citi.com', color: '#003B70' },
    { code: 'usbank', name: 'U.S. Bank', logo: 'https://logo.clearbit.com/usbank.com', color: '#0C2074' },
    { code: 'pnc', name: 'PNC Bank', logo: 'https://logo.clearbit.com/pnc.com', color: '#FF5800' },
    { code: 'capital_one', name: 'Capital One', logo: 'https://logo.clearbit.com/capitalone.com', color: '#004879' },
    { code: 'td_us', name: 'TD Bank', logo: 'https://logo.clearbit.com/td.com', color: '#34A853' },
  ],
  
  // Bangladesh Banks
  BD: [
    { code: 'brac', name: 'BRAC Bank', logo: 'https://logo.clearbit.com/bracbank.com', color: '#003366' },
    { code: 'dbbl', name: 'Dutch-Bangla Bank', logo: 'https://logo.clearbit.com/dutchbanglabank.com', color: '#00843D' },
    { code: 'ebl', name: 'Eastern Bank', logo: 'https://logo.clearbit.com/ebl.com.bd', color: '#005BAC' },
    { code: 'city', name: 'City Bank', logo: 'https://logo.clearbit.com/thecitybank.com', color: '#ED1C24' },
    { code: 'prime', name: 'Prime Bank', logo: 'https://logo.clearbit.com/primebank.com.bd', color: '#00529B' },
    { code: 'islami', name: 'Islami Bank Bangladesh', logo: 'https://logo.clearbit.com/islamibankbd.com', color: '#00594F' },
    { code: 'pubali', name: 'Pubali Bank', logo: 'https://logo.clearbit.com/pubalibankbd.com', color: '#00467F' },
    { code: 'mtb', name: 'Mutual Trust Bank', logo: 'https://logo.clearbit.com/mutualtrustbank.com', color: '#0072BC' },
    { code: 'ucb', name: 'United Commercial Bank', logo: 'https://logo.clearbit.com/ucb.com.bd', color: '#003366' },
    { code: 'sonali', name: 'Sonali Bank', logo: 'https://logo.clearbit.com/sonalibank.com.bd', color: '#CD212A' },
    { code: 'janata', name: 'Janata Bank', logo: 'https://logo.clearbit.com/jb.com.bd', color: '#1D4F91' },
    { code: 'scbd', name: 'Standard Chartered BD', logo: 'https://logo.clearbit.com/sc.com', color: '#0072AA' },
  ],
  
  // India Banks
  IN: [
    { code: 'sbi', name: 'State Bank of India', logo: 'https://logo.clearbit.com/sbi.co.in', color: '#22409A' },
    { code: 'hdfc', name: 'HDFC Bank', logo: 'https://logo.clearbit.com/hdfcbank.com', color: '#004C8F' },
    { code: 'icici', name: 'ICICI Bank', logo: 'https://logo.clearbit.com/icicibank.com', color: '#F58220' },
    { code: 'axis', name: 'Axis Bank', logo: 'https://logo.clearbit.com/axisbank.com', color: '#800000' },
    { code: 'kotak', name: 'Kotak Mahindra Bank', logo: 'https://logo.clearbit.com/kotak.com', color: '#ED1C24' },
    { code: 'pnb', name: 'Punjab National Bank', logo: 'https://logo.clearbit.com/pnbindia.in', color: '#EA5B0C' },
    { code: 'bob', name: 'Bank of Baroda', logo: 'https://logo.clearbit.com/bankofbaroda.in', color: '#F47920' },
    { code: 'canara', name: 'Canara Bank', logo: 'https://logo.clearbit.com/canarabank.com', color: '#F9A61A' },
    { code: 'yes', name: 'Yes Bank', logo: 'https://logo.clearbit.com/yesbank.in', color: '#00518F' },
    { code: 'indusind', name: 'IndusInd Bank', logo: 'https://logo.clearbit.com/indusind.com', color: '#880A1F' },
  ],
  
  // Pakistan Banks
  PK: [
    { code: 'hbl', name: 'Habib Bank Limited', logo: 'https://logo.clearbit.com/hbl.com', color: '#00843D' },
    { code: 'ubl', name: 'United Bank Limited', logo: 'https://logo.clearbit.com/ubl.com.pk', color: '#003366' },
    { code: 'mcb', name: 'MCB Bank', logo: 'https://logo.clearbit.com/mcb.com.pk', color: '#00529B' },
    { code: 'alfalah', name: 'Bank Alfalah', logo: 'https://logo.clearbit.com/bankalfalah.com', color: '#E31837' },
    { code: 'nbp', name: 'National Bank of Pakistan', logo: 'https://logo.clearbit.com/nbp.com.pk', color: '#003366' },
    { code: 'meezan', name: 'Meezan Bank', logo: 'https://logo.clearbit.com/meezanbank.com', color: '#00843D' },
    { code: 'faysal', name: 'Faysal Bank', logo: 'https://logo.clearbit.com/faysalbank.com', color: '#00529B' },
  ],
  
  // UK Banks
  GB: [
    { code: 'barclays', name: 'Barclays', logo: 'https://logo.clearbit.com/barclays.co.uk', color: '#00AEEF' },
    { code: 'hsbc_uk', name: 'HSBC UK', logo: 'https://logo.clearbit.com/hsbc.co.uk', color: '#DB0011' },
    { code: 'lloyds', name: 'Lloyds Bank', logo: 'https://logo.clearbit.com/lloydsbank.com', color: '#024731' },
    { code: 'natwest', name: 'NatWest', logo: 'https://logo.clearbit.com/natwest.com', color: '#5B0069' },
    { code: 'santander_uk', name: 'Santander UK', logo: 'https://logo.clearbit.com/santander.co.uk', color: '#EC0000' },
    { code: 'rbs', name: 'RBS', logo: 'https://logo.clearbit.com/rbs.co.uk', color: '#002E5E' },
  ],
  
  // Canada Banks
  CA: [
    { code: 'td_ca', name: 'TD Bank', logo: 'https://logo.clearbit.com/td.com', color: '#34A853' },
    { code: 'rbc', name: 'RBC', logo: 'https://logo.clearbit.com/rbc.com', color: '#0051A5' },
    { code: 'scotiabank', name: 'Scotiabank', logo: 'https://logo.clearbit.com/scotiabank.com', color: '#EC111A' },
    { code: 'bmo', name: 'BMO', logo: 'https://logo.clearbit.com/bmo.com', color: '#0079C1' },
    { code: 'cibc', name: 'CIBC', logo: 'https://logo.clearbit.com/cibc.com', color: '#C41F3E' },
  ],
  
  // EU Banks
  EU: [
    { code: 'deutsche', name: 'Deutsche Bank', logo: 'https://logo.clearbit.com/db.com', color: '#001E64' },
    { code: 'bnp', name: 'BNP Paribas', logo: 'https://logo.clearbit.com/bnpparibas.com', color: '#00915A' },
    { code: 'ing', name: 'ING', logo: 'https://logo.clearbit.com/ing.com', color: '#FF6200' },
    { code: 'n26', name: 'N26', logo: 'https://logo.clearbit.com/n26.com', color: '#36A18B' },
  ],
  
  // Australia Banks
  AU: [
    { code: 'commbank', name: 'CommBank', logo: 'https://logo.clearbit.com/commbank.com.au', color: '#FFCC00' },
    { code: 'anz', name: 'ANZ', logo: 'https://logo.clearbit.com/anz.com.au', color: '#007DBA' },
    { code: 'westpac', name: 'Westpac', logo: 'https://logo.clearbit.com/westpac.com.au', color: '#DA1710' },
    { code: 'nab', name: 'NAB', logo: 'https://logo.clearbit.com/nab.com.au', color: '#C8102E' },
  ],
  
  // UAE Banks
  AE: [
    { code: 'emirates_nbd', name: 'Emirates NBD', logo: 'https://logo.clearbit.com/emiratesnbd.com', color: '#002E5D' },
    { code: 'adcb', name: 'ADCB', logo: 'https://logo.clearbit.com/adcb.com', color: '#0D6AB8' },
    { code: 'fab', name: 'FAB', logo: 'https://logo.clearbit.com/bankfab.com', color: '#003D6B' },
    { code: 'mashreq', name: 'Mashreq', logo: 'https://logo.clearbit.com/mashreq.com', color: '#E4002B' },
  ],
  
  // Saudi Arabia Banks
  SA: [
    { code: 'alrajhi', name: 'Al Rajhi Bank', logo: 'https://logo.clearbit.com/alrajhibank.com.sa', color: '#0062A7' },
    { code: 'snb', name: 'SNB', logo: 'https://logo.clearbit.com/snb.com.sa', color: '#003A6E' },
    { code: 'riyad', name: 'Riyad Bank', logo: 'https://logo.clearbit.com/riyadbank.com', color: '#002E5D' },
    { code: 'sabb', name: 'SABB', logo: 'https://logo.clearbit.com/sabb.com', color: '#DB0011' },
  ],
  
  // Nigeria Banks
  NG: [
    { code: 'gtbank', name: 'GTBank', logo: 'https://logo.clearbit.com/gtbank.com', color: '#E04403' },
    { code: 'firstbank', name: 'First Bank', logo: 'https://logo.clearbit.com/firstbanknigeria.com', color: '#003366' },
    { code: 'zenith', name: 'Zenith Bank', logo: 'https://logo.clearbit.com/zenithbank.com', color: '#E60000' },
    { code: 'access', name: 'Access Bank', logo: 'https://logo.clearbit.com/accessbankplc.com', color: '#FF6600' },
  ],
  
  // Philippines Banks
  PH: [
    { code: 'bdo', name: 'BDO', logo: 'https://logo.clearbit.com/bdo.com.ph', color: '#003399' },
    { code: 'bpi', name: 'BPI', logo: 'https://logo.clearbit.com/bpi.com.ph', color: '#A81C1E' },
    { code: 'metrobank', name: 'Metrobank', logo: 'https://logo.clearbit.com/metrobank.com.ph', color: '#0047AB' },
    { code: 'unionbank_ph', name: 'UnionBank', logo: 'https://logo.clearbit.com/unionbankph.com', color: '#F26522' },
  ],
  
  // Indonesia Banks
  ID: [
    { code: 'bca', name: 'BCA', logo: 'https://logo.clearbit.com/bca.co.id', color: '#003399' },
    { code: 'mandiri', name: 'Bank Mandiri', logo: 'https://logo.clearbit.com/bankmandiri.co.id', color: '#003768' },
    { code: 'bni', name: 'BNI', logo: 'https://logo.clearbit.com/bni.co.id', color: '#FF6600' },
    { code: 'bri', name: 'BRI', logo: 'https://logo.clearbit.com/bri.co.id', color: '#0033A0' },
  ],
  
  // Malaysia Banks
  MY: [
    { code: 'maybank', name: 'Maybank', logo: 'https://logo.clearbit.com/maybank.com', color: '#FFCC00' },
    { code: 'cimb', name: 'CIMB', logo: 'https://logo.clearbit.com/cimb.com', color: '#EC1C24' },
    { code: 'publicbank', name: 'Public Bank', logo: 'https://logo.clearbit.com/pbebank.com', color: '#ED1D24' },
  ],
  
  // Vietnam Banks
  VN: [
    { code: 'vietcombank', name: 'Vietcombank', logo: 'https://logo.clearbit.com/vietcombank.com.vn', color: '#006A4D' },
    { code: 'techcombank', name: 'Techcombank', logo: 'https://logo.clearbit.com/techcombank.com.vn', color: '#ED1C24' },
    { code: 'bidv', name: 'BIDV', logo: 'https://logo.clearbit.com/bidv.com.vn', color: '#0F4C81' },
  ],
  
  // Thailand Banks
  TH: [
    { code: 'bangkok_bank', name: 'Bangkok Bank', logo: 'https://logo.clearbit.com/bangkokbank.com', color: '#004C97' },
    { code: 'kasikorn', name: 'Kasikorn Bank', logo: 'https://logo.clearbit.com/kasikornbank.com', color: '#138F2D' },
    { code: 'scb_th', name: 'SCB', logo: 'https://logo.clearbit.com/scb.co.th', color: '#4E2A8E' },
  ],
  
  // Egypt Banks
  EG: [
    { code: 'cib_eg', name: 'CIB', logo: 'https://logo.clearbit.com/cibeg.com', color: '#003366' },
    { code: 'nbe', name: 'NBE', logo: 'https://logo.clearbit.com/nbe.com.eg', color: '#00A651' },
    { code: 'banquemisr', name: 'Banque Misr', logo: 'https://logo.clearbit.com/banquemisr.com', color: '#C8102E' },
  ],
  
  // Kenya Banks
  KE: [
    { code: 'equity_ke', name: 'Equity Bank', logo: 'https://logo.clearbit.com/equitybankgroup.com', color: '#A6192E' },
    { code: 'kcb', name: 'KCB', logo: 'https://logo.clearbit.com/kcbgroup.com', color: '#00A651' },
    { code: 'coop_ke', name: 'Co-operative Bank', logo: 'https://logo.clearbit.com/co-opbank.co.ke', color: '#006B3C' },
  ],
  
  // South Africa Banks
  ZA: [
    { code: 'standardbank', name: 'Standard Bank', logo: 'https://logo.clearbit.com/standardbank.co.za', color: '#0033A1' },
    { code: 'fnb', name: 'FNB', logo: 'https://logo.clearbit.com/fnb.co.za', color: '#009A44' },
    { code: 'absa', name: 'ABSA', logo: 'https://logo.clearbit.com/absa.co.za', color: '#AF0000' },
    { code: 'nedbank', name: 'Nedbank', logo: 'https://logo.clearbit.com/nedbank.co.za', color: '#00633F' },
  ],
  
  // Brazil Banks
  BR: [
    { code: 'itau', name: 'Itaú', logo: 'https://logo.clearbit.com/itau.com.br', color: '#EC7000' },
    { code: 'bradesco', name: 'Bradesco', logo: 'https://logo.clearbit.com/bradesco.com.br', color: '#CC092F' },
    { code: 'nubank', name: 'Nubank', logo: 'https://logo.clearbit.com/nubank.com.br', color: '#820AD1' },
    { code: 'santander_br', name: 'Santander', logo: 'https://logo.clearbit.com/santander.com.br', color: '#EC0000' },
  ],
  
  // Mexico Banks
  MX: [
    { code: 'bbva_mx', name: 'BBVA México', logo: 'https://logo.clearbit.com/bbva.mx', color: '#004481' },
    { code: 'banamex', name: 'Banamex', logo: 'https://logo.clearbit.com/banamex.com', color: '#004990' },
    { code: 'santander_mx', name: 'Santander MX', logo: 'https://logo.clearbit.com/santander.com.mx', color: '#EC0000' },
  ],
  
  // Nepal Banks
  NP: [
    { code: 'nepalbank', name: 'Nepal Bank', logo: 'https://logo.clearbit.com/nepalbank.com.np', color: '#1E3A5F' },
    { code: 'nicasia', name: 'NIC Asia', logo: 'https://logo.clearbit.com/nicasiabank.com', color: '#E31E25' },
    { code: 'nabil', name: 'Nabil Bank', logo: 'https://logo.clearbit.com/nabilbank.com', color: '#003B71' },
  ],
  
  // Sri Lanka Banks
  LK: [
    { code: 'combank_lk', name: 'Commercial Bank', logo: 'https://logo.clearbit.com/combank.net', color: '#00529B' },
    { code: 'peoplesbank_lk', name: "People's Bank", logo: 'https://logo.clearbit.com/peoplesbank.lk', color: '#D91E18' },
    { code: 'hnb', name: 'HNB', logo: 'https://logo.clearbit.com/hnb.net', color: '#008B48' },
  ],
  
  // Japan Banks
  JP: [
    { code: 'mufg', name: 'MUFG', logo: 'https://logo.clearbit.com/mufg.jp', color: '#D50032' },
    { code: 'mizuho', name: 'Mizuho', logo: 'https://logo.clearbit.com/mizuhogroup.com', color: '#003399' },
    { code: 'smbc', name: 'SMBC', logo: 'https://logo.clearbit.com/smbc.co.jp', color: '#00A84F' },
  ],
  
  // South Korea Banks
  KR: [
    { code: 'kbkookmin', name: 'KB Kookmin', logo: 'https://logo.clearbit.com/kbstar.com', color: '#FFCC00' },
    { code: 'shinhan', name: 'Shinhan', logo: 'https://logo.clearbit.com/shinhan.com', color: '#0046FF' },
    { code: 'woori', name: 'Woori', logo: 'https://logo.clearbit.com/wooribank.com', color: '#0075C9' },
  ],
  
  // Singapore Banks
  SG: [
    { code: 'dbs', name: 'DBS', logo: 'https://logo.clearbit.com/dbs.com.sg', color: '#D50032' },
    { code: 'ocbc', name: 'OCBC', logo: 'https://logo.clearbit.com/ocbc.com', color: '#E31837' },
    { code: 'uob', name: 'UOB', logo: 'https://logo.clearbit.com/uob.com.sg', color: '#0033A1' },
  ],
  
  // Switzerland Banks
  CH: [
    { code: 'ubs', name: 'UBS', logo: 'https://logo.clearbit.com/ubs.com', color: '#E60000' },
    { code: 'creditsuisse', name: 'Credit Suisse', logo: 'https://logo.clearbit.com/credit-suisse.com', color: '#003A6C' },
    { code: 'juliusbaer', name: 'Julius Baer', logo: 'https://logo.clearbit.com/juliusbaer.com', color: '#00205B' },
  ],
  
  // Global/International Banks (DEFAULT)
  DEFAULT: [
    { code: 'wise', name: 'Wise (TransferWise)', logo: 'https://logo.clearbit.com/wise.com', color: '#9FE870' },
    { code: 'payoneer', name: 'Payoneer', logo: 'https://logo.clearbit.com/payoneer.com', color: '#FF4800' },
    { code: 'hsbc', name: 'HSBC', logo: 'https://logo.clearbit.com/hsbc.com', color: '#DB0011' },
    { code: 'citi_global', name: 'Citibank', logo: 'https://logo.clearbit.com/citi.com', color: '#003B70' },
    { code: 'sc_global', name: 'Standard Chartered', logo: 'https://logo.clearbit.com/sc.com', color: '#0072AA' },
  ]
};

// Country-based digital wallets with official branding
export const DIGITAL_WALLETS: Record<string, DigitalWallet[]> = {
  // USA
  US: [
    { code: 'zelle', label: 'Zelle', logo: 'https://logo.clearbit.com/zellepay.com', color: '#6D1ED4', bgColor: 'bg-purple-50', inputLabel: 'Zelle Email/Phone', placeholder: 'email@example.com' },
    { code: 'venmo', label: 'Venmo', logo: 'https://logo.clearbit.com/venmo.com', color: '#3D95CE', bgColor: 'bg-blue-50', inputLabel: 'Venmo Username', placeholder: '@username' },
    { code: 'paypal_us', label: 'PayPal', logo: 'https://logo.clearbit.com/paypal.com', color: '#003087', bgColor: 'bg-blue-50', inputLabel: 'PayPal Email', placeholder: 'email@example.com' },
    { code: 'cashapp', label: 'Cash App', logo: 'https://logo.clearbit.com/cash.app', color: '#00D632', bgColor: 'bg-green-50', inputLabel: 'Cash Tag', placeholder: '$cashtag' },
  ],
  
  // Bangladesh
  BD: [
    { code: 'bkash', label: 'bKash', logo: 'https://www.logo.wine/a/logo/BKash/BKash-Icon-Logo.wine.svg', color: '#E2136E', bgColor: 'bg-pink-50', inputLabel: 'bKash Number', placeholder: '01XXXXXXXXX' },
    { code: 'nagad', label: 'Nagad', logo: 'https://download.logo.wine/logo/Nagad/Nagad-Logo.wine.png', color: '#F6A623', bgColor: 'bg-orange-50', inputLabel: 'Nagad Number', placeholder: '01XXXXXXXXX' },
    { code: 'rocket', label: 'Rocket', logo: 'https://seeklogo.com/images/D/dutch-bangla-rocket-logo-B4D1CC458D-seeklogo.com.png', color: '#8B2F89', bgColor: 'bg-purple-50', inputLabel: 'Rocket Number', placeholder: '01XXXXXXXXX' },
    { code: 'upay', label: 'Upay', logo: 'https://play-lh.googleusercontent.com/1dUGBb2e8I-lVPz8ydFJNzLYfVMC5CWvYQvSvZk_dS6GrYlB2Vv1BKBVpSG7vb_M1g', color: '#EE3524', bgColor: 'bg-red-50', inputLabel: 'Upay Number', placeholder: '01XXXXXXXXX' },
  ],
  
  // India
  IN: [
    { code: 'phonepe', label: 'PhonePe', logo: 'https://download.logo.wine/logo/PhonePe/PhonePe-Logo.wine.png', color: '#5F259F', bgColor: 'bg-indigo-50', inputLabel: 'PhonePe Number / UPI ID', placeholder: 'name@ybl or 9XXXXXXXXX' },
    { code: 'gpay', label: 'Google Pay', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/512px-Google_Pay_Logo.svg.png', color: '#4285F4', bgColor: 'bg-blue-50', inputLabel: 'UPI ID / Phone Number', placeholder: 'name@okaxis or 9XXXXXXXXX' },
    { code: 'paytm', label: 'Paytm', logo: 'https://download.logo.wine/logo/Paytm/Paytm-Logo.wine.png', color: '#00BAF2', bgColor: 'bg-cyan-50', inputLabel: 'Paytm Number / UPI ID', placeholder: 'name@paytm or 9XXXXXXXXX' },
    { code: 'amazonpay_in', label: 'Amazon Pay', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Amazon_Pay_logo.svg/512px-Amazon_Pay_logo.svg.png', color: '#FF9900', bgColor: 'bg-amber-50', inputLabel: 'Amazon Pay UPI ID', placeholder: 'name@apl' },
  ],
  
  // Pakistan
  PK: [
    { code: 'jazzcash', label: 'JazzCash', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9c/JazzCash_logo.png/220px-JazzCash_logo.png', color: '#ED1C24', bgColor: 'bg-red-50', inputLabel: 'JazzCash Number', placeholder: '03XXXXXXXXX' },
    { code: 'easypaisa', label: 'Easypaisa', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c8/Easypaisa.svg/220px-Easypaisa.svg.png', color: '#00A651', bgColor: 'bg-green-50', inputLabel: 'Easypaisa Number', placeholder: '03XXXXXXXXX' },
    { code: 'nayapay', label: 'NayaPay', logo: 'https://play-lh.googleusercontent.com/8ZMYzPvPl8_s8lnSbMVXvDrGpMqJvS_NXKqXu5HhJYqVxKZLvJr8YQ_QnFXKQC3Bsg', color: '#6366F1', bgColor: 'bg-violet-50', inputLabel: 'NayaPay Number', placeholder: '03XXXXXXXXX' },
    { code: 'sadapay', label: 'SadaPay', logo: 'https://play-lh.googleusercontent.com/tHlNKj-_4EZzL-4EJdCJTNfYYMq7WQCPvh8qcE6kGQfvSEuLpDpLqFsqKJeP_RFq3w', color: '#000000', bgColor: 'bg-gray-50', inputLabel: 'SadaPay Number', placeholder: '03XXXXXXXXX' },
  ],
  
  // UK
  GB: [
    { code: 'monzo', label: 'Monzo', logo: 'https://logo.clearbit.com/monzo.com', color: '#E84B5A', bgColor: 'bg-red-50', inputLabel: 'Monzo Email', placeholder: 'email@example.com' },
    { code: 'revolut', label: 'Revolut', logo: 'https://logo.clearbit.com/revolut.com', color: '#0075EB', bgColor: 'bg-blue-50', inputLabel: 'Revolut Tag', placeholder: '@username' },
    { code: 'starling', label: 'Starling', logo: 'https://logo.clearbit.com/starlingbank.com', color: '#7433FF', bgColor: 'bg-purple-50', inputLabel: 'Account Number', placeholder: '12345678' },
  ],
  
  // Canada
  CA: [
    { code: 'interac', label: 'Interac e-Transfer', logo: 'https://logo.clearbit.com/interac.ca', color: '#FFCC00', bgColor: 'bg-yellow-50', inputLabel: 'Email for e-Transfer', placeholder: 'email@example.com' },
    { code: 'paypal_ca', label: 'PayPal Canada', logo: 'https://logo.clearbit.com/paypal.com', color: '#003087', bgColor: 'bg-blue-50', inputLabel: 'PayPal Email', placeholder: 'email@example.com' },
  ],
  
  // EU
  EU: [
    { code: 'revolut_eu', label: 'Revolut', logo: 'https://logo.clearbit.com/revolut.com', color: '#0075EB', bgColor: 'bg-blue-50', inputLabel: 'Revolut Tag', placeholder: '@username' },
    { code: 'n26_wallet', label: 'N26', logo: 'https://logo.clearbit.com/n26.com', color: '#36A18B', bgColor: 'bg-teal-50', inputLabel: 'N26 IBAN', placeholder: 'DE89...' },
    { code: 'paypal_eu', label: 'PayPal', logo: 'https://logo.clearbit.com/paypal.com', color: '#003087', bgColor: 'bg-blue-50', inputLabel: 'PayPal Email', placeholder: 'email@example.com' },
  ],
  
  // Australia
  AU: [
    { code: 'payid', label: 'PayID', logo: 'https://logo.clearbit.com/nppa.com.au', color: '#00B5E2', bgColor: 'bg-cyan-50', inputLabel: 'PayID (Email/Phone)', placeholder: 'email or phone' },
    { code: 'osko', label: 'Osko', logo: 'https://logo.clearbit.com/osko.com.au', color: '#FF6200', bgColor: 'bg-orange-50', inputLabel: 'Osko ID', placeholder: 'Your Osko ID' },
  ],
  
  // UAE
  AE: [
    { code: 'payby', label: 'PayBy', logo: 'https://logo.clearbit.com/payby.com', color: '#00C4CC', bgColor: 'bg-cyan-50', inputLabel: 'PayBy ID', placeholder: 'Your PayBy ID' },
  ],
  
  // Saudi Arabia
  SA: [
    { code: 'stcpay', label: 'STC Pay', logo: 'https://logo.clearbit.com/stcpay.com.sa', color: '#4D148C', bgColor: 'bg-purple-50', inputLabel: 'STC Pay Number', placeholder: '+966 XXXXXXXXX' },
  ],
  
  // Nigeria
  NG: [
    { code: 'opay', label: 'OPay', logo: 'https://logo.clearbit.com/opayweb.com', color: '#00C853', bgColor: 'bg-green-50', inputLabel: 'OPay Number', placeholder: '080XXXXXXXX' },
    { code: 'palmpay', label: 'PalmPay', logo: 'https://logo.clearbit.com/palmpay.com', color: '#7B1FA2', bgColor: 'bg-purple-50', inputLabel: 'PalmPay Number', placeholder: '080XXXXXXXX' },
    { code: 'kuda', label: 'Kuda', logo: 'https://logo.clearbit.com/kuda.com', color: '#40196D', bgColor: 'bg-violet-50', inputLabel: 'Kuda Account', placeholder: '080XXXXXXXX' },
  ],
  
  // Philippines
  PH: [
    { code: 'gcash', label: 'GCash', logo: 'https://logo.clearbit.com/gcash.com', color: '#007DFE', bgColor: 'bg-blue-50', inputLabel: 'GCash Number', placeholder: '09XXXXXXXXX' },
    { code: 'maya', label: 'Maya (PayMaya)', logo: 'https://logo.clearbit.com/maya.ph', color: '#00D95F', bgColor: 'bg-green-50', inputLabel: 'Maya Number', placeholder: '09XXXXXXXXX' },
  ],
  
  // Indonesia
  ID: [
    { code: 'gopay', label: 'GoPay', logo: 'https://logo.clearbit.com/gojek.com', color: '#00AA5B', bgColor: 'bg-green-50', inputLabel: 'GoPay Number', placeholder: '08XXXXXXXXXX' },
    { code: 'ovo', label: 'OVO', logo: 'https://logo.clearbit.com/ovo.id', color: '#4C3494', bgColor: 'bg-purple-50', inputLabel: 'OVO Number', placeholder: '08XXXXXXXXXX' },
    { code: 'dana', label: 'DANA', logo: 'https://logo.clearbit.com/dana.id', color: '#118EEA', bgColor: 'bg-blue-50', inputLabel: 'DANA Number', placeholder: '08XXXXXXXXXX' },
    { code: 'shopeepay_id', label: 'ShopeePay', logo: 'https://logo.clearbit.com/shopee.co.id', color: '#EE4D2D', bgColor: 'bg-orange-50', inputLabel: 'ShopeePay Number', placeholder: '08XXXXXXXXXX' },
  ],
  
  // Malaysia
  MY: [
    { code: 'touchngo', label: "Touch 'n Go", logo: 'https://logo.clearbit.com/touchngo.com.my', color: '#005DAA', bgColor: 'bg-blue-50', inputLabel: 'TnG Phone Number', placeholder: '01XXXXXXXX' },
    { code: 'grabpay_my', label: 'GrabPay', logo: 'https://logo.clearbit.com/grab.com', color: '#00B14F', bgColor: 'bg-green-50', inputLabel: 'GrabPay Number', placeholder: '01XXXXXXXX' },
  ],
  
  // Vietnam
  VN: [
    { code: 'momo', label: 'MoMo', logo: 'https://logo.clearbit.com/momo.vn', color: '#A50064', bgColor: 'bg-pink-50', inputLabel: 'MoMo Number', placeholder: '09XXXXXXXX' },
    { code: 'zalopay', label: 'ZaloPay', logo: 'https://logo.clearbit.com/zalopay.vn', color: '#0068FF', bgColor: 'bg-blue-50', inputLabel: 'ZaloPay Number', placeholder: '09XXXXXXXX' },
    { code: 'vnpay', label: 'VNPay', logo: 'https://logo.clearbit.com/vnpay.vn', color: '#005BAC', bgColor: 'bg-blue-50', inputLabel: 'VNPay Account', placeholder: '09XXXXXXXX' },
  ],
  
  // Thailand
  TH: [
    { code: 'promptpay', label: 'PromptPay', logo: 'https://logo.clearbit.com/bot.or.th', color: '#0067B1', bgColor: 'bg-blue-50', inputLabel: 'PromptPay ID', placeholder: 'Phone or ID card' },
    { code: 'truemoney', label: 'TrueMoney', logo: 'https://logo.clearbit.com/truemoney.com', color: '#F7941D', bgColor: 'bg-orange-50', inputLabel: 'TrueMoney Number', placeholder: '08XXXXXXXX' },
  ],
  
  // Egypt
  EG: [
    { code: 'fawry', label: 'Fawry', logo: 'https://logo.clearbit.com/fawry.com', color: '#FFD100', bgColor: 'bg-yellow-50', inputLabel: 'Fawry Number', placeholder: '01XXXXXXXXX' },
    { code: 'vodafone_cash', label: 'Vodafone Cash', logo: 'https://logo.clearbit.com/vodafone.com.eg', color: '#E60000', bgColor: 'bg-red-50', inputLabel: 'Vodafone Number', placeholder: '01XXXXXXXXX' },
  ],
  
  // Kenya
  KE: [
    { code: 'mpesa', label: 'M-Pesa', logo: 'https://logo.clearbit.com/safaricom.co.ke', color: '#00A651', bgColor: 'bg-green-50', inputLabel: 'M-Pesa Number', placeholder: '07XXXXXXXX' },
    { code: 'airtel_money', label: 'Airtel Money', logo: 'https://logo.clearbit.com/airtel.co.ke', color: '#ED1C24', bgColor: 'bg-red-50', inputLabel: 'Airtel Number', placeholder: '07XXXXXXXX' },
  ],
  
  // South Africa
  ZA: [
    { code: 'snapscan', label: 'SnapScan', logo: 'https://logo.clearbit.com/snapscan.co.za', color: '#00A8E8', bgColor: 'bg-cyan-50', inputLabel: 'SnapScan ID', placeholder: 'Your SnapScan ID' },
    { code: 'zapper', label: 'Zapper', logo: 'https://logo.clearbit.com/zapper.com', color: '#FF6B00', bgColor: 'bg-orange-50', inputLabel: 'Zapper Email', placeholder: 'email@example.com' },
  ],
  
  // Brazil
  BR: [
    { code: 'pix', label: 'Pix', logo: 'https://logo.clearbit.com/bcb.gov.br', color: '#32BCAD', bgColor: 'bg-teal-50', inputLabel: 'Pix Key', placeholder: 'CPF, Email or Phone' },
    { code: 'picpay', label: 'PicPay', logo: 'https://logo.clearbit.com/picpay.com', color: '#21C25E', bgColor: 'bg-green-50', inputLabel: 'PicPay Username', placeholder: '@username' },
  ],
  
  // Mexico
  MX: [
    { code: 'spei', label: 'SPEI', logo: 'https://logo.clearbit.com/banxico.org.mx', color: '#002F6C', bgColor: 'bg-blue-50', inputLabel: 'CLABE', placeholder: '18 digit CLABE' },
    { code: 'mercadopago', label: 'Mercado Pago', logo: 'https://logo.clearbit.com/mercadopago.com.mx', color: '#00BCFF', bgColor: 'bg-cyan-50', inputLabel: 'Mercado Pago Email', placeholder: 'email@example.com' },
  ],
  
  // Nepal
  NP: [
    { code: 'khalti', label: 'Khalti', logo: 'https://logo.clearbit.com/khalti.com', color: '#5D2E8C', bgColor: 'bg-purple-50', inputLabel: 'Khalti Number', placeholder: '98XXXXXXXX' },
    { code: 'esewa', label: 'eSewa', logo: 'https://logo.clearbit.com/esewa.com.np', color: '#60BB46', bgColor: 'bg-green-50', inputLabel: 'eSewa ID', placeholder: '98XXXXXXXX' },
    { code: 'imepay', label: 'IME Pay', logo: 'https://logo.clearbit.com/imepay.com.np', color: '#E31B23', bgColor: 'bg-red-50', inputLabel: 'IME Pay Number', placeholder: '98XXXXXXXX' },
  ],
  
  // Sri Lanka
  LK: [
    { code: 'frimi', label: 'FriMi', logo: 'https://logo.clearbit.com/frimi.lk', color: '#FF6B00', bgColor: 'bg-orange-50', inputLabel: 'FriMi Number', placeholder: '07XXXXXXXX' },
    { code: 'ezcash', label: 'eZ Cash', logo: 'https://logo.clearbit.com/dialog.lk', color: '#E31837', bgColor: 'bg-red-50', inputLabel: 'eZ Cash Number', placeholder: '07XXXXXXXX' },
  ],
  
  // Japan
  JP: [
    { code: 'paypay', label: 'PayPay', logo: 'https://logo.clearbit.com/paypay.ne.jp', color: '#FF0033', bgColor: 'bg-red-50', inputLabel: 'PayPay ID', placeholder: 'Your PayPay ID' },
    { code: 'linepay', label: 'LINE Pay', logo: 'https://logo.clearbit.com/pay.line.me', color: '#00C300', bgColor: 'bg-green-50', inputLabel: 'LINE ID', placeholder: 'Your LINE ID' },
  ],
  
  // South Korea
  KR: [
    { code: 'kakaopay', label: 'KakaoPay', logo: 'https://logo.clearbit.com/kakaopay.com', color: '#FFCD00', bgColor: 'bg-yellow-50', inputLabel: 'KakaoPay ID', placeholder: 'Your KakaoPay ID' },
    { code: 'toss', label: 'Toss', logo: 'https://logo.clearbit.com/toss.im', color: '#0064FF', bgColor: 'bg-blue-50', inputLabel: 'Toss Phone', placeholder: '010XXXXXXXX' },
    { code: 'naverpay', label: 'Naver Pay', logo: 'https://logo.clearbit.com/navercorp.com', color: '#03C75A', bgColor: 'bg-green-50', inputLabel: 'Naver ID', placeholder: 'Your Naver ID' },
  ],
  
  // Singapore
  SG: [
    { code: 'paynow', label: 'PayNow', logo: 'https://logo.clearbit.com/abs.org.sg', color: '#780A7C', bgColor: 'bg-purple-50', inputLabel: 'PayNow ID', placeholder: 'NRIC or Mobile' },
    { code: 'grabpay_sg', label: 'GrabPay', logo: 'https://logo.clearbit.com/grab.com', color: '#00B14F', bgColor: 'bg-green-50', inputLabel: 'GrabPay Number', placeholder: '9XXXXXXX' },
  ],
  
  // Switzerland
  CH: [
    { code: 'twint', label: 'TWINT', logo: 'https://logo.clearbit.com/twint.ch', color: '#000000', bgColor: 'bg-gray-50', inputLabel: 'TWINT Phone', placeholder: '+41 XX XXX XX XX' },
  ],
  
  // Default / Global
  DEFAULT: [
    { code: 'wise', label: 'Wise', logo: 'https://logo.clearbit.com/wise.com', color: '#9FE870', bgColor: 'bg-lime-50', inputLabel: 'Email / Account ID', placeholder: 'your@email.com' },
    { code: 'payoneer_wallet', label: 'Payoneer', logo: 'https://logo.clearbit.com/payoneer.com', color: '#FF4800', bgColor: 'bg-orange-50', inputLabel: 'Payoneer Email', placeholder: 'your@email.com' },
    { code: 'skrill', label: 'Skrill', logo: 'https://logo.clearbit.com/skrill.com', color: '#8B3FFD', bgColor: 'bg-purple-50', inputLabel: 'Skrill Email', placeholder: 'your@email.com' },
    { code: 'paypal', label: 'PayPal', logo: 'https://logo.clearbit.com/paypal.com', color: '#003087', bgColor: 'bg-blue-50', inputLabel: 'PayPal Email', placeholder: 'your@email.com' },
  ]
};

// Crypto wallets (same for all countries)
export const CRYPTO_WALLETS: DigitalWallet[] = [
  { code: 'btc', label: 'Bitcoin (BTC)', logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png', color: '#F7931A', bgColor: 'bg-orange-50', inputLabel: 'BTC Wallet Address', placeholder: 'bc1q...' },
  { code: 'eth', label: 'Ethereum (ETH)', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png', color: '#627EEA', bgColor: 'bg-indigo-50', inputLabel: 'ETH Wallet Address', placeholder: '0x...' },
  { code: 'usdt', label: 'Tether (USDT)', logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png', color: '#50AF95', bgColor: 'bg-green-50', inputLabel: 'USDT Wallet Address (TRC20/ERC20)', placeholder: 'T... or 0x...' },
  { code: 'usdc', label: 'USD Coin (USDC)', logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png', color: '#2775CA', bgColor: 'bg-blue-50', inputLabel: 'USDC Wallet Address', placeholder: '0x...' },
];

// Helper function to get countries sorted by position
export const getSortedCountries = (): Country[] => {
  return [...SUPPORTED_COUNTRIES].sort((a, b) => a.position - b.position);
};

// Get top tier countries (for quick selection)
export const getTopCountries = (): Country[] => {
  return SUPPORTED_COUNTRIES.filter(c => c.tier === 'top');
};

// Get all non-top countries
export const getOtherCountries = (): Country[] => {
  return SUPPORTED_COUNTRIES.filter(c => c.tier !== 'top' && c.code !== 'DEFAULT');
};

// Helper function to get banks for a country
export const getBanksForCountry = (countryCode: string): Bank[] => {
  return COUNTRY_BANKS[countryCode] || COUNTRY_BANKS.DEFAULT;
};

// Helper to get bank by code
export const getBankByCode = (countryCode: string, bankCode: string): Bank | undefined => {
  const banks = getBanksForCountry(countryCode);
  return banks.find(b => b.code === bankCode);
};

// Helper function to get wallets for a country
export const getDigitalWalletsForCountry = (countryCode: string): DigitalWallet[] => {
  return DIGITAL_WALLETS[countryCode] || DIGITAL_WALLETS.DEFAULT;
};

// Helper to get wallet by code
export const getWalletByCode = (code: string): DigitalWallet | undefined => {
  // Check crypto wallets first
  const crypto = CRYPTO_WALLETS.find(w => w.code === code);
  if (crypto) return crypto;
  
  // Check all country wallets
  for (const wallets of Object.values(DIGITAL_WALLETS)) {
    const wallet = wallets.find(w => w.code === code);
    if (wallet) return wallet;
  }
  return undefined;
};

// Check if a code is a digital wallet
export const isDigitalWalletCode = (code: string): boolean => {
  return !!getWalletByCode(code);
};

// Check if a code is a bank
export const isBankCode = (code: string): boolean => {
  for (const banks of Object.values(COUNTRY_BANKS)) {
    if (banks.some(b => b.code === code)) return true;
  }
  return false;
};

// Check if a code is crypto
export const isCryptoCode = (code: string): boolean => {
  return CRYPTO_WALLETS.some(c => c.code === code);
};

// Get country name
export const COUNTRY_NAMES: Record<string, string> = Object.fromEntries(
  SUPPORTED_COUNTRIES.map(c => [c.code, c.name])
);

export const getCountryName = (countryCode: string): string => {
  return COUNTRY_NAMES[countryCode] || 'International';
};

// Get country by code
export const getCountryByCode = (code: string): Country | undefined => {
  return SUPPORTED_COUNTRIES.find(c => c.code === code);
};

// Search countries
export const searchCountries = (query: string): Country[] => {
  const lowerQuery = query.toLowerCase();
  return SUPPORTED_COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(lowerQuery) || 
    c.code.toLowerCase().includes(lowerQuery)
  );
};
