export enum ContestStatus {
  OPEN = 'Aperto',
  EVALUATING = 'In valutazione',
  CLOSED = 'Chiuso',
}

export enum Category {
  RESIDENTIAL = 'Residenziale',
  COMMERCIAL = 'Commerciale',
  INTERIOR = 'Interior',
  URBAN = 'Urbano',
  CONCEPT = 'Concept',
}

export interface Contest {
  id: string;
  title: string;
  location: string;
  category: Category;
  budget: number;
  proposalsCount: number;
  deadline: string; // ISO date string
  daysRemaining: number;
  status: ContestStatus;
  imageUrl: string;
  description: string;
  isFeatured?: boolean;
}

export interface User {
  name: string;
  role: 'architect' | 'client';
  avatarUrl: string;
}

export type Page = 'HOME' | 'EXPLORE' | 'CONTEST_DETAIL' | 'DASHBOARD' | 'LAUNCH_WIZARD' | 'HOW_IT_WORKS' | 'PRACTICES' | 'PRACTICE_WIZARD' | 'ADMIN' | 'PROFILE';

export enum PracticeType {
  // Amministrative
  ACCESSO_ATTI = 'Accesso agli Atti',
  CILA = 'CILA',
  SCIA = 'SCIA',
  PDC = 'Permesso di Costruire',
  SANATORIA = 'Sanatoria',
  
  // Ingegneria Strutturale
  CALCOLI_STRUTTURALI = 'Calcoli Strutturali',
  SISMICA = 'Pratica Sismica (Genio Civile)',
  COLLAUDO = 'Collaudo Statico',
  
  // Impianti (MEP)
  IMPIANTI_ELETTRICI = 'Progetto Elettrico/Domotica',
  IMPIANTI_TERMICI = 'Progetto Termico/Idraulico',
  RINNOVABILI = 'Fotovoltaico & Rinnovabili',
  
  // Specialistiche & Cantieri
  SICUREZZA = 'Sicurezza (PSC/CSE)',
  DIREZIONE_LAVORI = 'Direzione Lavori',
  COMPUTO = 'Computo Metrico',
  ANTINCENDIO = 'Prevenzione Incendi (CPI)',
  ACUSTICA = 'Valutazione Acustica',
  
  // Catasto & Energetica
  CATASTO = 'Catasto',
  APE = 'Certificazione Energetica',
  OTHER = 'Consulenza Generica'
}