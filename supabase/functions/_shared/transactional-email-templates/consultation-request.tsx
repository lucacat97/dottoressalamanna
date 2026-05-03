import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface ConsultationRequestProps {
  professionistaNome?: string
  professionistaEmail?: string
  note?: string
  allegati?: Array<{ name: string; url: string }>
  createdAt?: string
}

const ConsultationRequestEmail = ({
  professionistaNome,
  professionistaEmail,
  note,
  allegati,
  createdAt,
}: ConsultationRequestProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Nuova richiesta di consulenza singola da {professionistaNome || professionistaEmail}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar} />
        <Heading style={h1}>Nuova richiesta di consulenza singola</Heading>
        <Text style={text}>
          Hai ricevuto una nuova richiesta di consulenza diretta da un professionista.
        </Text>

        <Section style={card}>
          <Text style={label}>Professionista</Text>
          <Text style={value}>
            {professionistaNome || '—'}
            <br />
            <Link href={`mailto:${professionistaEmail}`} style={link}>{professionistaEmail}</Link>
          </Text>

          {createdAt && (
            <>
              <Text style={label}>Data invio</Text>
              <Text style={value}>{createdAt}</Text>
            </>
          )}

          <Text style={label}>Note del professionista</Text>
          <Text style={{ ...value, whiteSpace: 'pre-wrap' as const }}>
            {note && note.trim().length > 0 ? note : '(nessuna nota)'}
          </Text>

          <Text style={label}>Allegati ({allegati?.length || 0})</Text>
          {allegati && allegati.length > 0 ? (
            allegati.map((a, i) => (
              <Text key={i} style={value}>
                <Link href={a.url} style={link}>{a.name}</Link>
              </Text>
            ))
          ) : (
            <Text style={value}>(nessun allegato)</Text>
          )}
          <Text style={hint}>
            I link agli allegati restano validi per 7 giorni.
          </Text>
        </Section>

        <Hr style={hr} />
        <Text style={footer}>
          Dott.ssa Annarita Lamanna · Ortodonzia &amp; Postura
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ConsultationRequestEmail,
  subject: (data: Record<string, any>) =>
    `Nuova consulenza singola — ${data?.professionistaNome || data?.professionistaEmail || 'Professionista'}`,
  displayName: 'Richiesta consulenza singola (admin)',
  to: 'dott.lamanna.a@gmail.com',
  previewData: {
    professionistaNome: 'Mario Rossi',
    professionistaEmail: 'mario.rossi@example.com',
    note: 'Caso complesso di Classe III in paziente di 9 anni con asimmetria mandibolare.',
    allegati: [{ name: 'cartella.pdf', url: 'https://example.com/cartella.pdf' }],
    createdAt: '03/05/2026 17:30',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Raleway, Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '620px', margin: '0 auto' }
const brandBar = { height: '4px', background: 'linear-gradient(90deg,#14524F,#1F6F6B)', borderRadius: '2px', margin: '0 0 24px' }
const h1 = { fontFamily: 'Playfair Display, Georgia, serif', fontSize: '22px', fontWeight: 700, color: '#0E2A2A', margin: '0 0 12px' }
const text = { fontSize: '14px', color: '#3a4a4a', lineHeight: 1.6, margin: '0 0 18px' }
const card = { background: '#F5F8F8', border: '1px solid #DDE7E7', borderRadius: '8px', padding: '18px 20px', margin: '8px 0 20px' }
const label = { fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#7a8a8a', margin: '14px 0 4px', fontWeight: 600 }
const value = { fontSize: '14px', color: '#0E2A2A', margin: '0', lineHeight: 1.5 }
const link = { color: '#14524F', textDecoration: 'underline' }
const hint = { fontSize: '12px', color: '#7a8a8a', margin: '12px 0 0', fontStyle: 'italic' as const }
const hr = { border: 'none', borderTop: '1px solid #e6ecec', margin: '24px 0 12px' }
const footer = { fontSize: '12px', color: '#9aa6a6', textAlign: 'center' as const, margin: '0' }
