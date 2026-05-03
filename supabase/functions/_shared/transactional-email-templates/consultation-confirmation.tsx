import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface ConsultationConfirmationProps {
  nome?: string
}

const ConsultationConfirmationEmail = ({ nome }: ConsultationConfirmationProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Abbiamo ricevuto la tua richiesta di consulenza</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar} />
        <Heading style={h1}>
          {nome ? `Grazie ${nome},` : 'Grazie,'} la tua richiesta è stata ricevuta
        </Heading>
        <Text style={text}>
          Abbiamo ricevuto la tua richiesta di <strong>consulenza singola diretta</strong>.
          La Dott.ssa Annarita Lamanna esaminerà personalmente il caso e ti contatterà al più presto
          all'indirizzo email da cui hai effettuato la richiesta.
        </Text>
        <Text style={text}>
          Se hai bisogno di aggiungere informazioni o nuovi allegati,
          rispondi semplicemente a questa email.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          Dott.ssa Annarita Lamanna · Ortodonzia &amp; Postura
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ConsultationConfirmationEmail,
  subject: 'Abbiamo ricevuto la tua richiesta di consulenza',
  displayName: 'Conferma richiesta consulenza (professionista)',
  previewData: { nome: 'Mario' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Raleway, Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '600px', margin: '0 auto' }
const brandBar = { height: '4px', background: 'linear-gradient(90deg,#14524F,#1F6F6B)', borderRadius: '2px', margin: '0 0 24px' }
const h1 = { fontFamily: 'Playfair Display, Georgia, serif', fontSize: '22px', fontWeight: 700, color: '#0E2A2A', margin: '0 0 14px' }
const text = { fontSize: '14px', color: '#3a4a4a', lineHeight: 1.7, margin: '0 0 16px' }
const hr = { border: 'none', borderTop: '1px solid #e6ecec', margin: '24px 0 12px' }
const footer = { fontSize: '12px', color: '#9aa6a6', textAlign: 'center' as const, margin: '0' }
