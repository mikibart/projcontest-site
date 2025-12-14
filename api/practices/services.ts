import type { VercelRequest, VercelResponse } from '@vercel/node';

const SERVICES = [
  // Burocrazia
  {
    type: 'CILA',
    category: 'burocrazia',
    title: 'CILA / Manutenzione Straordinaria',
    description: 'Comunicazione Inizio Lavori Asseverata per interventi di manutenzione straordinaria',
    price: 800,
    icon: 'FileText',
    color: 'orange',
  },
  {
    type: 'SCIA',
    category: 'burocrazia',
    title: 'SCIA',
    description: 'Segnalazione Certificata di Inizio Attività per ristrutturazioni edilizie',
    price: 1200,
    icon: 'FileText',
    color: 'orange',
  },
  {
    type: 'PDC',
    category: 'burocrazia',
    title: 'Permesso di Costruire',
    description: 'Per nuove costruzioni e interventi di trasformazione urbanistica',
    price: null,
    priceLabel: 'Su preventivo',
    icon: 'FileText',
    color: 'orange',
  },
  {
    type: 'SANATORIA',
    category: 'burocrazia',
    title: 'Sanatoria Edilizia',
    description: 'Regolarizzazione di opere realizzate in difformità o senza titolo',
    price: null,
    priceLabel: 'Su preventivo',
    icon: 'FileText',
    color: 'orange',
  },
  {
    type: 'ACCESSO_ATTI',
    category: 'burocrazia',
    title: 'Accesso Atti',
    description: 'Ricerca e recupero documentazione presso enti pubblici',
    price: 300,
    icon: 'Search',
    color: 'orange',
  },
  // Strutture
  {
    type: 'CALCOLI_STRUTTURALI',
    category: 'strutture',
    title: 'Calcoli Strutturali',
    description: 'Progettazione e verifica strutturale di elementi portanti',
    price: null,
    priceLabel: 'Su preventivo',
    icon: 'Activity',
    color: 'blue',
  },
  {
    type: 'SISMICA',
    category: 'strutture',
    title: 'Pratica Sismica',
    description: 'Deposito e autorizzazione sismica presso il Genio Civile',
    price: 1500,
    icon: 'Activity',
    color: 'blue',
  },
  {
    type: 'COLLAUDO',
    category: 'strutture',
    title: 'Collaudo Statico',
    description: 'Certificazione di idoneità statica delle strutture',
    price: null,
    priceLabel: 'Su preventivo',
    icon: 'CheckCircle',
    color: 'blue',
  },
  // Impianti
  {
    type: 'IMPIANTI_ELETTRICI',
    category: 'impianti',
    title: 'Progetto Impianto Elettrico',
    description: 'Progettazione impianto elettrico con certificazione',
    price: 600,
    icon: 'Zap',
    color: 'yellow',
  },
  {
    type: 'IMPIANTI_TERMICI',
    category: 'impianti',
    title: 'Progetto Impianto Termico',
    description: 'Progettazione impianto di riscaldamento/raffrescamento',
    price: 800,
    icon: 'Thermometer',
    color: 'yellow',
  },
  {
    type: 'RINNOVABILI',
    category: 'impianti',
    title: 'Impianti Rinnovabili',
    description: 'Progettazione fotovoltaico, solare termico, pompe di calore',
    price: null,
    priceLabel: 'Su preventivo',
    icon: 'Sun',
    color: 'yellow',
  },
  // Specialistiche
  {
    type: 'SICUREZZA',
    category: 'specialistiche',
    title: 'Piano di Sicurezza (PSC/POS)',
    description: 'Piani di sicurezza per cantieri edili',
    price: 1000,
    icon: 'Shield',
    color: 'green',
  },
  {
    type: 'DIREZIONE_LAVORI',
    category: 'specialistiche',
    title: 'Direzione Lavori',
    description: 'Supervisione tecnica dell\'esecuzione dei lavori',
    price: null,
    priceLabel: '% sul valore lavori',
    icon: 'HardHat',
    color: 'green',
  },
  {
    type: 'COMPUTO',
    category: 'specialistiche',
    title: 'Computo Metrico',
    description: 'Quantificazione e stima economica degli interventi',
    price: 400,
    icon: 'Calculator',
    color: 'green',
  },
  {
    type: 'ANTINCENDIO',
    category: 'specialistiche',
    title: 'Prevenzione Incendi',
    description: 'SCIA antincendio e progetti di prevenzione',
    price: null,
    priceLabel: 'Su preventivo',
    icon: 'Flame',
    color: 'red',
  },
  {
    type: 'ACUSTICA',
    category: 'specialistiche',
    title: 'Relazione Acustica',
    description: 'Requisiti acustici passivi e impatto acustico',
    price: 500,
    icon: 'Volume2',
    color: 'purple',
  },
  // Catasto & Energia
  {
    type: 'CATASTO',
    category: 'catasto',
    title: 'Variazione Catastale',
    description: 'DOCFA per aggiornamento planimetria catastale',
    price: 250,
    icon: 'Map',
    color: 'gray',
  },
  {
    type: 'APE',
    category: 'energia',
    title: 'APE - Attestato Energetico',
    description: 'Certificazione prestazione energetica dell\'edificio',
    price: 150,
    icon: 'Leaf',
    color: 'green',
  },
  {
    type: 'CONSULENZA_GENERICA',
    category: 'consulenza',
    title: 'Consulenza Tecnica',
    description: 'Consulenza generica su tematiche edilizie e normative',
    price: 100,
    priceLabel: 'a ora',
    icon: 'MessageCircle',
    color: 'blue',
  },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { category } = req.query;

  let services = SERVICES;
  if (category && category !== 'all') {
    services = SERVICES.filter(s => s.category === category.toString());
  }

  return res.status(200).json({ services });
}
