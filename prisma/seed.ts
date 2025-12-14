import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Create demo users
  const hashedPassword = await bcrypt.hash('demo123', 12);

  const client = await prisma.user.upsert({
    where: { email: 'cliente@demo.it' },
    update: {},
    create: {
      email: 'cliente@demo.it',
      password: hashedPassword,
      name: 'Marco Rossi',
      role: 'CLIENT',
      avatarUrl: 'https://picsum.photos/seed/client1/100/100',
    },
  });

  const architect = await prisma.user.upsert({
    where: { email: 'architetto@demo.it' },
    update: {},
    create: {
      email: 'architetto@demo.it',
      password: hashedPassword,
      name: 'Laura Bianchi',
      role: 'ARCHITECT',
      avatarUrl: 'https://picsum.photos/seed/arch1/100/100',
      bio: 'Architetto specializzato in interior design e ristrutturazioni',
      portfolio: 'https://portfolio.example.com',
    },
  });

  console.log('Created users:', { client: client.email, architect: architect.email });

  // Create demo contests
  const contests = [
    {
      title: 'Ristrutturazione Appartamento Centro Storico',
      description: 'Cerchiamo idee innovative per la ristrutturazione completa di un appartamento di 120mq nel centro storico di Roma. L\'obiettivo è creare un ambiente moderno mantenendo elementi architettonici originali.',
      brief: 'L\'appartamento si trova al terzo piano di un palazzo del \'700. Presenta soffitti a volta, pavimenti in cotto originale e una vista mozzafiato sui tetti del centro. Il cliente desidera un design contemporaneo che rispetti la storia del luogo.',
      location: 'Roma, Centro Storico',
      category: 'INTERIOR',
      budget: 2500,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'OPEN',
      imageUrl: 'https://picsum.photos/seed/contest1/800/600',
      isFeatured: true,
      mustHaves: ['Open space cucina-soggiorno', 'Due camere da letto', 'Studio ricavato'],
      constraints: ['Vincolo Soprintendenza', 'No modifiche strutturali'],
      deliverables: ['Piante arredate', 'Render 3D', 'Moodboard materiali'],
      clientId: client.id,
    },
    {
      title: 'Villa Moderna con Piscina',
      description: 'Progettazione di una villa unifamiliare di nuova costruzione su un lotto di 2000mq in collina. Richiesta particolare attenzione all\'efficienza energetica e all\'integrazione con il paesaggio.',
      brief: 'Il terreno gode di una vista panoramica sulla valle. Il cliente desidera una villa di circa 300mq con piscina infinity, ampi spazi esterni e garage interrato per 3 auto.',
      location: 'Toscana, Chianti',
      category: 'RESIDENTIAL',
      budget: 3000,
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      status: 'OPEN',
      imageUrl: 'https://picsum.photos/seed/contest2/800/600',
      isFeatured: true,
      mustHaves: ['Classe energetica A4', 'Piscina infinity', 'Domotica integrata'],
      constraints: ['Altezza max 7m', 'Rapporto copertura 20%'],
      deliverables: ['Concept architettonico', 'Studio volumetrico', 'Stima di massima'],
      clientId: client.id,
    },
    {
      title: 'Showroom Auto di Lusso',
      description: 'Design di uno showroom per concessionaria auto di lusso. Superficie di 500mq con area esposizione, uffici e lounge clienti.',
      brief: 'Il brand richiede un ambiente esclusivo che rifletta i valori di lusso e innovazione. Particolare attenzione all\'illuminazione delle vetture e all\'esperienza cliente.',
      location: 'Milano, Porta Nuova',
      category: 'COMMERCIAL',
      budget: 1800,
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: 'OPEN',
      imageUrl: 'https://picsum.photos/seed/contest3/800/600',
      isFeatured: false,
      mustHaves: ['Area espositiva 8 vetture', 'Lounge VIP', 'Configuratore digitale'],
      constraints: ['Budget finiture 200k', 'Apertura entro 6 mesi'],
      deliverables: ['Layout funzionale', 'Concept illuminotecnico', 'Selezione materiali'],
      clientId: client.id,
    },
    {
      title: 'Riqualificazione Piazza Pubblica',
      description: 'Concorso di idee per la riqualificazione di una piazza storica. L\'intervento deve valorizzare il patrimonio esistente e creare nuovi spazi di aggregazione.',
      brief: 'La piazza centrale del comune necessita di un ripensamento degli spazi pubblici. Attualmente è utilizzata principalmente come parcheggio. Si vuole restituirla ai cittadini.',
      location: 'Bergamo, Città Alta',
      category: 'URBAN',
      budget: 800,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'OPEN',
      imageUrl: 'https://picsum.photos/seed/contest4/800/600',
      isFeatured: false,
      mustHaves: ['Pedonalizzazione', 'Verde pubblico', 'Arredo urbano'],
      constraints: ['Budget realizzazione 500k', 'Tutela UNESCO'],
      deliverables: ['Masterplan', 'Sezioni ambientali', 'Rendering'],
      clientId: client.id,
    },
  ];

  for (const contestData of contests) {
    const existing = await prisma.contest.findFirst({
      where: { title: contestData.title },
    });

    if (!existing) {
      await prisma.contest.create({ data: contestData });
      console.log('Created contest:', contestData.title);
    }
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
