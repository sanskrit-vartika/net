// ==========================================
// 📚 VARTIKA MASTER PHONEBOOK
// ==========================================
// This file ONLY contains your database links. 
// It is completely isolated from app.js to keep your main engine safe!

const TEST_DATABASE_URLS = {
  
  
  // Premium Sanskrit full topics
  // .................................................................................................
  'full': 'https://script.google.com/macros/s/AKfycbyikVGeVJijVnekPuqULdIQwzLGYFWPEm-bJmGMQviqf1ehUQJp-VfYGZ03SBvnjfHt4A/exec',

  // Veda subject tipics
  // .................................................................................................
  'vedic': 'https://script.google.com/macros/s/AKfycby2KLerDt9aHOKPU2PT3ugptNxoaslcgrmbR0REDn2OMSyVXdV_qpS2fKCuNROmDbQKZA/exec',

  // Grammar subject tipics
  // .................................................................................................
  'grammar': 'https://script.google.com/macros/s/AKfycbyZItA0HY3SpL_d5QRJ3aoqWvOQ6W29MFmlSHBTJiX-kflkEe6bdiyuA1eJGMpSNgbb/exec',

  // Darshan subject tipics
  // .................................................................................................
  'darshan': 'https://script.google.com/macros/s/AKfycbz99sKN9db97mj3uXgERz-Tzv2bWCuwGKTSGi5WU905OgEOYXGIr4OVR5qtisK8fgCx/exec',

  // Sahitya subject tipics
  // .................................................................................................
  'sahitya': 'https://script.google.com/macros/s/AKfycbx84ZIVDvvNG4yX9nOYBaU_GSKYIjtxflfEke5gbBWIr-Uidwa6Vt4yrSajoE13PGJiPw/exec',

  // Other subject topics
  // ................................................................................................
  'other': 'https://script.google.com/macros/s/AKfycbwgzQw9hZPBNOznWJUCobVyjN7LYU9-Tf93fZgm4VxWQfKo9Lo9vdYP4HnaqBEgHPU/exec',

  // Premium Paper 1 full sets
  // ..................................................................................................
  'paper1': [
    { tabName: 'Set-1', url: 'https://sanskrit-vartika.github.io/net/Data/p1test/pp1s1.json' },
    { tabName: 'Set-2', url: 'https://sanskrit-vartika.github.io/net/Data/p1test/pp1s2.json' },
    { tabName: 'Set-3', url: 'https://sanskrit-vartika.github.io/net/Data/p1test/pp1s3.json' },
    { tabName: 'Set-4', url: 'https://sanskrit-vartika.github.io/net/Data/p1test/pp1s4.json' },
    { tabName: 'Set-5', url: 'https://sanskrit-vartika.github.io/net/Data/p1test/pp1s5.json' },
    { tabName: 'Set-6', url: 'https://sanskrit-vartika.github.io/net/Data/p1test/pp1s6.json' },
    { tabName: 'Set-7', url: 'https://sanskrit-vartika.github.io/net/Data/p1test/pp1s7.json' },
    { tabName: 'Set-8', url: 'https://sanskrit-vartika.github.io/net/Data/p1test/pp1s8.json' },
    { tabName: 'Set-9', url: 'https://sanskrit-vartika.github.io/net/Data/p1test/pp1s9.json' },
    { tabName: 'Set-10', url: 'https://sanskrit-vartika.github.io/net/Data/p1test/pp1s10.json' }
    
  ],
  
  // For Encrypted GitHub files, use this bracket format:
  'paper1_topic': [
    { tabName: 'Teaching Aptitude', url: 'https://sanskrit-vartika.github.io/net/Data/p1test/pp1t.u1.teach.json' },
    { tabName: 'Research Aptitude', url: 'https://sanskrit-vartika.github.io/net/Data/p1test/pp1t.u2.resea.json' },
    { tabName: 'Comprehension', url: 'https://sanskrit-vartika.github.io/net/Data/p1test/pp1t.u3.compr.json' },
    { tabName: 'Communication', url: 'https://sanskrit-vartika.github.io/net/Data/p1test/pp1t.u4.comun.json' },
    { tabName: 'Mathematical Reasoning', url: 'https://sanskrit-vartika.github.io/net/Data/p1test/pp1t.u5.math.json' },
    { tabName: 'Logical Reasoning', url: 'https://sanskrit-vartika.github.io/net/Data/p1test/pp1t.u6.logic.json' },
    { tabName: 'Data Interpretation', url: 'https://sanskrit-vartika.github.io/net/Data/p1test/pp1t.u7.data.json' },
    { tabName: 'ICT', url: 'https://sanskrit-vartika.github.io/net/Data/ptest/p1p1t.u8.ict.json' },
    { tabName: 'People, Development and Environment', url: 'https://sanskrit-vartika.github.io/net/Data/p1test/pp1t.u9.peopl.json' },
    { tabName: 'Higher Education System', url: 'https://sanskrit-vartika.github.io/net/Data/p1test/pp1t.u10.highe.json' }
  ]
};

// NEW: The Dedicated Free Databases
const FREE_DATABASE_URLS = {
  'topic': 'https://script.google.com/macros/s/AKfycbwsDVEqgnkrJNcc8BXg3roqQ7tL5p9trxC-Eu8rtD-hTtfOo64WPTwax7ql6uitgFbXJg/exec',
  'full': 'https://script.google.com/macros/s/AKfycbyzEJOaAOHBalQESrUx3vDyvnPHijXL_6RfLTxu2iy4BAIUeLzagkE-c7_nHMKrDOf1/exec',
  'paper1_full': 'https://script.google.com/macros/s/AKfycbyK5qR-npXX_Zjmpxu4NguoSHtsDWvZHwpOJEIUsDvlYBnn-HCZNE_LV-cxLVr1TjNwWA/exec',
  'paper1_topic': 'https://script.google.com/macros/s/AKfycbxLbX-cXVXNjy5tNxF4nJ64Tj7fwBLGs5k1v3K8MR8OlykDvyAjGdj8rhaVEFT4yxw3iQ/exec'
};