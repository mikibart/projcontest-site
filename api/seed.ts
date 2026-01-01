import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { secret } = req.body;
  if (secret !== 'projcontest-seed-2024') {
    return res.status(403).json({ error: 'Invalid secret' });
  }

  try {
    const hashedPassword = await bcrypt.hash('demo123', 10);

    // ==================== USERS ====================
    const usersData = [
      {
        email: 'admin@demo.it',
        name: 'Admin Demo',
        role: 'ADMIN' as const,
        password: hashedPassword,
      },
      {
        email: 'cliente@demo.it',
        name: 'Marco Rossi',
        role: 'CLIENT' as const,
        password: hashedPassword,
        phone: '+39 333 1234567',
      },
      {
        email: 'cliente2@demo.it',
        name: 'Laura Bianchi',
        role: 'CLIENT' as const,
        password: hashedPassword,
      },
      {
        email: 'architetto@demo.it',
        name: 'Giuseppe Verdi',
        role: 'ARCHITECT' as const,
        password: hashedPassword,
        bio: 'Architetto con 10 anni di esperienza in progetti residenziali e commerciali. Specializzato in design sostenibile e ristrutturazioni di pregio.',
        portfolio: 'https://portfolio.demo.it',
      },
      {
        email: 'architetto2@demo.it',
        name: 'Anna Conti',
        role: 'ARCHITECT' as const,
        password: hashedPassword,
        bio: 'Studio di architettura specializzato in interior design e spazi commerciali.',
      },
      {
        email: 'ingegnere@demo.it',
        name: 'Paolo Neri',
        role: 'ENGINEER' as const,
        password: hashedPassword,
        bio: 'Ingegnere strutturista specializzato in calcoli sismici e pratiche edilizie.',
      },
    ];

    const createdUsers: any[] = [];
    for (const userData of usersData) {
      const existing = await prisma.user.findUnique({ where: { email: userData.email } });
      if (existing) {
        createdUsers.push({ ...existing, status: 'exists' });
      } else {
        const user = await prisma.user.create({ data: userData });
        createdUsers.push({ ...user, status: 'created' });
      }
    }

    // Get client user for contests
    const clientUser = createdUsers.find(u => u.email === 'cliente@demo.it');
    const clientUser2 = createdUsers.find(u => u.email === 'cliente2@demo.it');
    const architectUser = createdUsers.find(u => u.email === 'architetto@demo.it');
    const architectUser2 = createdUsers.find(u => u.email === 'architetto2@demo.it');

    // ==================== CONTESTS ====================
    const contestsData = [
      {
        title: 'Villa Moderna sul Lago di Como',
        description: 'Progettazione di una villa contemporanea con vista panoramica sul Lago di Como. Richiesta massima integrazione con il paesaggio circostante.',
        brief: 'Il cliente desidera una residenza di lusso che combini eleganza moderna con rispetto per il contesto naturale. La villa dovrà includere ampi spazi living, 4 camere da letto, piscina infinity e giardino terrazzato.',
        location: 'Lago di Como, Lombardia',
        category: 'RESIDENTIAL' as const,
        budget: 25000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: 'OPEN' as const,
        imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
        isFeatured: true,
        mustHaves: ['Piscina infinity', 'Vista lago', 'Domotica integrata', 'Materiali eco-sostenibili'],
        constraints: ['Vincolo paesaggistico', 'Altezza max 2 piani', 'Distanza minima dal lago 50m'],
        deliverables: ['Piante architettoniche', 'Render 3D', 'Concept design', 'Preventivo di massima'],
        clientId: clientUser.id,
      },
      {
        title: 'Ristrutturazione Appartamento Centro Storico',
        description: 'Ristrutturazione completa di un appartamento di 120mq nel centro storico di Firenze, con vincoli della Soprintendenza.',
        brief: 'Appartamento in palazzo del 1800, necessita di un redesign completo mantenendo gli elementi storici (soffitti affrescati, pavimenti originali). Obiettivo: creare spazi moderni e funzionali.',
        location: 'Firenze, Toscana',
        category: 'INTERIOR' as const,
        budget: 12000,
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
        status: 'OPEN' as const,
        imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        isFeatured: true,
        mustHaves: ['Cucina open space', 'Bagno padronale con doccia', 'Studio/home office'],
        constraints: ['Vincolo Soprintendenza', 'Conservazione affreschi', 'No modifiche facciate'],
        deliverables: ['Progetto esecutivo', 'Render interni', 'Computo metrico'],
        clientId: clientUser.id,
      },
      {
        title: 'Showroom Automotive Milano',
        description: 'Design di uno showroom per concessionaria auto di lusso in zona Porta Nuova a Milano.',
        brief: 'Spazio espositivo di 800mq su due livelli. Deve trasmettere innovazione e lusso, con aree per esposizione veicoli, lounge clienti VIP, e uffici.',
        location: 'Milano, Lombardia',
        category: 'COMMERCIAL' as const,
        budget: 35000,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
        status: 'OPEN' as const,
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
        isFeatured: false,
        mustHaves: ['Area esposizione 10+ veicoli', 'Lounge VIP', 'Illuminazione scenografica', 'Parcheggio clienti'],
        constraints: ['Normative antincendio', 'Accessibilità disabili', 'Certificazione LEED'],
        deliverables: ['Concept design', 'Layout funzionale', 'Render fotorealistici', 'Lighting design'],
        clientId: clientUser2.id,
      },
      {
        title: 'Riqualificazione Piazza del Mercato',
        description: 'Progetto di riqualificazione urbana per la piazza centrale del comune, con nuova pavimentazione, arredi urbani e spazi verdi.',
        brief: 'La piazza storica necessita di un intervento di riqualificazione che la renda più vivibile e attrattiva. Previsti: nuova pavimentazione, fontana, area giochi bambini, dehors per locali.',
        location: 'Bergamo, Lombardia',
        category: 'URBAN' as const,
        budget: 50000,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        status: 'OPEN' as const,
        imageUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800',
        isFeatured: true,
        mustHaves: ['Fontana centrale', 'Area verde', 'Parcheggio biciclette', 'Illuminazione LED'],
        constraints: ['Vincolo centro storico', 'Mantenimento mercato settimanale', 'Accesso mezzi emergenza'],
        deliverables: ['Masterplan', 'Render piazza', 'Dettagli arredi urbani', 'Piano illuminazione'],
        clientId: clientUser2.id,
      },
      {
        title: 'Concept Hotel Boutique Costiera',
        description: 'Concept design per un boutique hotel di 20 camere sulla Costiera Amalfitana, ricavato da un palazzo storico.',
        brief: 'Trasformazione di un palazzo del 1700 in un hotel boutique esclusivo. Ogni camera deve essere unica, con vista mare. Richiesti: ristorante panoramico, spa, terrazze private.',
        location: 'Amalfi, Campania',
        category: 'CONCEPT' as const,
        budget: 40000,
        deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000), // 40 days
        status: 'OPEN' as const,
        imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
        isFeatured: false,
        mustHaves: ['20 camere uniche', 'Ristorante panoramico', 'Spa', 'Terrazze private'],
        constraints: ['Vincolo paesaggistico', 'Struttura storica', 'Accesso limitato cantiere'],
        deliverables: ['Concept book', 'Moodboard', 'Layout camere tipo', 'Render esterni'],
        clientId: clientUser.id,
      },
      {
        title: 'Loft Industriale Torino',
        description: 'Conversione di un ex capannone industriale in loft residenziale open space di 250mq.',
        brief: 'Spazio industriale con altezze fino a 6m, grandi vetrate. Il cliente vuole mantenere il carattere industriale creando un ambiente residenziale caldo e accogliente.',
        location: 'Torino, Piemonte',
        category: 'INTERIOR' as const,
        budget: 18000,
        deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days
        status: 'EVALUATING' as const,
        imageUrl: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800',
        isFeatured: false,
        mustHaves: ['Soppalco camera', 'Cucina isola', 'Bagno design', 'Home cinema'],
        constraints: ['Mantenere travi originali', 'Impianto riscaldamento a pavimento'],
        deliverables: ['Progetto definitivo', 'Render 3D', 'Selezione materiali'],
        clientId: clientUser.id,
      },
    ];

    const createdContests: any[] = [];
    for (const contestData of contestsData) {
      const existing = await prisma.contest.findFirst({ where: { title: contestData.title } });
      if (existing) {
        createdContests.push({ ...existing, status: 'exists' });
      } else {
        const contest = await prisma.contest.create({ data: contestData });
        createdContests.push({ ...contest, status: 'created' });
      }
    }

    // ==================== PROPOSALS ====================
    const proposalsData = [
      {
        contestId: createdContests.find(c => c.title.includes('Loft Industriale'))?.id,
        architectId: architectUser.id,
        description: 'Proposta che esalta il carattere industriale dello spazio, con inserimento di elementi caldi in legno e tessuti naturali. Il soppalco in acciaio e vetro crea una camera da letto panoramica.',
        status: 'SUBMITTED' as const,
      },
      {
        contestId: createdContests.find(c => c.title.includes('Loft Industriale'))?.id,
        architectId: architectUser2.id,
        description: 'Design minimalista che gioca sui contrasti: cemento grezzo e superfici laccate bianche. Illuminazione scenografica con binari industriali.',
        status: 'SUBMITTED' as const,
      },
    ];

    const createdProposals: any[] = [];
    for (const proposalData of proposalsData) {
      if (!proposalData.contestId) continue;
      const existing = await prisma.proposal.findFirst({
        where: { contestId: proposalData.contestId, architectId: proposalData.architectId }
      });
      if (existing) {
        createdProposals.push({ ...existing, status: 'exists' });
      } else {
        const proposal = await prisma.proposal.create({ data: proposalData });
        createdProposals.push({ ...proposal, status: 'created' });
      }
    }

    // ==================== PRACTICE REQUESTS ====================
    const practicesData = [
      {
        userId: clientUser.id,
        type: 'CILA',
        propertyType: 'Appartamento',
        location: 'Roma, Lazio',
        size: 85,
        contactName: 'Marco Rossi',
        contactEmail: 'cliente@demo.it',
        contactPhone: '+39 333 1234567',
        interventionDetails: 'Ristrutturazione bagno e cucina con spostamento tramezzi interni.',
        status: 'PENDING_QUOTE' as const,
      },
      {
        userId: clientUser2.id,
        type: 'SCIA',
        propertyType: 'Locale commerciale',
        location: 'Milano, Lombardia',
        size: 120,
        contactName: 'Laura Bianchi',
        contactEmail: 'cliente2@demo.it',
        interventionDetails: 'Cambio destinazione d\'uso da magazzino a negozio.',
        status: 'QUOTE_SENT' as const,
        quoteAmount: 2500,
        quoteValidUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      },
    ];

    const createdPractices: any[] = [];
    for (const practiceData of practicesData) {
      const existing = await prisma.practiceRequest.findFirst({
        where: { userId: practiceData.userId, type: practiceData.type, location: practiceData.location }
      });
      if (existing) {
        createdPractices.push({ ...existing, status: 'exists' });
      } else {
        const practice = await prisma.practiceRequest.create({ data: practiceData });
        createdPractices.push({ ...practice, status: 'created' });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Database seeded successfully!',
      summary: {
        users: createdUsers.length,
        contests: createdContests.length,
        proposals: createdProposals.length,
        practices: createdPractices.length,
      },
      details: {
        users: createdUsers.map(u => ({ email: u.email, role: u.role, status: u.status })),
        contests: createdContests.map(c => ({ title: c.title, status: c.status })),
      }
    });
  } catch (error) {
    console.error('Seed error:', error);
    return res.status(500).json({ error: 'Failed to seed database', details: String(error) });
  }
}
